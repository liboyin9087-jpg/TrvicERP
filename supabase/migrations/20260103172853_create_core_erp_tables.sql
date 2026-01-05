/*
  # TrvicERP Core Tables - Complete Travel Industry Architecture
  
  This migration creates the four core tables and supporting structures for a complete
  travel ERP system with atomic component management, dynamic pricing, customer segmentation,
  and competitor analysis.

  ## 1. New Tables

  ### Core Tables
  
  #### `items` - Atomic Travel Components
  Central repository for all bookable/configurable travel elements (attractions, hotels, meals, transport, activities)
  - `id` (uuid, primary key)
  - `item_type` (text) - Type: 'attraction', 'hotel', 'meal', 'transport', 'activity', 'experience'
  - `name` (text) - Item name in default language
  - `name_en` (text) - English name
  - `county` (text) - County/region
  - `city` (text) - City location
  - `tags` (text[]) - Searchable tags array
  - `customer_segments` (text[]) - Target customer types
  - `difficulty_level` (text) - Physical difficulty: 'easy', 'moderate', 'challenging', 'expert'
  - `sustainability_score` (integer) - Eco-rating 0-100
  - `experience_types` (text[]) - Experience categories: 'cultural', 'adventure', 'relaxation', 'culinary', etc.
  - `best_seasons` (text[]) - Optimal seasons: 'spring', 'summer', 'fall', 'winter'
  - `requires_reservation` (boolean) - Advance booking required
  - `reservation_lead_days` (integer) - Minimum days notice
  - `base_price` (decimal) - Base cost
  - `currency` (text) - Currency code
  - `duration_minutes` (integer) - Time required
  - `capacity_min` (integer) - Minimum group size
  - `capacity_max` (integer) - Maximum group size
  - `supplier_id` (uuid) - Reference to supplier
  - `coordinates` (point) - Geographic coordinates
  - `images` (jsonb) - Image URLs and metadata
  - `description` (text) - Detailed description
  - `highlights` (text[]) - Key selling points
  - `inclusions` (text[]) - What's included
  - `exclusions` (text[]) - What's not included
  - `accessibility_features` (text[]) - Accessibility support
  - `is_active` (boolean) - Active status
  - `metadata` (jsonb) - Additional flexible data

  #### `copy_bank` - Marketing Content Repository
  Centralized content management for all marketing materials
  - `id` (uuid, primary key)
  - `template_name` (text) - Template identifier
  - `content_type` (text) - Type: 'headline', 'description', 'pitch', 'email', 'social'
  - `language` (text) - Language code
  - `audience_type` (text) - Target audience: 'tech', 'sales', 'executive', 'general'
  - `tone` (text) - Writing tone: 'professional', 'casual', 'luxury', 'adventure'
  - `subject` (text) - Content subject/title
  - `body` (text) - Main content
  - `variables` (jsonb) - Dynamic placeholders
  - `use_cases` (text[]) - Applicable scenarios
  - `performance_score` (decimal) - Engagement metrics
  - `tags` (text[]) - Searchable tags

  #### `itineraries` - Complete Trip Configurations
  Complete multi-day trip definitions with all components
  - `id` (uuid, primary key)
  - `name` (text) - Itinerary name
  - `code` (text) - Unique product code
  - `customer_segment` (text) - Primary target segment
  - `duration_days` (integer) - Trip duration
  - `base_price` (decimal) - Starting price
  - `currency` (text) - Currency code
  - `min_group_size` (integer) - Minimum participants
  - `max_group_size` (integer) - Maximum participants
  - `status` (text) - Status: 'draft', 'active', 'archived'
  - `description` (text) - Trip description
  - `highlights` (text[]) - Key highlights
  - `included_items` (text[]) - General inclusions
  - `excluded_items` (text[]) - General exclusions
  - `difficulty_level` (text) - Overall difficulty
  - `sustainability_score` (integer) - Overall eco-rating
  - `best_seasons` (text[]) - Recommended seasons
  - `images` (jsonb) - Marketing images
  - `metadata` (jsonb) - Additional data

  #### `itinerary_items_junction` - Many-to-Many Relationships
  Links itineraries with specific items in a scheduled sequence
  - `id` (uuid, primary key)
  - `itinerary_id` (uuid) - Reference to itinerary
  - `item_id` (uuid) - Reference to item
  - `day_number` (integer) - Which day of trip
  - `time_slot` (text) - Time: 'morning', 'afternoon', 'evening', 'full_day'
  - `start_time` (time) - Scheduled start
  - `end_time` (time) - Scheduled end
  - `sequence_order` (integer) - Order within day
  - `is_optional` (boolean) - Optional vs required
  - `notes` (text) - Special instructions
  - `price_override` (decimal) - Custom pricing

  ### Supporting Tables

  #### `customer_segments` - Customer Type Definitions
  - `id` (uuid, primary key)
  - `segment_code` (text) - Unique code
  - `name` (text) - Segment name
  - `description` (text) - Detailed description
  - `age_range_min` (integer) - Minimum age
  - `age_range_max` (integer) - Maximum age
  - `preferred_difficulty` (text[]) - Preferred difficulty levels
  - `preferred_experiences` (text[]) - Preferred experience types
  - `budget_range` (text) - Budget category: 'budget', 'mid-range', 'luxury', 'ultra-luxury'
  - `travel_style` (text[]) - Travel preferences
  - `interests` (text[]) - Primary interests
  - `accessibility_needs` (text[]) - Special requirements
  - `matching_tags` (text[]) - Auto-match tags

  #### `competitor_hotels` - Competitor Analysis Data
  - `id` (uuid, primary key)
  - `hotel_name` (text) - Hotel name
  - `location` (text) - Location
  - `city` (text) - City
  - `star_rating` (decimal) - Star rating
  - `year_built` (integer) - Construction year
  - `year_renovated` (integer) - Last renovation
  - `distance_to_station_km` (decimal) - Distance to transport
  - `room_size_sqm` (decimal) - Average room size
  - `tags` (text[]) - Feature tags
  - `pros` (text[]) - Advantages
  - `cons` (text[]) - Disadvantages
  - `typical_price_min` (decimal) - Min price
  - `typical_price_max` (decimal) - Max price
  - `hidden_costs` (text[]) - Additional fees
  - `verified` (boolean) - Data verified
  - `last_updated` (timestamptz) - Last update

  #### `pricing_rules` - Dynamic Pricing Configuration
  - `id` (uuid, primary key)
  - `rule_name` (text) - Rule identifier
  - `rule_type` (text) - Type: 'seasonal', 'group_size', 'advance_booking', 'day_of_week'
  - `conditions` (jsonb) - Rule conditions
  - `adjustment_type` (text) - Type: 'percentage', 'fixed_amount'
  - `adjustment_value` (decimal) - Adjustment amount
  - `priority` (integer) - Rule precedence
  - `is_active` (boolean) - Active status
  - `valid_from` (date) - Start date
  - `valid_to` (date) - End date

  #### `user_roles` - RBAC Role Definitions
  - `id` (uuid, primary key)
  - `role_name` (text) - Role identifier
  - `display_name` (text) - Display name
  - `permissions` (jsonb) - Permission array
  - `is_system_role` (boolean) - Built-in vs custom

  ## 2. Security
  - Enable RLS on all tables
  - Create policies for authenticated users and admins
  - Implement role-based access control

  ## 3. Indexes
  - Add indexes on foreign keys
  - Add indexes on commonly queried fields
  - Add full-text search indexes

  ## 4. Functions & Triggers
  - Auto-update timestamps
  - Generate unique codes
  - Calculate aggregate scores
*/

