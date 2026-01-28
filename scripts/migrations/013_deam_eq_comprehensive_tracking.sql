-- ============================================
-- MIGRATION 013: DEAM EQ Comprehensive Tracking
-- Adds all fields for scientific data collection
-- ============================================

-- ============================================
-- 1. ONSET TRACKING (for Inertia calculation)
-- "¿Cuándo empezó esta emoción?"
-- ============================================

-- Create enum for onset bucket
DO $$ BEGIN
  CREATE TYPE onset_bucket_type AS ENUM (
    'now',           -- Ahora mismo (0 min)
    'less_1h',       -- Hace < 1 hora (30 min)
    'hours_1_3',     -- Hace 1-3 horas (120 min)
    'today',         -- Hoy (480 min)
    'yesterday'      -- Ayer (1440 min)
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS onset_bucket onset_bucket_type;

ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS onset_estimated_minutes SMALLINT;

-- Trigger to auto-populate onset_estimated_minutes from onset_bucket
CREATE OR REPLACE FUNCTION public.populate_onset_minutes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.onset_bucket IS NOT NULL AND NEW.onset_estimated_minutes IS NULL THEN
    NEW.onset_estimated_minutes := CASE NEW.onset_bucket
      WHEN 'now' THEN 0
      WHEN 'less_1h' THEN 30
      WHEN 'hours_1_3' THEN 120
      WHEN 'today' THEN 480
      WHEN 'yesterday' THEN 1440
      ELSE NULL
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_populate_onset_minutes ON public.emotion_entries;
CREATE TRIGGER trigger_populate_onset_minutes
  BEFORE INSERT OR UPDATE ON public.emotion_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_onset_minutes();

COMMENT ON COLUMN public.emotion_entries.onset_bucket IS 'When the emotion started: now, less_1h, hours_1_3, today, yesterday';
COMMENT ON COLUMN public.emotion_entries.onset_estimated_minutes IS 'Estimated minutes since onset (auto-calculated from bucket)';

-- ============================================
-- 2. PHYSICAL STATE (to separate emotion from fatigue)
-- "¿Cómo está tu cuerpo ahora?"
-- ============================================

DO $$ BEGIN
  CREATE TYPE physical_state_type AS ENUM ('low', 'mid', 'high');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS physical_state physical_state_type;

COMMENT ON COLUMN public.emotion_entries.physical_state IS 'Physical energy state: low (tired), mid, high';

-- ============================================
-- 3. INTERVENTION TRACKING (complete traceability for Adaptability)
-- ============================================

-- Intervention suggestion tracking
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS intervention_suggested BOOLEAN DEFAULT false;

ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS intervention_suggested_type TEXT;

-- Intervention execution tracking
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS intervention_done BOOLEAN DEFAULT false;

ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS intervention_done_type TEXT;

ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS intervention_skip_reason TEXT;

-- Post-check tracking
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS post_check_completed BOOLEAN DEFAULT false;

ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS arousal_self_after SMALLINT CHECK (arousal_self_after IS NULL OR (arousal_self_after >= 1 AND arousal_self_after <= 10));

ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS energy_after NUMERIC(5,2) CHECK (energy_after IS NULL OR (energy_after >= 0 AND energy_after <= 100));

ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS pleasantness_after NUMERIC(5,2) CHECK (pleasantness_after IS NULL OR (pleasantness_after >= 0 AND pleasantness_after <= 100));

COMMENT ON COLUMN public.emotion_entries.intervention_suggested IS 'Whether an intervention was suggested';
COMMENT ON COLUMN public.emotion_entries.intervention_suggested_type IS 'Type of intervention suggested: breathing|grounding|reframe|gratitude|savoring|writing|mindfulness';
COMMENT ON COLUMN public.emotion_entries.intervention_done IS 'Whether the user completed an intervention';
COMMENT ON COLUMN public.emotion_entries.intervention_done_type IS 'Type of intervention actually done';
COMMENT ON COLUMN public.emotion_entries.intervention_skip_reason IS 'Optional reason for skipping: no_time|not_useful|not_now|other';
COMMENT ON COLUMN public.emotion_entries.post_check_completed IS 'Whether user completed post-intervention check';
COMMENT ON COLUMN public.emotion_entries.arousal_self_after IS 'Self-reported intensity after intervention (1-10)';
COMMENT ON COLUMN public.emotion_entries.energy_after IS 'Energy level after intervention (0-100)';
COMMENT ON COLUMN public.emotion_entries.pleasantness_after IS 'Pleasantness after intervention (0-100)';

-- ============================================
-- 4. AI FEATURES JSON (structured analysis of notes)
-- ============================================

ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS ai_features JSONB;

COMMENT ON COLUMN public.emotion_entries.ai_features IS 'Structured AI analysis: note_summary, trigger_categories, detected_topics, cognitive_patterns, needs, risk_level, suggested_intervention_type, xai_reason_codes';

-- ============================================
-- 5. INTERVENTION SUGGESTION REASONING
-- ============================================

ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS xai_reason_codes TEXT[];

COMMENT ON COLUMN public.emotion_entries.xai_reason_codes IS 'Explainable AI reason codes for intervention suggestion';

-- ============================================
-- 6. Create index for efficient queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_emotion_entries_onset ON public.emotion_entries (user_id, onset_bucket) 
  WHERE onset_bucket IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_emotion_entries_physical_state ON public.emotion_entries (user_id, physical_state) 
  WHERE physical_state IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_emotion_entries_intervention_done ON public.emotion_entries (user_id, intervention_done, intervention_done_type) 
  WHERE intervention_done = true;

CREATE INDEX IF NOT EXISTS idx_emotion_entries_post_check ON public.emotion_entries (user_id, post_check_completed) 
  WHERE post_check_completed = true;

-- ============================================
-- 7. Create view for intervention effectiveness analysis
-- ============================================

CREATE OR REPLACE VIEW public.intervention_effectiveness AS
SELECT 
  user_id,
  intervention_done_type,
  COUNT(*) as total_uses,
  AVG(
    CASE 
      WHEN arousal_self_after IS NOT NULL AND intensity IS NOT NULL 
      THEN intensity - arousal_self_after 
      ELSE NULL 
    END
  ) as avg_intensity_delta,
  AVG(
    CASE 
      WHEN energy_after IS NOT NULL AND energy IS NOT NULL 
      THEN energy_after - energy 
      ELSE NULL 
    END
  ) as avg_energy_delta,
  AVG(
    CASE 
      WHEN pleasantness_after IS NOT NULL AND pleasantness IS NOT NULL 
      THEN pleasantness_after - pleasantness 
      ELSE NULL 
    END
  ) as avg_pleasantness_delta
FROM public.emotion_entries
WHERE intervention_done = true 
  AND intervention_done_type IS NOT NULL
  AND post_check_completed = true
GROUP BY user_id, intervention_done_type
HAVING COUNT(*) >= 1;

-- ============================================
-- 8. Backfill existing intervention data
-- ============================================

-- Set intervention_done = true for entries that have intensity_after or intervention_type
UPDATE public.emotion_entries
SET 
  intervention_done = true,
  intervention_done_type = COALESCE(intervention_type, intervention_done_type),
  post_check_completed = CASE WHEN intensity_after IS NOT NULL THEN true ELSE false END,
  arousal_self_after = intensity_after
WHERE (intensity_after IS NOT NULL OR intervention_type IS NOT NULL)
  AND intervention_done IS NULL;

-- Set intervention_done = false for entries without interventions
UPDATE public.emotion_entries
SET intervention_done = false
WHERE intervention_done IS NULL;
