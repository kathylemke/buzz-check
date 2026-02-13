-- Comments table
CREATE TABLE IF NOT EXISTS public.bc_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.bc_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.bc_users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.bc_comments(post_id);
ALTER TABLE public.bc_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read comments" ON public.bc_comments FOR SELECT USING (true);
CREATE POLICY "Anyone can create comments" ON public.bc_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete comments" ON public.bc_comments FOR DELETE USING (true);

-- Add new columns to bc_posts
ALTER TABLE public.bc_posts ADD COLUMN IF NOT EXISTS rating SMALLINT CHECK (rating >= 1 AND rating <= 10);
ALTER TABLE public.bc_posts ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;
ALTER TABLE public.bc_posts ADD COLUMN IF NOT EXISTS city TEXT;

-- Add city column to bc_users
ALTER TABLE public.bc_users ADD COLUMN IF NOT EXISTS city TEXT;

-- Badges table
CREATE TABLE IF NOT EXISTS public.bc_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.bc_users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_desc TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type, badge_name)
);
CREATE INDEX IF NOT EXISTS idx_badges_user ON public.bc_badges(user_id);
ALTER TABLE public.bc_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read badges" ON public.bc_badges FOR SELECT USING (true);
CREATE POLICY "Anyone can earn badges" ON public.bc_badges FOR INSERT WITH CHECK (true);
