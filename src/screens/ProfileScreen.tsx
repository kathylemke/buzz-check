import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, RefreshControl, Modal, ScrollView, TextInput, Platform, Switch } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { fonts, drinkTypeEmoji, drinkTypeLabels } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getUserBadges, BADGE_DEFS } from '../lib/badges';
import BadgeIcon from '../components/BadgeIcon';
import { CAMPUS_TO_CITY, cityFromCampus, getSelectableCities } from '../data/cities';
import { getUnreadCount } from '../lib/notifications';

type Post = { id: string; drink_name: string; drink_type: string; brand: string | null; photo_url: string | null; created_at: string };
type Badge = { badge_type: string; badge_name: string; metadata?: { desc?: string; emoji?: string }; earned_at: string };

export default function ProfileScreen({ route, navigation }: any) {
  const { user, signOut } = useAuth();
  const { colors, mode, toggle } = useTheme();
  const viewingUserId = route?.params?.userId;
  const isOwnProfile = !viewingUserId || viewingUserId === user?.id;

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [stats, setStats] = useState({ today: 0, week: 0, allTime: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [campusInput, setCampusInput] = useState('');
  const [campusSuggestions, setCampusSuggestions] = useState<string[]>([]);
  const [notInUni, setNotInUni] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [editMsg, setEditMsg] = useState('');
  const [topDrinksByConsumption, setTopDrinksByConsumption] = useState<{name: string; count: number}[]>([]);
  const [followStatus, setFollowStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [statsTab, setStatsTab] = useState<'favorites' | 'consumed' | 'badges'>('favorites');
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);

  const targetUserId = viewingUserId || user?.id;

  const saveUsername = async () => {
    if (!user || !newUsername.trim()) return;
    const { data: existing } = await supabase.from('bc_users').select('id').eq('username', newUsername.trim()).neq('id', user.id).single();
    if (existing) { setEditMsg('Username taken'); return; }
    await supabase.from('bc_users').update({ username: newUsername.trim(), display_name: newDisplayName.trim() || newUsername.trim() }).eq('id', user.id);
    setProfile((p: any) => p ? { ...p, username: newUsername.trim(), display_name: newDisplayName.trim() || newUsername.trim() } : p);
    setEditMsg('✓ Saved');
  };

  const savePassword = async () => {
    if (!user || !newPassword || newPassword.length < 4) { setEditMsg('Password must be 4+ chars'); return; }
    const encoder = new TextEncoder();
    const data = encoder.encode(newPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    await supabase.from('bc_users').update({ password_hash: hashHex }).eq('id', user.id);
    setNewPassword('');
    setEditMsg('✓ Password updated');
  };

  const uploadProfilePic = async () => {
    if (!user) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    const ext = uri.split('.').pop() ?? 'jpg';
    const fileName = `profile-pics/${user.id}.${ext}`;
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      await supabase.storage.from('post-photos').upload(fileName, arrayBuffer, { contentType: `image/${ext}`, upsert: true });
      const { data } = supabase.storage.from('post-photos').getPublicUrl(fileName);
      const picUrl = data.publicUrl + '?t=' + Date.now();
      await supabase.from('bc_users').update({ profile_pic_url: picUrl }).eq('id', user.id);
      setProfile((p: any) => p ? { ...p, profile_pic_url: picUrl } : p);
      setEditMsg('✓ Photo updated');
    } catch (e: any) { setEditMsg('Upload failed: ' + e.message); }
  };

  const ALL_CAMPUSES = Object.keys(CAMPUS_TO_CITY).sort();

  const onCampusType = (text: string) => {
    setCampusInput(text);
    if (text.length < 2) { setCampusSuggestions([]); return; }
    const lower = text.toLowerCase();
    setCampusSuggestions(ALL_CAMPUSES.filter(c => c.toLowerCase().includes(lower)).slice(0, 5));
  };

  const pickCampus = async (c: string) => {
    if (!user) return;
    const city = cityFromCampus(c) || null;
    await supabase.from('bc_users').update({ campus: c, city }).eq('id', user.id);
    setProfile((p: any) => p ? { ...p, campus: c, city } : p);
    setCampusInput(c);
    setCampusSuggestions([]);
    setNotInUni(false);
  };

  const onCitySearch = (text: string) => {
    setCitySearch(text);
    if (text.length < 2) { setCitySuggestions([]); return; }
    const lower = text.toLowerCase();
    setCitySuggestions(getSelectableCities().filter(c => c.toLowerCase().includes(lower)).slice(0, 8));
  };

  const pickCityDirect = async (city: string) => {
    if (!user) return;
    await supabase.from('bc_users').update({ campus: null, city }).eq('id', user.id);
    setProfile((p: any) => p ? { ...p, campus: null, city } : p);
    setCitySearch(city);
    setCitySuggestions([]);
    setEditMsg('✓ City set to ' + city);
  };

  const saveSettings = async (updates: any) => {
    if (!user) return;
    await supabase.from('bc_users').update(updates).eq('id', user.id);
    setProfile((p: any) => p ? { ...p, ...updates } : p);
  };

  const handleFollow = async () => {
    if (!user || !viewingUserId) return;
    if (followStatus === 'none') {
      const status = profile?.approve_follows ? 'pending' : 'accepted';
      await supabase.from('bc_follows').insert({ follower_id: user.id, following_id: viewingUserId, status });
      setFollowStatus(status);
    } else {
      await supabase.from('bc_follows').delete().eq('follower_id', user.id).eq('following_id', viewingUserId);
      setFollowStatus('none');
    }
  };

  const fetchData = useCallback(async () => {
    if (!targetUserId) return;
    const [profileRes, postsRes] = await Promise.all([
      supabase.from('bc_users').select('*').eq('id', targetUserId).single(),
      supabase.from('bc_posts').select('*').eq('user_id', targetUserId).order('created_at', { ascending: false }),
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
      // Top 3 drinks by consumption
      const drinkCounts: Record<string, number> = {};
      for (const p of postsRes.data) {
        const key = p.drink_name || p.brand || 'Unknown';
        drinkCounts[key] = (drinkCounts[key] || 0) + 1;
      }
      const sorted = Object.entries(drinkCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
      setTopDrinksByConsumption(sorted.map(([name, count]) => ({ name, count })));
    }
    const b = await getUserBadges(targetUserId);
    setBadges(b);

    // Check follow status if viewing someone else
    if (!isOwnProfile && user) {
      const { data: f } = await supabase.from('bc_follows').select('status').eq('follower_id', user.id).eq('following_id', viewingUserId).single();
      setFollowStatus(f?.status || 'none');
    }

    // Fetch follow counts
    const [{ count: fgCount }, { count: frCount }] = await Promise.all([
      supabase.from('bc_follows').select('*', { count: 'exact', head: true }).eq('follower_id', targetUserId),
      supabase.from('bc_follows').select('*', { count: 'exact', head: true }).eq('following_id', targetUserId),
    ]);
    setFollowingCount(fgCount ?? 0);
    setFollowersCount(frCount ?? 0);

    // Unread alerts (own profile)
    if (isOwnProfile && user) {
      const c = await getUnreadCount(user.id);
      setUnreadAlerts(c);
    }
  }, [targetUserId, user, isOwnProfile, viewingUserId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

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

  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null;

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
  const userTopDrinks = profile?.top_drinks && Array.isArray(profile.top_drinks) && profile.top_drinks.length > 0 ? profile.top_drinks : null;

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
            {/* Back button for viewing others */}
            {!isOwnProfile && (
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, backgroundColor: colors.surface, borderRadius: 20, width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginTop: -1 }}>←</Text>
              </TouchableOpacity>
            )}

            {/* Theme toggle + alerts (own profile only) */}
            {isOwnProfile && (
              <View style={{ position: 'absolute', top: 60, right: 16, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
                  <Text style={{ fontSize: 24 }}>🔔</Text>
                  {unreadAlerts > 0 && (
                    <View style={{ position: 'absolute', top: -4, right: -8, backgroundColor: colors.danger, borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 }}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{unreadAlerts > 99 ? '99+' : unreadAlerts}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={toggle}>
                  <Text style={{ fontSize: 24 }}>{mode === 'dark' ? '☀️' : '🌙'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Avatar */}
            <TouchableOpacity onPress={isOwnProfile && editMode ? uploadProfilePic : undefined} activeOpacity={isOwnProfile && editMode ? 0.7 : 1}>
              {profile?.profile_pic_url ? (
                <Image source={{ uri: profile.profile_pic_url }} style={[ss.avatar, { backgroundColor: colors.electricBlue }]} />
              ) : (
                <View style={[ss.avatar, { backgroundColor: colors.electricBlue }]}>
                  <Text style={{ color: colors.bg, fontWeight: '900', fontSize: 32 }}>{profile?.username?.[0]?.toUpperCase() ?? '?'}</Text>
                </View>
              )}
              {isOwnProfile && editMode && (
                <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.neonGreen, borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14 }}>📷</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={{ color: colors.text, fontSize: fonts.sizes.xl, fontWeight: '800' }}>{profile?.display_name ?? profile?.username ?? '...'}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: fonts.sizes.md, marginTop: 2 }}>@{profile?.username}</Text>
            {profile?.campus && <Text style={{ color: colors.textMuted, fontSize: fonts.sizes.sm, marginTop: 4 }}>🎓 {profile.campus}</Text>}
            {profile?.city && <Text style={{ color: colors.electricBlue, fontSize: fonts.sizes.xs, marginTop: 2 }}>📍 {profile.city}</Text>}
            {profile?.show_age && profile?.age_range && <Text style={{ color: colors.textMuted, fontSize: fonts.sizes.xs, marginTop: 2 }}>🎂 {profile.age_range}</Text>}

            {/* Member since */}
            {memberSince && <Text style={{ color: colors.textMuted, fontSize: fonts.sizes.xs, marginTop: 6 }}>Member since {memberSince}</Text>}

            {/* Following / Followers */}
            <View style={{ flexDirection: 'row', marginTop: 12, gap: 24, alignItems: 'center' }}>
              <TouchableOpacity onPress={() => navigation.navigate('Friends')} style={{ alignItems: 'center' }}>
                <Text style={{ color: colors.text, fontSize: fonts.sizes.lg, fontWeight: '800' }}>{followingCount}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: fonts.sizes.xs }}>Following</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Friends')} style={{ alignItems: 'center' }}>
                <Text style={{ color: colors.text, fontSize: fonts.sizes.lg, fontWeight: '800' }}>{followersCount}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: fonts.sizes.xs }}>Followers</Text>
              </TouchableOpacity>
              {isOwnProfile && (
                <TouchableOpacity
                  onPress={async () => {
                    const msg = 'Check out L.I.D. - Li-quid I drank! Track your drinks and compete with friends 🏆 https://kathylemke.github.io/buzz-check';
                    if (Platform.OS === 'web' && navigator.share) {
                      try { await navigator.share({ text: msg }); } catch {}
                    } else if (Platform.OS === 'web' && navigator.clipboard) {
                      await navigator.clipboard.writeText(msg);
                      setEditMsg('📋 Copied invite link!');
                    } else {
                      try {
                        const { Share } = require('react-native');
                        await Share.share({ message: msg });
                      } catch {}
                    }
                  }}
                  style={{ backgroundColor: colors.electricBlue, borderRadius: 20, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 18 }}>📤</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Follow button for other profiles */}
            {!isOwnProfile && (
              <TouchableOpacity
                onPress={handleFollow}
                style={{ marginTop: 12, backgroundColor: followStatus === 'accepted' ? colors.surface : followStatus === 'pending' ? colors.surface : colors.electricBlue, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 24, borderWidth: 1, borderColor: followStatus === 'accepted' ? colors.cardBorder : followStatus === 'pending' ? colors.cardBorder : colors.electricBlue }}
              >
                <Text style={{ color: followStatus === 'none' ? '#fff' : colors.textSecondary, fontWeight: '700', fontSize: fonts.sizes.sm }}>
                  {followStatus === 'accepted' ? '✓ Following' : followStatus === 'pending' ? '⏳ Requested' : '+ Follow'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Edit profile + Sign Out row */}
            {isOwnProfile && (
              <View style={{ flexDirection: 'row', marginTop: 8, gap: 16, alignItems: 'center' }}>
                <TouchableOpacity onPress={() => { setEditMode(!editMode); setCampusInput(profile?.campus || ''); setNewUsername(profile?.username || ''); setNewDisplayName(profile?.display_name || ''); setNewPassword(''); setEditMsg(''); }}>
                  <Text style={{ color: colors.electricBlue, fontSize: fonts.sizes.xs, fontWeight: '600' }}>{editMode ? 'Done' : '✏️ Edit Profile'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={signOut}>
                  <Text style={{ color: colors.danger, fontSize: fonts.sizes.xs, fontWeight: '600' }}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Edit mode panel */}
            {isOwnProfile && editMode && (
              <View style={{ width: '100%', marginTop: 12, backgroundColor: colors.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.cardBorder }}>
                {editMsg ? <Text style={{ color: colors.neonGreen, fontSize: 12, marginBottom: 8, textAlign: 'center' }}>{editMsg}</Text> : null}

                {/* Profile Picture */}
                <TouchableOpacity onPress={uploadProfilePic} style={{ alignSelf: 'center', marginBottom: 16 }}>
                  <Text style={{ color: colors.electricBlue, fontSize: fonts.sizes.sm, fontWeight: '600' }}>📷 Change Profile Picture</Text>
                </TouchableOpacity>

                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' }}>Username</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  <TextInput
                    style={{ flex: 1, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: 12, fontSize: fonts.sizes.sm, color: colors.text }}
                    value={newUsername} onChangeText={setNewUsername} autoCapitalize="none" placeholder="Username" placeholderTextColor={colors.textMuted}
                  />
                  <TouchableOpacity onPress={saveUsername} style={{ backgroundColor: colors.neonGreen, borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' }}>
                    <Text style={{ color: colors.bg, fontWeight: '700', fontSize: 12 }}>Save</Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' }}>Display Name</Text>
                <TextInput
                  style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: 12, fontSize: fonts.sizes.sm, color: colors.text, marginBottom: 12 }}
                  value={newDisplayName} onChangeText={setNewDisplayName} placeholder="Display name" placeholderTextColor={colors.textMuted}
                />

                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' }}>New Password</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  <TextInput
                    style={{ flex: 1, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: 12, fontSize: fonts.sizes.sm, color: colors.text }}
                    value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="New password" placeholderTextColor={colors.textMuted}
                  />
                  <TouchableOpacity onPress={savePassword} style={{ backgroundColor: colors.electricBlue, borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' }}>
                    <Text style={{ color: colors.bg, fontWeight: '700', fontSize: 12 }}>Update</Text>
                  </TouchableOpacity>
                </View>

                {/* Age Range */}
                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' }}>Age Range</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  {['Under 18', '18-25', '25+'].map(range => (
                    <TouchableOpacity
                      key={range}
                      onPress={() => saveSettings({ age_range: range })}
                      style={{ flex: 1, backgroundColor: profile?.age_range === range ? colors.electricBlue + '22' : colors.inputBg, borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: profile?.age_range === range ? colors.electricBlue : colors.inputBorder }}
                    >
                      <Text style={{ color: profile?.age_range === range ? colors.electricBlue : colors.textSecondary, fontWeight: '600', fontSize: 12 }}>{range}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Show age on profile</Text>
                  <Switch value={profile?.show_age || false} onValueChange={v => saveSettings({ show_age: v })} trackColor={{ true: colors.neonGreen, false: colors.inputBorder }} thumbColor="#fff" />
                </View>

                {/* Approve Follow Requests */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, backgroundColor: colors.surface, padding: 14, borderRadius: 12 }}>
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13 }}>🔒 Approve follow requests</Text>
                  <Switch value={profile?.approve_follows || false} onValueChange={v => saveSettings({ approve_follows: v })} trackColor={{ true: colors.neonGreen, false: colors.inputBorder }} thumbColor="#fff" />
                </View>

                {/* Top 3 Drinks Preference */}
                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' }}>Top 3 Favorite Drinks (optional)</Text>
                {[0, 1, 2].map(i => (
                  <TextInput
                    key={i}
                    style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: 12, fontSize: fonts.sizes.sm, color: colors.text, marginBottom: 8 }}
                    placeholder={`#${i + 1} favorite drink`}
                    placeholderTextColor={colors.textMuted}
                    value={(profile?.top_drinks || [])[i] || ''}
                    onChangeText={text => {
                      const newDrinks = [...(profile?.top_drinks || ['', '', ''])];
                      while (newDrinks.length < 3) newDrinks.push('');
                      newDrinks[i] = text;
                      setProfile((p: any) => p ? { ...p, top_drinks: newDrinks } : p);
                    }}
                    onBlur={() => {
                      const drinks = (profile?.top_drinks || []).filter((d: string) => d.trim());
                      saveSettings({ top_drinks: drinks });
                    }}
                  />
                ))}

                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', marginTop: 8, marginBottom: 6, textTransform: 'uppercase' }}>University</Text>
                <TextInput
                  style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: 12, fontSize: fonts.sizes.sm, color: colors.text }}
                  placeholder="Search university..." placeholderTextColor={colors.textMuted} value={campusInput} onChangeText={onCampusType} autoCapitalize="words"
                />
                {campusSuggestions.length > 0 && (
                  <View style={{ backgroundColor: colors.surface, borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: colors.cardBorder }}>
                    {campusSuggestions.map(c => (
                      <TouchableOpacity key={c} onPress={() => pickCampus(c)} style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
                        <Text style={{ color: colors.text, fontSize: fonts.sizes.sm }}>{c}</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 11 }}>{CAMPUS_TO_CITY[c]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <TouchableOpacity onPress={() => setNotInUni(!notInUni)} style={{ marginTop: 12 }}>
                  <Text style={{ color: colors.electricBlue, fontSize: fonts.sizes.xs, fontWeight: '600' }}>
                    {notInUni ? '↑ Search university instead' : 'Not in university? Select your home city'}
                  </Text>
                </TouchableOpacity>
                {notInUni && (
                  <View style={{ marginTop: 8 }}>
                    <TextInput
                      style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: 12, fontSize: fonts.sizes.sm, color: colors.text }}
                      placeholder="Search city..." placeholderTextColor={colors.textMuted} value={citySearch} onChangeText={onCitySearch} autoCapitalize="words"
                    />
                    {citySuggestions.length > 0 && (
                      <View style={{ backgroundColor: colors.surface, borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: colors.cardBorder }}>
                        {citySuggestions.map(c => (
                          <TouchableOpacity key={c} onPress={() => pickCityDirect(c)} style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
                            <Text style={{ color: colors.text, fontSize: fonts.sizes.sm }}>{c}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Drink counts */}
            <View style={{ flexDirection: 'row', marginTop: 20, gap: 16 }}>
              <StatBox label="Today" value={stats.today} period="today" />
              <StatBox label="This Week" value={stats.week} period="week" />
              <StatBox label="All Time" value={stats.allTime} period="allTime" />
            </View>

            {/* Stats Toggle */}
            <View style={{ width: '100%', marginTop: 20 }}>
              <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: 3 }}>
                {([['favorites', 'Favorites'], ['consumed', 'Most Consumed'], ['badges', 'Badges']] as const).map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setStatsTab(key)}
                    style={{ flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: statsTab === key ? colors.electricBlue : 'transparent', alignItems: 'center' }}
                  >
                    <Text style={{ color: statsTab === key ? '#fff' : colors.textSecondary, fontSize: fonts.sizes.xs, fontWeight: '700' }}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Favorites Tab */}
              {statsTab === 'favorites' && userTopDrinks && (
                <View style={{ marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {userTopDrinks.map((d: string, i: number) => (
                      <View key={i} style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder }}>
                        <Text style={{ fontSize: 18, marginBottom: 4 }}>{['🥇', '🥈', '🥉'][i]}</Text>
                        <Text style={{ color: colors.text, fontSize: 11, fontWeight: '600', textAlign: 'center' }} numberOfLines={2}>{d}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {statsTab === 'favorites' && !userTopDrinks && (
                <Text style={{ color: colors.textMuted, fontSize: fonts.sizes.xs, textAlign: 'center', marginTop: 16 }}>No favorite drinks set yet{isOwnProfile ? ' — edit your profile to add them!' : ''}</Text>
              )}

              {/* Most Consumed Tab */}
              {statsTab === 'consumed' && topDrinksByConsumption.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {topDrinksByConsumption.map((d, i) => (
                      <View key={i} style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder }}>
                        <Text style={{ fontSize: 18, marginBottom: 4 }}>{['🥇', '🥈', '🥉'][i]}</Text>
                        <Text style={{ color: colors.text, fontSize: 11, fontWeight: '600', textAlign: 'center' }} numberOfLines={2}>{d.name}</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>{d.count}x</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {statsTab === 'consumed' && topDrinksByConsumption.length === 0 && (
                <Text style={{ color: colors.textMuted, fontSize: fonts.sizes.xs, textAlign: 'center', marginTop: 16 }}>No drinks logged yet</Text>
              )}

              {/* Badges Tab - one row, tap to expand */}
              {statsTab === 'badges' && (
                <TouchableOpacity onPress={() => setBadgeModalVisible(true)} activeOpacity={0.7} style={{ marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(badges.length > 0 ? badges : BADGE_DEFS).slice(0, 4).map((b, i) => {
                      const bName = ('badge_name' in b) ? b.badge_name : (b as any).name;
                      const bType = ('badge_type' in b) ? b.badge_type : (b as any).type;
                      const isEarned = badges.some(eb => eb.badge_type === bType && eb.badge_name === bName);
                      return (
                        <View key={i} style={{ flex: 1, backgroundColor: isEarned ? colors.card : colors.surface, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: isEarned ? colors.cardBorder : 'transparent', opacity: isEarned ? 1 : 0.7 }}>
                          <BadgeIcon badgeName={bName} size={36} locked={!isEarned} />
                          <Text style={{ color: isEarned ? colors.text : colors.textMuted, fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 4 }} numberOfLines={2}>{bName}</Text>
                        </View>
                      );
                    })}
                  </View>
                  <Text style={{ color: colors.electricBlue, fontSize: fonts.sizes.xs, textAlign: 'center', marginTop: 8, fontWeight: '600' }}>Tap to view all badges →</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Sign out moved to edit profile row */}
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <Modal visible={badgeModalVisible} transparent animationType="slide" onRequestClose={() => setBadgeModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, borderTopWidth: 1, borderColor: colors.cardBorder, maxHeight: '85%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>🏅 All Badges</Text>
              <TouchableOpacity onPress={() => setBadgeModalVisible(false)}><Text style={{ color: colors.textSecondary, fontSize: 20 }}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {badges.length > 0 && (
                <>
                  <Text style={{ color: colors.electricBlue, fontSize: 12, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase' }}>Earned ({badges.length})</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                    {badges.map((b, i) => {
                      const def = BADGE_DEFS.find(d => d.type === b.badge_type && d.name === b.badge_name);
                      return (
                        <View key={i} style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, alignItems: 'center', width: 100, borderWidth: 1, borderColor: colors.cardBorder }}>
                          <BadgeIcon badgeName={b.badge_name} size={40} locked={false} />
                          <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 6 }} numberOfLines={2}>{b.badge_name}</Text>
                          <Text style={{ color: colors.textMuted, fontSize: 9, textAlign: 'center', marginTop: 2 }} numberOfLines={2}>{def?.desc || ''}</Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}
              <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase' }}>Locked</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {BADGE_DEFS.filter(d => !badges.some(b => b.badge_type === d.type && b.badge_name === d.name)).map((d, i) => (
                  <View key={i} style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center', width: 100, opacity: 0.7 }}>
                    <BadgeIcon badgeName={d.name} size={40} locked={true} />
                    <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 6 }} numberOfLines={2}>{d.name}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 9, textAlign: 'center', marginTop: 2 }} numberOfLines={2}>{d.desc}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
                  <Text style={{ color: colors.electricBlue, fontSize: 12, fontWeight: '700', marginTop: 16, marginBottom: 8 }}>TOP COMPANIES</Text>
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
