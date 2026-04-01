-- Migration: Create initial quiz tables for emotional assessment
-- This quiz appears once when users first access VLADI tab

-- Add initial_quiz_completed to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS initial_quiz_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS initial_quiz_completed_at timestamp with time zone;

-- Table for quiz sessions (tracks progress through the quiz)
CREATE TABLE IF NOT EXISTS initial_quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  started_at timestamp with time zone DEFAULT now() NOT NULL,
  completed_at timestamp with time zone,
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  current_question_index integer DEFAULT 0,
  total_questions integer,
  total_duration_ms integer,
  score_total numeric,
  score_recognition numeric,
  score_comprehension numeric,
  score_regulation numeric,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Table for individual quiz responses
CREATE TABLE IF NOT EXISTS initial_quiz_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES initial_quiz_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id text NOT NULL,
  question_index integer NOT NULL,
  domain text NOT NULL CHECK (domain IN ('recognition', 'comprehension', 'regulation')),
  question_type text NOT NULL CHECK (question_type IN ('video', 'scenario', 'situation')),
  selected_answer text NOT NULL,
  is_correct boolean,
  score numeric DEFAULT 0,
  response_time_ms integer,
  shown_at timestamp with time zone NOT NULL,
  answered_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user ON initial_quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_status ON initial_quiz_sessions(status);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_session ON initial_quiz_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_user ON initial_quiz_responses(user_id);

-- RLS Policies for initial_quiz_sessions
ALTER TABLE initial_quiz_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quiz_sessions_select_own ON initial_quiz_sessions;
CREATE POLICY quiz_sessions_select_own ON initial_quiz_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS quiz_sessions_insert_own ON initial_quiz_sessions;
CREATE POLICY quiz_sessions_insert_own ON initial_quiz_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS quiz_sessions_update_own ON initial_quiz_sessions;
CREATE POLICY quiz_sessions_update_own ON initial_quiz_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for initial_quiz_responses
ALTER TABLE initial_quiz_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quiz_responses_select_own ON initial_quiz_responses;
CREATE POLICY quiz_responses_select_own ON initial_quiz_responses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS quiz_responses_insert_own ON initial_quiz_responses;
CREATE POLICY quiz_responses_insert_own ON initial_quiz_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS quiz_responses_update_own ON initial_quiz_responses;
CREATE POLICY quiz_responses_update_own ON initial_quiz_responses
  FOR UPDATE USING (auth.uid() = user_id);
