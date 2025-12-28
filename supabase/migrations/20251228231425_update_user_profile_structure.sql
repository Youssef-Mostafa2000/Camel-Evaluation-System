/*
  # Update User Profile Structure
  
  1. Changes to profiles table
    - Add `first_name` (text, required)
    - Add `last_name` (text, required)
    - Add `email` (text, required) - denormalized from auth.users for easier queries
    - Add `country` (text, optional)
    - Add `gender` (text, optional) - male/female/other
    - Add `birthdate` (date, optional)
    - Add `profile_picture_url` (text, optional)
    - Remove `full_name` column (replaced by first_name + last_name)
    - Remove `organization` column (not needed)
  
  2. Data Migration
    - Split existing full_name into first_name and last_name where possible
    - Populate email from auth.users
  
  3. Updates
    - Update trigger function to use new field structure
    - Maintain all existing RLS policies
*/

-- Add new columns to profiles table
DO $$
BEGIN
  -- Add first_name if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN first_name text;
  END IF;

  -- Add last_name if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_name text;
  END IF;

  -- Add email if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email text;
  END IF;

  -- Add country if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'country'
  ) THEN
    ALTER TABLE profiles ADD COLUMN country text;
  END IF;

  -- Add gender if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'gender'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gender text CHECK (gender IN ('male', 'female', 'other'));
  END IF;

  -- Add birthdate if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'birthdate'
  ) THEN
    ALTER TABLE profiles ADD COLUMN birthdate date;
  END IF;

  -- Add profile_picture_url if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_picture_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_picture_url text;
  END IF;
END $$;

-- Migrate existing data: split full_name into first_name and last_name
UPDATE profiles
SET 
  first_name = COALESCE(
    CASE 
      WHEN full_name IS NOT NULL AND position(' ' in full_name) > 0 
      THEN split_part(full_name, ' ', 1)
      ELSE full_name
    END,
    'User'
  ),
  last_name = COALESCE(
    CASE 
      WHEN full_name IS NOT NULL AND position(' ' in full_name) > 0 
      THEN substring(full_name from position(' ' in full_name) + 1)
      ELSE ''
    END,
    ''
  ),
  email = (SELECT email FROM auth.users WHERE auth.users.id = profiles.id)
WHERE first_name IS NULL OR last_name IS NULL OR email IS NULL;

-- Make new required fields NOT NULL after data migration
ALTER TABLE profiles ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN last_name SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN email SET NOT NULL;

-- Drop old columns if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE profiles DROP COLUMN full_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'organization'
  ) THEN
    ALTER TABLE profiles DROP COLUMN organization;
  END IF;
END $$;

-- Update the trigger function to use new field structure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_first_name text;
  user_last_name text;
BEGIN
  -- Extract first name and last name from metadata or use defaults
  user_first_name := COALESCE(new.raw_user_meta_data->>'first_name', 'User');
  user_last_name := COALESCE(new.raw_user_meta_data->>'last_name', '');

  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    email, 
    phone,
    country,
    gender,
    birthdate,
    profile_picture_url,
    role
  )
  VALUES (
    new.id, 
    user_first_name,
    user_last_name,
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'gender',
    (new.raw_user_meta_data->>'birthdate')::date,
    new.raw_user_meta_data->>'profile_picture_url',
    'visitor'
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Add unique constraint on email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_email_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
  END IF;
END $$;