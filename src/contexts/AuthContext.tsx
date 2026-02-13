import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

type BCUser = {
  id: string;
  username: string;
  display_name: string | null;
  campus: string | null;
};

type AuthContextType = {
  session: { user: BCUser } | null;
  user: BCUser | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

// Simple storage wrapper
const storage = Platform.OS === 'web' ? localStorage : null;
function saveUser(user: BCUser) {
  try { storage?.setItem('bc_user', JSON.stringify(user)); } catch {}
}
function loadUser(): BCUser | null {
  try { const u = storage?.getItem('bc_user'); return u ? JSON.parse(u) : null; } catch { return null; }
}
function clearUser() {
  try { storage?.removeItem('bc_user'); } catch {}
}

// Simple hash for password (not secure, but fine for MVP)
async function hashPass(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_buzzcheck_salt');
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback: simple hash
  let h = 0;
  const s = password + '_buzzcheck_salt';
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
  return Math.abs(h).toString(16);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BCUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = loadUser();
    if (saved) setUser(saved);
    setLoading(false);
  }, []);

  const signUp = async (_email: string, password: string, username: string) => {
    // Check if username taken
    const { data: existing } = await supabase.from('bc_users').select('id').eq('username', username).single();
    if (existing) throw new Error('Username already taken');

    const passHash = await hashPass(password);
    const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
    
    const { error } = await supabase.from('bc_users').insert({
      id,
      username,
      display_name: username,
      password_hash: passHash,
    });
    if (error) throw new Error(error.message);
    
    const newUser = { id, username, display_name: username, campus: null };
    saveUser(newUser);
    setUser(newUser);
  };

  const signIn = async (_email: string, password: string, username?: string) => {
    // Use email field as username for login
    const loginName = username || _email;
    const passHash = await hashPass(password);
    
    const { data, error } = await supabase.from('bc_users')
      .select('*')
      .eq('username', loginName)
      .eq('password_hash', passHash)
      .single();
    
    if (error || !data) throw new Error('Invalid username or password');
    
    const u = { id: data.id, username: data.username, display_name: data.display_name, campus: data.campus };
    saveUser(u);
    setUser(u);
  };

  const signOut = async () => {
    clearUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ session: user ? { user } : null, user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
