-- Add password hash column and make id not require auth.users reference
ALTER TABLE public.bc_users DROP CONSTRAINT IF EXISTS bc_users_id_fkey;
ALTER TABLE public.bc_users ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.bc_users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Update RLS to allow inserts/reads without auth
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.bc_users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.bc_users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.bc_users;

CREATE POLICY "Anyone can read users" ON public.bc_users FOR SELECT USING (true);
CREATE POLICY "Anyone can insert users" ON public.bc_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update users" ON public.bc_users FOR UPDATE USING (true);

-- Update posts RLS too
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.bc_posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.bc_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.bc_posts;

CREATE POLICY "Anyone can read posts" ON public.bc_posts FOR SELECT USING (true);
CREATE POLICY "Anyone can create posts" ON public.bc_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete posts" ON public.bc_posts FOR DELETE USING (true);

-- Update likes RLS
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.bc_likes;
DROP POLICY IF EXISTS "Users can like" ON public.bc_likes;
DROP POLICY IF EXISTS "Users can unlike" ON public.bc_likes;

CREATE POLICY "Anyone can read likes" ON public.bc_likes FOR SELECT USING (true);
CREATE POLICY "Anyone can like" ON public.bc_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can unlike" ON public.bc_likes FOR DELETE USING (true);

-- Update follows RLS
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.bc_follows;
DROP POLICY IF EXISTS "Users can follow" ON public.bc_follows;
DROP POLICY IF EXISTS "Users can unfollow" ON public.bc_follows;

CREATE POLICY "Anyone can read follows" ON public.bc_follows FOR SELECT USING (true);
CREATE POLICY "Anyone can follow" ON public.bc_follows FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can unfollow" ON public.bc_follows FOR DELETE USING (true);