-- =====================================================
-- 1. Create Core Tables
-- =====================================================

-- Items Table: Atomic Travel Components
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL CHECK (item_type IN ('attraction', 'hotel', 'meal', 'transport', 'activity', 'experience')),
  name text NOT NULL,
  name_en text,
  county text,
  city text,
  tags text[] DEFAULT '{}',
  customer_segments text[] DEFAULT '{}',
  difficulty_level text CHECK (difficulty_level IN ('easy', 'moderate', 'challenging', 'expert')),
  sustainability_score integer CHECK (sustainability_score >= 0 AND sustainability_score <= 100),
  experience_types text[] DEFAULT '{}',
  best_seasons text[] DEFAULT '{}',
  requires_reservation boolean DEFAULT false,
  reservation_lead_days integer DEFAULT 0,
  base_price decimal(10,2),
  currency text DEFAULT 'TWD',
  duration_minutes integer,
  capacity_min integer DEFAULT 1,
  capacity_max integer,
  supplier_id uuid REFERENCES suppliers(id),
  coordinates point,
  images jsonb DEFAULT '[]',
  description text,
  highlights text[] DEFAULT '{}',
  inclusions text[] DEFAULT '{}',
  exclusions text[] DEFAULT '{}',
  accessibility_features text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Copy Bank Table: Marketing Content Repository
