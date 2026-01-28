-- ============================================
-- DEAM EQ Model Canonical Fields Migration
-- Aligns VLADI with the DEAM EQ paper/product model
-- ============================================

-- ============================================
-- 1. Add canonical fields to emotion_entries
-- Existing columns: intensity, valence, arousal (from previous migrations)
-- Adding: pleasantness, energy (canonical 0-100 scales), arousal_self, intensity_after
-- and user-adjusted values (pleasantness_user, energy_user)
-- ============================================

-- First, ensure the base canonical columns exist (they may have been added before)
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS pleasantness NUMERIC(5,2);

ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS energy NUMERIC(5,2);

-- Arousal self-reported (semantic alias for intensity in DEAM model)
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS arousal_self SMALLINT;

-- Intensity after intervention (for measuring regulation effectiveness)
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS intensity_after SMALLINT CHECK (intensity_after >= 0 AND intensity_after <= 100);

-- Intervention type used
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS intervention_type TEXT;

-- Default values from emotion catalog (baseline from emotion label)
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS pleasantness_default NUMERIC(5,2);

ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS energy_default NUMERIC(5,2);

-- User values (for future manual adjustment, currently = from emotion catalog)
ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS pleasantness_user NUMERIC(5,2);

ALTER TABLE public.emotion_entries 
  ADD COLUMN IF NOT EXISTS energy_user NUMERIC(5,2);

-- ============================================
-- 2. Add user settings for adherence calculation
-- ============================================

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS target_checkins_per_day SMALLINT DEFAULT 1;

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS adherence_window_days SMALLINT DEFAULT 14;

-- ============================================
-- 3. Add comments for documentation
-- ============================================

COMMENT ON COLUMN public.emotion_entries.arousal_self IS 'Self-reported activation level (1-100, copy of intensity for DEAM model clarity)';
COMMENT ON COLUMN public.emotion_entries.intensity_after IS 'Intensity after intervention (0-100 scale)';
COMMENT ON COLUMN public.emotion_entries.intervention_type IS 'Type of intervention used (breathing, grounding, reframe, gratitude, etc.)';
COMMENT ON COLUMN public.emotion_entries.pleasantness_default IS 'Default pleasantness from emotion catalog (0-100)';
COMMENT ON COLUMN public.emotion_entries.energy_default IS 'Default energy from emotion catalog (0-100)';
COMMENT ON COLUMN public.emotion_entries.pleasantness_user IS 'User-adjusted pleasantness (0-100), defaults to pleasantness_default';
COMMENT ON COLUMN public.emotion_entries.energy_user IS 'User-adjusted energy (0-100), defaults to energy_default';
COMMENT ON COLUMN public.profiles.target_checkins_per_day IS 'Target number of check-ins per day for adherence calculation (default 1)';
COMMENT ON COLUMN public.profiles.adherence_window_days IS 'Window in days for adherence calculation (default 14)';

-- ============================================
-- 4. Create function to auto-populate canonical fields on insert/update
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
  
  RETURN NEW;
END;
$$;

-- Create trigger for new entries
DROP TRIGGER IF EXISTS trigger_populate_deam_fields ON public.emotion_entries;
CREATE TRIGGER trigger_populate_deam_fields
  BEFORE INSERT ON public.emotion_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_deam_canonical_fields();

-- Also trigger on update
DROP TRIGGER IF EXISTS trigger_populate_deam_fields_update ON public.emotion_entries;
CREATE TRIGGER trigger_populate_deam_fields_update
  BEFORE UPDATE ON public.emotion_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_deam_canonical_fields();

-- ============================================
-- 5. Backfill existing data
-- ============================================

-- First, populate pleasantness and energy from valence and arousal if they exist
-- Conversion: valence (-1..+1) -> pleasantness (0-100): (valence + 1) * 50
-- Conversion: arousal (-1..+1) -> energy (0-100): (arousal + 1) * 50
UPDATE public.emotion_entries
SET
  pleasantness = CASE 
    WHEN valence IS NOT NULL THEN (valence + 1.0) * 50.0 
    ELSE 50.0 
  END,
  energy = CASE 
    WHEN arousal IS NOT NULL THEN (arousal + 1.0) * 50.0 
    ELSE 50.0 
  END
WHERE pleasantness IS NULL OR energy IS NULL;

-- Now backfill the DEAM canonical fields
UPDATE public.emotion_entries
SET
  -- Copy intensity to arousal_self
  arousal_self = intensity,
  
  -- Set defaults from calculated pleasantness/energy columns
  pleasantness_default = COALESCE(pleasantness, 50.0),
  energy_default = COALESCE(energy, 50.0),
  
  -- User values = defaults
  pleasantness_user = COALESCE(pleasantness, 50.0),
  energy_user = COALESCE(energy, 50.0)
WHERE arousal_self IS NULL;

-- ============================================
-- 6. Create index for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_emotion_entries_canonical 
  ON public.emotion_entries (user_id, pleasantness_user, energy_user, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_emotion_entries_intervention 
  ON public.emotion_entries (user_id, intervention_type, created_at DESC)
  WHERE intervention_type IS NOT NULL;
