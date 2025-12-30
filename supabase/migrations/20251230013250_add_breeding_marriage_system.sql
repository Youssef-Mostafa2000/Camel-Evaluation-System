/*
  # Camel Breeding/Marriage System

  ## Overview
  Complete breeding and marriage system for registered users to create camel profiles,
  search for breeding matches, and communicate with other owners.

  ## 1. New Tables

  ### camel_profiles
  Stores complete camel information for breeding/marriage purposes.
  
  Columns:
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - References auth.users (owner)
  - `name` (text) - Camel name
  - `sex` (text) - Male or Female
  - `age` (integer) - Age in years
  - `breed_type` (text) - Breed classification
  - `color` (text) - Camel color
  - `location_province` (text) - Saudi Arabia province
  - `location_city` (text) - City name
  - `location_coordinates` (jsonb) - Lat/lng for map view
  - `description` (text) - Optional description
  - `pedigree_info` (jsonb) - Ancestry information
  - `breeding_history` (jsonb) - Previous breeding records
  - `health_certifications` (jsonb) - Health documents
  - `primary_image_url` (text) - Main camel image
  - `additional_images` (jsonb) - Array of additional image URLs
  - `detection_id` (uuid) - References camel_detections for auto-analyzed scores
  - `head_beauty_score` (numeric) - Manually set or from detection
  - `neck_beauty_score` (numeric) - Manually set or from detection
  - `body_hump_limbs_score` (numeric) - Manually set or from detection
  - `body_size_score` (numeric) - Manually set or from detection
  - `overall_score` (numeric) - Calculated overall score
  - `is_available_for_breeding` (boolean) - Availability status
  - `owner_contact_phone` (text) - Contact phone number
  - `owner_contact_email` (text) - Contact email
  - `owner_contact_whatsapp` (text) - WhatsApp number
  - `view_count` (integer) - Profile views
  - `inquiry_count` (integer) - Number of inquiries received
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### breeding_inquiries
  Tracks breeding requests between users.
  
  Columns:
  - `id` (uuid, primary key) - Unique identifier
  - `from_user_id` (uuid) - User sending inquiry
  - `to_user_id` (uuid) - Camel owner receiving inquiry
  - `from_camel_id` (uuid) - Inquirer's camel
  - `to_camel_id` (uuid) - Target camel
  - `message` (text) - Inquiry message
  - `status` (text) - 'pending', 'accepted', 'rejected', 'withdrawn'
  - `compatibility_score` (numeric) - Auto-calculated compatibility
  - `created_at` (timestamptz) - When inquiry was sent
  - `updated_at` (timestamptz) - Last status change

  ### camel_favorites
  User's favorite/wishlist camels.
  
  Columns:
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - User who favorited
  - `camel_id` (uuid) - Favorited camel profile
  - `notes` (text) - Optional user notes
  - `created_at` (timestamptz) - When favorited

  ### messages
  In-app messaging between users.
  
  Columns:
  - `id` (uuid, primary key) - Unique identifier
  - `from_user_id` (uuid) - Sender
  - `to_user_id` (uuid) - Recipient
  - `inquiry_id` (uuid, nullable) - Related inquiry if applicable
  - `subject` (text) - Message subject
  - `body` (text) - Message content
  - `is_read` (boolean) - Read status
  - `created_at` (timestamptz) - Send timestamp

  ### notifications
  System notifications for users.
  
  Columns:
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - User receiving notification
  - `type` (text) - 'inquiry', 'message', 'favorite', 'system'
  - `title` (text) - Notification title
  - `body` (text) - Notification content
  - `link` (text) - Action link
  - `is_read` (boolean) - Read status
  - `created_at` (timestamptz) - Creation timestamp

  ## 2. Security
  
  All tables have RLS enabled with appropriate policies for user access control.
*/

