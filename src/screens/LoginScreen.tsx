import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fonts } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { CAMPUS_TO_CITY, cityFromCampus } from '../data/cities';

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

  const handleSubmit = async () => {
    setError('');
    if (!username || !password) { setError('Please fill in all fields'); return; }
    if (isSignUp && !selectedCampus) { setError('Please select your university'); return; }
    setLoading(true);
    try {
      if (isSignUp) {
        const city = cityFromCampus(selectedCampus);
        await signUp(username, password, username, selectedCampus, city || undefined);
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
            <TextInput style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12, padding: 16, fontSize: fonts.sizes.md, color: colors.text }} placeholder="University (e.g. Virginia Tech)" placeholderTextColor={colors.textMuted} value={campus} onChangeText={(t) => { setCampus(t); setSelectedCampus(''); }} autoCapitalize="words" />
            {campusSuggestions.length > 0 && (
              <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.cardBorder, marginTop: 4 }}>
                {campusSuggestions.map(c => (
                  <TouchableOpacity key={c} onPress={() => pickCampus(c)} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
                    <Text style={{ color: colors.text, fontSize: fonts.sizes.sm }}>{c}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>{CAMPUS_TO_CITY[c]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {detectedCity && <Text style={{ color: colors.electricBlue, fontSize: 12, marginTop: 6 }}>📍 {detectedCity}</Text>}
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
