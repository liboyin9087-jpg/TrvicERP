/*
  # RFP and Warning Database Tables for TravelCanvas
  
  This migration creates:
  1. RFP (Request for Proposal) tables for welfare committees
  2. Quote submission tables for agencies
  3. Warning/Anti-fraud database for supplier reviews

  ## RFP Flow:
  1. Welfare committee creates RFP with requirements
  2. Agencies view open RFPs and submit quotes
  3. Committee compares quotes and awards contract
  4. Employees vote on final options

  ## Warning Database:
  - Crowdsourced supplier reviews
  - Trust scoring system
  - Verification workflow
*/

-- =====================================================
-- 1. RFPs (Request for Proposals)
-- =====================================================

CREATE TABLE IF NOT EXISTS rfps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_person text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  headcount integer NOT NULL CHECK (headcount > 0),
  budget_min numeric(12, 2) NOT NULL,
  budget_max numeric(12, 2) NOT NULL,
  destination text NOT NULL,
  duration_days integer NOT NULL CHECK (duration_days > 0),
  departure_date date,
  special_requirements text[] DEFAULT '{}',
  custom_requirements text,
  deadline date NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'reviewing', 'awarded', 'cancelled')),
  share_code text UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_by uuid REFERENCES auth.users(id),
  awarded_to uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_budget CHECK (budget_max >= budget_min)
);

-- =====================================================
-- 2. Quotes (Agency Responses to RFPs)
-- =====================================================

CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfp_id uuid NOT NULL REFERENCES rfps(id) ON DELETE CASCADE,
  agency_id uuid REFERENCES auth.users(id),
  agency_name text NOT NULL,
  price_per_person numeric(12, 2) NOT NULL,
  total_price numeric(14, 2) NOT NULL,
  features text[] DEFAULT '{}',
  itinerary_summary text,
  detailed_itinerary jsonb,
  valid_until date NOT NULL,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'accepted', 'rejected', 'withdrawn')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 3. Warning Reports (Anti-Fraud Database)
-- =====================================================

CREATE TABLE IF NOT EXISTS warning_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name text NOT NULL,
  supplier_type text NOT NULL CHECK (supplier_type IN ('hotel', 'restaurant', 'transport', 'attraction', 'guide', 'other')),
  location text,
  city text,
  country text DEFAULT 'Japan',
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  issue_title text NOT NULL,
  issue_description text NOT NULL,
  incident_date date,
  evidence_urls text[] DEFAULT '{}',
  reported_by uuid REFERENCES auth.users(id),
  reporter_agency text,
  report_count integer NOT NULL DEFAULT 1,
  upvotes integer NOT NULL DEFAULT 0,
  downvotes integer NOT NULL DEFAULT 0,
  trust_score numeric(3, 2) DEFAULT 0.5,
  verified boolean NOT NULL DEFAULT false,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  resolution_status text NOT NULL DEFAULT 'open' CHECK (resolution_status IN ('open', 'investigating', 'resolved', 'dismissed')),
  resolution_notes text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 4. Warning Votes (Upvote/Downvote Tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS warning_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warning_id uuid NOT NULL REFERENCES warning_reports(id) ON DELETE CASCADE,
  voter_id text NOT NULL, -- Can be user ID or anonymous identifier
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(warning_id, voter_id)
);

-- =====================================================
-- 5. Create Indexes
-- =====================================================

-- RFPs
CREATE INDEX IF NOT EXISTS idx_rfps_status ON rfps(status);
CREATE INDEX IF NOT EXISTS idx_rfps_deadline ON rfps(deadline);
CREATE INDEX IF NOT EXISTS idx_rfps_destination ON rfps(destination);
CREATE INDEX IF NOT EXISTS idx_rfps_share_code ON rfps(share_code);
CREATE INDEX IF NOT EXISTS idx_rfps_created_by ON rfps(created_by);