CREATE TABLE IF NOT EXISTS copy_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('headline', 'description', 'pitch', 'email', 'social', 'sms')),
  language text DEFAULT 'zh' CHECK (language IN ('zh', 'en', 'ja', 'ko')),
  audience_type text CHECK (audience_type IN ('tech', 'sales', 'executive', 'general', 'family', 'couples')),
  tone text CHECK (tone IN ('professional', 'casual', 'luxury', 'adventure', 'friendly', 'formal')),
  subject text,
  body text NOT NULL,
  variables jsonb DEFAULT '{}',
  use_cases text[] DEFAULT '{}',
  performance_score decimal(5,2) DEFAULT 0,
  tags text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Itineraries Table: Complete Trip Configurations
CREATE TABLE IF NOT EXISTS itineraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  customer_segment text,
  duration_days integer NOT NULL CHECK (duration_days > 0),
  base_price decimal(10,2) NOT NULL,
  currency text DEFAULT 'TWD',
  min_group_size integer DEFAULT 1,
  max_group_size integer,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  description text,
  highlights text[] DEFAULT '{}',
  included_items text[] DEFAULT '{}',
  excluded_items text[] DEFAULT '{}',
  difficulty_level text CHECK (difficulty_level IN ('easy', 'moderate', 'challenging', 'expert')),
  sustainability_score integer CHECK (sustainability_score >= 0 AND sustainability_score <= 100),
  best_seasons text[] DEFAULT '{}',
  images jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Junction Table: Itinerary-Item Relationships
