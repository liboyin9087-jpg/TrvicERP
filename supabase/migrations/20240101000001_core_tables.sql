-- ==============================================
-- TrivcERP - Core Tables Migration
-- Migration: 20240101000001_core_tables.sql
-- ==============================================

-- Trips Table
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  headcount INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  base_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'TWD',
  agency_id UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RFPs Table
CREATE TABLE IF NOT EXISTS public.rfps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  contact_email TEXT,
  headcount INTEGER NOT NULL,
  budget_min DECIMAL(10, 2) NOT NULL,
  budget_max DECIMAL(10, 2) NOT NULL,
  destination TEXT NOT NULL,
  duration INTEGER NOT NULL,
  departure_date DATE,
  deadline DATE NOT NULL,
  special_requirements TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'won', 'lost')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votings Table
CREATE TABLE IF NOT EXISTS public.votings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes Table (individual votes)
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voting_id UUID NOT NULL REFERENCES public.votings(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voting_id, user_id)
);

-- Supplier Warnings Table
CREATE TABLE IF NOT EXISTS public.supplier_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name TEXT NOT NULL,
  supplier_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  reported_by UUID REFERENCES public.profiles(id),
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- Indexes
-- ==============================================

CREATE INDEX IF NOT EXISTS trips_status_idx ON public.trips(status);
CREATE INDEX IF NOT EXISTS trips_agency_id_idx ON public.trips(agency_id);
CREATE INDEX IF NOT EXISTS rfps_status_idx ON public.rfps(status);
CREATE INDEX IF NOT EXISTS rfps_deadline_idx ON public.rfps(deadline);
CREATE INDEX IF NOT EXISTS votings_status_idx ON public.votings(status);
CREATE INDEX IF NOT EXISTS votes_voting_id_idx ON public.votes(voting_id);
CREATE INDEX IF NOT EXISTS supplier_warnings_verified_idx ON public.supplier_warnings(verified);
CREATE INDEX IF NOT EXISTS supplier_warnings_name_idx ON public.supplier_warnings(supplier_name);

-- ==============================================
-- Enable RLS
-- ==============================================

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_warnings ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- RLS Policies - Trips
-- ==============================================

CREATE POLICY "Agency can manage own trips"
  ON public.trips FOR ALL
  USING (agency_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Committee can view all trips"
  ON public.trips FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('welfare_committee', 'admin')
    )
  );

-- ==============================================
-- RLS Policies - RFPs
-- ==============================================

CREATE POLICY "Creator can manage own RFPs"
  ON public.rfps FOR ALL
  USING (created_by = auth.uid());

CREATE POLICY "Agency can view assigned RFPs"
  ON public.rfps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('travel_agency', 'admin')
    )
  );

-- ==============================================
-- RLS Policies - Votings
-- ==============================================

CREATE POLICY "Anyone can view active votings"
  ON public.votings FOR SELECT
  USING (status = 'active' OR created_by = auth.uid());

CREATE POLICY "Creator can manage votings"
  ON public.votings FOR ALL
  USING (created_by = auth.uid());

CREATE POLICY "Committee can create votings"
  ON public.votings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('welfare_committee', 'admin')
    )
  );

-- ==============================================
-- RLS Policies - Votes
-- ==============================================

CREATE POLICY "Users can vote once"
  ON public.votes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own votes"
  ON public.votes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Creator can view all votes"
  ON public.votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.votings
      WHERE id = votes.voting_id AND created_by = auth.uid()
    )
  );

-- ==============================================
-- RLS Policies - Supplier Warnings
-- ==============================================

CREATE POLICY "Anyone can view verified warnings"
  ON public.supplier_warnings FOR SELECT
  USING (verified = TRUE);

CREATE POLICY "Authenticated can create warnings"
  ON public.supplier_warnings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage all warnings"
  ON public.supplier_warnings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================
-- Triggers for updated_at
-- ==============================================

CREATE TRIGGER on_trips_updated
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_rfps_updated
  BEFORE UPDATE ON public.rfps
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================
-- Function: Increment Vote Count
-- ==============================================

CREATE OR REPLACE FUNCTION public.increment_vote_count(
  p_voting_id UUID,
  p_option_id TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.votings
  SET options = (
    SELECT jsonb_agg(
      CASE
        WHEN opt->>'id' = p_option_id
        THEN jsonb_set(opt, '{votes}', to_jsonb((opt->>'votes')::int + 1))
        ELSE opt
      END
    )
    FROM jsonb_array_elements(options) AS opt
  )
  WHERE id = p_voting_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- Grants
-- ==============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.trips TO anon, authenticated;
GRANT ALL ON public.trips TO authenticated;
GRANT SELECT ON public.rfps TO authenticated;
GRANT ALL ON public.rfps TO authenticated;
GRANT SELECT ON public.votings TO anon, authenticated;
GRANT ALL ON public.votings TO authenticated;
GRANT SELECT, INSERT ON public.votes TO authenticated;
GRANT SELECT ON public.supplier_warnings TO anon, authenticated;
GRANT INSERT ON public.supplier_warnings TO authenticated;
