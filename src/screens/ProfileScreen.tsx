import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, RefreshControl, Modal, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fonts, drinkTypeEmoji, drinkTypeLabels } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getUserBadges, BADGE_DEFS } from '../lib/badges';
import { getAllCities } from '../data/cities';

type Post = { id: string; drink_name: string; drink_type: string; brand: string | null; photo_url: string | null; created_at: string };
type Badge = { badge_type: string; badge_name: string; badge_desc: string; earned_at: string };

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { colors, mode, toggle } = useTheme();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [stats, setStats] = useState({ today: 0, week: 0, allTime: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [breakdown, setBreakdown] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [profileRes, postsRes] = await Promise.all([
      supabase.from('bc_users').select('*').eq('id', user.id).single(),
      supabase.from('bc_posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    if (profileRes.data) setProfile(profileRes.data);
    if (postsRes.data) {
      setPosts(postsRes.data);
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startOfWeek = new Date(now.getTime() - 7 * 86400000).toISOString();
      setStats({
        today: postsRes.data.filter((p: Post) => p.created_at >= startOfDay).length,
        week: postsRes.data.filter((p: Post) => p.created_at >= startOfWeek).length,
        allTime: postsRes.data.length,
      });
    }
    const b = await getUserBadges(user.id);
    setBadges(b);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const updateCity = async (c: string) => {
    if (!user) return;
    await supabase.from('bc_users').update({ city: c }).eq('id', user.id);
    setProfile((p: any) => p ? { ...p, city: c } : p);
  };

  const openBreakdown = (period: 'today' | 'week' | 'allTime') => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfWeek = new Date(now.getTime() - 7 * 86400000).toISOString();
    const config: any = {
      today: { title: "Today's Breakdown", filter: (p: Post) => p.created_at >= startOfDay },
      week: { title: "This Week", filter: (p: Post) => p.created_at >= startOfWeek },
      allTime: { title: "All Time", filter: undefined },
    }[period];
    const filtered = config.filter ? posts.filter(config.filter) : posts;
    const byType: Record<string, number> = {};
    const brandMap: Record<string, number> = {};
    for (const p of filtered) {
      byType[p.drink_type] = (byType[p.drink_type] || 0) + 1;
      const b = p.brand || 'Unknown';
      brandMap[b] = (brandMap[b] || 0) + 1;
    }
    setBreakdown({ title: config.title, byType, byBrand: Object.entries(brandMap).sort((a, b) => b[1] - a[1]) });
  };

  const StatBox = ({ label, value, period }: any) => (
    <TouchableOpacity style={[ss.statBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} onPress={() => openBreakdown(period)} activeOpacity={0.7}>
      <Text style={{ color: colors.neonGreen, fontSize: fonts.sizes.xl, fontWeight: '900' }}>{value}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: fonts.sizes.xs, marginTop: 4 }}>{label}</Text>
    </TouchableOpacity>
  );

  const renderPost = ({ item }: { item: Post }) => (
    <View style={ss.gridItem}>
      {item.photo_url ? (
        <Image source={{ uri: item.photo_url }} style={[ss.gridImage, { backgroundColor: colors.surface }]} />
      ) : (
        <View style={[ss.gridImage, ss.gridPlaceholder, { backgroundColor: colors.surface }]}>
          <Text style={{ fontSize: 28 }}>{drinkTypeEmoji[item.drink_type] ?? '🥤'}</Text>
          <Text style={{ color: colors.textMuted, fontSize: fonts.sizes.xs, textAlign: 'center', marginTop: 4 }} numberOfLines={2}>{item.drink_name}</Text>
        </View>
      )}
    </View>
  );

  const typeKeys = ['energy_drink', 'protein_shake', 'coffee', 'pre_workout', 'other'];

  return (
    <>
      <FlatList
        style={{ flex: 1, backgroundColor: colors.bg }}
        data={posts}
        keyExtractor={item => item.id}
        numColumns={3}
        renderItem={renderPost}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.neonGreen} />}
        ListHeaderComponent={
          <View style={{ alignItems: 'center', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 16 }}>
            {/* Theme toggle */}
            <TouchableOpacity onPress={toggle} style={{ position: 'absolute', top: 60, right: 16 }}>
              <Text style={{ fontSize: 24 }}>{mode === 'dark' ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>

            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={[ss.avatar, { backgroundColor: colors.electricBlue }]} />
            ) : (
              <View style={[ss.avatar, { backgroundColor: colors.electricBlue }]}>
                <Text style={{ color: colors.bg, fontWeight: '900', fontSize: 32 }}>{profile?.username?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
            )}
            <Text style={{ color: colors.text, fontSize: fonts.sizes.xl, fontWeight: '800' }}>{profile?.display_name ?? profile?.username ?? '...'}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: fonts.sizes.md, marginTop: 2 }}>@{profile?.username}</Text>
            {profile?.campus && <Text style={{ color: colors.textMuted, fontSize: fonts.sizes.sm, marginTop: 4 }}>🎓 {profile.campus}</Text>}
            {profile?.city && <Text style={{ color: colors.electricBlue, fontSize: fonts.sizes.xs, marginTop: 2 }}>📍 {profile.city}</Text>}

            <View style={{ flexDirection: 'row', marginTop: 20, gap: 16 }}>
              <StatBox label="Today" value={stats.today} period="today" />
              <StatBox label="This Week" value={stats.week} period="week" />
              <StatBox label="All Time" value={stats.allTime} period="allTime" />
            </View>

            {/* Badges */}
            {badges.length > 0 && (
              <View style={{ width: '100%', marginTop: 20 }}>
                <Text style={{ color: colors.electricBlue, fontSize: fonts.sizes.sm, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Badges</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {badges.map((b, i) => {
                    const def = BADGE_DEFS.find(d => d.type === b.badge_type && d.name === b.badge_name);
                    return (
                      <View key={i} style={{ backgroundColor: colors.card, borderRadius: 12, padding: 10, alignItems: 'center', width: 80, borderWidth: 1, borderColor: colors.cardBorder }}>
                        <Text style={{ fontSize: 24 }}>{def?.emoji || '🏅'}</Text>
                        <Text style={{ color: colors.text, fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 4 }} numberOfLines={2}>{b.badge_name}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Unearned badges */}
            <View style={{ width: '100%', marginTop: 16 }}>
              <Text style={{ color: colors.textMuted, fontSize: fonts.sizes.xs, fontWeight: '600', marginBottom: 8 }}>LOCKED BADGES</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {BADGE_DEFS.filter(d => !badges.some(b => b.badge_type === d.type && b.badge_name === d.name)).map((d, i) => (
                  <View key={i} style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 10, alignItems: 'center', width: 80, opacity: 0.4 }}>
                    <Text style={{ fontSize: 24 }}>🔒</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600', textAlign: 'center', marginTop: 4 }} numberOfLines={2}>{d.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity style={{ marginTop: 20, paddingVertical: 8, paddingHorizontal: 20 }} onPress={signOut}>
              <Text style={{ color: colors.danger, fontSize: fonts.sizes.sm, fontWeight: '600' }}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <Modal visible={breakdown !== null} transparent animationType="slide" onRequestClose={() => setBreakdown(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, borderTopWidth: 1, borderColor: colors.cardBorder }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>{breakdown?.title}</Text>
              <TouchableOpacity onPress={() => setBreakdown(null)}><Text style={{ color: colors.textSecondary, fontSize: 20 }}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={{ color: colors.electricBlue, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>BY TYPE</Text>
              {typeKeys.map(k => (
                <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                  <Text style={{ color: colors.text }}>{drinkTypeLabels[k]}</Text>
                  <Text style={{ color: (breakdown?.byType[k] || 0) > 0 ? colors.neonGreen : colors.textMuted, fontWeight: '800' }}>{breakdown?.byType[k] || 0}</Text>
                </View>
              ))}
              {breakdown?.byBrand?.length > 0 && (
                <>
                  <Text style={{ color: colors.electricBlue, fontSize: 12, fontWeight: '700', marginTop: 16, marginBottom: 8 }}>TOP BRANDS</Text>
                  {breakdown.byBrand.slice(0, 10).map(([brand, count]: any, i: number) => (
                    <View key={brand} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                      <Text style={{ color: colors.text }}>{i + 1}. {brand}</Text>
                      <Text style={{ color: colors.electricBlue, fontWeight: '800' }}>{count}</Text>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const ss = StyleSheet.create({
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12, overflow: 'hidden' },
  statBox: { borderRadius: 12, padding: 16, alignItems: 'center', minWidth: 90, borderWidth: 1 },
  gridItem: { flex: 1 / 3, aspectRatio: 1, padding: 2 },
  gridImage: { flex: 1, borderRadius: 8 },
  gridPlaceholder: { justifyContent: 'center', alignItems: 'center', padding: 4 },
});
