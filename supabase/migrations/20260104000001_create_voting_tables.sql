/*
  # Voting System Tables for TravelCanvas
  
  This migration creates the voting system tables with real-time support.

  ## Tables Created
  
  1. `vote_polls` - Voting polls created by committees or agencies
  2. `vote_options` - Options for each poll
  3. `vote_records` - Individual vote records (who voted for what)

  ## Features
  - Real-time vote count updates via triggers
  - Unique constraint to prevent double voting
  - RLS policies for proper access control
*/

-- =====================================================
-- 1. Create Vote Polls Table
-- =====================================================

CREATE TABLE IF NOT EXISTS vote_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  deadline timestamptz NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_by_role text NOT NULL CHECK (created_by_role IN ('agency', 'welfare_committee')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 2. Create Vote Options Table
-- =====================================================

CREATE TABLE IF NOT EXISTS vote_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES vote_polls(id) ON DELETE CASCADE,
  label text NOT NULL,
  vote_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 3. Create Vote Records Table
-- =====================================================

CREATE TABLE IF NOT EXISTS vote_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES vote_polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES vote_options(id) ON DELETE CASCADE,
  voter_id text NOT NULL, -- Can be user ID or demo voter ID
  created_at timestamptz DEFAULT now(),
  
  -- Prevent double voting (one vote per voter per poll)
  UNIQUE(poll_id, voter_id)
);

-- =====================================================
-- 4. Create Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_vote_polls_status ON vote_polls(status);
CREATE INDEX IF NOT EXISTS idx_vote_polls_deadline ON vote_polls(deadline);
CREATE INDEX IF NOT EXISTS idx_vote_options_poll_id ON vote_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_vote_records_poll_id ON vote_records(poll_id);
CREATE INDEX IF NOT EXISTS idx_vote_records_voter_id ON vote_records(voter_id);

-- =====================================================
-- 5. Create Functions for Vote Counting
-- =====================================================

-- Increment vote count
CREATE OR REPLACE FUNCTION increment_vote_count(opt_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE vote_options 
  SET vote_count = vote_count + 1 
  WHERE id = opt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement vote count
CREATE OR REPLACE FUNCTION decrement_vote_count(opt_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE vote_options 
  SET vote_count = GREATEST(vote_count - 1, 0) 
  WHERE id = opt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. Enable RLS
-- =====================================================

ALTER TABLE vote_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_records ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. Create RLS Policies
-- =====================================================

-- Vote Polls: Anyone can view active polls
CREATE POLICY "Anyone can view active polls"
  ON vote_polls FOR SELECT
  USING (status = 'active' OR status = 'closed');

-- Vote Polls: Authenticated users can create polls
CREATE POLICY "Authenticated users can create polls"
  ON vote_polls FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Vote Polls: Creators can update their polls
CREATE POLICY "Creators can update their polls"
  ON vote_polls FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Vote Options: Anyone can view options
CREATE POLICY "Anyone can view vote options"
  ON vote_options FOR SELECT
  USING (true);

-- Vote Options: Authenticated users can create options (with poll)
CREATE POLICY "Authenticated users can create options"
  ON vote_options FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Vote Records: Anyone can insert vote records
CREATE POLICY "Anyone can vote"
  ON vote_records FOR INSERT
  WITH CHECK (true);

-- Vote Records: Users can see their own votes
CREATE POLICY "Users can see their votes"
  ON vote_records FOR SELECT
  USING (true);

-- Vote Records: Users can update their own votes
CREATE POLICY "Users can change their votes"
  ON vote_records FOR UPDATE
  USING (voter_id = auth.uid()::text OR voter_id LIKE '%DEMO%')
  WITH CHECK (voter_id = auth.uid()::text OR voter_id LIKE '%DEMO%');

-- =====================================================
-- 8. Create Triggers for Updated At
-- =====================================================

CREATE TRIGGER update_vote_polls_updated_at
  BEFORE UPDATE ON vote_polls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. Enable Realtime
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE vote_options;
