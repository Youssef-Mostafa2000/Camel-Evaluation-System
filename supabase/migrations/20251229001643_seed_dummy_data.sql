/*
  # Seed Database with Dummy Data
  
  1. Creates test users in auth.users
  2. Creates corresponding profiles with different roles
  3. Adds sample camels for testing
  4. Adds camel images
  5. Creates sample evaluations (AI and expert)
  6. Sets up expert assignments
  
  Note: This is for testing purposes only
*/

-- Insert test users into auth.users (if they don't exist)
-- We'll create users with known IDs for testing
DO $$
DECLARE
  admin_id uuid := '11111111-1111-1111-1111-111111111111';
  owner1_id uuid := '22222222-2222-2222-2222-222222222222';
  owner2_id uuid := '33333333-3333-3333-3333-333333333333';
  expert1_id uuid := '44444444-4444-4444-4444-444444444444';
  expert2_id uuid := '55555555-5555-5555-5555-555555555555';
  visitor_id uuid := '66666666-6666-6666-6666-666666666666';
BEGIN
  -- Insert into auth.users (only if running in a context where we can modify auth schema)
  -- Note: In production, users would be created through signup
  
  -- Insert test users into auth.users if they don't exist
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, role, aud)
  VALUES 
    (admin_id, 'admin@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (owner1_id, 'owner1@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (owner2_id, 'owner2@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (expert1_id, 'expert1@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (expert2_id, 'expert2@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (visitor_id, 'visitor@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  -- Insert profiles
  INSERT INTO profiles (id, email, first_name, last_name, role, phone, country, gender, birthdate)
  VALUES 
    (admin_id, 'admin@test.com', 'Admin', 'User', 'admin', '+966501234567', 'Saudi Arabia', 'male', '1985-01-15'),
    (owner1_id, 'owner1@test.com', 'Mohammed', 'Al-Saud', 'owner', '+966502345678', 'Saudi Arabia', 'male', '1990-05-20'),
    (owner2_id, 'owner2@test.com', 'Fatima', 'Al-Rashid', 'owner', '+966503456789', 'Saudi Arabia', 'female', '1988-08-12'),
    (expert1_id, 'expert1@test.com', 'Ahmed', 'Al-Qahtani', 'expert', '+966504567890', 'Saudi Arabia', 'male', '1982-03-25'),
    (expert2_id, 'expert2@test.com', 'Khalid', 'Al-Otaibi', 'expert', '+966505678901', 'Saudi Arabia', 'male', '1980-11-30'),
    (visitor_id, 'visitor@test.com', 'Sara', 'Al-Mutairi', 'visitor', '+966506789012', 'Saudi Arabia', 'female', '1995-07-18')
  ON CONFLICT (id) DO NOTHING;

  -- Insert camels
  INSERT INTO camels (id, owner_id, name, breed, gender, age, notes)
  VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', owner1_id, 'Majesty', 'Majahim', 'male', 5, 'Champion breed with excellent lineage'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', owner1_id, 'Desert Star', 'Shaele', 'female', 4, 'Beautiful camel with great temperament'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', owner1_id, 'Thunder', 'Majahim', 'male', 6, 'Strong and powerful camel'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', owner2_id, 'Pearl', 'Shaele', 'female', 3, 'Young and promising camel'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', owner2_id, 'Golden Sand', 'Homor', 'male', 7, 'Experienced racing camel')
  ON CONFLICT (id) DO NOTHING;

  -- Insert camel images (using placeholder image URLs)
  INSERT INTO camel_images (id, camel_id, image_url)
  VALUES 
    ('aaaabbbb-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'https://images.pexels.com/photos/2382681/pexels-photo-2382681.jpeg'),
    ('aaaabbbb-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'https://images.pexels.com/photos/3540375/pexels-photo-3540375.jpeg'),
    ('bbbbcccc-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'https://images.pexels.com/photos/1958149/pexels-photo-1958149.jpeg'),
    ('ccccdddd-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'https://images.pexels.com/photos/2382681/pexels-photo-2382681.jpeg'),
    ('ddddeeee-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'https://images.pexels.com/photos/1958149/pexels-photo-1958149.jpeg'),
    ('eeeeffff-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'https://images.pexels.com/photos/3540375/pexels-photo-3540375.jpeg')
  ON CONFLICT (id) DO NOTHING;

  -- Insert AI evaluations
  INSERT INTO evaluations (id, camel_id, image_id, overall_score, head_score, neck_score, hump_score, body_score, legs_score, evaluation_type, notes)
  VALUES 
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaabbbb-1111-1111-1111-111111111111', 92, 95, 90, 93, 91, 88, 'ai', 'Excellent overall structure with strong features'),
    (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbcccc-1111-1111-1111-111111111111', 88, 87, 89, 88, 90, 86, 'ai', 'Very good specimen with balanced proportions'),
    (gen_random_uuid(), 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'ccccdddd-1111-1111-1111-111111111111', 85, 83, 86, 87, 84, 85, 'ai', 'Strong build with good racing potential'),
    (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'ddddeeee-1111-1111-1111-111111111111', 90, 92, 88, 91, 89, 90, 'ai', 'Young camel showing excellent promise'),
    (gen_random_uuid(), 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeffff-1111-1111-1111-111111111111', 87, 85, 88, 89, 87, 86, 'ai', 'Mature camel with consistent performance');

  -- Insert expert assignments
  INSERT INTO expert_assignments (id, camel_id, expert_id, assigned_by, status, notes)
  VALUES 
    ('11112222-3333-4444-5555-666677778888', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', expert1_id, admin_id, 'completed', 'Priority evaluation for championship'),
    ('22223333-4444-5555-6666-777788889999', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', expert2_id, admin_id, 'in_progress', 'Standard evaluation'),
    ('33334444-5555-6666-7777-888899990000', 'dddddddd-dddd-dddd-dddd-dddddddddddd', expert1_id, admin_id, 'pending', 'Scheduled for next week')
  ON CONFLICT (id) DO NOTHING;

  -- Insert expert evaluations
  INSERT INTO expert_evaluations (id, assignment_id, camel_id, expert_id, overall_score, head_score, neck_score, hump_score, body_score, legs_score, notes)
  VALUES 
    (gen_random_uuid(), '11112222-3333-4444-5555-666677778888', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', expert1_id, 94, 96, 92, 95, 93, 91, 'Outstanding camel with championship potential. Excellent head structure and well-proportioned body. Minor improvement possible in leg alignment.')
  ON CONFLICT (id) DO NOTHING;

  -- Also insert into evaluations table for expert evaluation
  INSERT INTO evaluations (id, camel_id, image_id, overall_score, head_score, neck_score, hump_score, body_score, legs_score, evaluation_type, expert_id, notes)
  VALUES 
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaabbbb-1111-1111-1111-111111111111', 94, 96, 92, 95, 93, 91, 'expert', expert1_id, 'Outstanding camel with championship potential')
  ON CONFLICT (id) DO NOTHING;

END $$;
