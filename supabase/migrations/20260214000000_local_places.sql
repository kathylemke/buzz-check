-- Local places table
CREATE TABLE IF NOT EXISTS public.bc_local_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS idx_local_places_city ON public.bc_local_places(city);
ALTER TABLE public.bc_local_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read local places" ON public.bc_local_places FOR SELECT USING (true);
CREATE POLICY "Auth insert local places" ON public.bc_local_places FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Local items table
CREATE TABLE IF NOT EXISTS public.bc_local_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID REFERENCES public.bc_local_places(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS idx_local_items_place ON public.bc_local_items(place_id);
ALTER TABLE public.bc_local_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read local items" ON public.bc_local_items FOR SELECT USING (true);
CREATE POLICY "Auth insert local items" ON public.bc_local_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Add is_local flag to posts
ALTER TABLE public.bc_posts ADD COLUMN IF NOT EXISTS is_local BOOLEAN DEFAULT false;
