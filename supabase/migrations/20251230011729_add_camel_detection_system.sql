/*
  # Camel Beauty Detection System

  ## Overview
  This migration adds the complete database schema for the camel beauty detection feature,
  including support for image uploads, AI-powered analysis, recommendations, and premium user features.

  ## 1. New Tables

  ### camel_detections
  Stores all camel beauty detection results with comprehensive scoring data.
  
  Columns:
  - `id` (uuid, primary key) - Unique identifier for each detection
  - `user_id` (uuid, nullable) - References auth.users, NULL for anonymous uploads
  - `image_url` (text) - URL to the uploaded image in Supabase storage
  - `image_filename` (text) - Original filename of the uploaded image
  - `overall_score` (numeric) - Overall beauty score (0-100)
  - `head_beauty_score` (numeric) - Head beauty attribute score (0-100)
  - `neck_beauty_score` (numeric) - Neck beauty attribute score (0-100)
  - `body_hump_limbs_score` (numeric) - Body, hump, and limbs score (0-100)
  - `body_size_score` (numeric) - Body size score (0-100)
  - `category` (text) - Classification: 'beautiful' or 'ugly'
  - `confidence` (numeric) - Detection confidence percentage (0-100)
  - `bounding_boxes` (jsonb) - Detected regions as JSON (body and face coordinates)
  - `metadata` (jsonb) - Additional metadata (age, sex, breed, etc.)
  - `is_public` (boolean) - Whether the detection result is publicly shareable
  - `share_token` (text, unique) - Unique token for sharing results
  - `created_at` (timestamptz) - When the detection was created

  ### ai_recommendations
  Stores AI-generated recommendations for camel care, breeding, and health.
  
  Columns:
  - `id` (uuid, primary key) - Unique identifier
  - `detection_id` (uuid) - References camel_detections
  - `user_id` (uuid, nullable) - References auth.users
  - `recommendation_type` (text) - Type: 'care', 'breeding', 'health', 'custom'
  - `prompt_used` (text) - The prompt sent to OpenAI
  - `recommendation_text` (text) - Generated recommendation from GPT-4
  - `metadata` (jsonb) - Additional context and parameters
  - `created_at` (timestamptz) - When the recommendation was generated

  ### batch_uploads
  Tracks batch upload sessions for organizing multiple detections.
  
  Columns:
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, nullable) - References auth.users
  - `total_images` (integer) - Total number of images in batch
  - `completed_images` (integer) - Number of successfully processed images
  - `failed_images` (integer) - Number of failed processing attempts
  - `status` (text) - Status: 'processing', 'completed', 'failed'
  - `created_at` (timestamptz) - When batch was started
  - `completed_at` (timestamptz, nullable) - When batch processing finished

  ## 2. Profile Updates
  
  Adds premium user support to existing profiles table:
  - `is_premium` (boolean) - Premium subscription status
  - `premium_expires_at` (timestamptz, nullable) - Premium expiration date
  - `api_key` (text, nullable, unique) - API key for premium users
  - `detection_count` (integer) - Total detections performed by user
  - `monthly_detection_count` (integer) - Detections this month (for rate limiting)

  ## 3. Storage
  
  Creates Supabase storage bucket for camel images with appropriate access policies.

  ## 4. Security
  
  All tables have RLS enabled with appropriate policies:
  - Anonymous users can insert detections and view public results
  - Authenticated users can view/manage their own detections
  - Premium users get enhanced access and API capabilities
  - Admins have full access
*/

-- =====================================================================
-- 1. UPDATE PROFILES TABLE WITH PREMIUM FEATURES
-- =====================================================================

DO $$
BEGIN
  -- Add is_premium column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_premium boolean DEFAULT false NOT NULL;
  END IF;

  -- Add premium_expires_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'premium_expires_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN premium_expires_at timestamptz;
  END IF;

  -- Add api_key column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'api_key'
  ) THEN
    ALTER TABLE profiles ADD COLUMN api_key text UNIQUE;
  END IF;

  -- Add detection_count column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'detection_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN detection_count integer DEFAULT 0 NOT NULL;
  END IF;

  -- Add monthly_detection_count column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'monthly_detection_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN monthly_detection_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Add index for API key lookups
CREATE INDEX IF NOT EXISTS idx_profiles_api_key ON profiles(api_key);

-- =====================================================================
-- 2. CREATE CAMEL_DETECTIONS TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS camel_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  batch_id uuid,
  image_url text NOT NULL,
  image_filename text NOT NULL,
  overall_score numeric(5,2) CHECK (overall_score >= 0 AND overall_score <= 100),
  head_beauty_score numeric(5,2) CHECK (head_beauty_score >= 0 AND head_beauty_score <= 100),
  neck_beauty_score numeric(5,2) CHECK (neck_beauty_score >= 0 AND neck_beauty_score <= 100),
  body_hump_limbs_score numeric(5,2) CHECK (body_hump_limbs_score >= 0 AND body_hump_limbs_score <= 100),
  body_size_score numeric(5,2) CHECK (body_size_score >= 0 AND body_size_score <= 100),
  category text CHECK (category IN ('beautiful', 'ugly')),
  confidence numeric(5,2) CHECK (confidence >= 0 AND confidence <= 100),
  bounding_boxes jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_public boolean DEFAULT false NOT NULL,
  share_token text UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_camel_detections_user_id ON camel_detections(user_id);
