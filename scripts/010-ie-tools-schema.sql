-- =====================================================
-- IE Tools Schema: tool_items, tool_sessions, tool_answers
-- =====================================================

-- 1. tool_items: Banco de preguntas/ítems para herramientas IE
CREATE TABLE IF NOT EXISTS public.tool_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_code TEXT NOT NULL, -- 'put_a_name_v1', 'emotion_match_v1', etc.
  item_code TEXT NOT NULL UNIQUE, -- 'PN1', 'PN2', etc.
  domain TEXT NOT NULL, -- 'recognition', 'understanding', 'management'
  subdomain TEXT, -- 'emotional_labeling', 'emotion_differentiation', etc.
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  context_tag TEXT, -- 'trabajo', 'pareja', 'rechazo', 'incertidumbre', etc.
  prompt TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of {key: string, label: string}
  correct_option TEXT NOT NULL, -- The key of the correct option
  rationale_internal TEXT, -- Internal explanation (not shown to user)
  is_anchor_item BOOLEAN DEFAULT false, -- Reserved for assessment/checkpoints
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. tool_sessions: Sesiones de uso de herramientas
CREATE TABLE IF NOT EXISTS public.tool_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tool_code TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('training', 'assessment')),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  items_presented_count INTEGER DEFAULT 0,
  items_answered_count INTEGER DEFAULT 0,
  total_time_ms INTEGER,
  accuracy_score_100 NUMERIC(5,2), -- 0-100 score
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. tool_answers: Respuestas individuales por sesión
CREATE TABLE IF NOT EXISTS public.tool_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.tool_sessions(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.tool_items(id) ON DELETE CASCADE,
  tool_code TEXT NOT NULL,
  domain TEXT,
  subdomain TEXT,
  context_tag TEXT,
  difficulty TEXT,
  selected_option TEXT NOT NULL, -- The key selected by user
  correct_option TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  raw_score NUMERIC(3,2) DEFAULT 0, -- 0 or 1 typically
  response_time_ms INTEGER,
  confidence_score INTEGER, -- Optional 0-100 confidence
  shown_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ DEFAULT now(),
  presented_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. tool_item_stats: Estadísticas agregadas por usuario e ítem
CREATE TABLE IF NOT EXISTS public.tool_item_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.tool_items(id) ON DELETE CASCADE,
  tool_code TEXT NOT NULL,
  times_seen INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, item_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tool_items_tool_code ON public.tool_items(tool_code);
CREATE INDEX IF NOT EXISTS idx_tool_items_active ON public.tool_items(is_active);
CREATE INDEX IF NOT EXISTS idx_tool_items_anchor ON public.tool_items(is_anchor_item);
CREATE INDEX IF NOT EXISTS idx_tool_sessions_profile ON public.tool_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_tool_sessions_tool_code ON public.tool_sessions(tool_code);
CREATE INDEX IF NOT EXISTS idx_tool_answers_session ON public.tool_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_tool_answers_profile ON public.tool_answers(profile_id);
CREATE INDEX IF NOT EXISTS idx_tool_item_stats_profile ON public.tool_item_stats(profile_id);

-- Enable RLS
ALTER TABLE public.tool_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_item_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tool_items (read-only for all authenticated users)
CREATE POLICY tool_items_read ON public.tool_items
  FOR SELECT TO authenticated
  USING (is_active = true);

-- RLS Policies for tool_sessions
CREATE POLICY tool_sessions_select_own ON public.tool_sessions
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY tool_sessions_insert_own ON public.tool_sessions
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY tool_sessions_update_own ON public.tool_sessions
  FOR UPDATE TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- RLS Policies for tool_answers
CREATE POLICY tool_answers_select_own ON public.tool_answers
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY tool_answers_insert_own ON public.tool_answers
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- RLS Policies for tool_item_stats
CREATE POLICY tool_item_stats_select_own ON public.tool_item_stats
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY tool_item_stats_insert_own ON public.tool_item_stats
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY tool_item_stats_update_own ON public.tool_item_stats
  FOR UPDATE TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
