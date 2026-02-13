import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { DRINK_CATEGORIES, getBrandsByCategory, getBrandProducts, getProductFlavors, DrinkCategory } from '../data/drinks';

type Step = 'category' | 'brand' | 'product' | 'flavor' | 'details';

export default function NewPostScreen({ navigation }: any) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState<DrinkCategory | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [product, setProduct] = useState<string | null>(null);
  const [flavor, setFlavor] = useState<string>('');
  const [customFlavor, setCustomFlavor] = useState('');
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const reset = () => {
    setStep('category');
    setCategory(null);
    setBrand(null);
    setProduct(null);
    setFlavor('');
    setCustomFlavor('');
    setCaption('');
    setImageUri(null);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const finalFlavor = customFlavor.trim() || flavor;
  const drinkName = product && finalFlavor ? `${product} - ${finalFlavor}` : product || brand || '';

  const handlePost = async () => {
    if (!brand) { Alert.alert('Pick a brand first'); return; }
    setPosting(true);
    try {
      let photo_url = null;
      if (imageUri) {
        const ext = imageUri.split('.').pop() ?? 'jpg';
        const fileName = `${user!.id}/${Date.now()}.${ext}`;
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();
        const { error: uploadError } = await supabase.storage
          .from('post-photos')
          .upload(fileName, arrayBuffer, { contentType: `image/${ext}` });
        if (!uploadError) {
          const { data } = supabase.storage.from('post-photos').getPublicUrl(fileName);
          photo_url = data.publicUrl;
        }
      }

      const { error } = await supabase.from('bc_posts').insert({
        user_id: user!.id,
        drink_name: drinkName,
        drink_type: category,
        brand: brand,
        flavor: finalFlavor || null,
        caption: caption.trim() || null,
        photo_url,
      });
      if (error) throw error;

      Alert.alert('Posted! ⚡', 'Your buzz has been checked.');
      reset();
      navigation.navigate('Feed');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setPosting(false);
    }
  };

  const STEPS: Step[] = ['category', 'brand', 'product', 'flavor', 'details'];
  const stepNumber = STEPS.indexOf(step) + 1;

  const renderStepIndicator = () => (
    <View style={s.stepRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <View key={n} style={[s.stepDot, n <= stepNumber && s.stepDotActive]} />
      ))}
    </View>
  );

  const goBack = () => {
    if (step === 'brand') { setStep('category'); setCategory(null); setBrand(null); setProduct(null); setFlavor(''); }
    else if (step === 'product') { setStep('brand'); setBrand(null); setProduct(null); setFlavor(''); }
    else if (step === 'flavor') { setStep('product'); setProduct(null); setFlavor(''); }
    else if (step === 'details') setStep('flavor');
  };

  const renderBack = () =>
    step !== 'category' ? (
      <TouchableOpacity style={s.backBtn} onPress={goBack}>
        <Text style={s.backText}>← Back</Text>
      </TouchableOpacity>
    ) : null;

  // ── Step 1: Category ──
  if (step === 'category') {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Text style={s.title}>🥤 New Check-In</Text>
        {renderStepIndicator()}
        <Text style={s.stepLabel}>What are you drinking?</Text>
        <View style={s.catGrid}>
          {DRINK_CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={s.catCard}
              onPress={() => { setCategory(c.key); setStep('brand'); }}
            >
              <Text style={s.catEmoji}>{c.emoji}</Text>
              <Text style={s.catName}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  // ── Step 2: Brand ──
  if (step === 'brand') {
    const brands = category ? getBrandsByCategory(category) : [];
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        {renderBack()}
        <Text style={s.title}>{DRINK_CATEGORIES.find((c) => c.key === category)?.emoji} Pick Brand</Text>
        {renderStepIndicator()}
        <View style={s.brandList}>
          {brands.map((b) => (
            <TouchableOpacity
              key={b.name}
              style={s.brandItem}
              onPress={() => { setBrand(b.name); setStep('product'); }}
            >
              <Text style={s.brandText}>{b.name}</Text>
              <Text style={s.chevron}>›</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={s.brandItem}
            onPress={() => { setBrand('Other'); setStep('details'); }}
          >
            <Text style={s.brandText}>Other</Text>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ── Step 3: Product Line ──
  if (step === 'product') {
    const products = brand ? getBrandProducts(brand) : [];
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        {renderBack()}
        <Text style={s.title}>{brand}</Text>
        {renderStepIndicator()}
        <Text style={s.stepLabel}>Pick a product line</Text>
        <View style={s.brandList}>
          {products.map((p) => (
            <TouchableOpacity
              key={p.name}
              style={s.brandItem}
              onPress={() => { setProduct(p.name); setStep('flavor'); }}
            >
              <Text style={s.brandText}>{p.name}</Text>
              <Text style={s.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  // ── Step 4: Flavor ──
  if (step === 'flavor') {
    const flavors = brand && product ? getProductFlavors(brand, product) : [];
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        {renderBack()}
        <Text style={s.title}>{product}</Text>
        {renderStepIndicator()}
        <Text style={s.stepLabel}>Pick a flavor</Text>
        <View style={s.flavorGrid}>
          {flavors.map((f) => (
            <TouchableOpacity
              key={f}
              style={[s.flavorChip, flavor === f && s.flavorChipActive]}
              onPress={() => { setFlavor(f); setCustomFlavor(''); }}
            >
              <Text style={[s.flavorText, flavor === f && s.flavorTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={s.input}
          placeholder="Or type a custom flavor..."
          placeholderTextColor={colors.textMuted}
          value={customFlavor}
          onChangeText={(t) => { setCustomFlavor(t); if (t) setFlavor(''); }}
        />
        <TouchableOpacity
          style={[s.nextBtn, !(flavor || customFlavor.trim()) && s.nextBtnDisabled]}
          disabled={!(flavor || customFlavor.trim())}
          onPress={() => setStep('details')}
        >
          <Text style={s.nextBtnText}>Next →</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── Step 5: Photo + Caption + Post ──
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {renderBack()}
      <Text style={s.title}>Almost there!</Text>
      {renderStepIndicator()}

      <View style={s.summaryCard}>
        <Text style={s.summaryText}>{drinkName}</Text>
      </View>

      <TouchableOpacity style={s.photoPicker} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={s.photoPreview} />
        ) : (
          <Text style={s.photoPlaceholder}>📸 Add Photo</Text>
        )}
      </TouchableOpacity>

      <TextInput
        style={[s.input, { height: 80, textAlignVertical: 'top' }]}
        placeholder="Caption (optional)"
        placeholderTextColor={colors.textMuted}
        value={caption}
        onChangeText={setCaption}
        multiline
      />

      <TouchableOpacity style={s.postBtn} onPress={handlePost} disabled={posting}>
        <Text style={s.postBtnText}>{posting ? 'POSTING...' : '⚡ CHECK IN'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: fonts.sizes.xl, fontWeight: '800', color: colors.neonGreen, marginBottom: 12 },
  stepRow: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  stepDot: { width: 26, height: 4, borderRadius: 2, backgroundColor: colors.inputBorder },
  stepDotActive: { backgroundColor: colors.neonGreen },
  stepLabel: { color: colors.textSecondary, fontSize: fonts.sizes.md, marginBottom: 16 },
  backBtn: { marginBottom: 8 },
  backText: { color: colors.electricBlue, fontSize: fonts.sizes.md, fontWeight: '600' },

  // Category
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  catCard: {
    width: '47%' as any,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  catEmoji: { fontSize: 36, marginBottom: 8 },
  catName: { color: colors.text, fontSize: fonts.sizes.md, fontWeight: '700' },

  // Brand & Product list
  brandList: { gap: 2 },
  brandItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  brandText: { color: colors.text, fontSize: fonts.sizes.md, fontWeight: '600' },
  chevron: { color: colors.textMuted, fontSize: 22 },

  // Flavor
  flavorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  flavorChip: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  flavorChipActive: { backgroundColor: colors.electricBlue + '22', borderColor: colors.electricBlue },
  flavorText: { color: colors.textSecondary, fontSize: fonts.sizes.sm },
  flavorTextActive: { color: colors.electricBlue, fontWeight: '600' },

  // Details
  summaryCard: {
    backgroundColor: colors.neonGreen + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.neonGreen + '44',
  },
  summaryText: { color: colors.neonGreen, fontSize: fonts.sizes.lg, fontWeight: '700', textAlign: 'center' },
  photoPicker: {
    height: 200,
    backgroundColor: colors.surface,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderStyle: 'dashed',
  },
  photoPreview: { width: '100%', height: '100%', borderRadius: 16 },
  photoPlaceholder: { color: colors.textMuted, fontSize: fonts.sizes.lg },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    padding: 16,
    fontSize: fonts.sizes.md,
    color: colors.text,
    marginBottom: 12,
  },
  nextBtn: {
    backgroundColor: colors.electricBlue,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: colors.bg, fontSize: fonts.sizes.lg, fontWeight: '800' },
  postBtn: { backgroundColor: colors.neonGreen, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  postBtnText: { color: colors.bg, fontSize: fonts.sizes.lg, fontWeight: '800', letterSpacing: 1 },
});
