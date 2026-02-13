import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

type Mode = 'dark' | 'light';

type ThemeColors = {
  bg: string; card: string; cardBorder: string; surface: string;
  neonGreen: string; electricBlue: string; accent: string;
  text: string; textSecondary: string; textMuted: string;
  danger: string; inputBg: string; inputBorder: string;
};

const darkColors: ThemeColors = {
  bg: '#0a0a0a', card: '#141414', cardBorder: '#1e1e1e', surface: '#1a1a1a',
  neonGreen: '#39FF14', electricBlue: '#00D4FF', accent: '#39FF14',
  text: '#FFFFFF', textSecondary: '#888888', textMuted: '#555555',
  danger: '#FF4444', inputBg: '#1e1e1e', inputBorder: '#333333',
};

const lightColors: ThemeColors = {
  bg: '#F5F5F7', card: '#FFFFFF', cardBorder: '#E5E5E5', surface: '#EBEBEB',
  neonGreen: '#16A34A', electricBlue: '#0284C7', accent: '#16A34A',
  text: '#1A1A1A', textSecondary: '#666666', textMuted: '#999999',
  danger: '#DC2626', inputBg: '#FFFFFF', inputBorder: '#D4D4D4',
};

type ThemeContextType = {
  mode: Mode;
  colors: ThemeColors;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark', colors: darkColors, toggle: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>(() => {
    if (Platform.OS === 'web') {
      try { return (localStorage.getItem('bc_theme') as Mode) || 'dark'; } catch { return 'dark'; }
    }
    return 'dark';
  });

  useEffect(() => {
    if (Platform.OS === 'web') {
      try { localStorage.setItem('bc_theme', mode); } catch {}
    }
  }, [mode]);

  const toggle = () => setMode(m => m === 'dark' ? 'light' : 'dark');
  const colors = mode === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ mode, colors, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
