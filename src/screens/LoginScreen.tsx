import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fonts } from '../theme';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const { colors } = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!username || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    try {
      if (isSignUp) await signUp(username, password, username);
      else await signIn(username, password);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: fonts.sizes.xxl, fontWeight: '900', color: colors.neonGreen, textAlign: 'center', letterSpacing: 2 }}>⚡ BUZZ CHECK</Text>
        <Text style={{ fontSize: fonts.sizes.md, color: colors.textSecondary, textAlign: 'center', marginBottom: 40, marginTop: 8 }}>Track your daily fuel</Text>
        {error ? <Text style={{ color: '#ff4444', textAlign: 'center', marginBottom: 16 }}>{error}</Text> : null}
        <TextInput style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12, padding: 16, fontSize: fonts.sizes.md, color: colors.text, marginBottom: 12 }} placeholder="Username" placeholderTextColor={colors.textMuted} value={username} onChangeText={setUsername} autoCapitalize="none" />
        <TextInput style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12, padding: 16, fontSize: fonts.sizes.md, color: colors.text, marginBottom: 12 }} placeholder="Password" placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
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
