-- =====================================================
-- PHASE 1: NGO & VOLUNTEER SCHEMA MIGRATION
-- Applied: 2026-03-29
-- =====================================================

-- 1. NGO Organizations
CREATE TABLE IF NOT EXISTS ngo_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_name TEXT NOT NULL,
  org_type TEXT NOT NULL CHECK (org_type IN ('ngo','community_kitchen','food_bank','orphanage','old_age_home','hospital','shelter','other')),
  registration_number TEXT NOT NULL UNIQUE,
  fssai_number TEXT,
  contact_person TEXT NOT NULL,
  designation TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('pending_verification','verified','suspended','rejected')),
  trust_score INTEGER DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  primary_address TEXT NOT NULL,
  primary_lat DOUBLE PRECISION NOT NULL,
  primary_lng DOUBLE PRECISION NOT NULL,
  service_radius_km INTEGER DEFAULT 10,
  dietary_restrictions TEXT[] DEFAULT '{}',
  food_type_preferences TEXT[] DEFAULT '{}',
  beneficiary_count INTEGER DEFAULT 0,
  peak_meal_times JSONB DEFAULT '{}',
  documents JSONB DEFAULT '{}',
  logo_url TEXT,
  cover_photo_url TEXT,
  bio TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}',
  total_kg_received DOUBLE PRECISION DEFAULT 0,
  total_tasks_completed INTEGER DEFAULT 0,
  rating DOUBLE PRECISION DEFAULT 0,
  kyc_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. NGO Distribution Locations
CREATE TABLE IF NOT EXISTS ngo_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID REFERENCES ngo_organizations(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  capacity_kg INTEGER,
  operating_hours JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Volunteers
CREATE TABLE IF NOT EXISTS ngo_volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID REFERENCES ngo_organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  profile_photo_url TEXT,
  role TEXT NOT NULL DEFAULT 'volunteer' CHECK (role IN ('volunteer','employee','team_lead','driver')),
  vehicle_type TEXT CHECK (vehicle_type IN ('bicycle','bike','auto','car','van','truck','on_foot')),
  vehicle_number TEXT,
  id_proof_type TEXT,
  id_proof_url TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','on_leave','terminated')),
  availability_status TEXT NOT NULL DEFAULT 'offline' CHECK (availability_status IN ('available','on_task','break','offline')),
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  last_location_update TIMESTAMPTZ,
  total_tasks_completed INTEGER DEFAULT 0,
  total_kg_collected DOUBLE PRECISION DEFAULT 0,
  rating DOUBLE PRECISION DEFAULT 0,
  join_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  setup_pin TEXT,
  setup_pin_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. NGO Food Claims
CREATE TABLE IF NOT EXISTS ngo_food_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID REFERENCES ngo_organizations(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES food_listings(id) ON DELETE CASCADE,
  quantity_claimed DOUBLE PRECISION NOT NULL,
  quantity_unit TEXT NOT NULL,
  destination_location_id UUID REFERENCES ngo_locations(id),
  status TEXT NOT NULL DEFAULT 'pending_assignment' CHECK (status IN (
    'pending_assignment','assigned','volunteer_en_route','arrived_at_donor',
    'picked_up','in_transit','delivered','completed','cancelled'
  )),
  pickup_otp TEXT NOT NULL,
  pickup_otp_verified BOOLEAN DEFAULT false,
  actual_quantity_received DOUBLE PRECISION,
  cancellation_reason TEXT,
  cancelled_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Volunteer Task Assignments
CREATE TABLE IF NOT EXISTS volunteer_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES ngo_food_claims(id) ON DELETE CASCADE,
  ngo_id UUID REFERENCES ngo_organizations(id) ON DELETE CASCADE,
  volunteer_id UUID REFERENCES ngo_volunteers(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES auth.users(id),
  listing_snapshot JSONB NOT NULL DEFAULT '{}',
  donor_snapshot JSONB NOT NULL DEFAULT '{}',
  pickup_address TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,
  pickup_window_start TIMESTAMPTZ NOT NULL,
  pickup_window_end TIMESTAMPTZ NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_lat DOUBLE PRECISION NOT NULL,
  delivery_lng DOUBLE PRECISION NOT NULL,
  vehicle_required TEXT,
  special_instructions TEXT,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN (
    'assigned','accepted','en_route_pickup','arrived_at_pickup',
    'otp_verified','picked_up','en_route_delivery','delivered','completed','cancelled'
  )),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  arrived_pickup_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_distance_km DOUBLE PRECISION,
  estimated_duration_min INTEGER,
  actual_kg_collected DOUBLE PRECISION,
  photo_proof_url TEXT,
  volunteer_note TEXT,
  rating_by_ngo INTEGER CHECK (rating_by_ngo BETWEEN 1 AND 5),
  ngo_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Live Location Logs
CREATE TABLE IF NOT EXISTS volunteer_location_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID REFERENCES ngo_volunteers(id) ON DELETE CASCADE,
  task_id UUID REFERENCES volunteer_tasks(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  speed_kmph DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  accuracy_meters DOUBLE PRECISION,
  logged_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Impact Logs
CREATE TABLE IF NOT EXISTS impact_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID REFERENCES ngo_organizations(id) ON DELETE CASCADE,
  task_id UUID REFERENCES volunteer_tasks(id) ON DELETE CASCADE,
  claim_id UUID REFERENCES ngo_food_claims(id) ON DELETE CASCADE,
  volunteer_id UUID REFERENCES ngo_volunteers(id),
  food_category TEXT,
  kg_received DOUBLE PRECISION NOT NULL,
  meals_estimated INTEGER,
  people_served_estimate INTEGER,
  food_condition TEXT CHECK (food_condition IN ('excellent','good','fair','poor')),
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Task Messages (Chat)
CREATE TABLE IF NOT EXISTS task_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES volunteer_tasks(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  sender_role TEXT CHECK (sender_role IN ('ngo','volunteer')),
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text','image','location','system')),
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Volunteer Availability Logs
CREATE TABLE IF NOT EXISTS volunteer_availability_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID REFERENCES ngo_volunteers(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT now(),
  note TEXT
);

-- RLS & Realtime applied via Supabase MCP
