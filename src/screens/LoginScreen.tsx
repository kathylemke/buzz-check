import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, fonts } from '../theme';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    setError('');
    setMessage('');
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(username, password, username);
      } else {
        await signIn(username, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.inner}>
        <Text style={s.logo}>⚡ BUZZ CHECK</Text>
        <Text style={s.subtitle}>Track your daily fuel</Text>

        {error ? <Text style={s.error}>{error}</Text> : null}
        {message ? <Text style={s.message}>{message}</Text> : null}

        <TextInput
          style={s.input}
          placeholder="Username"
          placeholderTextColor={colors.textMuted}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={s.input}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={s.button} onPress={handleSubmit} disabled={loading}>
          <Text style={s.buttonText}>{loading ? '...' : isSignUp ? 'SIGN UP' : 'LOG IN'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={s.switchText}>
            {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: fonts.sizes.xxl, fontWeight: '900', color: colors.neonGreen, textAlign: 'center', letterSpacing: 2 },
  subtitle: { fontSize: fonts.sizes.md, color: colors.textSecondary, textAlign: 'center', marginBottom: 40, marginTop: 8 },
  input: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12, padding: 16, fontSize: fonts.sizes.md, color: colors.text, marginBottom: 12 },
  button: { backgroundColor: colors.neonGreen, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: colors.bg, fontSize: fonts.sizes.lg, fontWeight: '800', letterSpacing: 1 },
  switchText: { color: colors.electricBlue, textAlign: 'center', marginTop: 20, fontSize: fonts.sizes.sm },
  error: { color: '#ff4444', textAlign: 'center', marginBottom: 16, fontSize: fonts.sizes.sm },
  message: { color: colors.neonGreen, textAlign: 'center', marginBottom: 16, fontSize: fonts.sizes.sm },
});
