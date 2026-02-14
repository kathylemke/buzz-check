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
type LocalStep = 'city' | 'place' | 'item' | 'details';
type PostMode = 'branded' | 'local';

export default function NewPostScreen({ navigation }: any) {
  const { user } = useAuth();
  const { colors } = useTheme();

  // Post mode
  const [postMode, setPostMode] = useState<PostMode>('branded');

  // Branded flow state
  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState<DrinkCategory | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [product, setProduct] = useState<string | null>(null);
  const [flavor, setFlavor] = useState('');
  const [customFlavor, setCustomFlavor] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Local flow state
  const [localStep, setLocalStep] = useState<LocalStep>('city');
  const [citySearch, setCitySearch] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [localPlaces, setLocalPlaces] = useState<any[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [localItemName, setLocalItemName] = useState('');
  const [localItemCategory, setLocalItemCategory] = useState<string>('other');
  const [newPlaceName, setNewPlaceName] = useState('');

  // Shared state
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [isPrivate, setIsPrivate] = useState(false);
  const [city, setCity] = useState<string>('');
  const [celebrating, setCelebrating] = useState(false);
  const [celebrateCategory, setCelebrateCategory] = useState<string>('');
  const [celebrateDrink, setCelebrateDrink] = useState<string>('');

  useEffect(() => {
    if (user) {
      supabase.from('bc_users').select('campus, city').eq('id', user.id).single().then(({ data }) => {
        if (data?.city) setCity(data.city);
        else if (data?.campus) setCity(cityFromCampus(data.campus) || '');
      });
    }
  }, [user]);

  // Fetch local places when city is selected
  useEffect(() => {
    if (selectedCity) {
      supabase.from('bc_local_places').select('*').eq('city', selectedCity).order('name').then(({ data }) => {
        setLocalPlaces(data || []);
      });
    }
  }, [selectedCity]);

  const reset = () => {
    setStep('category'); setCategory(null); setBrand(null); setProduct(null);
    setFlavor(''); setCustomFlavor(''); setCaption(''); setImageUri(null); setRating(0); setIsPrivate(false); setBrandSearch(''); setProductSearch('');
    setLocalStep('city'); setCitySearch(''); setSelectedCity(null); setLocalPlaces([]); setSelectedPlace(null); setLocalItemName(''); setLocalItemCategory('other'); setNewPlaceName('');
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const finalFlavor = customFlavor.trim() || flavor;
  const drinkName = postMode === 'branded'
    ? (product && finalFlavor ? `${product} - ${finalFlavor}` : product || brand || '')
    : localItemName || '';
  const displayBrand = postMode === 'branded' ? brand : selectedPlace?.name || '';

  const handlePost = async () => {
    if (postMode === 'branded' && !brand) { if (Platform.OS === 'web') window.alert('Pick a company first'); else alert('Pick a company first'); return; }
    if (postMode === 'local' && !selectedPlace) { if (Platform.OS === 'web') window.alert('Pick a local place first'); else alert('Pick a local place first'); return; }
    if (postMode === 'local' && !localItemName.trim()) { if (Platform.OS === 'web') window.alert('Enter a menu item name'); else alert('Enter a menu item name'); return; }

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

      // For local posts, save the item to bc_local_items
      if (postMode === 'local' && selectedPlace) {
        await supabase.from('bc_local_items').insert({
          place_id: selectedPlace.id,
          name: localItemName.trim(),
          category: localItemCategory,
          created_by: user!.id,
        });
      }

      const postData: any = {
        user_id: user!.id,
        drink_name: drinkName,
        drink_type: postMode === 'local' ? localItemCategory : category,
        brand: displayBrand,
        flavor: postMode === 'branded' ? (finalFlavor || null) : null,
        caption: caption.trim() || null,
        photo_url,
        rating: rating || null,
        is_private: isPrivate,
        city: postMode === 'local' ? selectedCity : (city || null),
        is_local: postMode === 'local',
      };
      const { error } = await supabase.from('bc_posts').insert(postData);
      if (error) throw error;
      checkAndAwardBadges(user!.id).catch(() => {});
      setCelebrateCategory(postData.drink_type || 'other');
      setCelebrateDrink(drinkName);
      setCelebrating(true);
    } catch (err: any) {
      if (Platform.OS === 'web') window.alert('Error: ' + err.message); else alert('Error: ' + err.message);
    } finally { setPosting(false); }
  };

  const s = makeStyles(colors);
  const STEPS: Step[] = ['category', 'brand', 'product', 'flavor', 'details'];
  const stepNumber = STEPS.indexOf(step) + 1;
  const LOCAL_STEPS: LocalStep[] = ['city', 'place', 'item', 'details'];
  const localStepNumber = LOCAL_STEPS.indexOf(localStep) + 1;

  const renderStepIndicator = (total: number, current: number) => (
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 20 }}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={{ width: 26, height: 4, borderRadius: 2, backgroundColor: i < current ? colors.neonGreen : colors.inputBorder }} />
      ))}
    </View>
  );

  const goBack = () => {
    if (postMode === 'branded') {
      if (step === 'brand') { setStep('category'); setCategory(null); setBrand(null); setProduct(null); setFlavor(''); }
      else if (step === 'product') { setStep('brand'); setBrand(null); setProduct(null); setFlavor(''); }
      else if (step === 'flavor') { setStep('product'); setProduct(null); setFlavor(''); }
      else if (step === 'details') setStep('flavor');
    } else {
      if (localStep === 'place') { setLocalStep('city'); setSelectedCity(null); setSelectedPlace(null); }
      else if (localStep === 'item') { setLocalStep('place'); setSelectedPlace(null); setLocalItemName(''); }
      else if (localStep === 'details') setLocalStep('item');
    }
  };

  const isFirstStep = postMode === 'branded' ? step === 'category' : localStep === 'city';

  const renderBack = () => !isFirstStep ? (
    <TouchableOpacity style={{ marginBottom: 8 }} onPress={goBack}>
      <Text style={{ color: colors.electricBlue, fontSize: fonts.sizes.md, fontWeight: '600' }}>← Back</Text>
    </TouchableOpacity>
  ) : null;

  // Mode toggle component
  const renderModeToggle = () => (
    <View style={[s.modeToggleRow, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        style={[s.modeToggleBtn, postMode === 'branded' && { backgroundColor: colors.neonGreen }]}
        onPress={() => { setPostMode('branded'); reset(); }}
      >
        <Text style={[s.modeToggleText, { color: colors.textMuted }, postMode === 'branded' && { color: colors.bg }]}>🏷️ Branded</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[s.modeToggleBtn, postMode === 'local' && { backgroundColor: colors.electricBlue }]}
        onPress={() => { setPostMode('local'); reset(); setPostMode('local'); }}
      >
        <Text style={[s.modeToggleText, { color: colors.textMuted }, postMode === 'local' && { color: '#fff' }]}>📍 Local</Text>
      </TouchableOpacity>
    </View>
  );

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

  // ═══════════════════════════════
  // LOCAL FLOW
  // ═══════════════════════════════
  if (postMode === 'local') {
    if (localStep === 'city') {
      const allCities = getSelectableCities();
      const q = citySearch.toLowerCase();
      const filtered = q ? allCities.filter(c => c.toLowerCase().includes(q)) : allCities;

      return (
        <ScrollView style={s.container} contentContainerStyle={s.content}>
          <Text style={s.title}>📍 Local Check-In</Text>
          {renderModeToggle()}
          {renderStepIndicator(4, localStepNumber)}
          <Text style={s.stepLabel}>Search for your city</Text>
          <TextInput
            style={[s.input, { marginBottom: 16 }]}
            placeholder="🔍 Search cities..."
            placeholderTextColor={colors.textMuted}
            value={citySearch}
            onChangeText={setCitySearch}
          />
          <View style={{ gap: 2 }}>
            {filtered.map(c => (
              <TouchableOpacity key={c} style={s.listItem} onPress={() => { setSelectedCity(c); setLocalStep('place'); }}>
                <Text style={{ color: colors.text, fontSize: fonts.sizes.md, fontWeight: '600' }}>{c}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 22 }}>›</Text>
              </TouchableOpacity>
            ))}
            {filtered.length === 0 && <Text style={{ color: colors.textMuted, textAlign: 'center', marginVertical: 20 }}>No cities found</Text>}
          </View>
        </ScrollView>
      );
    }

    if (localStep === 'place') {
      return (
        <ScrollView style={s.container} contentContainerStyle={s.content}>
          {renderBack()}
          <Text style={s.title}>📍 {selectedCity}</Text>
          {renderStepIndicator(4, localStepNumber)}
          <Text style={s.stepLabel}>Pick a local spot</Text>

          {localPlaces.length === 0 && (
            <Text style={{ color: colors.textMuted, textAlign: 'center', marginVertical: 12 }}>No places added yet — be the first!</Text>
          )}

          <View style={{ gap: 2 }}>
            {localPlaces.map(p => (
              <TouchableOpacity key={p.id} style={s.listItem} onPress={() => { setSelectedPlace(p); setLocalStep('item'); }}>
                <Text style={{ color: colors.text, fontSize: fonts.sizes.md, fontWeight: '600' }}>{p.name}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 22 }}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Add new place */}
          <View style={{ marginTop: 20, backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.cardBorder }}>
            <Text style={{ color: colors.textSecondary, fontWeight: '700', marginBottom: 8 }}>➕ Add a new place</Text>
            <TextInput
              style={s.input}
              placeholder="Place name (e.g. Joe's Coffee)"
              placeholderTextColor={colors.textMuted}
              value={newPlaceName}
              onChangeText={setNewPlaceName}
            />
            <TouchableOpacity
              style={[s.nextBtn, !newPlaceName.trim() && { opacity: 0.4 }]}
              disabled={!newPlaceName.trim()}
              onPress={async () => {
                const { data, error } = await supabase.from('bc_local_places').insert({
                  name: newPlaceName.trim(),
                  city: selectedCity,
                  created_by: user!.id,
                }).select().single();
                if (!error && data) {
                  setLocalPlaces(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
                  setSelectedPlace(data);
                  setNewPlaceName('');
                  setLocalStep('item');
                } else {
                  if (Platform.OS === 'web') window.alert('Error adding place'); else alert('Error adding place');
                }
              }}
            >
              <Text style={{ color: colors.bg, fontSize: fonts.sizes.md, fontWeight: '800' }}>Add & Select</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    if (localStep === 'item') {
      const categoryOptions = [
        { key: 'coffee', label: '☕ Coffee', },
        { key: 'energy_drink', label: '⚡ Energy' },
        { key: 'protein_shake', label: '💪 Protein' },
        { key: 'electrolytes', label: '💧 Electrolytes' },
        { key: 'supplements', label: '🥛 Supplements' },
        { key: 'other', label: '🥤 Other' },
      ];

      return (
        <ScrollView style={s.container} contentContainerStyle={s.content}>
          {renderBack()}
          <Text style={s.title}>🏪 {selectedPlace?.name}</Text>
          {renderStepIndicator(4, localStepNumber)}
          <Text style={s.stepLabel}>What did you get?</Text>

          <TextInput
            style={s.input}
            placeholder="Menu item name (e.g. Oat Latte)"
            placeholderTextColor={colors.textMuted}
            value={localItemName}
            onChangeText={setLocalItemName}
          />

          <Text style={[s.stepLabel, { marginTop: 8 }]}>Category</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {categoryOptions.map(c => (
              <TouchableOpacity
                key={c.key}
                style={[s.chip, localItemCategory === c.key && { backgroundColor: colors.electricBlue + '22', borderColor: colors.electricBlue }]}
                onPress={() => setLocalItemCategory(c.key)}
              >
                <Text style={{ color: localItemCategory === c.key ? colors.electricBlue : colors.textSecondary, fontSize: fonts.sizes.sm, fontWeight: localItemCategory === c.key ? '600' : '400' }}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[s.nextBtn, !localItemName.trim() && { opacity: 0.4 }]}
            disabled={!localItemName.trim()}
            onPress={() => setLocalStep('details')}
          >
            <Text style={{ color: colors.bg, fontSize: fonts.sizes.lg, fontWeight: '800' }}>Next →</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    // Local details step (same as branded details)
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        {renderBack()}
        <Text style={s.title}>Almost there!</Text>
        {renderStepIndicator(4, localStepNumber)}
        <View style={s.summaryCard}>
          <Text style={{ color: colors.neonGreen, fontSize: fonts.sizes.lg, fontWeight: '700', textAlign: 'center' }}>{localItemName}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: fonts.sizes.sm, textAlign: 'center', marginTop: 4 }}>from {selectedPlace?.name} • {selectedCity}</Text>
        </View>

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

  // ═══════════════════════════════
  // BRANDED FLOW (existing)
  // ═══════════════════════════════

  if (step === 'category') {
    const searchResults = searchBrands(brandSearch);
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Text style={s.title}>🥤 New Check-In</Text>
        {renderModeToggle()}
        {renderStepIndicator(5, stepNumber)}
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
        {renderStepIndicator(5, stepNumber)}
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
        {renderStepIndicator(5, stepNumber)}
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
        {renderStepIndicator(5, stepNumber)}
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

  // Step 5: Details (branded)
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {renderBack()}
      <Text style={s.title}>Almost there!</Text>
      {renderStepIndicator(5, stepNumber)}
      <View style={s.summaryCard}>
        <Text style={{ color: colors.neonGreen, fontSize: fonts.sizes.lg, fontWeight: '700', textAlign: 'center' }}>{drinkName}</Text>
      </View>

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
  modeToggleRow: { flexDirection: 'row', marginBottom: 16, borderRadius: 10, padding: 3 },
  modeToggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  modeToggleText: { fontWeight: '700', fontSize: fonts.sizes.md },
});
