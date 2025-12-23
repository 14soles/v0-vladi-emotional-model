-- Create test user for demo purposes
-- Email: demo@vladi.app
-- Password: Demo123!

-- First, sign up the user through Supabase Auth
-- Note: This requires manual creation through Supabase dashboard or auth API
-- The password will be: Demo123!

-- Insert user profile data
INSERT INTO profiles (id, username, full_name, email, created_at, updated_at)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- This will need to match the auth.users id
  'demo',
  'Usuario Demo',
  'demo@vladi.app',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Add some sample emotion entries for the demo user
INSERT INTO emotion_entries (
  user_id,
  emotion,
  quadrant,
  energy,
  pleasantness,
  intensity,
  valence,
  description,
  created_at
)
VALUES
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'En calma',
    'green',
    35,
    65,
    3,
    1,
    'Sensación de tranquilidad y paz interior',
    NOW() - INTERVAL '2 hours'
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Con energía',
    'yellow',
    75,
    80,
    7,
    1,
    'Lleno de vitalidad y motivación',
    NOW() - INTERVAL '5 hours'
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Sin ánimo',
    'blue',
    25,
    30,
    5,
    -1,
    'Bajo de energía y desmotivado',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT DO NOTHING;

-- Note: To create the actual auth user, run this in Supabase dashboard SQL editor:
-- 
-- INSERT INTO auth.users (
--   id,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   created_at,
--   updated_at,
--   raw_app_meta_data,
--   raw_user_meta_data,
--   is_super_admin,
--   role
-- )
-- VALUES (
--   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
--   'demo@vladi.app',
--   crypt('Demo123!', gen_salt('bf')), -- Requires pgcrypto extension
--   NOW(),
--   NOW(),
--   NOW(),
--   '{"provider":"email","providers":["email"]}',
--   '{"full_name":"Usuario Demo"}',
--   false,
--   'authenticated'
-- );