CREATE TABLE IF NOT EXISTS itinerary_items_junction (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id uuid NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  day_number integer NOT NULL CHECK (day_number > 0),
  time_slot text CHECK (time_slot IN ('morning', 'afternoon', 'evening', 'full_day')),
  start_time time,
  end_time time,
  sequence_order integer NOT NULL DEFAULT 0,
  is_optional boolean DEFAULT false,
  notes text,
  price_override decimal(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(itinerary_id, day_number, sequence_order)
);

-- =====================================================
-- 2. Create Supporting Tables
-- =====================================================

-- Customer Segments Table
CREATE TABLE IF NOT EXISTS customer_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  age_range_min integer,
  age_range_max integer,
  preferred_difficulty text[] DEFAULT '{}',
  preferred_experiences text[] DEFAULT '{}',
  budget_range text CHECK (budget_range IN ('budget', 'mid-range', 'luxury', 'ultra-luxury')),
  travel_style text[] DEFAULT '{}',
  interests text[] DEFAULT '{}',
  accessibility_needs text[] DEFAULT '{}',
  matching_tags text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Competitor Hotels Table
CREATE TABLE IF NOT EXISTS competitor_hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_name text NOT NULL,
  location text NOT NULL,
  city text,
  star_rating decimal(2,1) CHECK (star_rating >= 0 AND star_rating <= 5),
  year_built integer,
  year_renovated integer,
  distance_to_station_km decimal(5,2),
  room_size_sqm decimal(6,2),
  tags text[] DEFAULT '{}',
  pros text[] DEFAULT '{}',
  cons text[] DEFAULT '{}',
  typical_price_min decimal(10,2),
  typical_price_max decimal(10,2),
  hidden_costs text[] DEFAULT '{}',
  verified boolean DEFAULT false,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Pricing Rules Table
CREATE TABLE IF NOT EXISTS pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  rule_type text NOT NULL CHECK (rule_type IN ('seasonal', 'group_size', 'advance_booking', 'day_of_week', 'special_event')),
  conditions jsonb NOT NULL,
  adjustment_type text NOT NULL CHECK (adjustment_type IN ('percentage', 'fixed_amount')),
  adjustment_value decimal(10,2) NOT NULL,
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  valid_from date,
  valid_to date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Roles Table (RBAC)
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  permissions jsonb DEFAULT '{}',
  is_system_role boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 3. Create Indexes
-- =====================================================

-- Items indexes
CREATE INDEX IF NOT EXISTS idx_items_type ON items(item_type);
CREATE INDEX IF NOT EXISTS idx_items_city ON items(city);
CREATE INDEX IF NOT EXISTS idx_items_customer_segments ON items USING GIN(customer_segments);
CREATE INDEX IF NOT EXISTS idx_items_tags ON items USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_items_active ON items(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_items_supplier ON items(supplier_id);

-- Copy bank indexes
CREATE INDEX IF NOT EXISTS idx_copy_bank_type ON copy_bank(content_type);
CREATE INDEX IF NOT EXISTS idx_copy_bank_language ON copy_bank(language);
CREATE INDEX IF NOT EXISTS idx_copy_bank_tags ON copy_bank USING GIN(tags);

-- Itineraries indexes
CREATE INDEX IF NOT EXISTS idx_itineraries_code ON itineraries(code);
CREATE INDEX IF NOT EXISTS idx_itineraries_segment ON itineraries(customer_segment);
CREATE INDEX IF NOT EXISTS idx_itineraries_status ON itineraries(status);

-- Junction indexes
CREATE INDEX IF NOT EXISTS idx_junction_itinerary ON itinerary_items_junction(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_junction_item ON itinerary_items_junction(item_id);
CREATE INDEX IF NOT EXISTS idx_junction_day ON itinerary_items_junction(itinerary_id, day_number);

-- Customer segments indexes
CREATE INDEX IF NOT EXISTS idx_segments_code ON customer_segments(segment_code);
CREATE INDEX IF NOT EXISTS idx_segments_active ON customer_segments(is_active) WHERE is_active = true;

-- Competitor hotels indexes
CREATE INDEX IF NOT EXISTS idx_competitor_city ON competitor_hotels(city);
CREATE INDEX IF NOT EXISTS idx_competitor_rating ON competitor_hotels(star_rating);

-- Pricing rules indexes
CREATE INDEX IF NOT EXISTS idx_pricing_rules_type ON pricing_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(is_active) WHERE is_active = true;

-- =====================================================
-- 4. Enable Row Level Security
-- =====================================================

ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE copy_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items_junction ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. Create RLS Policies
-- =====================================================

-- Items policies
CREATE POLICY "Anyone can view active items"
  ON items FOR SELECT
  USING (
    is_active = true OR 
    (SELECT auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  );

CREATE POLICY "Admins can manage items"
  ON items FOR ALL
  TO authenticated
  USING ((SELECT auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((SELECT auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- Copy bank policies
CREATE POLICY "Authenticated users can view copy bank"
  ON copy_bank FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage copy bank"
  ON copy_bank FOR ALL
  TO authenticated
  USING ((SELECT auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((SELECT auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- Itineraries policies
CREATE POLICY "Anyone can view active itineraries"
  ON itineraries FOR SELECT
  USING (
    status = 'active' OR 
    (SELECT auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  );

CREATE POLICY "Admins can manage itineraries"
  ON itineraries FOR ALL
  TO authenticated
  USING ((SELECT auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((SELECT auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- Junction table policies
CREATE POLICY "Anyone can view junction for active itineraries"
  ON itinerary_items_junction FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM itineraries 
      WHERE itineraries.id = itinerary_items_junction.itinerary_id 
      AND itineraries.status = 'active'
    ) OR 
    (SELECT auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  );

CREATE POLICY "Admins can manage junction"
  ON itinerary_items_junction FOR ALL
  TO authenticated
  USING ((SELECT auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((SELECT auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- Customer segments policies
CREATE POLICY "Anyone can view customer segments"
  ON customer_segments FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage segments"
  ON customer_segments FOR ALL
  TO authenticated
  USING ((SELECT auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((SELECT auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- Competitor hotels policies
CREATE POLICY "Authenticated users can view competitors"
  ON competitor_hotels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage competitors"
  ON competitor_hotels FOR ALL
  TO authenticated
  USING ((SELECT auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((SELECT auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- Pricing rules policies
CREATE POLICY "Authenticated users can view pricing rules"
  ON pricing_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage pricing rules"
  ON pricing_rules FOR ALL
  TO authenticated
  USING ((SELECT auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((SELECT auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- User roles policies
CREATE POLICY "Authenticated users can view roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage roles"
  ON user_roles FOR ALL
  TO authenticated
  USING ((SELECT auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin')
  WITH CHECK ((SELECT auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin');

-- =====================================================
-- 6. Create Triggers
-- =====================================================

-- Auto-update timestamps
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_copy_bank_updated_at BEFORE UPDATE ON copy_bank
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itineraries_updated_at BEFORE UPDATE ON itineraries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_junction_updated_at BEFORE UPDATE ON itinerary_items_junction
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_segments_updated_at BEFORE UPDATE ON customer_segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at BEFORE UPDATE ON pricing_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. Insert Default Customer Segments (10 Types)
-- =====================================================

INSERT INTO customer_segments (segment_code, name, description, age_range_min, age_range_max, preferred_difficulty, preferred_experiences, budget_range, travel_style, interests, matching_tags) VALUES
('LUXURY_COUPLES', '精品情侶遊', '追求奢華體驗的情侶旅客，偏好高品質住宿與私密行程', 25, 55, ARRAY['easy', 'moderate'], ARRAY['luxury', 'relaxation', 'culinary', 'cultural'], 'luxury', ARRAY['romance', 'privacy', 'fine-dining', 'spa'], ARRAY['gourmet', 'wine', 'romance', 'photography'], ARRAY['luxury', 'couples', 'romantic', 'premium']),

('ADVENTURE_YOUTH', '冒險青年團', '18-35歲熱愛刺激與探索的年輕旅客', 18, 35, ARRAY['challenging', 'expert'], ARRAY['adventure', 'outdoor', 'extreme'], 'budget', ARRAY['backpacking', 'active', 'social'], ARRAY['hiking', 'water-sports', 'extreme-sports', 'nightlife'], ARRAY['adventure', 'active', 'outdoor', 'backpacker']),

('FAMILY_FRIENDLY', '親子家庭遊', '帶小孩的家庭旅客，需要安全且寓教於樂的行程', 0, 60, ARRAY['easy', 'moderate'], ARRAY['educational', 'family', 'cultural'], 'mid-range', ARRAY['family', 'educational', 'safe'], ARRAY['theme-parks', 'museums', 'nature', 'interactive'], ARRAY['family', 'kids', 'safe', 'educational']),

('SENIOR_LEISURE', '銀髮樂活團', '55歲以上追求舒適與文化深度的旅客', 55, 85, ARRAY['easy'], ARRAY['cultural', 'relaxation', 'scenic'], 'mid-range', ARRAY['comfortable', 'cultural', 'slow-paced'], ARRAY['gardens', 'temples', 'hot-springs', 'local-culture'], ARRAY['senior', 'comfortable', 'cultural', 'accessible']),

('BUSINESS_BLEISURE', '商務混搭型', '結合商務與休閒的專業人士', 30, 50, ARRAY['easy', 'moderate'], ARRAY['urban', 'culinary', 'cultural'], 'luxury', ARRAY['efficient', 'flexible', 'urban'], ARRAY['networking', 'local-cuisine', 'city-tours'], ARRAY['business', 'flexible', 'urban', 'wifi']),

('ECO_CONSCIOUS', '永續旅行者', '重視環保與永續的意識型旅客', 20, 50, ARRAY['moderate', 'challenging'], ARRAY['eco-tourism', 'nature', 'cultural'], 'mid-range', ARRAY['sustainable', 'responsible', 'authentic'], ARRAY['conservation', 'local-community', 'organic'], ARRAY['eco', 'sustainable', 'green', 'organic']),

('CULTURAL_EXPLORER', '文化深度遊', '追求深度文化體驗的知識型旅客', 25, 65, ARRAY['moderate'], ARRAY['cultural', 'historical', 'culinary'], 'mid-range', ARRAY['authentic', 'educational', 'immersive'], ARRAY['history', 'art', 'local-traditions', 'language'], ARRAY['cultural', 'heritage', 'authentic', 'local']),

('WELLNESS_SEEKER', '身心靈療癒', '追求健康、療癒與自我提升的旅客', 30, 60, ARRAY['easy', 'moderate'], ARRAY['wellness', 'relaxation', 'yoga'], 'luxury', ARRAY['mindful', 'healthy', 'peaceful'], ARRAY['yoga', 'meditation', 'spa', 'organic-food'], ARRAY['wellness', 'spa', 'yoga', 'mindfulness']),

('PHOTOGRAPHY_ENTHUSIAST', '攝影愛好者', '專注於捕捉絕美景色的攝影玩家', 25, 55, ARRAY['moderate', 'challenging'], ARRAY['scenic', 'nature', 'cultural'], 'mid-range', ARRAY['flexible', 'early-starts', 'off-beaten-path'], ARRAY['landscapes', 'wildlife', 'architecture', 'golden-hour'], ARRAY['photography', 'scenic', 'sunrise', 'instagram']),

('FOODIE_TRAVELER', '美食探索家', '以品嚐當地美食為主要目的的旅客', 25, 60, ARRAY['easy', 'moderate'], ARRAY['culinary', 'cultural', 'market'], 'mid-range', ARRAY['gastronomic', 'local', 'authentic'], ARRAY['street-food', 'fine-dining', 'cooking-class', 'wine-tasting'], ARRAY['foodie', 'culinary', 'gourmet', 'local-cuisine'])
ON CONFLICT (segment_code) DO NOTHING;

-- =====================================================
-- 8. Insert Default User Roles (RBAC)
-- =====================================================

INSERT INTO user_roles (role_name, display_name, permissions, is_system_role) VALUES
('super_admin', 'Super Administrator', '{"all": true}'::jsonb, true),
('admin', 'Administrator', '{"read": true, "write": true, "delete": true, "manage_users": true}'::jsonb, true),
('product_manager', 'Product Manager', '{"read": true, "write": true, "manage_products": true, "manage_pricing": true}'::jsonb, true),
('sales_agent', 'Sales Agent', '{"read": true, "create_bookings": true, "view_pricing": true}'::jsonb, true),
('tour_guide', 'Tour Guide', '{"read": true, "view_itineraries": true, "update_tour_status": true}'::jsonb, true),
('customer', 'Customer', '{"read": true, "create_bookings": true, "view_own_bookings": true}'::jsonb, true)
ON CONFLICT (role_name) DO NOTHING;