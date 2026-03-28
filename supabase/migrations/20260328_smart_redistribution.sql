-- 1. Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create RPC for smart matching (Nearby NGOs)
-- This function finds NGOs within a certain radius of a listing location
CREATE OR REPLACE FUNCTION get_nearby_receivers(
  listing_lat DOUBLE PRECISION,
  listing_lng DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION DEFAULT 10000
) 
RETURNS TABLE (
  id UUID,
  organization_name TEXT,
  distance_meters DOUBLE PRECISION,
  location_geography GEOGRAPHY
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.organization_name,
    ST_Distance(
      r.location, 
      ST_SetSRID(ST_MakePoint(listing_lng, listing_lat), 4326)::geography
    ) as distance_meters,
    r.location as location_geography
  FROM receivers r
  WHERE ST_DWithin(
    r.location,
    ST_SetSRID(ST_MakePoint(listing_lng, listing_lat), 4326)::geography,
    radius_meters
  )
  ORDER BY distance_meters ASC;
END;
$$;

-- 3. Add spatial index to receivers table if it exists
-- Assumption: 'location' column of type GEOGRAPHY exists in 'receivers'
CREATE INDEX IF NOT EXISTS idx_receivers_location ON receivers USING GIST (location);

-- 4. Create Notifications table if not exists
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable real-time for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
