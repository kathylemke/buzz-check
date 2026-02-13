import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fonts } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type UserRow = { id: string; username: string; display_name: string | null; avatar_url: string | null };

export default function FriendsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [following, setFollowing] = useState<UserRow[]>([]);
  const [followers, setFollowers] = useState<UserRow[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const fetchFollows = useCallback(async () => {
    if (!user) return;
    const { data: fData } = await supabase.from('bc_follows').select('following_id').eq('follower_id', user.id);
    const fIds = (fData ?? []).map((r: any) => r.following_id);
    setFollowingIds(new Set(fIds));
    if (fIds.length > 0) {
      const { data: users } = await supabase.from('bc_users').select('id, username, display_name, avatar_url').in('id', fIds);
      setFollowing(users ?? []);
    } else setFollowing([]);
    const { data: frData } = await supabase.from('bc_follows').select('follower_id').eq('following_id', user.id);
    const frIds = (frData ?? []).map((r: any) => r.follower_id);
    if (frIds.length > 0) {
      const { data: users } = await supabase.from('bc_users').select('id, username, display_name, avatar_url').in('id', frIds);
      setFollowers(users ?? []);
    } else setFollowers([]);
  }, [user]);

  useEffect(() => { fetchFollows(); }, [fetchFollows]);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase.from('bc_users').select('id, username, display_name, avatar_url').ilike('username', `%${q.trim()}%`).neq('id', user!.id).limit(20);
    setSearchResults(data ?? []);
    setSearching(false);
  }, [user]);

  useEffect(() => { const t = setTimeout(() => doSearch(search), 300); return () => clearTimeout(t); }, [search, doSearch]);

  const toggleFollow = async (targetId: string) => {
    if (!user) return;
    if (followingIds.has(targetId)) await supabase.from('bc_follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
    else await supabase.from('bc_follows').insert({ follower_id: user.id, following_id: targetId });
    await fetchFollows();
  };

  const renderUser = (item: UserRow) => {
    const isFollowing = followingIds.has(item.id);
    return (
      <View style={[ss.userRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={[ss.avatar, { backgroundColor: colors.electricBlue }]} />
        ) : (
          <View style={[ss.avatar, { backgroundColor: colors.electricBlue }]}>
            <Text style={{ color: colors.bg, fontWeight: '800', fontSize: fonts.sizes.lg }}>{item.username?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: fonts.sizes.md }}>{item.username}</Text>
          {item.display_name ? <Text style={{ color: colors.textMuted, fontSize: fonts.sizes.sm }}>{item.display_name}</Text> : null}
        </View>
        <TouchableOpacity style={[ss.followBtn, isFollowing ? { borderWidth: 1, borderColor: colors.danger } : { backgroundColor: colors.neonGreen }]} onPress={() => toggleFollow(item.id)}>
          <Text style={{ fontWeight: '700', fontSize: fonts.sizes.sm, color: isFollowing ? colors.danger : colors.bg }}>{isFollowing ? 'Unfollow' : 'Follow'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <>
            <Text style={{ fontSize: fonts.sizes.xl, fontWeight: '800', color: colors.neonGreen, padding: 16, paddingTop: 60 }}>👥 Friends</Text>
            <TextInput
              style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12, color: colors.text, fontSize: fonts.sizes.md, padding: 14, marginHorizontal: 16, marginBottom: 12 }}
              placeholder="Search by username..." placeholderTextColor={colors.textMuted} value={search} onChangeText={setSearch} autoCapitalize="none" autoCorrect={false}
            />
            {searching && <ActivityIndicator color={colors.neonGreen} style={{ marginVertical: 8 }} />}
            {search.trim().length >= 2 && searchResults.length > 0 && (
              <View style={{ marginTop: 16, paddingHorizontal: 16 }}>
                <Text style={{ color: colors.textSecondary, fontWeight: '700', marginBottom: 8 }}>Search Results</Text>
                {searchResults.map(u => <View key={u.id}>{renderUser(u)}</View>)}
              </View>
            )}
            {search.trim().length >= 2 && !searching && searchResults.length === 0 && (
              <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 12 }}>No users found</Text>
            )}
            <View style={{ marginTop: 16, paddingHorizontal: 16 }}>
              <Text style={{ color: colors.textSecondary, fontWeight: '700', marginBottom: 8 }}>Following ({following.length})</Text>
              {following.length === 0 && <Text style={{ color: colors.textMuted, textAlign: 'center' }}>Not following anyone yet</Text>}
              {following.map(u => <View key={u.id}>{renderUser(u)}</View>)}
            </View>
            <View style={{ marginTop: 16, paddingHorizontal: 16 }}>
              <Text style={{ color: colors.textSecondary, fontWeight: '700', marginBottom: 8 }}>Followers ({followers.length})</Text>
              {followers.length === 0 && <Text style={{ color: colors.textMuted, textAlign: 'center' }}>No followers yet</Text>}
              {followers.map(u => <View key={u.id}>{renderUser(u)}</View>)}
            </View>
          </>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const ss = StyleSheet.create({
  userRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 10, overflow: 'hidden' },
  followBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
});
