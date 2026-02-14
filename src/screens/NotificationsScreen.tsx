import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fonts } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { getNotifications, markAllRead } from '../lib/notifications';

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function NotificationsScreen({ navigation }: any) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await getNotifications(user.id);
    setNotifications(data);
    setLoading(false);
    // Mark all as read when viewing
    markAllRead(user.id);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const s = makeStyles(colors);

  const renderItem = ({ item }: { item: any }) => (
    <View style={[s.card, !item.read && { borderLeftWidth: 3, borderLeftColor: colors.neonGreen }]}>
      <Text style={s.message}>{item.message}</Text>
      <View style={s.cardFooter}>
        <Text style={s.time}>{timeAgo(item.created_at)}</Text>
        <TouchableOpacity
          style={s.ctaBtn}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Post' })}
        >
          <Text style={s.ctaText}>⚡ Post Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.electricBlue, fontSize: fonts.sizes.md, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>🔔 Notifications</Text>
        <View style={{ width: 50 }} />
      </View>
      {loading ? (
        <ActivityIndicator color={colors.neonGreen} style={{ marginTop: 40 }} />
      ) : notifications.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🔕</Text>
          <Text style={{ color: colors.textMuted, fontSize: fonts.sizes.md }}>No notifications yet</Text>
          <Text style={{ color: colors.textMuted, fontSize: fonts.sizes.sm, marginTop: 4 }}>When your friends start checking in, you'll get smack talk here</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  title: { fontSize: fonts.sizes.lg, fontWeight: '800', color: colors.neonGreen },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.cardBorder },
  message: { color: colors.text, fontSize: fonts.sizes.md, fontWeight: '600', lineHeight: 22 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  time: { color: colors.textMuted, fontSize: fonts.sizes.sm },
  ctaBtn: { backgroundColor: colors.neonGreen, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  ctaText: { color: colors.bg, fontSize: fonts.sizes.sm, fontWeight: '800' },
});