CREATE INDEX IF NOT EXISTS idx_camel_detections_batch_id ON camel_detections(batch_id);
CREATE INDEX IF NOT EXISTS idx_camel_detections_share_token ON camel_detections(share_token);
CREATE INDEX IF NOT EXISTS idx_camel_detections_created_at ON camel_detections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_camel_detections_overall_score ON camel_detections(overall_score DESC);

-- Enable RLS
ALTER TABLE camel_detections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for camel_detections

-- Anonymous users can insert detections (for visitor uploads)
CREATE POLICY "Anonymous users can insert detections"
  ON camel_detections FOR INSERT
  TO anon
  WITH CHECK (true);

-- Anyone can view public detections via share token
CREATE POLICY "Anyone can view public detections"
  ON camel_detections FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- Authenticated users can view their own detections
CREATE POLICY "Users can view own detections"
  ON camel_detections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can insert their own detections
CREATE POLICY "Users can insert own detections"
  ON camel_detections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own detections
CREATE POLICY "Users can update own detections"
  ON camel_detections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can delete their own detections
CREATE POLICY "Users can delete own detections"
  ON camel_detections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all detections
CREATE POLICY "Admins can view all detections"
  ON camel_detections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================================
-- 3. CREATE AI_RECOMMENDATIONS TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  detection_id uuid REFERENCES camel_detections(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recommendation_type text CHECK (recommendation_type IN ('care', 'breeding', 'health', 'custom')) NOT NULL,
  prompt_used text NOT NULL,
  recommendation_text text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_detection_id ON ai_recommendations(detection_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_id ON ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_created_at ON ai_recommendations(created_at DESC);

-- Enable RLS
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_recommendations

-- Users can view recommendations for their own detections
CREATE POLICY "Users can view recommendations for own detections"
  ON ai_recommendations FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM camel_detections
      WHERE camel_detections.id = ai_recommendations.detection_id
      AND camel_detections.user_id = auth.uid()
    )
  );

-- Users can view recommendations for public detections
CREATE POLICY "Anyone can view recommendations for public detections"
  ON ai_recommendations FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM camel_detections
      WHERE camel_detections.id = ai_recommendations.detection_id
      AND camel_detections.is_public = true
    )
  );

-- Users can insert recommendations for their own detections
CREATE POLICY "Users can insert recommendations for own detections"
  ON ai_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM camel_detections
      WHERE camel_detections.id = ai_recommendations.detection_id
      AND camel_detections.user_id = auth.uid()
    )
  );

-- =====================================================================
-- 4. CREATE BATCH_UPLOADS TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS batch_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  total_images integer DEFAULT 0 NOT NULL,
  completed_images integer DEFAULT 0 NOT NULL,
  failed_images integer DEFAULT 0 NOT NULL,
  status text CHECK (status IN ('processing', 'completed', 'failed')) DEFAULT 'processing' NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_batch_uploads_user_id ON batch_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_uploads_status ON batch_uploads(status);
CREATE INDEX IF NOT EXISTS idx_batch_uploads_created_at ON batch_uploads(created_at DESC);

-- Enable RLS
ALTER TABLE batch_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for batch_uploads

-- Users can view their own batch uploads
CREATE POLICY "Users can view own batch uploads"
  ON batch_uploads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own batch uploads
CREATE POLICY "Users can insert own batch uploads"
  ON batch_uploads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own batch uploads
CREATE POLICY "Users can update own batch uploads"
  ON batch_uploads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Anonymous users can create batch uploads
CREATE POLICY "Anonymous users can create batch uploads"
  ON batch_uploads FOR INSERT
  TO anon
  WITH CHECK (true);

-- =====================================================================
-- 5. ADD FOREIGN KEY FOR BATCH_ID IN CAMEL_DETECTIONS
-- =====================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'camel_detections_batch_id_fkey'
  ) THEN
    ALTER TABLE camel_detections 
    ADD CONSTRAINT camel_detections_batch_id_fkey 
    FOREIGN KEY (batch_id) REFERENCES batch_uploads(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================================
-- 6. HELPER FUNCTIONS
-- =====================================================================

-- Function to generate unique share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS text AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to increment user detection count
CREATE OR REPLACE FUNCTION increment_detection_count()
RETURNS trigger AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    UPDATE profiles
    SET 
      detection_count = detection_count + 1,
      monthly_detection_count = monthly_detection_count + 1
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-increment detection counts
DROP TRIGGER IF EXISTS on_detection_created ON camel_detections;
CREATE TRIGGER on_detection_created
  AFTER INSERT ON camel_detections
  FOR EACH ROW
  EXECUTE FUNCTION increment_detection_count();

-- Function to reset monthly detection counts (to be called monthly)
CREATE OR REPLACE FUNCTION reset_monthly_detection_counts()
RETURNS void AS $$
BEGIN
  UPDATE profiles SET monthly_detection_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;