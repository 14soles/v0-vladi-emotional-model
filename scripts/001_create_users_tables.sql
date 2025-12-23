-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de contactos/amigos
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  is_vladi_user BOOLEAN DEFAULT FALSE,
  friendship_status TEXT DEFAULT 'none' CHECK (friendship_status IN ('none', 'pending_sent', 'pending_received', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, contact_phone)
);

-- Tabla de grupos de privacidad
CREATE TABLE IF NOT EXISTS public.privacy_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Tabla de miembros de grupos
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.privacy_groups(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, contact_id)
);

-- Tabla de registros emocionales
CREATE TABLE IF NOT EXISTS public.emotion_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emotion TEXT NOT NULL,
  quadrant TEXT NOT NULL CHECK (quadrant IN ('green', 'yellow', 'red', 'blue')),
  intensity INTEGER NOT NULL CHECK (intensity >= 0 AND intensity <= 100),
  wellbeing INTEGER NOT NULL CHECK (wellbeing >= 0 AND wellbeing <= 100),
  context TEXT,
  activity_tags TEXT[],
  company_tags TEXT[],
  custom_activity TEXT,
  custom_company TEXT,
  notes TEXT,
  privacy_group_id UUID REFERENCES public.privacy_groups(id) ON DELETE SET NULL,
  intervention_used TEXT,
  intervention_delta INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotion_entries ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_select_by_phone" ON public.profiles FOR SELECT USING (true);

-- Políticas RLS para contacts
CREATE POLICY "contacts_select_own" ON public.contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "contacts_insert_own" ON public.contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contacts_update_own" ON public.contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "contacts_delete_own" ON public.contacts FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para privacy_groups
CREATE POLICY "groups_select_own" ON public.privacy_groups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "groups_insert_own" ON public.privacy_groups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "groups_update_own" ON public.privacy_groups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "groups_delete_own" ON public.privacy_groups FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para group_members
CREATE POLICY "members_select_own" ON public.group_members FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.privacy_groups WHERE id = group_id AND user_id = auth.uid()));
CREATE POLICY "members_insert_own" ON public.group_members FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.privacy_groups WHERE id = group_id AND user_id = auth.uid()));
CREATE POLICY "members_delete_own" ON public.group_members FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.privacy_groups WHERE id = group_id AND user_id = auth.uid()));

-- Políticas RLS para emotion_entries
CREATE POLICY "entries_select_own" ON public.emotion_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "entries_insert_own" ON public.emotion_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "entries_update_own" ON public.emotion_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "entries_delete_own" ON public.emotion_entries FOR DELETE USING (auth.uid() = user_id);

-- Trigger para crear grupos por defecto al crear perfil
CREATE OR REPLACE FUNCTION public.create_default_groups()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.privacy_groups (user_id, name, is_system) VALUES
    (NEW.id, 'Todos', TRUE),
    (NEW.id, 'Solo yo', TRUE),
    (NEW.id, 'Familia', FALSE),
    (NEW.id, 'Amigos cercanos', FALSE),
    (NEW.id, 'Trabajo', FALSE);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_groups();
