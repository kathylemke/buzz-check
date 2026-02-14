import { supabase } from './supabase';

// ═══════════════════════════════════════════════
// Smack Talk Notification System
// ═══════════════════════════════════════════════

const SMACK_TALK_CHANCE = 0.1; // 10% chance per post

const SMACK_TALK_TEMPLATES = [
  `@{name} just checked in AGAIN… you gonna let them outdrink you? 💀`,
  `yo @{name} is on a TEAR today. what's your excuse? 🫠`,
  `@{name} just logged another one. at this point they're carrying your whole campus 😤`,
  `@{name} is putting in WORK rn and you're just watching?? 👀`,
  `not @{name} casually flexing another check-in while you sit there dry 🏜️`,
  `@{name} really said "I never miss" and they meant it. your move 🎯`,
  `@{name} just checked in. that's more than you've done all week bestie 💅`,
  `imagine letting @{name} have more check-ins than you. couldn't be me. oh wait— 😭`,
  `@{name} is speedrunning check-ins today and you're AFK 🎮`,
  `@{name} just hit another one. they're not even trying and still winning 🏆`,
  `the way @{name} keeps checking in is actually embarrassing… for YOU 🪞`,
  `@{name} woke up and chose violence (caffeine violence) ☕🔥`,
  `@{name} just posted AGAIN. do you even drink bro?? 🤨`,
  `@{name} really treating check-ins like a full-time job rn 💼`,
  `@{name} has been LOCKED IN today. meanwhile you've been locked out 🔒`,
  `another day, another @{name} check-in. and another day of you doing nothing 📉`,
  `@{name} is building a dynasty and you're building excuses 🧱`,
  `@{name} just dropped another check-in like it's nothing. go touch a drink 🥤`,
  `breaking: @{name} still has more check-ins than you. developing story 📰`,
  `@{name} really out here collecting check-ins like infinity stones 💎`,
];

function getRandomTemplate(): string {
  return SMACK_TALK_TEMPLATES[Math.floor(Math.random() * SMACK_TALK_TEMPLATES.length)];
}

function buildSmackTalkMessage(posterName: string): string {
  return getRandomTemplate().replace(/{name}/g, posterName);
}

/**
 * Send a notification. Currently writes to DB only.
 * When push notifications are added, extend this to also call Expo Push API.
 */
export async function sendNotification(params: {
  userId: string;       // recipient
  fromUserId: string;   // who triggered it
  message: string;
  type: string;
}) {
  const { error } = await supabase.from('bc_notifications').insert({
    user_id: params.userId,
    from_user_id: params.fromUserId,
    message: params.message,
    type: params.type,
    read: false,
  });

  // TODO: Add Expo push notification here
  // if (pushToken) { await sendExpoPush(pushToken, params.message); }

  if (error) console.warn('Failed to insert notification:', error.message);
}

/**
 * Called after a post is created. Rolls the dice for smack talk.
 */
export async function maybeSmackTalk(posterId: string, posterUsername: string) {
  // Roll the dice
  if (Math.random() > SMACK_TALK_CHANCE) return;

  // Get all followers of the poster
  const { data: followers } = await supabase
    .from('bc_follows')
    .select('follower_id')
    .eq('following_id', posterId);

  if (!followers || followers.length === 0) return;

  const message = buildSmackTalkMessage(posterUsername);

  // Send notification to each follower
  const notifications = followers.map((f: any) => ({
    user_id: f.follower_id,
    from_user_id: posterId,
    message,
    type: 'smack_talk',
    read: false,
  }));

  const { error } = await supabase.from('bc_notifications').insert(notifications);
  if (error) console.warn('Failed to send smack talk:', error.message);
}

/**
 * Fetch notifications for a user
 */
export async function getNotifications(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('bc_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: data || [], error };
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('bc_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  return error ? 0 : (count || 0);
}

/**
 * Mark all notifications as read
 */
export async function markAllRead(userId: string) {
  await supabase
    .from('bc_notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
}
