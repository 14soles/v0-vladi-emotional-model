-- ============================================
-- DEAM EQ Structured Context, Visibility & AI Analysis Migration
-- Implements:
-- 1. Structured context tags (activity, social, body, time)
-- 2. Visibility/sharing fields
-- 3. AI text classification storage
-- 4. Intervention suggestion fields
-- 5. Certainty and consistency tracking
-- ============================================

-- ============================================
-- 1. Structured Context Tags
-- ============================================

-- Activity tags: what user was doing
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS activity_tags TEXT[] DEFAULT '{}';

-- Social tags: who user was with
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS social_tags TEXT[] DEFAULT '{}';

-- Body tags: physical sensations/location
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS body_tags TEXT[] DEFAULT '{}';

-- Time tag: when the emotion occurred (ahora, hace 1h, hoy, ayer, etc.)
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS time_tag TEXT;

-- Certainty: how sure user is about their emotion (0-100)
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS certainty SMALLINT CHECK (certainty >= 0 AND certainty <= 100);

-- ============================================
-- 2. Visibility/Sharing Fields
-- ============================================

-- Visibility scope: who can see this entry
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS visibility_scope TEXT DEFAULT 'private' 
  CHECK (visibility_scope IN ('all', 'group', 'private'));

-- Shared group IDs if visibility = 'group'
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS shared_group_ids UUID[] DEFAULT '{}';

-- ============================================
-- 3. AI Text Classification Storage
-- ============================================

-- Raw note text (already exists as 'note' or 'description')
-- Keep note_raw as alias for clarity
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS note_raw TEXT;

-- AI-generated classification JSON
-- Structure:
-- {
--   "note_summary": "1 frase neutra",
--   "trigger_categories": ["trabajo","pareja"],
--   "detected_topics": ["limite","cansancio"],
--   "cognitive_patterns": ["rumiacion","catastrofismo"],
--   "needs": ["descanso","claridad"],
--   "risk_level": "none|low|medium|high",
--   "suggested_intervention_type": "breathing|grounding|reframe|gratitude|savoring|writing",
--   "xai_reason_codes": ["high_arousal","low_pleasantness"]
-- }
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS ai_tags JSONB DEFAULT '{}';

-- ============================================
-- 4. Intervention Suggestion & Tracking
-- ============================================

-- Intervention suggested by system (before user choice)
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS intervention_suggested TEXT;

-- Arousal/energy self-reported AFTER intervention (0-100)
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS arousal_self_after SMALLINT CHECK (arousal_self_after >= 0 AND arousal_self_after <= 100);

-- Energy after intervention (0-100)
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS energy_after NUMERIC(5,2);

-- Pleasantness after intervention (0-100)
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS pleasantness_after NUMERIC(5,2);

-- ============================================
-- 5. Quadrant Consistency Tracking
-- ============================================

-- Quadrant as selected by user on screen 1
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS quadrant_selected TEXT;

-- Quadrant calculated from pleasantness_user and energy_user
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS quadrant_calculated TEXT;

-- Flag for inconsistency (for debugging/logging)
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS quadrant_inconsistent BOOLEAN DEFAULT FALSE;

-- ============================================
-- 6. Comments for Documentation
-- ============================================

COMMENT ON COLUMN public.emotion_entries.activity_tags IS 'Activity context tags: trabajando, descansando, comiendo, ejercicio, etc.';
COMMENT ON COLUMN public.emotion_entries.social_tags IS 'Social context tags: solo/a, pareja, amigos, familia, companeros, etc.';
COMMENT ON COLUMN public.emotion_entries.body_tags IS 'Body sensation tags: cabeza, pecho, estomago, tension, relajado, etc.';
COMMENT ON COLUMN public.emotion_entries.time_tag IS 'When emotion occurred: ahora, hace_1h, hoy, ayer, esta_semana';
COMMENT ON COLUMN public.emotion_entries.certainty IS 'How certain user is about their emotion identification (0-100)';
COMMENT ON COLUMN public.emotion_entries.visibility_scope IS 'Who can see this entry: all (everyone), group (specific groups), private (only me)';
COMMENT ON COLUMN public.emotion_entries.shared_group_ids IS 'Array of group UUIDs if visibility_scope = group';
COMMENT ON COLUMN public.emotion_entries.note_raw IS 'Raw text note from user (alias for description/note field)';
COMMENT ON COLUMN public.emotion_entries.ai_tags IS 'AI-generated classification of note text as JSON';
COMMENT ON COLUMN public.emotion_entries.intervention_suggested IS 'Intervention type suggested by system before user choice';
COMMENT ON COLUMN public.emotion_entries.arousal_self_after IS 'Self-reported arousal/activation AFTER intervention (0-100)';
COMMENT ON COLUMN public.emotion_entries.energy_after IS 'Energy level AFTER intervention (0-100)';
COMMENT ON COLUMN public.emotion_entries.pleasantness_after IS 'Pleasantness level AFTER intervention (0-100)';
COMMENT ON COLUMN public.emotion_entries.quadrant_selected IS 'Quadrant selected by user in emotion picker UI';
COMMENT ON COLUMN public.emotion_entries.quadrant_calculated IS 'Quadrant calculated from pleasantness_user/energy_user with threshold 50';
COMMENT ON COLUMN public.emotion_entries.quadrant_inconsistent IS 'Flag if quadrant_selected != quadrant_calculated (for debugging)';

