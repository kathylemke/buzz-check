import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Switch, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { fonts } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { DRINK_CATEGORIES, getBrandsByCategory, getBrandProducts, getProductFlavors, DrinkCategory, searchBrands, getCategoryForBrand } from '../data/drinks';
import { cityFromCampus, getSelectableCities } from '../data/cities';
import { checkAndAwardBadges } from '../lib/badges';
import PostCelebration from '../components/PostCelebration';

type Step = 'category' | 'brand' | 'product' | 'flavor' | 'details';

export default function NewPostScreen({ navigation }: any) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState<DrinkCategory | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [product, setProduct] = useState<string | null>(null);
  const [flavor, setFlavor] = useState('');
  const [customFlavor, setCustomFlavor] = useState('');
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [isPrivate, setIsPrivate] = useState(false);
  const [city, setCity] = useState<string>('');
  const [celebrating, setCelebrating] = useState(false);
  const [celebrateCategory, setCelebrateCategory] = useState<string>('');
  const [celebrateDrink, setCelebrateDrink] = useState<string>('');
  const [brandSearch, setBrandSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    if (user) {
      supabase.from('bc_users').select('campus, city').eq('id', user.id).single().then(({ data }) => {
        if (data?.city) setCity(data.city);
        else if (data?.campus) setCity(cityFromCampus(data.campus) || '');
      });
    }
  }, [user]);

  const reset = () => {
    setStep('category'); setCategory(null); setBrand(null); setProduct(null);
    setFlavor(''); setCustomFlavor(''); setCaption(''); setImageUri(null); setRating(0); setIsPrivate(false); setBrandSearch(''); setProductSearch('');
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const finalFlavor = customFlavor.trim() || flavor;
  const drinkName = product && finalFlavor ? `${product} - ${finalFlavor}` : product || brand || '';

  const handlePost = async () => {
    if (!brand) { if (Platform.OS === 'web') window.alert('Pick a company first'); else alert('Pick a company first'); return; }
    setPosting(true);
    try {
      let photo_url = null;
      if (imageUri) {
        const ext = imageUri.split('.').pop() ?? 'jpg';
        const fileName = `${user!.id}/${Date.now()}.${ext}`;
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();
        const { error: uploadError } = await supabase.storage.from('post-photos').upload(fileName, arrayBuffer, { contentType: `image/${ext}` });
        if (!uploadError) {
          const { data } = supabase.storage.from('post-photos').getPublicUrl(fileName);
          photo_url = data.publicUrl;
        }
      }
      const postData: any = {
        user_id: user!.id, drink_name: drinkName, drink_type: category, brand, flavor: finalFlavor || null,
        caption: caption.trim() || null, photo_url, rating: rating || null,
        is_private: isPrivate, city: city || null,
      };
      const { error } = await supabase.from('bc_posts').insert(postData);
      if (error) throw error;
      // Check badges in background
      checkAndAwardBadges(user!.id).catch(() => {});
      setCelebrateCategory(category || 'other');
      setCelebrateDrink(drinkName);
      setCelebrating(true);
    } catch (err: any) {
      if (Platform.OS === 'web') window.alert('Error: ' + err.message); else alert('Error: ' + err.message);
    } finally { setPosting(false); }
  };

  const s = makeStyles(colors);
  const STEPS: Step[] = ['category', 'brand', 'product', 'flavor', 'details'];
  const stepNumber = STEPS.indexOf(step) + 1;

  const renderStepIndicator = () => (
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 20 }}>
      {[1, 2, 3, 4, 5].map(n => <View key={n} style={{ width: 26, height: 4, borderRadius: 2, backgroundColor: n <= stepNumber ? colors.neonGreen : colors.inputBorder }} />)}
    </View>
  );

  const goBack = () => {
    if (step === 'brand') { setStep('category'); setCategory(null); setBrand(null); setProduct(null); setFlavor(''); }
    else if (step === 'product') { setStep('brand'); setBrand(null); setProduct(null); setFlavor(''); }
    else if (step === 'flavor') { setStep('product'); setProduct(null); setFlavor(''); }
    else if (step === 'details') setStep('flavor');
  };

  const renderBack = () => step !== 'category' ? (
    <TouchableOpacity style={{ marginBottom: 8 }} onPress={goBack}>
      <Text style={{ color: colors.electricBlue, fontSize: fonts.sizes.md, fontWeight: '600' }}>← Back</Text>
    </TouchableOpacity>
  ) : null;

  if (celebrating) {
    return (
      <PostCelebration
        category={celebrateCategory}
        drinkName={celebrateDrink}
        onDone={() => {
          setCelebrating(false);
          reset();
          navigation.navigate('Feed');
        }}
      />
    );
  }

  if (step === 'category') {
    const searchResults = searchBrands(brandSearch);
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Text style={s.title}>🥤 New Check-In</Text>
        {renderStepIndicator()}
        <TextInput
          style={[s.input, { marginBottom: 16 }]}
          placeholder="🔍 Search all brands..."
          placeholderTextColor={colors.textMuted}
          value={brandSearch}
          onChangeText={setBrandSearch}
        />
        {brandSearch.trim() ? (
          <View style={{ gap: 2 }}>
            {searchResults.length === 0 && (
              <Text style={{ color: colors.textMuted, textAlign: 'center', marginVertical: 20 }}>No brands found</Text>
            )}
            {searchResults.map(b => {
              const catInfo = DRINK_CATEGORIES.find(c => c.key === b.category);
              return (
                <TouchableOpacity key={`${b.name}-${b.category}`} style={s.listItem} onPress={() => { setCategory(b.category); setBrand(b.name); setBrandSearch(''); setStep('product'); }}>
                  <View>
                    <Text style={{ color: colors.text, fontSize: fonts.sizes.md, fontWeight: '600' }}>{b.name}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: fonts.sizes.sm }}>{catInfo?.emoji} {catInfo?.label}</Text>
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 22 }}>›</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <>
            <Text style={s.stepLabel}>What are you drinking?</Text>
            <View style={s.catGrid}>
              {DRINK_CATEGORIES.map(c => (
                <TouchableOpacity key={c.key} style={s.catCard} onPress={() => { setCategory(c.key); setStep('brand'); }}>
                  <Text style={{ fontSize: 36, marginBottom: 8 }}>{c.emoji}</Text>
                  <Text style={{ color: colors.text, fontSize: fonts.sizes.md, fontWeight: '700' }}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    );
  }

  if (step === 'brand') {
    const brands = category ? getBrandsByCategory(category) : [];
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        {renderBack()}
        <Text style={s.title}>{DRINK_CATEGORIES.find(c => c.key === category)?.emoji} Pick Company</Text>
        {renderStepIndicator()}
        <View style={{ gap: 2 }}>
          {brands.map(b => (
            <TouchableOpacity key={b.name} style={s.listItem} onPress={() => { setBrand(b.name); setProductSearch(''); setStep('product'); }}>
              <Text style={{ color: colors.text, fontSize: fonts.sizes.md, fontWeight: '600' }}>{b.name}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 22 }}>›</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.listItem} onPress={() => { setBrand('Other'); setStep('details'); }}>
            <Text style={{ color: colors.text, fontSize: fonts.sizes.md, fontWeight: '600' }}>Other</Text>
            <Text style={{ color: colors.textMuted, fontSize: 22 }}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (step === 'product') {
    const products = brand ? getBrandProducts(brand) : [];
    const q = productSearch.toLowerCase();
    const filtered = q ? products.filter(p => p.name.toLowerCase().includes(q) || p.flavors.some(f => f.toLowerCase().includes(q))) : products;
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        {renderBack()}
        <Text style={s.title}>{brand}</Text>
        {renderStepIndicator()}
        {products.length > 5 && (
          <TextInput
            style={[s.input, { marginBottom: 12 }]}
            placeholder="🔍 Search drinks..."
            placeholderTextColor={colors.textMuted}
            value={productSearch}
            onChangeText={setProductSearch}
          />
        )}
        <Text style={s.stepLabel}>Pick a drink</Text>
        <View style={{ gap: 2 }}>
          {filtered.map(p => (
            <TouchableOpacity key={p.name} style={s.listItem} onPress={() => { setProduct(p.name); setStep('flavor'); }}>
              <Text style={{ color: colors.text, fontSize: fonts.sizes.md, fontWeight: '600' }}>{p.name}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 22 }}>›</Text>
            </TouchableOpacity>
          ))}
          {filtered.length === 0 && <Text style={{ color: colors.textMuted, textAlign: 'center', marginVertical: 20 }}>No drinks found</Text>}
        </View>
      </ScrollView>
    );
  }

  if (step === 'flavor') {
    const flavors = brand && product ? getProductFlavors(brand, product) : [];
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        {renderBack()}
        <Text style={s.title}>{product}</Text>
        {renderStepIndicator()}
        <Text style={s.stepLabel}>Pick a flavor</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {flavors.map(f => (
            <TouchableOpacity key={f} style={[s.chip, flavor === f && { backgroundColor: colors.electricBlue + '22', borderColor: colors.electricBlue }]} onPress={() => { setFlavor(f); setCustomFlavor(''); }}>
              <Text style={{ color: flavor === f ? colors.electricBlue : colors.textSecondary, fontSize: fonts.sizes.sm, fontWeight: flavor === f ? '600' : '400' }}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput style={s.input} placeholder="Or type a custom flavor..." placeholderTextColor={colors.textMuted} value={customFlavor} onChangeText={t => { setCustomFlavor(t); if (t) setFlavor(''); }} />
        <TouchableOpacity style={[s.nextBtn, !(flavor || customFlavor.trim()) && { opacity: 0.4 }]} disabled={!(flavor || customFlavor.trim())} onPress={() => setStep('details')}>
          <Text style={{ color: colors.bg, fontSize: fonts.sizes.lg, fontWeight: '800' }}>Next →</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Step 5: Details
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {renderBack()}
      <Text style={s.title}>Almost there!</Text>
      {renderStepIndicator()}
      <View style={s.summaryCard}>
        <Text style={{ color: colors.neonGreen, fontSize: fonts.sizes.lg, fontWeight: '700', textAlign: 'center' }}>{drinkName}</Text>
      </View>

      {/* Rating */}
      <Text style={[s.stepLabel, { marginTop: 8 }]}>Rate it (1-10)</Text>
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
          <TouchableOpacity key={n} onPress={() => setRating(n)} style={{ width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: rating === n ? colors.neonGreen : colors.surface, borderWidth: 1, borderColor: rating === n ? colors.neonGreen : colors.cardBorder }}>
            <Text style={{ color: rating === n ? colors.bg : colors.textSecondary, fontWeight: '800', fontSize: 14 }}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.photoPicker} onPress={pickImage}>
        {imageUri ? <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%', borderRadius: 16 }} /> : <Text style={{ color: colors.textMuted, fontSize: fonts.sizes.lg }}>📸 Add Photo</Text>}
      </TouchableOpacity>

      <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Caption (optional)" placeholderTextColor={colors.textMuted} value={caption} onChangeText={setCaption} multiline />

      {/* City auto-set from profile */}

      {/* Privacy */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, backgroundColor: colors.surface, padding: 14, borderRadius: 12 }}>
        <Text style={{ color: colors.text, fontWeight: '600' }}>🔒 Hide from everyone feed</Text>
        <Switch value={isPrivate} onValueChange={setIsPrivate} trackColor={{ true: colors.neonGreen, false: colors.inputBorder }} thumbColor="#fff" />
      </View>

      <TouchableOpacity style={s.postBtn} onPress={handlePost} disabled={posting}>
        <Text style={{ color: colors.bg, fontSize: fonts.sizes.lg, fontWeight: '800', letterSpacing: 1 }}>{posting ? 'POSTING...' : '⚡ CHECK IN'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: fonts.sizes.xl, fontWeight: '800', color: colors.neonGreen, marginBottom: 12 },
  stepLabel: { color: colors.textSecondary, fontSize: fonts.sizes.md, marginBottom: 16 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  catCard: { width: '47%' as any, backgroundColor: colors.surface, borderRadius: 16, paddingVertical: 28, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.cardBorder },
  chip: { backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.cardBorder },
  input: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12, padding: 16, fontSize: fonts.sizes.md, color: colors.text, marginBottom: 12 },
  nextBtn: { backgroundColor: colors.electricBlue, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  summaryCard: { backgroundColor: colors.neonGreen + '15', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.neonGreen + '44' },
  photoPicker: { height: 200, backgroundColor: colors.surface, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 2, borderColor: colors.inputBorder, borderStyle: 'dashed' },
  postBtn: { backgroundColor: colors.neonGreen, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
});
