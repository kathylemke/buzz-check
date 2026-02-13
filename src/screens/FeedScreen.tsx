import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { colors, fonts, drinkTypeEmoji } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Post = {
  id: string;
  drink_name: string;
  drink_type: string;
  caption: string;
  photo_url: string | null;
  created_at: string;
  bc_users: { username: string; display_name: string | null; avatar_url: string | null };
  like_count: number;
  liked_by_me: boolean;
};

export default function FeedScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [feedMode, setFeedMode] = useState<'everyone' | 'following'>('everyone');
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  const fetchFollowing = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('bc_follows').select('following_id').eq('follower_id', user.id);
    setFollowingIds((data ?? []).map((r: any) => r.following_id));
  }, [user]);

  useEffect(() => { fetchFollowing(); }, [fetchFollowing]);

  const fetchPosts = useCallback(async () => {
    let query = supabase
      .from('bc_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (feedMode === 'following' && user) {
      const ids = [...followingIds, user.id];
      query = query.in('user_id', ids);
    }

    const { data, error } = await query;

    if (data && data.length > 0) {
      // Fetch users separately (no FK join)
      const userIds = [...new Set(data.map((p: any) => p.user_id))];
      const { data: users } = await supabase.from('bc_users').select('id, username, display_name, avatar_url').in('id', userIds);
      const userMap: Record<string, any> = {};
      (users || []).forEach((u: any) => { userMap[u.id] = u; });

      const postIds = data.map((p: any) => p.id);
      const { data: likes } = await supabase.from('bc_likes').select('post_id, user_id').in('post_id', postIds);

      const enriched = data.map((p: any) => ({
        ...p,
        bc_users: userMap[p.user_id] || { username: 'unknown', display_name: null, avatar_url: null },
        like_count: likes?.filter((l: any) => l.post_id === p.id).length ?? 0,
        liked_by_me: likes?.some((l: any) => l.post_id === p.id && l.user_id === user?.id) ?? false,
      }));
      setPosts(enriched);
    } else {
      setPosts([]);
    }
  }, [user, feedMode, followingIds]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const toggleLike = async (post: Post) => {
    if (post.liked_by_me) {
      await supabase.from('bc_likes').delete().eq('user_id', user!.id).eq('post_id', post.id);
    } else {
      await supabase.from('bc_likes').insert({ user_id: user!.id, post_id: post.id });
    }
    fetchPosts();
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={s.card}>
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{item.bc_users.username?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.username}>{item.bc_users.username}</Text>
          <Text style={s.timestamp}>{timeAgo(item.created_at)}</Text>
        </View>
        <Text style={s.drinkBadge}>
          {drinkTypeEmoji[item.drink_type] ?? '🥤'} {item.drink_name}
        </Text>
      </View>
      {item.photo_url && <Image source={{ uri: item.photo_url }} style={s.photo} />}
      {item.caption ? <Text style={s.caption}>{item.caption}</Text> : null}
      <View style={s.actions}>
        <TouchableOpacity onPress={() => toggleLike(item)} style={s.likeBtn}>
          <Text style={[s.likeText, item.liked_by_me && { color: colors.neonGreen }]}>
            {item.liked_by_me ? '💚' : '🤍'} {item.like_count}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      <Text style={s.title}>⚡ Feed</Text>
      <View style={s.toggleRow}>
        <TouchableOpacity style={[s.toggleBtn, feedMode === 'everyone' && s.toggleActive]} onPress={() => setFeedMode('everyone')}>
          <Text style={[s.toggleText, feedMode === 'everyone' && s.toggleTextActive]}>Everyone</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.toggleBtn, feedMode === 'following' && s.toggleActive]} onPress={() => setFeedMode('following')}>
          <Text style={[s.toggleText, feedMode === 'following' && s.toggleTextActive]}>Following</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.neonGreen} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={<Text style={s.empty}>No posts yet. Be the first! 🚀</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: fonts.sizes.xl, fontWeight: '800', color: colors.neonGreen, padding: 16, paddingTop: 60 },
  card: { backgroundColor: colors.card, borderRadius: 16, margin: 12, marginTop: 0, padding: 16, borderWidth: 1, borderColor: colors.cardBorder },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.electricBlue, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { color: colors.bg, fontWeight: '800', fontSize: fonts.sizes.lg },
  username: { color: colors.text, fontWeight: '700', fontSize: fonts.sizes.md },
  timestamp: { color: colors.textMuted, fontSize: fonts.sizes.xs },
  drinkBadge: { color: colors.neonGreen, fontSize: fonts.sizes.sm, fontWeight: '600' },
  photo: { width: '100%', height: 250, borderRadius: 12, marginBottom: 12, backgroundColor: colors.surface },
  caption: { color: colors.text, fontSize: fonts.sizes.md, marginBottom: 8 },
  actions: { flexDirection: 'row' },
  likeBtn: { paddingVertical: 4 },
  likeText: { color: colors.textSecondary, fontSize: fonts.sizes.md },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 60, fontSize: fonts.sizes.md },
  toggleRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: colors.surface, borderRadius: 10, padding: 3 },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  toggleActive: { backgroundColor: colors.neonGreen },
  toggleText: { color: colors.textMuted, fontWeight: '700', fontSize: fonts.sizes.sm },
  toggleTextActive: { color: colors.bg },
});
