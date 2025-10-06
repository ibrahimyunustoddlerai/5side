-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_organizations junction table (links users to organizations with roles)
CREATE TABLE IF NOT EXISTS user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MANAGER', 'STAFF')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, organization_id)
);

-- Create locations (venues) table
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'UK',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  description TEXT,
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create pitches table
CREATE TABLE IF NOT EXISTS pitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  surface TEXT NOT NULL CHECK (surface IN ('GRASS', 'ARTIFICIAL_GRASS', 'ASTROTURF', 'CONCRETE', 'INDOOR_COURT')),
  indoor BOOLEAN NOT NULL DEFAULT false,
  size TEXT CHECK (size IN ('5_ASIDE', '7_ASIDE', '11_ASIDE', 'FUTSAL')),
  length DOUBLE PRECISION,
  width DOUBLE PRECISION,
  price_per_hour DECIMAL(10, 2) NOT NULL,
  description TEXT,
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pitch_id UUID NOT NULL REFERENCES pitches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')) DEFAULT 'PENDING',
  total_price DECIMAL(10, 2) NOT NULL,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED', 'FAILED')) DEFAULT 'PENDING',
  payment_intent_id TEXT,
  player_name TEXT NOT NULL,
  player_email TEXT NOT NULL,
  player_phone TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT no_overlapping_bookings EXCLUDE USING gist (
    pitch_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  ) WHERE (status != 'CANCELLED')
);

-- Create availability_rules table (for recurring availability patterns)
CREATE TABLE IF NOT EXISTS availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pitch_id UUID NOT NULL REFERENCES pitches(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_locations_org_id ON locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_locations_coords ON locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_pitches_location_id ON pitches(location_id);
CREATE INDEX IF NOT EXISTS idx_pitches_surface ON pitches(surface);
CREATE INDEX IF NOT EXISTS idx_pitches_indoor ON pitches(indoor);
CREATE INDEX IF NOT EXISTS idx_pitches_is_active ON pitches(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_pitch_id ON bookings(pitch_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_availability_rules_pitch_id ON availability_rules(pitch_id);

-- Enable Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view organizations they belong to"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert organizations"
  ON organizations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update organizations they own or admin"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
    )
  );

-- RLS Policies for user_organizations
CREATE POLICY "Users can view their organization memberships"
  ON user_organizations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own organization memberships"
  ON user_organizations FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for locations
CREATE POLICY "Anyone can view active locations"
  ON locations FOR SELECT
  USING (true);

CREATE POLICY "Organization members can insert locations"
  ON locations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can update locations"
  ON locations FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN', 'MANAGER')
    )
  );

-- RLS Policies for pitches
CREATE POLICY "Anyone can view active pitches"
  ON pitches FOR SELECT
  USING (is_active = true);

CREATE POLICY "Location managers can insert pitches"
  ON pitches FOR INSERT
  WITH CHECK (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN user_organizations uo ON l.organization_id = uo.organization_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Location managers can update pitches"
  ON pitches FOR UPDATE
  USING (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN user_organizations uo ON l.organization_id = uo.organization_id
      WHERE uo.user_id = auth.uid() AND uo.role IN ('OWNER', 'ADMIN', 'MANAGER')
    )
  );

-- RLS Policies for bookings
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Venue managers can view bookings for their pitches"
  ON bookings FOR SELECT
  USING (
    pitch_id IN (
      SELECT p.id FROM pitches p
      JOIN locations l ON p.location_id = l.id
      JOIN user_organizations uo ON l.organization_id = uo.organization_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Venue managers can update bookings for their pitches"
  ON bookings FOR UPDATE
  USING (
    pitch_id IN (
      SELECT p.id FROM pitches p
      JOIN locations l ON p.location_id = l.id
      JOIN user_organizations uo ON l.organization_id = uo.organization_id
      WHERE uo.user_id = auth.uid() AND uo.role IN ('OWNER', 'ADMIN', 'MANAGER')
    )
  );

-- RLS Policies for availability_rules
CREATE POLICY "Anyone can view availability rules"
  ON availability_rules FOR SELECT
  USING (true);

CREATE POLICY "Pitch managers can manage availability rules"
  ON availability_rules FOR ALL
  USING (
    pitch_id IN (
      SELECT p.id FROM pitches p
      JOIN locations l ON p.location_id = l.id
      JOIN user_organizations uo ON l.organization_id = uo.organization_id
      WHERE uo.user_id = auth.uid() AND uo.role IN ('OWNER', 'ADMIN', 'MANAGER')
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pitches_updated_at BEFORE UPDATE ON pitches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_rules_updated_at BEFORE UPDATE ON availability_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