-- =====================================================================
-- 1. CREATE CAMEL_PROFILES TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS camel_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  sex text CHECK (sex IN ('male', 'female')) NOT NULL,
  age integer CHECK (age > 0 AND age <= 30),
  breed_type text,
  color text,
  location_province text,
  location_city text,
  location_coordinates jsonb DEFAULT '{}'::jsonb,
  description text,
  pedigree_info jsonb DEFAULT '{}'::jsonb,
  breeding_history jsonb DEFAULT '[]'::jsonb,
  health_certifications jsonb DEFAULT '[]'::jsonb,
  primary_image_url text,
  additional_images jsonb DEFAULT '[]'::jsonb,
  detection_id uuid REFERENCES camel_detections(id) ON DELETE SET NULL,
  head_beauty_score numeric(5,2) CHECK (head_beauty_score >= 0 AND head_beauty_score <= 100),
  neck_beauty_score numeric(5,2) CHECK (neck_beauty_score >= 0 AND neck_beauty_score <= 100),
  body_hump_limbs_score numeric(5,2) CHECK (body_hump_limbs_score >= 0 AND body_hump_limbs_score <= 100),
  body_size_score numeric(5,2) CHECK (body_size_score >= 0 AND body_size_score <= 100),
  overall_score numeric(5,2) CHECK (overall_score >= 0 AND overall_score <= 100),
  is_available_for_breeding boolean DEFAULT true NOT NULL,
  owner_contact_phone text,
  owner_contact_email text,
  owner_contact_whatsapp text,
  view_count integer DEFAULT 0 NOT NULL,
  inquiry_count integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_camel_profiles_user_id ON camel_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_camel_profiles_sex ON camel_profiles(sex);
CREATE INDEX IF NOT EXISTS idx_camel_profiles_breed_type ON camel_profiles(breed_type);
CREATE INDEX IF NOT EXISTS idx_camel_profiles_location_province ON camel_profiles(location_province);
CREATE INDEX IF NOT EXISTS idx_camel_profiles_overall_score ON camel_profiles(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_camel_profiles_available ON camel_profiles(is_available_for_breeding);
CREATE INDEX IF NOT EXISTS idx_camel_profiles_created_at ON camel_profiles(created_at DESC);

-- Enable RLS
ALTER TABLE camel_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for camel_profiles

-- Anyone can view available camel profiles
CREATE POLICY "Anyone can view available camel profiles"
  ON camel_profiles FOR SELECT
  TO authenticated
  USING (is_available_for_breeding = true);

-- Users can view their own camel profiles
CREATE POLICY "Users can view own camel profiles"
  ON camel_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own camel profiles
CREATE POLICY "Users can create own camel profiles"
  ON camel_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own camel profiles
CREATE POLICY "Users can update own camel profiles"
  ON camel_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own camel profiles
CREATE POLICY "Users can delete own camel profiles"
  ON camel_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================================
-- 2. CREATE BREEDING_INQUIRIES TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS breeding_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  to_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  from_camel_id uuid REFERENCES camel_profiles(id) ON DELETE CASCADE NOT NULL,
  to_camel_id uuid REFERENCES camel_profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  status text CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')) DEFAULT 'pending' NOT NULL,
  compatibility_score numeric(5,2) CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_breeding_inquiries_from_user ON breeding_inquiries(from_user_id);
CREATE INDEX IF NOT EXISTS idx_breeding_inquiries_to_user ON breeding_inquiries(to_user_id);
CREATE INDEX IF NOT EXISTS idx_breeding_inquiries_status ON breeding_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_breeding_inquiries_created_at ON breeding_inquiries(created_at DESC);

-- Enable RLS
ALTER TABLE breeding_inquiries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for breeding_inquiries

-- Users can view inquiries they sent
CREATE POLICY "Users can view inquiries they sent"
  ON breeding_inquiries FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id);

-- Users can view inquiries they received
CREATE POLICY "Users can view inquiries they received"
  ON breeding_inquiries FOR SELECT
  TO authenticated
  USING (auth.uid() = to_user_id);

