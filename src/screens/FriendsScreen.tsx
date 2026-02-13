import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, fonts } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type UserRow = { id: string; username: string; display_name: string | null; avatar_url: string | null };

export default function FriendsScreen() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [following, setFollowing] = useState<UserRow[]>([]);
  const [followers, setFollowers] = useState<UserRow[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const fetchFollows = useCallback(async () => {
    if (!user) return;
    // Fetch following
    const { data: fData } = await supabase
      .from('bc_follows')
      .select('following_id')
      .eq('follower_id', user.id);
    const fIds = (fData ?? []).map((r: any) => r.following_id);
    setFollowingIds(new Set(fIds));

    if (fIds.length > 0) {
      const { data: users } = await supabase.from('bc_users').select('id, username, display_name, avatar_url').in('id', fIds);
      setFollowing(users ?? []);
    } else {
      setFollowing([]);
    }

    // Fetch followers
    const { data: frData } = await supabase
      .from('bc_follows')
      .select('follower_id')
      .eq('following_id', user.id);
    const frIds = (frData ?? []).map((r: any) => r.follower_id);
    if (frIds.length > 0) {
      const { data: users } = await supabase.from('bc_users').select('id, username, display_name, avatar_url').in('id', frIds);
      setFollowers(users ?? []);
    } else {
      setFollowers([]);
    }
  }, [user]);

  useEffect(() => { fetchFollows(); }, [fetchFollows]);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from('bc_users')
      .select('id, username, display_name, avatar_url')
      .ilike('username', `%${q.trim()}%`)
      .neq('id', user!.id)
      .limit(20);
    setSearchResults(data ?? []);
    setSearching(false);
  }, [user]);

  useEffect(() => {
    const t = setTimeout(() => doSearch(search), 300);
    return () => clearTimeout(t);
  }, [search, doSearch]);

  const toggleFollow = async (targetId: string) => {
    if (!user) return;
    if (followingIds.has(targetId)) {
      await supabase.from('bc_follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
    } else {
      await supabase.from('bc_follows').insert({ follower_id: user.id, following_id: targetId });
    }
    await fetchFollows();
  };

  const renderUser = (item: UserRow, showUnfollow: boolean) => {
    const isFollowing = followingIds.has(item.id);
    return (
      <View style={s.userRow}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{item.username?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.username}>{item.username}</Text>
          {item.display_name ? <Text style={s.displayName}>{item.display_name}</Text> : null}
        </View>
        <TouchableOpacity
          style={[s.followBtn, isFollowing ? s.unfollowBtn : s.followBtnActive]}
          onPress={() => toggleFollow(item.id)}
        >
          <Text style={[s.followBtnText, isFollowing && s.unfollowBtnText]}>
            {isFollowing ? 'Unfollow' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const ListHeader = () => (
    <>
      <Text style={s.title}>👥 Friends</Text>
      <TextInput
        style={s.searchInput}
        placeholder="Search by username..."
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {searching && <ActivityIndicator color={colors.neonGreen} style={{ marginVertical: 8 }} />}
      {search.trim().length >= 2 && searchResults.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Search Results</Text>
          {searchResults.map((u) => <View key={u.id}>{renderUser(u, false)}</View>)}
        </View>
      )}
      {search.trim().length >= 2 && !searching && searchResults.length === 0 && (
        <Text style={s.empty}>No users found</Text>
      )}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Following ({following.length})</Text>
        {following.length === 0 && <Text style={s.empty}>Not following anyone yet</Text>}
        {following.map((u) => <View key={u.id}>{renderUser(u, true)}</View>)}
      </View>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Followers ({followers.length})</Text>
        {followers.length === 0 && <Text style={s.empty}>No followers yet</Text>}
        {followers.map((u) => <View key={u.id}>{renderUser(u, false)}</View>)}
      </View>
    </>
  );

  return (
    <View style={s.container}>
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: fonts.sizes.xl, fontWeight: '800', color: colors.neonGreen, padding: 16, paddingTop: 60 },
  searchInput: {
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12,
    color: colors.text, fontSize: fonts.sizes.md, padding: 14, marginHorizontal: 16, marginBottom: 12,
  },
  section: { marginTop: 16, paddingHorizontal: 16 },
  sectionTitle: { color: colors.textSecondary, fontSize: fonts.sizes.md, fontWeight: '700', marginBottom: 8 },
  userRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.cardBorder,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.electricBlue, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { color: colors.bg, fontWeight: '800', fontSize: fonts.sizes.lg },
  username: { color: colors.text, fontWeight: '700', fontSize: fonts.sizes.md },
  displayName: { color: colors.textMuted, fontSize: fonts.sizes.sm },
  followBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  followBtnActive: { backgroundColor: colors.neonGreen },
  unfollowBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.danger },
  followBtnText: { fontWeight: '700', fontSize: fonts.sizes.sm, color: colors.bg },
  unfollowBtnText: { color: colors.danger },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 12, fontSize: fonts.sizes.sm },
});
