import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { supabase } from './src/lib/supabase';
import LoginScreen from './src/screens/LoginScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import FeedScreen from './src/screens/FeedScreen';
import NewPostScreen from './src/screens/NewPostScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import MapScreen from './src/screens/MapScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import { getUnreadCount } from './src/lib/notifications';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function NotifBell({ color, userId }: { color: string; userId: string | undefined }) {
  const [count, setCount] = useState(0);
  const { colors } = useTheme();

  useEffect(() => {
    if (!userId) return;
    const load = () => getUnreadCount(userId).then(setCount);
    load();
    const interval = setInterval(load, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, [userId]);

  return (
    <View>
      <Text style={{ fontSize: 22, color }}>🔔</Text>
      {count > 0 && (
        <View style={{ position: 'absolute', top: -4, right: -8, backgroundColor: colors.danger, borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </View>
  );
}

function AppTabs() {
  const { colors, mode } = useTheme();
  const { user } = useAuth();
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
      <Tab.Screen name="Post" component={NewPostScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>➕</Text> }} />
      <Tab.Screen name="Board" component={LeaderboardScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🏆</Text> }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🗺️</Text> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>👤</Text> }} />
    </Tab.Navigator>
  );
}

function Main() {
  const { session, user, loading } = useAuth();
  const [needsWelcome, setNeedsWelcome] = useState<boolean | null>(null);
  const { mode } = useTheme();

  useEffect(() => {
    if (user) {
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
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={AppTabs} />
      <Stack.Screen name="UserProfile" component={ProfileScreen} />
      <Stack.Screen name="Friends" component={FriendsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Main />
        </NavigationContainer>
      </AuthProvider>
    </ThemeProvider>
  );
}