-- ============================================
-- 7. Update trigger to calculate quadrant and check consistency
-- ============================================

CREATE OR REPLACE FUNCTION public.populate_deam_canonical_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Copy intensity to arousal_self (DEAM model semantic alias)
  IF NEW.arousal_self IS NULL AND NEW.intensity IS NOT NULL THEN
    NEW.arousal_self := NEW.intensity;
  END IF;
  
  -- Calculate pleasantness from valence if not set: (valence + 1) * 50
  IF NEW.pleasantness IS NULL AND NEW.valence IS NOT NULL THEN
    NEW.pleasantness := (NEW.valence + 1.0) * 50.0;
  END IF;
  
  -- Calculate energy from arousal if not set: (arousal + 1) * 50
  IF NEW.energy IS NULL AND NEW.arousal IS NOT NULL THEN
    NEW.energy := (NEW.arousal + 1.0) * 50.0;
  END IF;
  
  -- Set default pleasantness from the calculated pleasantness
  IF NEW.pleasantness_default IS NULL THEN
    NEW.pleasantness_default := COALESCE(NEW.pleasantness, 50.0);
  END IF;
  
  -- Set default energy from the calculated energy
  IF NEW.energy_default IS NULL THEN
    NEW.energy_default := COALESCE(NEW.energy, 50.0);
  END IF;
  
  -- User values = defaults if not explicitly set
  IF NEW.pleasantness_user IS NULL THEN
    NEW.pleasantness_user := NEW.pleasantness_default;
  END IF;
  
  IF NEW.energy_user IS NULL THEN
    NEW.energy_user := NEW.energy_default;
  END IF;
  
  -- Calculate quadrant from pleasantness_user and energy_user
  -- Threshold is 50 (center of 0-100 scale)
  IF NEW.pleasantness_user IS NOT NULL AND NEW.energy_user IS NOT NULL THEN
    IF NEW.pleasantness_user >= 50 AND NEW.energy_user >= 50 THEN
      NEW.quadrant_calculated := 'yellow';  -- High energy, high pleasantness
    ELSIF NEW.pleasantness_user >= 50 AND NEW.energy_user < 50 THEN
      NEW.quadrant_calculated := 'green';   -- Low energy, high pleasantness
    ELSIF NEW.pleasantness_user < 50 AND NEW.energy_user >= 50 THEN
      NEW.quadrant_calculated := 'red';     -- High energy, low pleasantness
    ELSE
      NEW.quadrant_calculated := 'blue';    -- Low energy, low pleasantness
    END IF;
  END IF;
  
  -- Check for inconsistency between selected and calculated quadrant
  IF NEW.quadrant_selected IS NOT NULL AND NEW.quadrant_calculated IS NOT NULL THEN
    NEW.quadrant_inconsistent := (NEW.quadrant_selected != NEW.quadrant_calculated);
  ELSE
    NEW.quadrant_inconsistent := FALSE;
  END IF;
  
  -- Copy note to note_raw if note_raw is empty
  IF NEW.note_raw IS NULL AND NEW.note IS NOT NULL THEN
    NEW.note_raw := NEW.note;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================
-- 8. Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_emotion_entries_visibility 
  ON public.emotion_entries (user_id, visibility_scope, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_emotion_entries_ai_tags 
  ON public.emotion_entries USING GIN (ai_tags);

CREATE INDEX IF NOT EXISTS idx_emotion_entries_activity_tags 
  ON public.emotion_entries USING GIN (activity_tags);

CREATE INDEX IF NOT EXISTS idx_emotion_entries_social_tags 
  ON public.emotion_entries USING GIN (social_tags);

-- ============================================
-- 9. Backfill existing data
-- ============================================

-- Copy existing 'note' or 'description' to note_raw
UPDATE public.emotion_entries
SET note_raw = COALESCE(note, description)
WHERE note_raw IS NULL AND (note IS NOT NULL OR description IS NOT NULL);

-- Set default visibility to private for existing entries
UPDATE public.emotion_entries
SET visibility_scope = 'private'
WHERE visibility_scope IS NULL;

-- Copy existing tags to activity_tags (simple migration)
UPDATE public.emotion_entries
SET activity_tags = tags
WHERE activity_tags = '{}' AND tags IS NOT NULL AND array_length(tags, 1) > 0;

-- Calculate quadrant for existing entries
UPDATE public.emotion_entries
SET 
  quadrant_calculated = CASE
    WHEN pleasantness_user >= 50 AND energy_user >= 50 THEN 'yellow'
    WHEN pleasantness_user >= 50 AND energy_user < 50 THEN 'green'
    WHEN pleasantness_user < 50 AND energy_user >= 50 THEN 'red'
    ELSE 'blue'
  END,
  quadrant_selected = quadrant
WHERE quadrant_calculated IS NULL AND pleasantness_user IS NOT NULL AND energy_user IS NOT NULL;

-- Mark inconsistencies
UPDATE public.emotion_entries
SET quadrant_inconsistent = (quadrant_selected != quadrant_calculated)
WHERE quadrant_selected IS NOT NULL AND quadrant_calculated IS NOT NULL;
