import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, RefreshControl, Modal, ScrollView, Dimensions } from 'react-native';
import { colors, fonts, drinkTypeEmoji, drinkTypeLabels } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type UserProfile = { username: string; display_name: string | null; campus: string | null; avatar_url: string | null };
type Post = { id: string; drink_name: string; drink_type: string; brand: string | null; photo_url: string | null; created_at: string };

type BreakdownData = {
  title: string;
  byType: Record<string, number>;
  byBrand: [string, number][];
  byProduct: [string, number][];
};

function computeBreakdown(posts: Post[], title: string, filter?: (p: Post) => boolean): BreakdownData {
  const filtered = filter ? posts.filter(filter) : posts;

  const byType: Record<string, number> = {};
  const brandMap: Record<string, number> = {};
  const productMap: Record<string, number> = {};

  for (const p of filtered) {
    byType[p.drink_type] = (byType[p.drink_type] || 0) + 1;
    const brand = p.brand || 'Unknown';
    brandMap[brand] = (brandMap[brand] || 0) + 1;
    productMap[p.drink_name] = (productMap[p.drink_name] || 0) + 1;
  }

  const byBrand = Object.entries(brandMap).sort((a, b) => b[1] - a[1]);
  const byProduct = Object.entries(productMap).sort((a, b) => b[1] - a[1]);

  return { title, byType, byBrand, byProduct };
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState({ today: 0, week: 0, allTime: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [breakdown, setBreakdown] = useState<BreakdownData | null>(null);

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
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const openBreakdown = (period: 'today' | 'week' | 'allTime') => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfWeek = new Date(now.getTime() - 7 * 86400000).toISOString();

    const config = {
      today: { title: "Today's Breakdown", filter: (p: Post) => p.created_at >= startOfDay },
      week: { title: "This Week's Breakdown", filter: (p: Post) => p.created_at >= startOfWeek },
      allTime: { title: "All Time Breakdown", filter: undefined },
    }[period];

    setBreakdown(computeBreakdown(posts, config.title, config.filter));
  };

  const StatBox = ({ label, value, period }: { label: string; value: number; period: 'today' | 'week' | 'allTime' }) => (
    <TouchableOpacity style={s.statBox} onPress={() => openBreakdown(period)} activeOpacity={0.7}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const renderPost = ({ item }: { item: Post }) => (
    <View style={s.gridItem}>
      {item.photo_url ? (
        <Image source={{ uri: item.photo_url }} style={s.gridImage} />
      ) : (
        <View style={[s.gridImage, s.gridPlaceholder]}>
          <Text style={{ fontSize: 28 }}>{drinkTypeEmoji[item.drink_type] ?? '🥤'}</Text>
          <Text style={s.gridDrinkName} numberOfLines={2}>{item.drink_name}</Text>
        </View>
      )}
    </View>
  );

  const typeKeys = ['energy_drink', 'protein_shake', 'coffee', 'pre_workout', 'other'];

  return (
    <>
      <FlatList
        style={s.container}
        data={posts}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={renderPost}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.neonGreen} />}
        ListHeaderComponent={
          <View style={s.header}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{profile?.username?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
            <Text style={s.displayName}>{profile?.display_name ?? profile?.username ?? '...'}</Text>
            <Text style={s.username}>@{profile?.username}</Text>
            {profile?.campus && <Text style={s.campus}>📍 {profile.campus}</Text>}

            <View style={s.statsRow}>
              <StatBox label="Today" value={stats.today} period="today" />
              <StatBox label="This Week" value={stats.week} period="week" />
              <StatBox label="All Time" value={stats.allTime} period="allTime" />
            </View>

            <TouchableOpacity style={s.signOutBtn} onPress={signOut}>
              <Text style={s.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <Modal visible={breakdown !== null} transparent animationType="slide" onRequestClose={() => setBreakdown(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{breakdown?.title}</Text>
              <TouchableOpacity onPress={() => setBreakdown(null)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={s.modalScroll} showsVerticalScrollIndicator={false}>
              {/* By Type */}
              <Text style={s.sectionTitle}>By Type</Text>
              <View style={s.sectionCard}>
                {typeKeys.map((key) => {
                  const count = breakdown?.byType[key] || 0;
                  return (
                    <View key={key} style={s.breakdownRow}>
                      <Text style={s.breakdownLabel}>{drinkTypeLabels[key] || key}</Text>
                      <Text style={[s.breakdownCount, count > 0 && s.breakdownCountActive]}>{count}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Top Brands */}
              <Text style={s.sectionTitle}>Top Brands</Text>
              <View style={s.sectionCard}>
                {breakdown?.byBrand.length === 0 && <Text style={s.emptyText}>No data yet</Text>}
                {breakdown?.byBrand.slice(0, 10).map(([brand, count], i) => (
                  <View key={brand} style={s.breakdownRow}>
                    <Text style={s.breakdownLabel}>
                      <Text style={s.rankNumber}>{i + 1}. </Text>{brand}
                    </Text>
                    <Text style={[s.breakdownCount, s.breakdownCountBrand]}>{count}</Text>
                  </View>
                ))}
              </View>

              {/* Top Products */}
              <Text style={s.sectionTitle}>Top Products</Text>
              <View style={s.sectionCard}>
                {breakdown?.byProduct.length === 0 && <Text style={s.emptyText}>No data yet</Text>}
                {breakdown?.byProduct.slice(0, 10).map(([product, count], i) => (
                  <View key={product} style={s.breakdownRow}>
                    <Text style={s.breakdownLabel} numberOfLines={1}>
                      <Text style={s.rankNumber}>{i + 1}. </Text>{product}
                    </Text>
                    <Text style={[s.breakdownCount, s.breakdownCountProduct]}>{count}</Text>
                  </View>
                ))}
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            <TouchableOpacity style={s.dismissBtn} onPress={() => setBreakdown(null)}>
              <Text style={s.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const screenHeight = Dimensions.get('window').height;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.electricBlue, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: colors.bg, fontWeight: '900', fontSize: 32 },
  displayName: { color: colors.text, fontSize: fonts.sizes.xl, fontWeight: '800' },
  username: { color: colors.textSecondary, fontSize: fonts.sizes.md, marginTop: 2 },
  campus: { color: colors.textMuted, fontSize: fonts.sizes.sm, marginTop: 4 },
  statsRow: { flexDirection: 'row', marginTop: 20, gap: 16 },
  statBox: { backgroundColor: colors.card, borderRadius: 12, padding: 16, alignItems: 'center', minWidth: 90, borderWidth: 1, borderColor: colors.cardBorder },
  statValue: { color: colors.neonGreen, fontSize: fonts.sizes.xl, fontWeight: '900' },
  statLabel: { color: colors.textSecondary, fontSize: fonts.sizes.xs, marginTop: 4 },
  signOutBtn: { marginTop: 16, paddingVertical: 8, paddingHorizontal: 20 },
  signOutText: { color: colors.danger, fontSize: fonts.sizes.sm, fontWeight: '600' },
  gridItem: { flex: 1 / 3, aspectRatio: 1, padding: 2 },
  gridImage: { flex: 1, borderRadius: 8, backgroundColor: colors.surface },
  gridPlaceholder: { justifyContent: 'center', alignItems: 'center', padding: 4 },
  gridDrinkName: { color: colors.textMuted, fontSize: fonts.sizes.xs, textAlign: 'center', marginTop: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: screenHeight * 0.75, paddingBottom: 30, borderTopWidth: 1, borderColor: colors.cardBorder },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  modalTitle: { color: colors.text, fontSize: fonts.sizes.lg, fontWeight: '800' },
  modalClose: { color: colors.textSecondary, fontSize: 20, fontWeight: '700' },
  modalScroll: { paddingHorizontal: 20 },

  sectionTitle: { color: colors.electricBlue, fontSize: fonts.sizes.sm, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 8 },
  sectionCard: { backgroundColor: colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.cardBorder },

  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  breakdownLabel: { color: colors.text, fontSize: fonts.sizes.md, flex: 1 },
  breakdownCount: { color: colors.textMuted, fontSize: fonts.sizes.md, fontWeight: '800', minWidth: 30, textAlign: 'right' },
  breakdownCountActive: { color: colors.neonGreen },
  breakdownCountBrand: { color: colors.electricBlue },
  breakdownCountProduct: { color: colors.neonGreen },
  rankNumber: { color: colors.textMuted, fontWeight: '600' },
  emptyText: { color: colors.textMuted, fontSize: fonts.sizes.sm, textAlign: 'center', paddingVertical: 12 },

  dismissBtn: { marginHorizontal: 20, marginTop: 12, backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  dismissText: { color: colors.textSecondary, fontSize: fonts.sizes.md, fontWeight: '700' },
});
