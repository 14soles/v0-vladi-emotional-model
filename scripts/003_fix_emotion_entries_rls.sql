-- Script para corregir las políticas RLS de emotion_entries
-- para permitir que los contactos vean las emociones compartidas

-- Primero eliminamos las políticas existentes
DROP POLICY IF EXISTS "entries_select_shared" ON emotion_entries;
DROP POLICY IF EXISTS "entries_select_own" ON emotion_entries;

-- Crear política para ver propias entradas
CREATE POLICY "entries_select_own" ON emotion_entries
FOR SELECT
USING (auth.uid() = user_id);

-- Crear política para ver entradas públicas de contactos
CREATE POLICY "entries_select_shared" ON emotion_entries
FOR SELECT
USING (
  is_public = true
  AND
  user_id IN (
    -- Contactos donde el viewer es el owner
    SELECT contact_user_id FROM contacts 
    WHERE contacts.user_id = auth.uid() 
    AND contacts.friendship_status = 'accepted'
    AND contacts.contact_user_id IS NOT NULL
    UNION
    -- Contactos donde el viewer fue añadido por otro
    SELECT user_id FROM contacts 
    WHERE contacts.contact_user_id = auth.uid() 
    AND contacts.friendship_status = 'accepted'
  )
);
