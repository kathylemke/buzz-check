import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fonts } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { CAMPUS_TO_CITY, cityFromCampus, getSelectableCities } from '../data/cities';

const ALL_CAMPUSES = Object.keys(CAMPUS_TO_CITY).sort();

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const { colors } = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [campus, setCampus] = useState('');
  const [campusSuggestions, setCampusSuggestions] = useState<string[]>([]);
  const [selectedCampus, setSelectedCampus] = useState('');
  const [notInUni, setNotInUni] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (campus.length < 2) { setCampusSuggestions([]); return; }
    const lower = campus.toLowerCase();
    const matches = ALL_CAMPUSES.filter(c => c.toLowerCase().includes(lower)).slice(0, 5);
    setCampusSuggestions(matches);
  }, [campus]);

  const pickCampus = (c: string) => {
    setSelectedCampus(c);
    setCampus(c);
    setCampusSuggestions([]);
  };

  const onCitySearch = (text: string) => {
    setCitySearch(text);
    setSelectedCity('');
    if (text.length < 2) { setCitySuggestions([]); return; }
    const lower = text.toLowerCase();
    setCitySuggestions(getSelectableCities().filter(c => c.toLowerCase().includes(lower)).slice(0, 8));
  };

  const pickCity = (c: string) => {
    setSelectedCity(c);
    setCitySearch(c);
    setCitySuggestions([]);
  };

  const handleSubmit = async () => {
    setError('');
    if (!username || !password) { setError('Please fill in all fields'); return; }
    if (isSignUp && !selectedCampus && !selectedCity) { setError('Please select your university or home city'); return; }
    setLoading(true);
    try {
      if (isSignUp) {
        const city = notInUni ? selectedCity : (cityFromCampus(selectedCampus) || undefined);
        const campusVal = notInUni ? undefined : selectedCampus;
        await signUp(username, password, username, campusVal, city);
      } else {
        await signIn(username, password);
      }
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const detectedCity = selectedCampus ? cityFromCampus(selectedCampus) : null;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: fonts.sizes.xxl, fontWeight: '900', color: colors.neonGreen, textAlign: 'center', letterSpacing: 2 }}>⚡ BUZZ CHECK</Text>
        <Text style={{ fontSize: fonts.sizes.md, color: colors.textSecondary, textAlign: 'center', marginBottom: 40, marginTop: 8 }}>Track your daily fuel</Text>
        {error ? <Text style={{ color: '#ff4444', textAlign: 'center', marginBottom: 16 }}>{error}</Text> : null}
        <TextInput style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12, padding: 16, fontSize: fonts.sizes.md, color: colors.text, marginBottom: 12 }} placeholder="Username" placeholderTextColor={colors.textMuted} value={username} onChangeText={setUsername} autoCapitalize="none" />
        <TextInput style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12, padding: 16, fontSize: fonts.sizes.md, color: colors.text, marginBottom: 12 }} placeholder="Password" placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
        {isSignUp && (
          <View style={{ marginBottom: 12 }}>
            {!notInUni && <TextInput style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12, padding: 16, fontSize: fonts.sizes.md, color: colors.text }} placeholder="University (e.g. Virginia Tech)" placeholderTextColor={colors.textMuted} value={campus} onChangeText={(t) => { setCampus(t); setSelectedCampus(''); }} autoCapitalize="words" />}
            {!notInUni && campusSuggestions.length > 0 && (
              <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.cardBorder, marginTop: 4 }}>
                {campusSuggestions.map(c => (
                  <TouchableOpacity key={c} onPress={() => pickCampus(c)} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
                    <Text style={{ color: colors.text, fontSize: fonts.sizes.sm }}>{c}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>{CAMPUS_TO_CITY[c]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {detectedCity && !notInUni && <Text style={{ color: colors.electricBlue, fontSize: 12, marginTop: 6 }}>📍 {detectedCity}</Text>}

            <TouchableOpacity onPress={() => { setNotInUni(!notInUni); setSelectedCampus(''); setCampus(''); setSelectedCity(''); setCitySearch(''); }} style={{ marginTop: 10 }}>
              <Text style={{ color: colors.electricBlue, fontSize: fonts.sizes.xs, fontWeight: '600' }}>
                {notInUni ? '↑ Search university instead' : 'Not in university? Select your home city'}
              </Text>
            </TouchableOpacity>

            {notInUni && (
              <View style={{ marginTop: 8 }}>
                <TextInput style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12, padding: 16, fontSize: fonts.sizes.md, color: colors.text }} placeholder="Search city..." placeholderTextColor={colors.textMuted} value={citySearch} onChangeText={onCitySearch} autoCapitalize="words" />
                {citySuggestions.length > 0 && (
                  <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.cardBorder, marginTop: 4 }}>
                    {citySuggestions.map(c => (
                      <TouchableOpacity key={c} onPress={() => pickCity(c)} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
                        <Text style={{ color: colors.text, fontSize: fonts.sizes.sm }}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {selectedCity && <Text style={{ color: colors.electricBlue, fontSize: 12, marginTop: 6 }}>📍 {selectedCity}</Text>}
              </View>
            )}
          </View>
        )}
        <TouchableOpacity style={{ backgroundColor: colors.neonGreen, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 }} onPress={handleSubmit} disabled={loading}>
          <Text style={{ color: colors.bg, fontSize: fonts.sizes.lg, fontWeight: '800', letterSpacing: 1 }}>{loading ? '...' : isSignUp ? 'SIGN UP' : 'LOG IN'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={{ color: colors.electricBlue, textAlign: 'center', marginTop: 20, fontSize: fonts.sizes.sm }}>{isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
