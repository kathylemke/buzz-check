import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fonts } from '../theme';
import { supabase } from '../lib/supabase';
import { getAllCities, FEATURED_CITIES } from '../data/cities';

type Period = 'week' | 'month' | 'year';
type Scope = 'all' | string;
type LeaderEntry = { user_id: string; username: string; count: number; rank: number };

export default function LeaderboardScreen() {
  const { colors } = useTheme();
  const [period, setPeriod] = useState<Period>('week');
  const [scope, setScope] = useState<Scope>('all');
  const [data, setData] = useState<LeaderEntry[]>([]);
  const [activeCities, setActiveCities] = useState<string[]>(FEATURED_CITIES);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch cities that actually have users
  useEffect(() => {
    (async () => {
      const { data: users } = await supabase.from('bc_users').select('city');
      if (users) {
        const userCities = [...new Set(users.map((u: any) => u.city).filter(Boolean))] as string[];
        const merged = [...new Set([...FEATURED_CITIES, ...userCities])].sort();
        setActiveCities(merged);
      }
    })();
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    const now = new Date();
    let since: string;
    if (period === 'week') since = new Date(now.getTime() - 7 * 86400000).toISOString();
    else if (period === 'month') since = new Date(now.getTime() - 30 * 86400000).toISOString();
    else since = new Date(now.getFullYear(), 0, 1).toISOString();

    // If filtering by city, first get users in that city, then their posts
    let cityUserIds: string[] | null = null;
    if (scope !== 'all') {
      const { data: cityUsers } = await supabase.from('bc_users').select('id').eq('city', scope);
      if (!cityUsers || cityUsers.length === 0) { setData([]); return; }
      cityUserIds = cityUsers.map(u => u.id);
    }

    let query = supabase.from('bc_posts').select('user_id').gte('created_at', since);
    if (cityUserIds) query = query.in('user_id', cityUserIds);

    const { data: posts } = await query;
    if (!posts) { setData([]); return; }

    const counts: Record<string, number> = {};
    for (const p of posts) counts[p.user_id] = (counts[p.user_id] || 0) + 1;

    const userIds = Object.keys(counts);
    if (userIds.length === 0) { setData([]); return; }

    const { data: users } = await supabase.from('bc_users').select('id, username').in('id', userIds);
    const userMap: Record<string, string> = {};
    (users || []).forEach(u => { userMap[u.id] = u.username; });

    const sorted = Object.entries(counts)
      .map(([uid, count]) => ({ user_id: uid, username: userMap[uid] || '?', count, rank: 0 }))
      .sort((a, b) => b.count - a.count)
      .map((e, i) => ({ ...e, rank: i + 1 }));

    setData(sorted.slice(0, 50));
  }, [period, scope]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);
  const onRefresh = async () => { setRefreshing(true); await fetchLeaderboard(); setRefreshing(false); };

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <Text style={[s.title, { color: colors.neonGreen }]}>🏆 Leaderboard</Text>

      {/* Period toggle */}
      <View style={[s.toggleRow, { backgroundColor: colors.surface }]}>
        {(['week', 'month', 'year'] as Period[]).map(p => (
          <TouchableOpacity key={p} style={[s.toggleBtn, period === p && { backgroundColor: colors.neonGreen }]} onPress={() => setPeriod(p)}>
            <Text style={[s.toggleText, { color: colors.textMuted }, period === p && { color: colors.bg }]}>{p.charAt(0).toUpperCase() + p.slice(1)}ly</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scope toggle */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: 16, marginBottom: 8 }}>
        <TouchableOpacity style={[s.cityChip, scope === 'all' && { backgroundColor: colors.electricBlue }]} onPress={() => setScope('all')}>
          <Text style={[s.toggleText, { color: colors.textMuted }, scope === 'all' && { color: colors.bg }]}>All Cities</Text>
        </TouchableOpacity>
        {activeCities.map(c => (
          <TouchableOpacity key={c} style={[s.cityChip, scope === c && { backgroundColor: colors.electricBlue }]} onPress={() => setScope(c)}>
            <Text style={[s.toggleText, { color: colors.textMuted }, scope === c && { color: colors.bg }]} numberOfLines={1}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={data}
        keyExtractor={item => item.user_id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.neonGreen} />}
        renderItem={({ item }) => (
          <View style={[s.row, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={s.rank}>{item.rank <= 3 ? medals[item.rank - 1] : `#${item.rank}`}</Text>
            <View style={[s.avatar, { backgroundColor: colors.electricBlue }]}>
              <Text style={[s.avatarText, { color: colors.bg }]}>{item.username[0]?.toUpperCase()}</Text>
            </View>
            <Text style={[s.username, { color: colors.text }]}>{item.username}</Text>
            <Text style={[s.count, { color: colors.neonGreen }]}>{item.count}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={<Text style={[s.empty, { color: colors.textMuted }]}>No posts yet for this period</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: fonts.sizes.xl, fontWeight: '800', padding: 16, paddingTop: 60 },
  toggleRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, borderRadius: 10, padding: 3 },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  toggleText: { fontWeight: '700', fontSize: fonts.sizes.xs },
  row: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginBottom: 6, padding: 12, borderRadius: 12, borderWidth: 1 },
  rank: { fontSize: 18, width: 36, textAlign: 'center' },
  avatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { fontWeight: '800', fontSize: 14 },
  username: { flex: 1, fontWeight: '700', fontSize: fonts.sizes.md },
  count: { fontWeight: '900', fontSize: fonts.sizes.lg },
  empty: { textAlign: 'center', marginTop: 60, fontSize: fonts.sizes.md },
  cityChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 6, backgroundColor: 'rgba(255,255,255,0.08)' },
});
