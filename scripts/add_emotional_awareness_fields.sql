-- Add missing fields for Emotional Awareness calculation to emotion_entries table

-- Body location where the emotion is felt
ALTER TABLE emotion_entries 
ADD COLUMN IF NOT EXISTS body_location TEXT[];

-- When the emotion occurred (temporal awareness)
ALTER TABLE emotion_entries 
ADD COLUMN IF NOT EXISTS when_occurred TEXT;

-- Certainty bucket (metacognition)
ALTER TABLE emotion_entries 
ADD COLUMN IF NOT EXISTS certainty_bucket TEXT;

-- Emotion family (quadrant label in Spanish)
ALTER TABLE emotion_entries 
ADD COLUMN IF NOT EXISTS emotion_family TEXT;

-- Color of the emotional family
ALTER TABLE emotion_entries 
ADD COLUMN IF NOT EXISTS color TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_emotion_entries_user_created 
ON emotion_entries(user_id, created_at DESC);

-- Add comment for documentation
COMMENT ON COLUMN emotion_entries.body_location IS 'Array of body parts where the emotion is physically felt';
COMMENT ON COLUMN emotion_entries.when_occurred IS 'When the emotion occurred (temporal reference)';
COMMENT ON COLUMN emotion_entries.certainty_bucket IS 'Level of certainty about the emotion (metacognition)';
COMMENT ON COLUMN emotion_entries.emotion_family IS 'Emotional family: en calma, en tensión, con energía, sin ánimo';
COMMENT ON COLUMN emotion_entries.color IS 'Color associated with the emotional family';
