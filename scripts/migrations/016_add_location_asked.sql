-- Add location_asked column to track if user has been prompted for location permission
-- This prevents re-prompting users who already answered the location dialog
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_asked BOOLEAN DEFAULT false;
