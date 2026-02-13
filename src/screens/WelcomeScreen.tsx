import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fonts } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CITIES, cityFromCampus } from '../data/cities';

export default function WelcomeScreen({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [campus, setCampus] = useState('');
  const [city, setCity] = useState('');
  const [step, setStep] = useState(0);

  const handleFinish = async () => {
    if (user) {
      const autoCity = cityFromCampus(campus) || city || null;
      await supabase.from('bc_users').update({ campus: campus || null, city: autoCity }).eq('id', user.id);
    }
    onComplete();
  };

  if (step === 0) {
    return (
      <View style={[s.container, { backgroundColor: colors.bg }]}>
        <Text style={{ fontSize: 64, textAlign: 'center', marginBottom: 16 }}>⚡</Text>
        <Text style={[s.title, { color: colors.neonGreen }]}>Welcome to Buzz Check!</Text>
        <Text style={{ fontSize: fonts.sizes.md, color: colors.textSecondary, textAlign: 'center', marginBottom: 40, lineHeight: 24 }}>Your daily fuel tracker. Post your coffees, energy drinks, protein shakes — and see what your friends are drinking.</Text>
        <TouchableOpacity style={[s.button, { backgroundColor: colors.neonGreen }]} onPress={() => setStep(1)}>
          <Text style={{ color: colors.bg, fontSize: fonts.sizes.lg, fontWeight: '800', letterSpacing: 1 }}>LET'S GO</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <Text style={{ fontSize: 64, textAlign: 'center', marginBottom: 16 }}>🏫</Text>
      <Text style={[s.title, { color: colors.neonGreen }]}>What's your campus?</Text>
      <Text style={{ fontSize: fonts.sizes.md, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 }}>Connect with people at your school</Text>
      <TextInput
        style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12, padding: 16, fontSize: fonts.sizes.md, color: colors.text, marginBottom: 16 }}
        placeholder="e.g. Northwestern, UCLA, NYU..."
        placeholderTextColor={colors.textMuted}
        value={campus}
        onChangeText={t => { setCampus(t); const auto = cityFromCampus(t); if (auto) setCity(auto); }}
      />
      <Text style={{ color: colors.textSecondary, fontSize: fonts.sizes.sm, marginBottom: 8 }}>Your city</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
        {CITIES.map(c => (
          <TouchableOpacity key={c} onPress={() => setCity(c)} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: city === c ? colors.electricBlue + '22' : colors.surface, borderWidth: 1, borderColor: city === c ? colors.electricBlue : colors.cardBorder }}>
            <Text style={{ color: city === c ? colors.electricBlue : colors.textMuted, fontWeight: '700', fontSize: 12 }}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={[s.button, { backgroundColor: colors.neonGreen }]} onPress={handleFinish}>
        <Text style={{ color: colors.bg, fontSize: fonts.sizes.lg, fontWeight: '800', letterSpacing: 1 }}>{campus ? 'DONE' : 'SKIP FOR NOW'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 32 },
  title: { fontSize: fonts.sizes.xxl, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  button: { borderRadius: 12, padding: 16, alignItems: 'center' },
});
