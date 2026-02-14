-- Run these in Supabase SQL Editor

-- Local places table
CREATE TABLE IF NOT EXISTS bc_local_places (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  city text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Local items table
CREATE TABLE IF NOT EXISTS bc_local_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id uuid REFERENCES bc_local_places(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text DEFAULT 'other',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Add is_local flag to posts
ALTER TABLE bc_posts ADD COLUMN IF NOT EXISTS is_local boolean DEFAULT false;

-- RLS policies for local places
ALTER TABLE bc_local_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read local places" ON bc_local_places FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert local places" ON bc_local_places FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS policies for local items
ALTER TABLE bc_local_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read local items" ON bc_local_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert local items" ON bc_local_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
