import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, Image, StyleSheet, RefreshControl, TouchableOpacity, TextInput, Animated, Modal, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fonts, drinkTypeEmoji } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Comment = { id: string; text: string; photo_url: string | null; created_at: string; user: { username: string } };
type Post = {
  id: string; drink_name: string; drink_type: string; caption: string; photo_url: string | null;
  created_at: string; rating: number | null; is_private: boolean; city: string | null;
  bc_users: { username: string; display_name: string | null; avatar_url: string | null };
  like_count: number; liked_by_me: boolean; comment_count: number;
};

function LikeButton({ liked, count, onPress }: { liked: boolean; count: number; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.5, duration: 120, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onPress();
  };
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={handlePress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
      <Animated.Text style={{ transform: [{ scale }], fontSize: 18, marginRight: 4 }}>{liked ? '💚' : '🤍'}</Animated.Text>
      <Text style={{ color: liked ? colors.neonGreen : colors.textSecondary, fontWeight: '700' }}>{count}</Text>
    </TouchableOpacity>
  );
}

export default function FeedScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [feedMode, setFeedMode] = useState<'everyone' | 'following'>('everyone');
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [commentModal, setCommentModal] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  const fetchFollowing = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('bc_follows').select('following_id').eq('follower_id', user.id);
    setFollowingIds((data ?? []).map((r: any) => r.following_id));
  }, [user]);

  useEffect(() => { fetchFollowing(); }, [fetchFollowing]);

  const fetchPosts = useCallback(async () => {
    let query = supabase.from('bc_posts').select('*').order('created_at', { ascending: false }).limit(50);
    if (feedMode === 'following' && user) {
      const ids = [...followingIds, user.id];
      query = query.in('user_id', ids);
    }
    const { data } = await query;
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((p: any) => p.user_id))];
      const { data: users } = await supabase.from('bc_users').select('id, username, display_name, avatar_url').in('id', userIds);
      const userMap: Record<string, any> = {};
      (users || []).forEach((u: any) => { userMap[u.id] = u; });
      const postIds = data.map((p: any) => p.id);
      const { data: likes } = await supabase.from('bc_likes').select('post_id, user_id').in('post_id', postIds);
      const { data: commentCounts } = await supabase.from('bc_comments').select('post_id').in('post_id', postIds);
      const ccMap: Record<string, number> = {};
      (commentCounts || []).forEach((c: any) => { ccMap[c.post_id] = (ccMap[c.post_id] || 0) + 1; });
      const enriched = data.map((p: any) => ({
        ...p,
        bc_users: userMap[p.user_id] || { username: 'unknown', display_name: null, avatar_url: null },
        like_count: likes?.filter((l: any) => l.post_id === p.id).length ?? 0,
        liked_by_me: likes?.some((l: any) => l.post_id === p.id && l.user_id === user?.id) ?? false,
        comment_count: ccMap[p.id] || 0,
      }));
      setPosts(enriched);
    } else setPosts([]);
  }, [user, feedMode, followingIds]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  const onRefresh = async () => { setRefreshing(true); await fetchPosts(); setRefreshing(false); };

  const toggleLike = async (post: Post) => {
    if (post.liked_by_me) await supabase.from('bc_likes').delete().eq('user_id', user!.id).eq('post_id', post.id);
    else await supabase.from('bc_likes').insert({ user_id: user!.id, post_id: post.id });
    fetchPosts();
  };

  const openComments = async (postId: string) => {
    setCommentModal(postId);
    const { data } = await supabase.from('bc_comments').select('*').eq('post_id', postId).order('created_at', { ascending: true });
    if (data) {
      const uids = [...new Set(data.map(c => c.user_id))];
      const { data: users } = await supabase.from('bc_users').select('id, username').in('id', uids);
      const umap: Record<string, string> = {};
      (users || []).forEach(u => { umap[u.id] = u.username; });
      setComments(data.map(c => ({ ...c, user: { username: umap[c.user_id] || '?' } })));
    }
  };

  const postComment = async () => {
    if (!newComment.trim() || !commentModal || !user) return;
    await supabase.from('bc_comments').insert({ post_id: commentModal, user_id: user.id, text: newComment.trim() });
    setNewComment('');
    openComments(commentModal);
    fetchPosts();
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return new Date(date).toLocaleDateString();
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={[ss.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={ss.header}>
        {item.bc_users.avatar_url ? (
          <Image source={{ uri: item.bc_users.avatar_url }} style={[ss.avatar, { backgroundColor: colors.electricBlue }]} />
        ) : (
          <View style={[ss.avatar, { backgroundColor: colors.electricBlue }]}>
            <Text style={[ss.avatarText, { color: colors.bg }]}>{item.bc_users.username?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[ss.username, { color: colors.text }]}>{item.bc_users.username}</Text>
          <Text style={[ss.timestamp, { color: colors.textMuted }]}>{timeAgo(item.created_at)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[ss.drinkBadge, { color: colors.neonGreen }]}>{drinkTypeEmoji[item.drink_type] ?? '🥤'} {item.drink_name}</Text>
          {item.rating && <Text style={{ color: colors.electricBlue, fontSize: 12, fontWeight: '700', marginTop: 2 }}>{'★'.repeat(Math.round(item.rating / 2))} {item.rating}/10</Text>}
        </View>
      </View>
      {item.photo_url && <Image source={{ uri: item.photo_url }} style={[ss.photo, { backgroundColor: colors.surface }]} />}
      {item.caption ? <Text style={[ss.caption, { color: colors.text }]}>{item.caption}</Text> : null}
      <View style={ss.actions}>
        <LikeButton liked={item.liked_by_me} count={item.like_count} onPress={() => toggleLike(item)} />
        <TouchableOpacity onPress={() => openComments(item.id)} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16 }}>
          <Text style={{ fontSize: 16, marginRight: 4 }}>💬</Text>
          <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>{item.comment_count}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[ss.container, { backgroundColor: colors.bg }]}>
      <Text style={[ss.title, { color: colors.neonGreen }]}>⚡ Feed</Text>
      <View style={[ss.toggleRow, { backgroundColor: colors.surface }]}>
        <TouchableOpacity style={[ss.toggleBtn, feedMode === 'everyone' && { backgroundColor: colors.neonGreen }]} onPress={() => setFeedMode('everyone')}>
          <Text style={[ss.toggleText, { color: colors.textMuted }, feedMode === 'everyone' && { color: colors.bg }]}>Everyone</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[ss.toggleBtn, feedMode === 'following' && { backgroundColor: colors.neonGreen }]} onPress={() => setFeedMode('following')}>
          <Text style={[ss.toggleText, { color: colors.textMuted }, feedMode === 'following' && { color: colors.bg }]}>Following</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.neonGreen} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={<Text style={[ss.empty, { color: colors.textMuted }]}>No posts yet. Be the first! 🚀</Text>}
      />

      {/* Comments Modal */}
      <Modal visible={commentModal !== null} transparent animationType="slide" onRequestClose={() => setCommentModal(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={[ss.commentSheet, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentModal(null)}><Text style={{ color: colors.textSecondary, fontSize: 20 }}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {comments.length === 0 && <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: 20 }}>No comments yet</Text>}
              {comments.map(c => (
                <View key={c.id} style={{ marginBottom: 12 }}>
                  <Text style={{ color: colors.electricBlue, fontWeight: '700', fontSize: 13 }}>{c.user.username} <Text style={{ color: colors.textMuted, fontWeight: '400' }}>· {timeAgo(c.created_at)}</Text></Text>
                  <Text style={{ color: colors.text, fontSize: 14, marginTop: 2 }}>{c.text}</Text>
                  {c.photo_url && <Image source={{ uri: c.photo_url }} style={{ width: 120, height: 120, borderRadius: 8, marginTop: 4 }} />}
                </View>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TextInput
                style={{ flex: 1, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: colors.text, fontSize: 14 }}
                placeholder="Add a comment..."
                placeholderTextColor={colors.textMuted}
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity onPress={postComment} style={{ marginLeft: 8, backgroundColor: colors.neonGreen, borderRadius: 20, paddingHorizontal: 16, justifyContent: 'center' }}>
                <Text style={{ color: colors.bg, fontWeight: '800' }}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const ss = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: fonts.sizes.xl, fontWeight: '800', padding: 16, paddingTop: 60 },
  card: { borderRadius: 16, margin: 12, marginTop: 0, padding: 16, borderWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 10, overflow: 'hidden' },
  avatarText: { fontWeight: '800', fontSize: fonts.sizes.lg },
  username: { fontWeight: '700', fontSize: fonts.sizes.md },
  timestamp: { fontSize: fonts.sizes.xs },
  drinkBadge: { fontSize: fonts.sizes.sm, fontWeight: '600' },
  photo: { width: '100%', height: 250, borderRadius: 12, marginBottom: 12 },
  caption: { fontSize: fonts.sizes.md, marginBottom: 8 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 60, fontSize: fonts.sizes.md },
  toggleRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, borderRadius: 10, padding: 3 },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  toggleText: { fontWeight: '700', fontSize: fonts.sizes.sm },
  commentSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, borderTopWidth: 1 },
});
