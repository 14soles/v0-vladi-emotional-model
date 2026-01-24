-- DEAM EQ Telemetry System Migration
-- Creates: app_sessions, user_events, interventions_log, emotion_episodes, emotion_episode_entries
-- Updates: emotion_entries with visibility fields

-- 1) Enum de tipos de intervención (v1)
DO $$ BEGIN
  CREATE TYPE intervention_type AS ENUM (
    'breathing_478',
    'breathing_box',
    'grounding_54321',
    'journaling_brief',
    'movement_quick',
    'meditation_body_scan',
    'cognitive_reframe',
    'social_reachout'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2) Enum de nombres de eventos
DO $$ BEGIN
  CREATE TYPE user_event_name AS ENUM (
    'app_open','app_close',
    'emotion_start','emotion_complete','emotion_abandon',
    'emotion_edit','emotion_delete',
    'ieq_view','ieq_detail_open',
    'chat_start','chat_end',
    'intervention_start','intervention_complete','intervention_abandon',
    'social_view','social_interact',
    'notification_sent','notification_open',
    'consent_updated','share_toggle',
    'friend_request_sent','friend_add'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3) Tabla app_sessions (sesiones de usuario en la app)
CREATE TABLE IF NOT EXISTS public.app_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz NULL,
  platform text NULL CHECK (platform IN ('ios','android','web','unknown')),
  app_version text NULL,
  device_id text NULL,
  screens_visited text[] DEFAULT '{}',
  emotions_registered int DEFAULT 0,
  chat_interactions int DEFAULT 0,
  interventions_completed int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_started ON public.app_sessions(user_id, started_at DESC);

-- RLS for app_sessions
ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select_own" ON public.app_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "sessions_insert_own" ON public.app_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions_update_own" ON public.app_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- 4) Tabla user_events (telemetría)
CREATE TABLE IF NOT EXISTS public.user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id uuid NULL REFERENCES public.app_sessions(id) ON DELETE SET NULL,
  name user_event_name NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  screen text NULL,
  platform text NULL CHECK (platform IN ('ios','android','web','unknown')),
  app_version text NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_user_time ON public.user_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_name_time ON public.user_events(name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_session ON public.user_events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_props_gin ON public.user_events USING gin(properties);

-- RLS for user_events
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select_own" ON public.user_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "events_insert_own" ON public.user_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5) Tabla emotion_episodes (episodios emocionales)
CREATE TABLE IF NOT EXISTS public.emotion_episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL,
  ended_at timestamptz NOT NULL,
  dominant_family text NULL,
  dominant_valence numeric NULL CHECK (dominant_valence BETWEEN -1 AND 1),
  peak_intensity int NULL CHECK (peak_intensity BETWEEN 0 AND 10),
  entries_count int NOT NULL DEFAULT 0,
  interventions_count int NOT NULL DEFAULT 0,
  recovered_at timestamptz NULL,
  recovery_time_minutes int NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_episodes_user_time ON public.emotion_episodes(user_id, started_at DESC);

-- RLS for emotion_episodes
ALTER TABLE public.emotion_episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "episodes_select_own" ON public.emotion_episodes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "episodes_insert_own" ON public.emotion_episodes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "episodes_update_own" ON public.emotion_episodes
  FOR UPDATE USING (auth.uid() = user_id);

-- 6) Tabla puente emotion_episode_entries
CREATE TABLE IF NOT EXISTS public.emotion_episode_entries (
  episode_id uuid NOT NULL REFERENCES public.emotion_episodes(id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES public.emotion_entries(id) ON DELETE CASCADE,
  PRIMARY KEY (episode_id, entry_id)
);

CREATE INDEX IF NOT EXISTS idx_episode_entries_entry ON public.emotion_episode_entries(entry_id);

-- RLS for emotion_episode_entries
ALTER TABLE public.emotion_episode_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "episode_entries_select_own" ON public.emotion_episode_entries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.emotion_episodes WHERE id = episode_id AND user_id = auth.uid())
  );

CREATE POLICY "episode_entries_insert_own" ON public.emotion_episode_entries
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.emotion_episodes WHERE id = episode_id AND user_id = auth.uid())
  );

-- 7) Tabla interventions_log (registro de intervenciones)
CREATE TABLE IF NOT EXISTS public.interventions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emotion_entry_id uuid NULL REFERENCES public.emotion_entries(id) ON DELETE SET NULL,
  episode_id uuid NULL REFERENCES public.emotion_episodes(id) ON DELETE SET NULL,
  intervention intervention_type NOT NULL,
  source text NOT NULL DEFAULT 'post_entry' CHECK (source IN ('post_entry','tools_menu','vladi_suggested')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz NULL,
  duration_planned_sec int NULL,
  duration_actual_sec int NULL,
  intensity_before int NULL CHECK (intensity_before BETWEEN 0 AND 10),
  valence_before numeric NULL CHECK (valence_before BETWEEN -1 AND 1),
  arousal_before numeric NULL CHECK (arousal_before BETWEEN -1 AND 1),
  intensity_after int NULL CHECK (intensity_after BETWEEN 0 AND 10),
  valence_after numeric NULL CHECK (valence_after BETWEEN -1 AND 1),
  arousal_after numeric NULL CHECK (arousal_after BETWEEN -1 AND 1),
  helpfulness smallint NULL CHECK (helpfulness BETWEEN 1 AND 5),
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interventions_user_started ON public.interventions_log(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_interventions_entry ON public.interventions_log(emotion_entry_id);
CREATE INDEX IF NOT EXISTS idx_interventions_episode ON public.interventions_log(episode_id);

-- RLS for interventions_log
ALTER TABLE public.interventions_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interventions_select_own" ON public.interventions_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "interventions_insert_own" ON public.interventions_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "interventions_update_own" ON public.interventions_log
  FOR UPDATE USING (auth.uid() = user_id);

-- 8) Añadir campos de visibilidad a emotion_entries
ALTER TABLE public.emotion_entries
ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private'
CHECK (visibility IN ('private','friends','public'));

ALTER TABLE public.emotion_entries
ADD COLUMN IF NOT EXISTS anonymous_in_feed boolean NOT NULL DEFAULT false;

-- 9) Trigger para updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_interventions_updated_at ON public.interventions_log;
CREATE TRIGGER trg_interventions_updated_at
BEFORE UPDATE ON public.interventions_log
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_episodes_updated_at ON public.emotion_episodes;
CREATE TRIGGER trg_episodes_updated_at
BEFORE UPDATE ON public.emotion_episodes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
