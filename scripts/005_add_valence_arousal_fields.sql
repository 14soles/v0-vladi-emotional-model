-- Añadir campos valence y arousal a emotion_entries para el cálculo del estado emocional

-- Añadir columna valence (valencia emocional: -1 a +1)
ALTER TABLE public.emotion_entries 
ADD COLUMN IF NOT EXISTS valence DECIMAL(3,2) CHECK (valence >= -1 AND valence <= 1);

-- Añadir columna arousal (activación emocional: -1 a +1)
ALTER TABLE public.emotion_entries 
ADD COLUMN IF NOT EXISTS arousal DECIMAL(3,2) CHECK (arousal >= -1 AND arousal <= 1);

-- Añadir columna confidence (confianza del usuario en el registro: 0 a 1)
ALTER TABLE public.emotion_entries 
ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1);

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_emotion_entries_user_timestamp ON public.emotion_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emotion_entries_valence ON public.emotion_entries(valence) WHERE valence IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emotion_entries_arousal ON public.emotion_entries(arousal) WHERE arousal IS NOT NULL;

-- Actualizar registros existentes con valores derivados del quadrant
-- Basado en el mapeo: green=calma, yellow=energía, red=tensión, blue=sin ánimo
UPDATE public.emotion_entries
SET 
  valence = CASE 
    WHEN quadrant = 'green' THEN 0.3  -- Calma: ligeramente positivo
    WHEN quadrant = 'yellow' THEN 0.5 -- Energía: positivo
    WHEN quadrant = 'red' THEN -0.6   -- Tensión: negativo con activación
    WHEN quadrant = 'blue' THEN -0.4  -- Sin ánimo: negativo sin activación
    ELSE 0
  END,
  arousal = CASE 
    WHEN quadrant = 'green' THEN -0.5  -- Calma: baja activación
    WHEN quadrant = 'yellow' THEN 0.6  -- Energía: alta activación
    WHEN quadrant = 'red' THEN 0.7     -- Tensión: muy alta activación
    WHEN quadrant = 'blue' THEN -0.6   -- Sin ánimo: muy baja activación
    ELSE 0
  END
WHERE valence IS NULL OR arousal IS NULL;

-- Comentario explicativo
COMMENT ON COLUMN public.emotion_entries.valence IS 'Valencia emocional: -1 (muy negativo) a +1 (muy positivo)';
COMMENT ON COLUMN public.emotion_entries.arousal IS 'Arousal/Activación: -1 (muy baja energía) a +1 (muy alta energía)';
COMMENT ON COLUMN public.emotion_entries.confidence IS 'Confianza del usuario en este registro: 0 (baja) a 1 (alta)';
