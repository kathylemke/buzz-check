import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { supabase } from './src/lib/supabase';
import { colors } from './src/theme';
import LoginScreen from './src/screens/LoginScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import FeedScreen from './src/screens/FeedScreen';
import NewPostScreen from './src/screens/NewPostScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FriendsScreen from './src/screens/FriendsScreen';

const Tab = createBottomTabNavigator();

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.cardBorder, borderTopWidth: 1, height: 85, paddingBottom: 28 },
        tabBarActiveTintColor: colors.neonGreen,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
      }}
    >
      <Tab.Screen name="Feed" component={FeedScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>⚡</Text> }} />
      <Tab.Screen name="Friends" component={FriendsScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>👥</Text> }} />
      <Tab.Screen name="Post" component={NewPostScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>➕</Text> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>👤</Text> }} />
    </Tab.Navigator>
  );
}

function Main() {
  const { session, user, loading } = useAuth();
  const [needsWelcome, setNeedsWelcome] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      // Check if user has set a campus (completed welcome)
      supabase.from('bc_users').select('campus').eq('id', user.id).single()
        .then(({ data }) => setNeedsWelcome(!data?.campus))
        .catch(() => setNeedsWelcome(true));
    } else {
      setNeedsWelcome(null);
    }
  }, [user]);

  if (loading || (session && needsWelcome === null)) return null;
  if (!session) return <LoginScreen />;
  if (needsWelcome) return <WelcomeScreen onComplete={() => setNeedsWelcome(false)} />;
  return <AppTabs />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Main />
      </NavigationContainer>
    </AuthProvider>
  );
}
