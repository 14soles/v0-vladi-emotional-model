-- ============================================
-- DEAM EQ Model Canonical Fields Migration
-- Aligns VLADI with the DEAM EQ paper/product model
-- ============================================

-- ============================================
-- 1. Add canonical fields to emotion_entries
-- ============================================

-- Arousal self-reported (copies of intensity for semantic clarity)
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS arousal_self_before SMALLINT;

ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS arousal_self_after SMALLINT;

-- Energy in canonical 0-100 scale
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS energy_before NUMERIC(5,2);

ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS energy_after NUMERIC(5,2);

-- Pleasantness in canonical 0-100 scale
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS pleasantness NUMERIC(5,2);

-- Energy canonical (derived from arousal or intensity)
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS energy NUMERIC(5,2);

-- Default values from emotion catalog
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS pleasantness_default NUMERIC(5,2);

ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS energy_default NUMERIC(5,2);

-- User values (for future manual adjustment, currently = default)
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS pleasantness_user NUMERIC(5,2);

ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS energy_user NUMERIC(5,2);

-- ============================================
-- 2. Add user settings for adherence calculation
-- ============================================

ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS target_checkins_per_day SMALLINT DEFAULT 1;

ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS adherence_window_days SMALLINT DEFAULT 14;

-- ============================================
-- 3. Add comments for documentation
-- ============================================

COMMENT ON COLUMN public.emotion_entries.arousal_self_before IS 'Self-reported activation level before intervention (1-10, copy of intensity_before)';
COMMENT ON COLUMN public.emotion_entries.arousal_self_after IS 'Self-reported activation level after intervention (1-10, copy of intensity_after)';
COMMENT ON COLUMN public.emotion_entries.energy_before IS 'Normalized energy before intervention (0-100 scale)';
COMMENT ON COLUMN public.emotion_entries.energy_after IS 'Normalized energy after intervention (0-100 scale)';
COMMENT ON COLUMN public.emotion_entries.pleasantness IS 'Pleasantness in canonical 0-100 scale (derived from valence)';
COMMENT ON COLUMN public.emotion_entries.energy IS 'Energy in canonical 0-100 scale (derived from arousal)';
COMMENT ON COLUMN public.emotion_entries.pleasantness_default IS 'Default pleasantness from emotion catalog (0-100)';
COMMENT ON COLUMN public.emotion_entries.energy_default IS 'Default energy from emotion catalog (0-100)';
COMMENT ON COLUMN public.emotion_entries.pleasantness_user IS 'User-adjusted pleasantness (0-100), defaults to pleasantness_default';
COMMENT ON COLUMN public.emotion_entries.energy_user IS 'User-adjusted energy (0-100), defaults to energy_default';
COMMENT ON COLUMN public.user_profiles.target_checkins_per_day IS 'Target number of check-ins per day for adherence calculation (default 1)';
COMMENT ON COLUMN public.user_profiles.adherence_window_days IS 'Window in days for adherence calculation (default 14)';

-- ============================================
-- 4. Create function to auto-populate canonical fields on insert/update
-- ============================================

CREATE OR REPLACE FUNCTION public.populate_deam_canonical_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Copy intensity to arousal_self
  NEW.arousal_self_before := NEW.intensity_before;
  NEW.arousal_self_after := NEW.intensity_after;
  
  -- Calculate energy_before from arousal_self_before: ((value - 1) / 9) * 100
  IF NEW.arousal_self_before IS NOT NULL THEN
    NEW.energy_before := ((NEW.arousal_self_before - 1)::NUMERIC / 9.0) * 100.0;
  END IF;
  
  -- Calculate energy_after from arousal_self_after
  IF NEW.arousal_self_after IS NOT NULL THEN
    NEW.energy_after := ((NEW.arousal_self_after - 1)::NUMERIC / 9.0) * 100.0;
  END IF;
  
  -- Convert valence (-1..+1) to pleasantness (0-100): (valence + 1) * 50
  IF NEW.valence IS NOT NULL THEN
    NEW.pleasantness := (NEW.valence + 1.0) * 50.0;
  END IF;
  
  -- Convert arousal (-1..+1) to energy (0-100): (arousal + 1) * 50
  IF NEW.arousal IS NOT NULL THEN
    NEW.energy := (NEW.arousal + 1.0) * 50.0;
  END IF;
  
  -- Set defaults from catalog values
  NEW.pleasantness_default := NEW.pleasantness;
  NEW.energy_default := NEW.energy;
  
  -- User values = defaults (no manual adjustment UI yet)
  NEW.pleasantness_user := NEW.pleasantness_default;
  NEW.energy_user := NEW.energy_default;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new entries
DROP TRIGGER IF EXISTS trigger_populate_deam_fields ON public.emotion_entries;
CREATE TRIGGER trigger_populate_deam_fields
  BEFORE INSERT ON public.emotion_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_deam_canonical_fields();

-- Also trigger on update (for intensity_after changes)
DROP TRIGGER IF EXISTS trigger_populate_deam_fields_update ON public.emotion_entries;
CREATE TRIGGER trigger_populate_deam_fields_update
  BEFORE UPDATE OF intensity_after ON public.emotion_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_deam_canonical_fields();

-- ============================================
-- 5. Backfill existing data
-- ============================================

UPDATE public.emotion_entries
SET
  -- Copy intensity to arousal_self
  arousal_self_before = intensity_before,
  arousal_self_after = intensity_after,
  
  -- Calculate energy_before: ((intensity_before - 1) / 9) * 100
  energy_before = CASE 
    WHEN intensity_before IS NOT NULL 
    THEN ((intensity_before - 1)::NUMERIC / 9.0) * 100.0 
    ELSE NULL 
  END,
  
  -- Calculate energy_after: ((intensity_after - 1) / 9) * 100
  energy_after = CASE 
    WHEN intensity_after IS NOT NULL 
    THEN ((intensity_after - 1)::NUMERIC / 9.0) * 100.0 
    ELSE NULL 
  END,
  
  -- Convert valence (-1..+1) to pleasantness (0-100)
  pleasantness = CASE 
    WHEN valence IS NOT NULL 
    THEN (valence + 1.0) * 50.0 
    ELSE 50.0 -- neutral default
  END,
  
  -- Convert arousal (-1..+1) to energy (0-100)
  energy = CASE 
    WHEN arousal IS NOT NULL 
    THEN (arousal + 1.0) * 50.0 
    ELSE 50.0 -- neutral default
  END,
  
  -- Set defaults
  pleasantness_default = CASE 
    WHEN valence IS NOT NULL 
    THEN (valence + 1.0) * 50.0 
    ELSE 50.0 
  END,
  energy_default = CASE 
    WHEN arousal IS NOT NULL 
    THEN (arousal + 1.0) * 50.0 
    ELSE 50.0 
  END,
  
  -- User values = defaults
  pleasantness_user = CASE 
    WHEN valence IS NOT NULL 
    THEN (valence + 1.0) * 50.0 
    ELSE 50.0 
  END,
  energy_user = CASE 
    WHEN arousal IS NOT NULL 
    THEN (arousal + 1.0) * 50.0 
    ELSE 50.0 
  END
WHERE arousal_self_before IS NULL;

-- ============================================
-- 6. Create index for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_emotion_entries_canonical 
  ON public.emotion_entries (user_id, pleasantness_user, energy_user, created_at DESC);
