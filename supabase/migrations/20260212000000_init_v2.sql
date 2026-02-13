-- Buzz Check Database Migration
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)

-- Drink type enum
CREATE TYPE drink_type AS ENUM ('energy_drink', 'protein_shake', 'coffee', 'pre_workout', 'other');

-- Users (extends Supabase auth.users)
CREATE TABLE public.bc_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  campus TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts
CREATE TABLE public.bc_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.bc_users(id) ON DELETE CASCADE,
  photo_url TEXT,
  drink_name TEXT NOT NULL,
  drink_type drink_type NOT NULL DEFAULT 'other',
  caption TEXT,
  campus TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follows
CREATE TABLE public.bc_follows (
  follower_id UUID NOT NULL REFERENCES public.bc_users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.bc_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Likes
CREATE TABLE public.bc_likes (
  user_id UUID NOT NULL REFERENCES public.bc_users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.bc_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- Indexes
CREATE INDEX idx_posts_user_id ON public.bc_posts(user_id);
CREATE INDEX idx_posts_created_at ON public.bc_posts(created_at DESC);
CREATE INDEX idx_follows_follower ON public.bc_follows(follower_id);
CREATE INDEX idx_follows_following ON public.bc_follows(following_id);
CREATE INDEX idx_likes_post ON public.bc_likes(post_id);

-- RLS Policies
ALTER TABLE public.bc_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bc_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bc_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bc_likes ENABLE ROW LEVEL SECURITY;

-- Users: anyone can read, users can update own
CREATE POLICY "Users are viewable by everyone" ON public.bc_users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.bc_users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.bc_users FOR INSERT WITH CHECK (auth.uid() = id);

-- Posts: anyone can read, users can CRUD own
CREATE POLICY "Posts are viewable by everyone" ON public.bc_posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON public.bc_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.bc_posts FOR DELETE USING (auth.uid() = user_id);

-- Follows: anyone can read, users can manage own
CREATE POLICY "Follows are viewable by everyone" ON public.bc_follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.bc_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.bc_follows FOR DELETE USING (auth.uid() = follower_id);

-- Likes: anyone can read, users can manage own
CREATE POLICY "Likes are viewable by everyone" ON public.bc_likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON public.bc_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.bc_likes FOR DELETE USING (auth.uid() = user_id);
