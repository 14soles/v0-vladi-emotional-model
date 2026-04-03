-- Tool Sessions table: stores completed tool activity sessions
CREATE TABLE IF NOT EXISTS tool_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tool_code TEXT NOT NULL, -- e.g., 'put_a_name_v1'
  mode TEXT NOT NULL CHECK (mode IN ('assessment', 'training')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  items_presented_count INTEGER NOT NULL DEFAULT 0,
  items_answered_count INTEGER NOT NULL DEFAULT 0,
  total_time_ms INTEGER,
  accuracy_score_100 INTEGER, -- 0-100 percentage
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tool Answers table: stores individual answers within sessions
CREATE TABLE IF NOT EXISTS tool_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES tool_sessions(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL, -- e.g., 'PN1', 'PN2'
  tool_code TEXT NOT NULL,
  domain TEXT, -- 'recognition' or 'understanding'
  subdomain TEXT, -- 'emotional_labeling'
  context_tag TEXT, -- 'trabajo', 'pareja', etc.
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  selected_option TEXT,
  correct_option TEXT NOT NULL,
  is_correct BOOLEAN,
  raw_score INTEGER NOT NULL DEFAULT 0 CHECK (raw_score IN (0, 1)),
  response_time_ms INTEGER,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  shown_at TIMESTAMPTZ NOT NULL,
  answered_at TIMESTAMPTZ,
  presented_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tool Item Stats table: aggregated stats per user per item
CREATE TABLE IF NOT EXISTS tool_item_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  tool_code TEXT NOT NULL,
  times_seen INTEGER NOT NULL DEFAULT 0,
  times_correct INTEGER NOT NULL DEFAULT 0,
  avg_response_time_ms INTEGER,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, item_id, tool_code)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tool_sessions_profile ON tool_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_tool_sessions_tool_code ON tool_sessions(tool_code);
CREATE INDEX IF NOT EXISTS idx_tool_sessions_completed ON tool_sessions(is_completed, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_answers_session ON tool_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_tool_answers_profile ON tool_answers(profile_id);
CREATE INDEX IF NOT EXISTS idx_tool_answers_item ON tool_answers(item_id);

CREATE INDEX IF NOT EXISTS idx_tool_item_stats_profile ON tool_item_stats(profile_id);
CREATE INDEX IF NOT EXISTS idx_tool_item_stats_item ON tool_item_stats(item_id, tool_code);

-- RLS Policies
ALTER TABLE tool_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_item_stats ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own data
CREATE POLICY "Users can view own tool sessions"
  ON tool_sessions FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own tool sessions"
  ON tool_sessions FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own tool sessions"
  ON tool_sessions FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can view own tool answers"
  ON tool_answers FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own tool answers"
  ON tool_answers FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can view own tool item stats"
  ON tool_item_stats FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own tool item stats"
  ON tool_item_stats FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own tool item stats"
  ON tool_item_stats FOR UPDATE
  USING (auth.uid() = profile_id);
