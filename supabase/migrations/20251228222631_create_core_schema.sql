/*
  # Create Core Schema for Camel Beauty Evaluation Platform

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `role` (text) - visitor, owner, expert, admin
      - `full_name` (text)
      - `phone` (text, optional)
      - `organization` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `camels`
      - `id` (uuid, primary key)
      - `owner_id` (uuid, references profiles)
      - `name` (text)
      - `breed` (text)
      - `gender` (text) - male/female
      - `age` (integer)
      - `notes` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `camel_images`
      - `id` (uuid, primary key)
      - `camel_id` (uuid, references camels)
      - `image_url` (text)
      - `uploaded_at` (timestamptz)
    
    - `evaluations`
      - `id` (uuid, primary key)
      - `camel_id` (uuid, references camels)
      - `image_id` (uuid, references camel_images)
      - `overall_score` (numeric)
      - `head_score` (numeric)
      - `neck_score` (numeric)
      - `hump_score` (numeric)
      - `body_score` (numeric)
      - `legs_score` (numeric)
      - `evaluation_type` (text) - ai/expert
      - `expert_id` (uuid, optional, references profiles)
      - `notes` (text, optional)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
    - Profiles: users can read own profile, admins can manage all
    - Camels: owners can manage their own, experts/admins can view all
    - Images: owners can upload, all authenticated can view
    - Evaluations: owners can view their camels' evaluations, experts can create evaluations
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'visitor' CHECK (role IN ('visitor', 'owner', 'expert', 'admin')),
  full_name text NOT NULL,
  phone text,
  organization text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create camels table
CREATE TABLE IF NOT EXISTS camels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  breed text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  age integer NOT NULL CHECK (age >= 0),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create camel_images table
CREATE TABLE IF NOT EXISTS camel_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camel_id uuid NOT NULL REFERENCES camels(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Create evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camel_id uuid NOT NULL REFERENCES camels(id) ON DELETE CASCADE,
  image_id uuid NOT NULL REFERENCES camel_images(id) ON DELETE CASCADE,
  overall_score numeric NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  head_score numeric NOT NULL CHECK (head_score >= 0 AND head_score <= 100),
  neck_score numeric NOT NULL CHECK (neck_score >= 0 AND neck_score <= 100),
  hump_score numeric NOT NULL CHECK (hump_score >= 0 AND hump_score <= 100),
  body_score numeric NOT NULL CHECK (body_score >= 0 AND body_score <= 100),
  legs_score numeric NOT NULL CHECK (legs_score >= 0 AND legs_score <= 100),
  evaluation_type text NOT NULL DEFAULT 'ai' CHECK (evaluation_type IN ('ai', 'expert')),
  expert_id uuid REFERENCES profiles(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE camels ENABLE ROW LEVEL SECURITY;
ALTER TABLE camel_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Camels policies
CREATE POLICY "Owners can view own camels"
  ON camels FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert own camels"
  ON camels FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own camels"
  ON camels FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own camels"
  ON camels FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Experts and admins can view all camels"
  ON camels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('expert', 'admin')
    )
  );

-- Camel images policies
CREATE POLICY "Owners can view images of own camels"
  ON camel_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM camels
      WHERE camels.id = camel_images.camel_id
      AND camels.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can insert images for own camels"
  ON camel_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM camels
      WHERE camels.id = camel_images.camel_id
      AND camels.owner_id = auth.uid()
    )
  );

CREATE POLICY "Experts and admins can view all images"
  ON camel_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('expert', 'admin')
    )
  );

-- Evaluations policies
CREATE POLICY "Owners can view evaluations of own camels"
  ON evaluations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM camels
      WHERE camels.id = evaluations.camel_id
      AND camels.owner_id = auth.uid()
    )
  );

CREATE POLICY "Experts can view all evaluations"
  ON evaluations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('expert', 'admin')
    )
  );

CREATE POLICY "Experts can insert evaluations"
  ON evaluations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('expert', 'admin')
    )
  );

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'User'), 'visitor');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_camels_owner_id ON camels(owner_id);
CREATE INDEX IF NOT EXISTS idx_camel_images_camel_id ON camel_images(camel_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_camel_id ON evaluations(camel_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_image_id ON evaluations(image_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);