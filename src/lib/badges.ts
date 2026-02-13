import { supabase } from './supabase';

type BadgeDef = { type: string; name: string; desc: string; emoji: string };

export const BADGE_DEFS: BadgeDef[] = [
  // First post per drink type
  { type: 'first_post', name: 'First Energy', desc: 'First energy drink post', emoji: '⚡' },
  { type: 'first_post', name: 'First Protein', desc: 'First protein shake post', emoji: '💪' },
  { type: 'first_post', name: 'First Coffee', desc: 'First coffee post', emoji: '☕' },
  { type: 'first_post', name: 'First Pre-Workout', desc: 'First pre-workout post', emoji: '🔥' },
  { type: 'first_post', name: 'First Supplements', desc: 'First supplements post', emoji: '🥛' },
  { type: 'first_post', name: 'First Electrolytes', desc: 'First electrolytes post', emoji: '💧' },
  { type: 'first_post', name: 'First Other', desc: 'First other drink post', emoji: '🥤' },
  // Milestones
  { type: 'brand_explorer', name: 'Brand Explorer', desc: '5 different brands in a category', emoji: '🧭' },
  { type: 'flavor_master', name: 'Flavor Master', desc: 'All flavors of a brand', emoji: '🎨' },
  { type: 'time_based', name: 'Early Bird', desc: 'Post before 7 AM', emoji: '🌅' },
  { type: 'time_based', name: 'Night Owl', desc: 'Post after 11 PM', emoji: '🦉' },
  { type: 'streak', name: '3-Day Streak', desc: 'Post 3 days in a row', emoji: '🔥' },
  { type: 'streak', name: '7-Day Streak', desc: 'Post 7 days in a row', emoji: '💥' },
  { type: 'streak', name: '30-Day Streak', desc: 'Post 30 days in a row', emoji: '👑' },
  { type: 'social', name: 'Social Butterfly', desc: 'Follow 10+ people', emoji: '🦋' },
  { type: 'social', name: 'Trendsetter', desc: 'Get 10+ likes on a post', emoji: '🌟' },
  { type: 'reviews', name: 'Top Reviewer', desc: '50+ reviews', emoji: '📝' },
];

const typeToFirstBadge: Record<string, string> = {
  energy_drink: 'First Energy',
  protein_shake: 'First Protein',
  coffee: 'First Coffee',
  pre_workout: 'First Pre-Workout',
  supplements: 'First Supplements',
  electrolytes: 'First Electrolytes',
  other: 'First Other',
};

export async function checkAndAwardBadges(userId: string) {
  const { data: existing } = await supabase.from('bc_badges').select('badge_type, badge_name').eq('user_id', userId);
  const has = (type: string, name: string) => existing?.some(b => b.badge_type === type && b.badge_name === name);

  const award = async (type: string, name: string) => {
    if (has(type, name)) return;
    // Double-check in DB to avoid duplicates
    const { data: check } = await supabase.from('bc_badges').select('id').eq('user_id', userId).eq('badge_type', type).eq('badge_name', name).limit(1);
    if (check && check.length > 0) return;
    const def = BADGE_DEFS.find(d => d.type === type && d.name === name);
    const { error } = await supabase.from('bc_badges').insert({
      user_id: userId, badge_type: type, badge_name: name,
      metadata: { desc: def?.desc || '', emoji: def?.emoji || '🏅' },
    });
    if (error) console.error('Badge award error:', error);
  };

  // Fetch user's posts
  const { data: posts } = await supabase.from('bc_posts').select('*').eq('user_id', userId).order('created_at', { ascending: true });
  if (!posts) return;

  // 1. First post per type
  const typesSeen = new Set<string>();
  for (const p of posts) {
    if (!typesSeen.has(p.drink_type)) {
      typesSeen.add(p.drink_type);
      const badgeName = typeToFirstBadge[p.drink_type];
      if (badgeName) await award('first_post', badgeName);
    }
  }

  // 2. Brand Explorer (5 diff brands per category)
  const brandsByCategory: Record<string, Set<string>> = {};
  for (const p of posts) {
    if (!p.brand) continue;
    if (!brandsByCategory[p.drink_type]) brandsByCategory[p.drink_type] = new Set();
    brandsByCategory[p.drink_type].add(p.brand);
  }
  for (const cat of Object.keys(brandsByCategory)) {
    if (brandsByCategory[cat].size >= 5) await award('brand_explorer', 'Brand Explorer');
  }

  // 3. Early Bird / Night Owl
  for (const p of posts) {
    const h = new Date(p.created_at).getHours();
    if (h < 7) await award('time_based', 'Early Bird');
    if (h >= 23) await award('time_based', 'Night Owl');
  }

  // 4. Streaks
  const days = [...new Set(posts.map(p => p.created_at.slice(0, 10)))].sort();
  let streak = 1;
  let maxStreak = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) { streak++; maxStreak = Math.max(maxStreak, streak); }
    else streak = 1;
  }
  if (maxStreak >= 3) await award('streak', '3-Day Streak');
  if (maxStreak >= 7) await award('streak', '7-Day Streak');
  if (maxStreak >= 30) await award('streak', '30-Day Streak');

  // 5. Social Butterfly
  const { count: followCount } = await supabase.from('bc_follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId);
  if ((followCount || 0) >= 10) await award('social', 'Social Butterfly');

  // 6. Trendsetter
  const { data: userPosts } = await supabase.from('bc_posts').select('id').eq('user_id', userId);
  if (userPosts) {
    for (const p of userPosts) {
      const { count } = await supabase.from('bc_likes').select('*', { count: 'exact', head: true }).eq('post_id', p.id);
      if ((count || 0) >= 10) { await award('social', 'Trendsetter'); break; }
    }
  }

  // 7. Top Reviewer (50+ posts)
  if (posts.length >= 50) await award('reviews', 'Top Reviewer');
}

export async function getUserBadges(userId: string) {
  const { data } = await supabase.from('bc_badges').select('*').eq('user_id', userId).order('earned_at', { ascending: false });
  return data || [];
}
