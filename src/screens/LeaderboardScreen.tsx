import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fonts } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FEATURED_CITIES } from '../data/cities';
import { DRINK_CATEGORIES, DrinkCategory } from '../data/drinks';

type Period = 'week' | 'month' | 'year';
type BoardType = 'city' | 'campus';
type LeaderEntry = { user_id: string; username: string; count: number; rank: number };
type TotalEntry = { name: string; count: number; rank: number; userCount: number };

export default function LeaderboardScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('week');
  const [boardType, setBoardType] = useState<BoardType>('campus');
  const [categoryFilter, setCategoryFilter] = useState<DrinkCategory | null>(null);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [totals, setTotals] = useState<TotalEntry[]>([]);
  const [drilldown, setDrilldown] = useState<string | null>(null); // name of campus/city drilled into
  const [drilldownUsers, setDrilldownUsers] = useState<LeaderEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const getSince = () => {
    const now = new Date();
    if (period === 'week') return new Date(now.getTime() - 7 * 86400000).toISOString();
    if (period === 'month') return new Date(now.getTime() - 30 * 86400000).toISOString();
    return new Date(now.getFullYear(), 0, 1).toISOString();
  };

  const fetchTotals = useCallback(async () => {
    const since = getSince();
    const field = boardType === 'campus' ? 'campus' : 'city';

    const { data: users } = await supabase.from('bc_users').select(`id, ${field}`);
    if (!users) { setTotals([]); return; }

    const userToGroup: Record<string, string> = {};
    for (const u of users) {
      if ((u as any)[field]) userToGroup[u.id] = (u as any)[field];
    }

    let postQuery = supabase.from('bc_posts').select('user_id').gte('created_at', since);
    if (categoryFilter) postQuery = postQuery.eq('drink_type', categoryFilter);
    const { data: posts } = await postQuery;
    if (!posts) { setTotals([]); return; }

    const groupCounts: Record<string, { count: number; users: Set<string> }> = {};
    for (const p of posts) {
      const group = userToGroup[p.user_id];
      if (!group) continue;
      if (!groupCounts[group]) groupCounts[group] = { count: 0, users: new Set() };
      groupCounts[group].count++;
      groupCounts[group].users.add(p.user_id);
    }

    const sorted = Object.entries(groupCounts)
      .map(([name, { count, users }]) => ({ name, count, userCount: users.size, rank: 0 }))
      .sort((a, b) => b.count - a.count)
      .map((e, i) => ({ ...e, rank: i + 1 }));

    setTotals(sorted.slice(0, 50));
  }, [period, boardType, categoryFilter]);

  const fetchDrilldownUsers = useCallback(async (locationName: string) => {
    const since = getSince();
    const field = boardType === 'campus' ? 'campus' : 'city';

    const { data: scopeUsers } = await supabase.from('bc_users').select('id').eq(field, locationName);
    if (!scopeUsers || scopeUsers.length === 0) { setDrilldownUsers([]); return; }
    const filteredUserIds = scopeUsers.map(u => u.id);

    let query = supabase.from('bc_posts').select('user_id').gte('created_at', since).in('user_id', filteredUserIds);
    if (categoryFilter) query = query.eq('drink_type', categoryFilter);
    const { data: posts } = await query;
    if (!posts) { setDrilldownUsers([]); return; }

    const counts: Record<string, number> = {};
    for (const p of posts) counts[p.user_id] = (counts[p.user_id] || 0) + 1;

    const userIds = Object.keys(counts);
    if (userIds.length === 0) { setDrilldownUsers([]); return; }

    const { data: users } = await supabase.from('bc_users').select('id, username').in('id', userIds);
    const userMap: Record<string, string> = {};
    (users || []).forEach(u => { userMap[u.id] = u.username; });

    const sorted = Object.entries(counts)
      .map(([uid, count]) => ({ user_id: uid, username: userMap[uid] || '?', count, rank: 0 }))
      .sort((a, b) => b.count - a.count)
      .map((e, i) => ({ ...e, rank: i + 1 }));

    setDrilldownUsers(sorted.slice(0, 50));
  }, [period, boardType, categoryFilter]);

  useEffect(() => {
    setDrilldown(null);
    fetchTotals();
  }, [fetchTotals]);

  useEffect(() => {
    if (drilldown) fetchDrilldownUsers(drilldown);
  }, [drilldown, fetchDrilldownUsers]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (drilldown) await fetchDrilldownUsers(drilldown);
    else await fetchTotals();
    setRefreshing(false);
  };

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <Text style={[s.title, { color: colors.neonGreen }]}>🏆 Leaderboard</Text>

      {/* Board type toggle: Campus vs City */}
      <View style={[s.toggleRow, { backgroundColor: colors.surface }]}>
        {(['campus', 'city'] as BoardType[]).map(t => (
          <TouchableOpacity key={t} style={[s.toggleBtn, boardType === t && { backgroundColor: colors.electricBlue }]} onPress={() => { setBoardType(t); setDrilldown(null); }}>
            <Text style={[s.toggleText, { color: colors.textMuted }, boardType === t && { color: '#fff' }]}>
              {t === 'campus' ? '🎓 Campus' : '📍 City'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Period toggle */}
      <View style={[s.toggleRow, { backgroundColor: colors.surface }]}>
        {(['week', 'month', 'year'] as Period[]).map(p => (
          <TouchableOpacity key={p} style={[s.toggleBtn, period === p && { backgroundColor: colors.neonGreen }]} onPress={() => setPeriod(p)}>
            <Text style={[s.toggleText, { color: colors.textMuted }, period === p && { color: colors.bg }]}>{p.charAt(0).toUpperCase() + p.slice(1)}ly</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Drink category filter dropdown */}
      <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.cardBorder }}
          onPress={() => setCatDropdownOpen(!catDropdownOpen)}
        >
          <Text style={{ color: categoryFilter ? colors.text : colors.textMuted, fontWeight: '600', fontSize: fonts.sizes.sm }}>
            {categoryFilter ? `${DRINK_CATEGORIES.find(c => c.key === categoryFilter)?.emoji} ${DRINK_CATEGORIES.find(c => c.key === categoryFilter)?.label}` : '🍹 All Drinks'}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{catDropdownOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {catDropdownOpen && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 10, marginTop: 4, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' }}>
            <TouchableOpacity
              style={{ padding: 12, backgroundColor: !categoryFilter ? colors.electricBlue + '22' : 'transparent' }}
              onPress={() => { setCategoryFilter(null); setCatDropdownOpen(false); }}
            >
              <Text style={{ color: !categoryFilter ? colors.electricBlue : colors.text, fontWeight: '600', fontSize: fonts.sizes.sm }}>🍹 All Drinks</Text>
            </TouchableOpacity>
            {DRINK_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={{ padding: 12, backgroundColor: categoryFilter === cat.key ? colors.electricBlue + '22' : 'transparent' }}
                onPress={() => { setCategoryFilter(cat.key); setCatDropdownOpen(false); }}
              >
                <Text style={{ color: categoryFilter === cat.key ? colors.electricBlue : colors.text, fontWeight: '600', fontSize: fonts.sizes.sm }}>
                  {cat.emoji} {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Drilldown back button */}
      {drilldown && (
        <TouchableOpacity style={[s.backBtn, { backgroundColor: colors.surface }]} onPress={() => setDrilldown(null)}>
          <Text style={[s.backBtnText, { color: colors.electricBlue }]}>← Back to {boardType === 'campus' ? 'Campus' : 'City'} Rankings</Text>
        </TouchableOpacity>
      )}

      {/* Drilldown header */}
      {drilldown && (
        <Text style={[s.drilldownTitle, { color: colors.text }]}>
          👤 Top Users in {drilldown}
        </Text>
      )}

      {/* Rankings or drilldown users */}
      {!drilldown ? (
        <FlatList
          data={totals}
          keyExtractor={item => item.name}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.neonGreen} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.row, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => setDrilldown(item.name)}
              activeOpacity={0.7}
            >
              <Text style={s.rank}>{item.rank <= 3 ? medals[item.rank - 1] : `#${item.rank}`}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.username, { color: colors.text }]}>{item.name}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>{item.userCount} {item.userCount === 1 ? 'person' : 'people'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 8 }}>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[s.count, { color: colors.neonGreen }]}>{item.count}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 10 }}>drinks</Text>
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 16 }}>›</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<Text style={[s.empty, { color: colors.textMuted }]}>No data yet for this period</Text>}
        />
      ) : (
        <FlatList
          data={drilldownUsers}
          keyExtractor={item => item.user_id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.neonGreen} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.row, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => navigation?.navigate('UserProfile', { userId: item.user_id })}
              activeOpacity={0.7}
            >
              <Text style={s.rank}>{item.rank <= 3 ? medals[item.rank - 1] : `#${item.rank}`}</Text>
              <View style={[s.avatar, { backgroundColor: colors.electricBlue }]}>
                <Text style={[s.avatarText, { color: colors.bg }]}>{item.username[0]?.toUpperCase()}</Text>
              </View>
              <Text style={[s.username, { color: colors.text }]}>{item.username}</Text>
              <Text style={[s.count, { color: colors.neonGreen }]}>{item.count}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<Text style={[s.empty, { color: colors.textMuted }]}>No posts yet for this period</Text>}
        />
      )}
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
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 6, backgroundColor: 'rgba(255,255,255,0.08)' },
  backBtn: { marginHorizontal: 16, marginBottom: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  backBtnText: { fontWeight: '700', fontSize: fonts.sizes.sm },
  drilldownTitle: { marginHorizontal: 16, marginBottom: 8, fontWeight: '800', fontSize: fonts.sizes.md },
});
