-- Migration: Points System & Donor Stats
-- Applied: 2026-03-29

-- 1. Add points to donors
ALTER TABLE donors ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE donors ADD COLUMN IF NOT EXISTS total_kg_donated DOUBLE PRECISION DEFAULT 0;

-- 2. Add points to NGOs
ALTER TABLE ngo_organizations ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- 3. Add points to Volunteers
ALTER TABLE ngo_volunteers ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- 4. Create function to increment points
CREATE OR REPLACE FUNCTION award_points(
  user_id_val UUID,
  points_val INTEGER,
  target_table TEXT
) RETURNS VOID AS $$
BEGIN
  IF target_table = 'donors' THEN
    UPDATE donors SET points = points + points_val WHERE user_id = user_id_val;
  ELSIF target_table = 'ngo_organizations' THEN
    UPDATE ngo_organizations SET points = points + points_val WHERE user_id = user_id_val;
  ELSIF target_table = 'ngo_volunteers' THEN
    UPDATE ngo_volunteers SET points = points + points_val WHERE user_id = user_id_val;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC to increment volunteer stats safely
CREATE OR REPLACE FUNCTION increment_volunteer_stats(
  p_volunteer_id UUID,
  p_kg DOUBLE PRECISION,
  p_points INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE ngo_volunteers 
  SET 
    total_tasks_completed = total_tasks_completed + 1,
    total_kg_collected = total_kg_collected + p_kg,
    points = points + p_points,
    updated_at = now()
  WHERE id = p_volunteer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