-- Users can create inquiries
CREATE POLICY "Users can create inquiries"
  ON breeding_inquiries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

-- Users can update inquiries they sent (withdraw)
CREATE POLICY "Users can update inquiries they sent"
  ON breeding_inquiries FOR UPDATE
  TO authenticated
  USING (auth.uid() = from_user_id)
  WITH CHECK (auth.uid() = from_user_id);

-- Users can update inquiries they received (accept/reject)
CREATE POLICY "Users can update inquiries they received"
  ON breeding_inquiries FOR UPDATE
  TO authenticated
  USING (auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = to_user_id);

-- =====================================================================
-- 3. CREATE CAMEL_FAVORITES TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS camel_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  camel_id uuid REFERENCES camel_profiles(id) ON DELETE CASCADE NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, camel_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_camel_favorites_user_id ON camel_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_camel_favorites_camel_id ON camel_favorites(camel_id);

-- Enable RLS
ALTER TABLE camel_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for camel_favorites

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites"
  ON camel_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can add favorites
CREATE POLICY "Users can add favorites"
  ON camel_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their favorites
CREATE POLICY "Users can delete own favorites"
  ON camel_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================================
-- 4. CREATE MESSAGES TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  to_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  inquiry_id uuid REFERENCES breeding_inquiries(id) ON DELETE SET NULL,
  subject text NOT NULL,
  body text NOT NULL,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_messages_from_user ON messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_user ON messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_inquiry ON messages(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages

-- Users can view messages they sent
CREATE POLICY "Users can view messages they sent"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id);

-- Users can view messages they received
CREATE POLICY "Users can view messages they received"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = to_user_id);

-- Users can send messages
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

-- Users can update messages they received (mark as read)
CREATE POLICY "Users can update messages they received"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = to_user_id);

-- =====================================================================
-- 5. CREATE NOTIFICATIONS TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text CHECK (type IN ('inquiry', 'message', 'favorite', 'system')) NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  link text,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- 6. HELPER FUNCTIONS AND TRIGGERS
-- =====================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for camel_profiles
DROP TRIGGER IF EXISTS update_camel_profiles_updated_at ON camel_profiles;
CREATE TRIGGER update_camel_profiles_updated_at
  BEFORE UPDATE ON camel_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for breeding_inquiries
DROP TRIGGER IF EXISTS update_breeding_inquiries_updated_at ON breeding_inquiries;
CREATE TRIGGER update_breeding_inquiries_updated_at
  BEFORE UPDATE ON breeding_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_camel_view_count()
RETURNS trigger AS $$
BEGIN
  UPDATE camel_profiles
  SET view_count = view_count + 1
  WHERE id = NEW.camel_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment inquiry count and create notification
CREATE OR REPLACE FUNCTION handle_new_breeding_inquiry()
RETURNS trigger AS $$
BEGIN
  -- Increment inquiry count
  UPDATE camel_profiles
  SET inquiry_count = inquiry_count + 1
  WHERE id = NEW.to_camel_id;
  
  -- Create notification for camel owner
  INSERT INTO notifications (user_id, type, title, body, link)
  VALUES (
    NEW.to_user_id,
    'inquiry',
    'New Breeding Inquiry',
    'You have received a new breeding inquiry',
    '/breeding/inquiries/' || NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new breeding inquiries
DROP TRIGGER IF EXISTS on_breeding_inquiry_created ON breeding_inquiries;
CREATE TRIGGER on_breeding_inquiry_created
  AFTER INSERT ON breeding_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_breeding_inquiry();

-- Function to create notification for new messages
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS trigger AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, link)
  VALUES (
    NEW.to_user_id,
    'message',
    'New Message: ' || NEW.subject,
    LEFT(NEW.body, 100),
    '/messages/' || NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new messages
DROP TRIGGER IF EXISTS on_message_created ON messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_message();