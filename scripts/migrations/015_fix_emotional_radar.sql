-- ============================================
-- Migration 015: Fix Emotional Radar
-- Corrige los problemas que impedían que el radar emocional funcionara:
-- 1. Función get_nearby_pings ahora usa SECURITY INVOKER para que auth.uid() funcione
-- 2. RLS SELECT simplificado: cualquier usuario autenticado puede leer pings activos
-- 3. Expiración extendida de 15 minutos a 2 horas
-- ============================================

-- 1. Recrear get_nearby_pings como SECURITY INVOKER
DROP FUNCTION IF EXISTS get_nearby_pings(DECIMAL, DECIMAL, DECIMAL);

CREATE OR REPLACE FUNCTION get_nearby_pings(
  user_lat DECIMAL,
  user_lon DECIMAL,
  radius_km DECIMAL DEFAULT 5
)
RETURNS TABLE(
  id UUID,
  latitude DECIMAL,
  longitude DECIMAL,
  emotion TEXT,
  quadrant TEXT,
  intensity INTEGER,
  created_at TIMESTAMPTZ,
  distance_km DECIMAL
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  lat_delta DECIMAL := radius_km / 111.0;
  lon_delta DECIMAL := radius_km / (111.0 * COS(RADIANS(user_lat)));
  calling_user UUID := auth.uid();
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
      AND ep.user_id != calling_user
      AND ep.latitude BETWEEN (user_lat - lat_delta) AND (user_lat + lat_delta)
      AND ep.longitude BETWEEN (user_lon - lon_delta) AND (user_lon + lon_delta)
  ) AS nearby
  WHERE nearby.distance_km <= radius_km
  ORDER BY nearby.distance_km ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_nearby_pings(DECIMAL, DECIMAL, DECIMAL) TO authenticated;

-- 2. Simplificar RLS SELECT - cualquier usuario autenticado puede leer pings activos
DROP POLICY IF EXISTS "Users can view active pings" ON emotional_pings;
DROP POLICY IF EXISTS "Users can read nearby non-expired pings" ON emotional_pings;
CREATE POLICY "Users can read nearby non-expired pings" 
  ON emotional_pings FOR SELECT
  USING (
    expires_at > NOW()
    AND auth.uid() IS NOT NULL
  );

-- 3. INSERT policy simplificado
DROP POLICY IF EXISTS "Users can insert own pings" ON emotional_pings;
CREATE POLICY "Users can insert own pings"
  ON emotional_pings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Extender expiración de 15 minutos a 2 horas
ALTER TABLE emotional_pings ALTER COLUMN expires_at SET DEFAULT NOW() + INTERVAL '2 hours';

-- 5. Asegurar RLS habilitado
ALTER TABLE emotional_pings ENABLE ROW LEVEL SECURITY;
