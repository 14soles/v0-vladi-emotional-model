-- Migration to fix intervention type enum values to match code
-- The original migration used different names than what the code expects

-- Drop and recreate the enum with correct values
-- First, we need to handle the existing column

-- 1. Create new enum with correct values
DO $$ BEGIN
  CREATE TYPE intervention_type_new AS ENUM (
    'breathing_478',
    'breathing_box',
    'grounding_54321',
    'journaling',
    'movement',
    'meditation',
    'reframing',
    'social_contact'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Alter the column to use text temporarily if needed
-- Note: This approach handles the case where the old enum already has data

-- 3. If table has no data in that column, we can just alter the type
ALTER TABLE public.interventions_log 
ALTER COLUMN intervention TYPE intervention_type_new 
USING intervention::text::intervention_type_new;

-- 4. Drop old enum and rename new one
DROP TYPE IF EXISTS intervention_type;
ALTER TYPE intervention_type_new RENAME TO intervention_type;
