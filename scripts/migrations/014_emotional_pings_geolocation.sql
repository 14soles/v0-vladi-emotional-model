-- ============================================
-- Migration 014: Emotional Pings with Geolocation
-- Sistema de radar emocional basado en ubicación real
-- Los pings expiran automáticamente después de 15 minutos
-- ============================================

-- Tabla para almacenar pings emocionales con ubicación
CREATE TABLE IF NOT EXISTS public.emotional_pings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Ubicación (coordenadas)
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Precisión de ubicación en metros (para mostrar en UI)
  accuracy_meters DECIMAL(10, 2),
  
  -- Datos emocionales (del último check-in)
  emotion TEXT NOT NULL,
  quadrant TEXT NOT NULL CHECK (quadrant IN ('green', 'yellow', 'red', 'blue')),
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 10),
  
  -- Referencia al emotion_entry original (opcional)
  emotion_entry_id UUID REFERENCES public.emotion_entries(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
  
  -- Índices para búsquedas geográficas eficientes
  CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180)
);

-- Índice para búsquedas por ubicación (bounding box queries)
CREATE INDEX IF NOT EXISTS idx_emotional_pings_location 
  ON public.emotional_pings (latitude, longitude);

-- Índice para expiración (cleanup queries)
CREATE INDEX IF NOT EXISTS idx_emotional_pings_expires 
  ON public.emotional_pings (expires_at);

-- Índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_emotional_pings_user 
  ON public.emotional_pings (user_id);

-- Índice compuesto para queries de radar (por ubicación y expiración)
-- No usamos partial index con NOW() porque no es inmutable
CREATE INDEX IF NOT EXISTS idx_emotional_pings_active 
  ON public.emotional_pings (expires_at DESC, latitude, longitude);

-- ============================================
-- Configuración de usuario para radar
-- ============================================
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS radar_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_location BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS location_precision TEXT DEFAULT 'approximate' 
    CHECK (location_precision IN ('approximate', 'precise'));

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE public.emotional_pings ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden insertar sus propios pings
DROP POLICY IF EXISTS "Users can insert own pings" ON public.emotional_pings;
CREATE POLICY "Users can insert own pings" ON public.emotional_pings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuarios pueden ver pings no expirados de todos (para el radar)
-- Solo si tienen radar_enabled = true
DROP POLICY IF EXISTS "Users can view active pings" ON public.emotional_pings;
CREATE POLICY "Users can view active pings" ON public.emotional_pings
  FOR SELECT USING (
    expires_at > NOW() 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND radar_enabled = true
    )
  );

-- Usuarios pueden eliminar sus propios pings
DROP POLICY IF EXISTS "Users can delete own pings" ON public.emotional_pings;
CREATE POLICY "Users can delete own pings" ON public.emotional_pings
  FOR DELETE USING (auth.uid() = user_id);

-- Usuarios pueden actualizar sus propios pings
DROP POLICY IF EXISTS "Users can update own pings" ON public.emotional_pings;
CREATE POLICY "Users can update own pings" ON public.emotional_pings
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- Función para limpiar pings expirados
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_pings()
RETURNS void AS $$
BEGIN
  DELETE FROM public.emotional_pings WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Función para obtener pings cercanos
-- Usa fórmula de Haversine simplificada para distancia aproximada
-- ============================================
CREATE OR REPLACE FUNCTION get_nearby_pings(
  user_lat DECIMAL,
  user_lon DECIMAL,
  radius_km DECIMAL DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  latitude DECIMAL,
  longitude DECIMAL,
  emotion TEXT,
  quadrant TEXT,
  intensity INTEGER,
  created_at TIMESTAMPTZ,
  distance_km DECIMAL
) AS $$
DECLARE
  -- Conversión aproximada: 1 grado ≈ 111 km
  lat_delta DECIMAL := radius_km / 111.0;
  lon_delta DECIMAL := radius_km / (111.0 * COS(RADIANS(user_lat)));
BEGIN
  RETURN QUERY
  SELECT * FROM (
    SELECT 
      ep.id,
      ep.latitude,
      ep.longitude,
      ep.emotion,
      ep.quadrant,
      ep.intensity,
      ep.created_at,
      -- Fórmula de Haversine simplificada para distancia
      (6371 * ACOS(
        LEAST(1, GREATEST(-1,
          COS(RADIANS(user_lat)) * COS(RADIANS(ep.latitude)) * 
          COS(RADIANS(ep.longitude) - RADIANS(user_lon)) + 
          SIN(RADIANS(user_lat)) * SIN(RADIANS(ep.latitude))
        ))
      ))::DECIMAL AS distance_km
    FROM public.emotional_pings ep
    WHERE 
      ep.expires_at > NOW()
      AND ep.user_id != auth.uid() -- No mostrar los propios pings
      AND ep.latitude BETWEEN (user_lat - lat_delta) AND (user_lat + lat_delta)
      AND ep.longitude BETWEEN (user_lon - lon_delta) AND (user_lon + lon_delta)
  ) AS nearby
  WHERE nearby.distance_km <= radius_km
  ORDER BY nearby.distance_km ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Trigger para crear ping automáticamente al hacer check-in
-- Solo si el usuario tiene share_location = true
-- ============================================
-- Nota: La ubicación se debe enviar desde el cliente ya que
-- el servidor no tiene acceso a la geolocalización del dispositivo

COMMENT ON TABLE public.emotional_pings IS 
'Pings emocionales con geolocalización para el radar emocional. 
Los pings expiran automáticamente después de 15 minutos.
La ubicación se envía desde el cliente cuando share_location = true.';
