// Legacy colors export for compatibility - prefer useTheme() hook
export const colors = {
  bg: '#0a0a0a',
  card: '#141414',
  cardBorder: '#1e1e1e',
  surface: '#1a1a1a',
  neonGreen: '#39FF14',
  electricBlue: '#00D4FF',
  accent: '#39FF14',
  text: '#FFFFFF',
  textSecondary: '#888888',
  textMuted: '#555555',
  danger: '#FF4444',
  inputBg: '#1e1e1e',
  inputBorder: '#333333',
};

export const fonts = {
  sizes: { xs: 11, sm: 13, md: 15, lg: 18, xl: 24, xxl: 32 },
};

export const drinkTypeLabels: Record<string, string> = {
  energy_drink: '⚡ Energy Drink',
  protein_shake: '💪 Protein Shakes',
  coffee: '☕ Coffee',
  pre_workout: '🔥 Pre-Workout',
  supplements: '🥛 Supplements',
  electrolytes: '💧 Electrolytes',
  other: '🥤 Other',
};

export const drinkTypeEmoji: Record<string, string> = {
  energy_drink: '⚡',
  protein_shake: '💪',
  coffee: '☕',
  pre_workout: '🔥',
  supplements: '🥛',
  electrolytes: '💧',
  other: '🥤',
};