-- Quotes
CREATE INDEX IF NOT EXISTS idx_quotes_rfp_id ON quotes(rfp_id);
CREATE INDEX IF NOT EXISTS idx_quotes_agency_id ON quotes(agency_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

-- Warnings
CREATE INDEX IF NOT EXISTS idx_warnings_supplier_type ON warning_reports(supplier_type);
CREATE INDEX IF NOT EXISTS idx_warnings_severity ON warning_reports(severity);
CREATE INDEX IF NOT EXISTS idx_warnings_location ON warning_reports(location);
CREATE INDEX IF NOT EXISTS idx_warnings_verified ON warning_reports(verified);
CREATE INDEX IF NOT EXISTS idx_warnings_resolution ON warning_reports(resolution_status);

-- Full text search for warnings
CREATE INDEX IF NOT EXISTS idx_warnings_fts ON warning_reports 
  USING gin(to_tsvector('simple', supplier_name || ' ' || issue_title || ' ' || COALESCE(issue_description, '')));

-- =====================================================
-- 6. Functions
-- =====================================================

-- Increment warning report count (when same supplier is reported again)
CREATE OR REPLACE FUNCTION increment_warning_count(warning_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE warning_reports 
  SET report_count = report_count + 1,
      updated_at = now()
  WHERE id = warning_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update warning trust score based on votes
CREATE OR REPLACE FUNCTION update_warning_trust_score()
RETURNS trigger AS $$
DECLARE
  total_votes integer;
  positive_votes integer;
BEGIN
  SELECT 
    COUNT(*), 
    COUNT(*) FILTER (WHERE vote_type = 'up')
  INTO total_votes, positive_votes
  FROM warning_votes
  WHERE warning_id = COALESCE(NEW.warning_id, OLD.warning_id);
  
  UPDATE warning_reports
  SET 
    upvotes = positive_votes,
    downvotes = total_votes - positive_votes,
    trust_score = CASE 
      WHEN total_votes = 0 THEN 0.5
      ELSE positive_votes::numeric / total_votes
    END,
    updated_at = now()
  WHERE id = COALESCE(NEW.warning_id, OLD.warning_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. Triggers
-- =====================================================

CREATE TRIGGER update_rfps_updated_at
  BEFORE UPDATE ON rfps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warnings_updated_at
  BEFORE UPDATE ON warning_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warning_trust_on_vote
  AFTER INSERT OR UPDATE OR DELETE ON warning_votes
  FOR EACH ROW EXECUTE FUNCTION update_warning_trust_score();

-- =====================================================
-- 8. Enable RLS
-- =====================================================

ALTER TABLE rfps ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE warning_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE warning_votes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9. RLS Policies
-- =====================================================

-- RFPs: Open RFPs are visible to all authenticated users
CREATE POLICY "View open RFPs"
  ON rfps FOR SELECT
  TO authenticated
  USING (status = 'open' OR created_by = auth.uid());

-- RFPs: View by share code (for external access)
CREATE POLICY "View RFP by share code"
  ON rfps FOR SELECT
  USING (share_code IS NOT NULL AND status = 'open');

-- RFPs: Creators can manage their RFPs
CREATE POLICY "Manage own RFPs"
  ON rfps FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Quotes: Agencies can submit quotes
CREATE POLICY "Submit quotes"
  ON quotes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Quotes: View quotes for own RFPs or own quotes
CREATE POLICY "View relevant quotes"
  ON quotes FOR SELECT
  TO authenticated
  USING (
    agency_id = auth.uid() OR 
    rfp_id IN (SELECT id FROM rfps WHERE created_by = auth.uid())
  );

-- Warnings: Everyone can view verified warnings
CREATE POLICY "View verified warnings"
  ON warning_reports FOR SELECT
  USING (verified = true OR resolution_status != 'dismissed');

-- Warnings: Authenticated users can submit warnings
CREATE POLICY "Submit warnings"
  ON warning_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Warning votes: Anyone can vote
CREATE POLICY "Vote on warnings"
  ON warning_votes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "View own votes"
  ON warning_votes FOR SELECT
  USING (true);

-- =====================================================
-- 10. Enable Realtime for Quotes
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE quotes;
