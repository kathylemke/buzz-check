import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function WelcomeScreen({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const [campus, setCampus] = useState('');
  const [step, setStep] = useState(0);

  const handleFinish = async () => {
    if (user && campus) {
      await supabase.from('bc_users').update({ campus }).eq('id', user.id);
    }
    onComplete();
  };

  if (step === 0) {
    return (
      <View style={s.container}>
        <Text style={s.emoji}>⚡</Text>
        <Text style={s.title}>Welcome to Buzz Check!</Text>
        <Text style={s.subtitle}>Your daily fuel tracker. Post your coffees, energy drinks, protein shakes — and see what your friends are drinking.</Text>
        <TouchableOpacity style={s.button} onPress={() => setStep(1)}>
          <Text style={s.buttonText}>LET'S GO</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Text style={s.emoji}>🏫</Text>
      <Text style={s.title}>What's your campus?</Text>
      <Text style={s.subtitle}>Connect with people at your school</Text>
      <TextInput
        style={s.input}
        placeholder="e.g. Northwestern, UCLA, NYU..."
        placeholderTextColor={colors.textMuted}
        value={campus}
        onChangeText={setCampus}
      />
      <TouchableOpacity style={s.button} onPress={handleFinish}>
        <Text style={s.buttonText}>{campus ? 'DONE' : 'SKIP FOR NOW'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 32 },
  emoji: { fontSize: 64, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: fonts.sizes.xxl, fontWeight: '900', color: colors.neonGreen, textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: fonts.sizes.md, color: colors.textSecondary, textAlign: 'center', marginBottom: 40, lineHeight: 24 },
  input: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12, padding: 16, fontSize: fonts.sizes.md, color: colors.text, marginBottom: 20 },
  button: { backgroundColor: colors.neonGreen, borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonText: { color: colors.bg, fontSize: fonts.sizes.lg, fontWeight: '800', letterSpacing: 1 },
});
