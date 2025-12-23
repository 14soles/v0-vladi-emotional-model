-- Añadir campos sociales a emotion_entries
ALTER TABLE public.emotion_entries ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE public.emotion_entries ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Tabla de vistas de emociones
CREATE TABLE IF NOT EXISTS public.emotion_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.emotion_entries(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(entry_id, viewer_id)
);

-- Tabla de comentarios/respuestas a emociones
CREATE TABLE IF NOT EXISTS public.emotion_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.emotion_entries(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_audio BOOLEAN DEFAULT FALSE,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de solicitudes de amistad
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- Habilitar RLS
ALTER TABLE public.emotion_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para emotion_views
CREATE POLICY "views_select_own" ON public.emotion_views FOR SELECT USING (auth.uid() = viewer_id);
CREATE POLICY "views_insert" ON public.emotion_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Políticas RLS para emotion_comments
CREATE POLICY "comments_select_related" ON public.emotion_comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_own" ON public.emotion_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "comments_delete_own" ON public.emotion_comments FOR DELETE USING (auth.uid() = author_id);

-- Políticas RLS para friend_requests
CREATE POLICY "requests_select_related" ON public.friend_requests FOR SELECT 
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "requests_insert" ON public.friend_requests FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "requests_update_recipient" ON public.friend_requests FOR UPDATE USING (auth.uid() = to_user_id);

-- Política para buscar usuarios por username (pública)
DROP POLICY IF EXISTS "profiles_select_by_phone" ON public.profiles;
CREATE POLICY "profiles_search_public" ON public.profiles FOR SELECT USING (true);

-- Política para ver emociones de contactos
CREATE POLICY "entries_select_shared" ON public.emotion_entries FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR (
      is_public = TRUE 
      AND EXISTS (
        SELECT 1 FROM public.contacts c 
        WHERE c.user_id = auth.uid() 
        AND c.contact_user_id = emotion_entries.user_id 
        AND c.friendship_status = 'accepted'
      )
    )
  );

-- Función para incrementar vistas
CREATE OR REPLACE FUNCTION public.increment_entry_views(entry_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.emotion_entries 
  SET views_count = views_count + 1 
  WHERE id = entry_uuid;
END;
$$;
