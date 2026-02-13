import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fonts } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FEATURED_CITIES } from '../data/cities';

type Period = 'week' | 'month' | 'year';
type BoardType = 'city' | 'campus';
type ViewMode = 'users' | 'totals';
type Scope = 'all' | string;
type LeaderEntry = { user_id: string; username: string; count: number; rank: number };
type TotalEntry = { name: string; count: number; rank: number; userCount: number };

export default function LeaderboardScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('week');
  const [boardType, setBoardType] = useState<BoardType>('campus');
  const [viewMode, setViewMode] = useState<ViewMode>('totals');
  const [scope, setScope] = useState<Scope>('all');
  const [data, setData] = useState<LeaderEntry[]>([]);
  const [totals, setTotals] = useState<TotalEntry[]>([]);
  const [activeCities, setActiveCities] = useState<string[]>(FEATURED_CITIES);
  const [activeCampuses, setActiveCampuses] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [myCity, setMyCity] = useState<string | null>(null);
  const [myCampus, setMyCampus] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (user) {
        const { data: me } = await supabase.from('bc_users').select('city, campus').eq('id', user.id).single();
        if (me?.city) setMyCity(me.city);
        if (me?.campus) setMyCampus(me.campus);
      }
      const { data: users } = await supabase.from('bc_users').select('city, campus');
      if (users) {
        const userCities = [...new Set(users.map((u: any) => u.city).filter(Boolean))] as string[];
        setActiveCities([...new Set([...FEATURED_CITIES, ...userCities])].sort());
        const userCampuses = [...new Set(users.map((u: any) => u.campus).filter(Boolean))] as string[];
        setActiveCampuses(userCampuses.sort());
      }
    })();
  }, [user]);

  useEffect(() => {
    if (viewMode === 'users') {
      if (boardType === 'campus' && myCampus) setScope(myCampus);
      else if (boardType === 'city' && myCity) setScope(myCity);
      else setScope('all');
    }
  }, [boardType, myCampus, myCity, viewMode]);

  const getSince = () => {
    const now = new Date();
    if (period === 'week') return new Date(now.getTime() - 7 * 86400000).toISOString();
    if (period === 'month') return new Date(now.getTime() - 30 * 86400000).toISOString();
    return new Date(now.getFullYear(), 0, 1).toISOString();
  };

  const fetchTotals = useCallback(async () => {
    const since = getSince();
    const field = boardType === 'campus' ? 'campus' : 'city';
    
    // Get all users with their campus/city
    const { data: users } = await supabase.from('bc_users').select(`id, ${field}`);
    if (!users) { setTotals([]); return; }
    
    const userToGroup: Record<string, string> = {};
    for (const u of users) {
      if ((u as any)[field]) userToGroup[u.id] = (u as any)[field];
    }

    // Get posts in period
    const { data: posts } = await supabase.from('bc_posts').select('user_id').gte('created_at', since);
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
  }, [period, boardType]);

  const fetchUsers = useCallback(async () => {
    const since = getSince();

    let filteredUserIds: string[] | null = null;
    if (scope !== 'all') {
      const field = boardType === 'campus' ? 'campus' : 'city';
      const { data: scopeUsers } = await supabase.from('bc_users').select('id').eq(field, scope);
      if (!scopeUsers || scopeUsers.length === 0) { setData([]); return; }
      filteredUserIds = scopeUsers.map(u => u.id);
    }

    let query = supabase.from('bc_posts').select('user_id').gte('created_at', since);
    if (filteredUserIds) query = query.in('user_id', filteredUserIds);

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
  }, [period, scope, boardType]);

  useEffect(() => {
    if (viewMode === 'totals') fetchTotals();
    else fetchUsers();
  }, [viewMode, fetchTotals, fetchUsers]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (viewMode === 'totals') await fetchTotals();
    else await fetchUsers();
    setRefreshing(false);
  };

  const medals = ['🥇', '🥈', '🥉'];
  const scopeOptions = boardType === 'campus' ? activeCampuses : activeCities;

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <Text style={[s.title, { color: colors.neonGreen }]}>🏆 Leaderboard</Text>

      {/* Board type toggle: Campus vs City */}
      <View style={[s.toggleRow, { backgroundColor: colors.surface }]}>
        {(['campus', 'city'] as BoardType[]).map(t => (
          <TouchableOpacity key={t} style={[s.toggleBtn, boardType === t && { backgroundColor: colors.electricBlue }]} onPress={() => setBoardType(t)}>
            <Text style={[s.toggleText, { color: colors.textMuted }, boardType === t && { color: '#fff' }]}>
              {t === 'campus' ? '🎓 Campus' : '📍 City'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* View mode: Rankings vs Individual Users */}
      <View style={[s.toggleRow, { backgroundColor: colors.surface }]}>
        <TouchableOpacity style={[s.toggleBtn, viewMode === 'totals' && { backgroundColor: colors.neonGreen }]} onPress={() => setViewMode('totals')}>
          <Text style={[s.toggleText, { color: colors.textMuted }, viewMode === 'totals' && { color: colors.bg }]}>
            {boardType === 'campus' ? '🏫 Campus Rankings' : '🏙️ City Rankings'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.toggleBtn, viewMode === 'users' && { backgroundColor: colors.neonGreen }]} onPress={() => setViewMode('users')}>
          <Text style={[s.toggleText, { color: colors.textMuted }, viewMode === 'users' && { color: colors.bg }]}>👤 Top Users</Text>
        </TouchableOpacity>
      </View>

      {/* Period toggle */}
      <View style={[s.toggleRow, { backgroundColor: colors.surface }]}>
        {(['week', 'month', 'year'] as Period[]).map(p => (
          <TouchableOpacity key={p} style={[s.toggleBtn, period === p && { backgroundColor: colors.neonGreen }]} onPress={() => setPeriod(p)}>
            <Text style={[s.toggleText, { color: colors.textMuted }, period === p && { color: colors.bg }]}>{p.charAt(0).toUpperCase() + p.slice(1)}ly</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scope chips (users mode only) */}
      {viewMode === 'users' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: 16, marginBottom: 8 }}>
          <TouchableOpacity style={[s.cityChip, scope === 'all' && { backgroundColor: colors.electricBlue }]} onPress={() => setScope('all')}>
            <Text style={[s.toggleText, { color: colors.textMuted }, scope === 'all' && { color: '#fff' }]}>All</Text>
          </TouchableOpacity>
          {scopeOptions.map(c => (
            <TouchableOpacity key={c} style={[s.cityChip, scope === c && { backgroundColor: colors.electricBlue }]} onPress={() => setScope(c)}>
              <Text style={[s.toggleText, { color: colors.textMuted }, scope === c && { color: '#fff' }]} numberOfLines={1}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Totals ranking */}
      {viewMode === 'totals' ? (
        <FlatList
          data={totals}
          keyExtractor={item => item.name}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.neonGreen} />}
          renderItem={({ item }) => (
            <View style={[s.row, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={s.rank}>{item.rank <= 3 ? medals[item.rank - 1] : `#${item.rank}`}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.username, { color: colors.text }]}>{item.name}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>{item.userCount} {item.userCount === 1 ? 'person' : 'people'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[s.count, { color: colors.neonGreen }]}>{item.count}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 10 }}>drinks</Text>
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<Text style={[s.empty, { color: colors.textMuted }]}>No data yet for this period</Text>}
        />
      ) : (
        <FlatList
          data={data}
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
  cityChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 6, backgroundColor: 'rgba(255,255,255,0.08)' },
});
