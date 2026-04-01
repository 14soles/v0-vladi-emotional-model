-- Migration: Complete Assessment System for Initial Emotional Quiz
-- This creates the full database structure for the 36-question baseline assessment

-- ============================================
-- TABLE 1: assessment_definitions
-- Defines the test structure
-- ============================================
CREATE TABLE IF NOT EXISTS assessment_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  version integer DEFAULT 1,
  total_questions integer DEFAULT 36,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Insert the initial quiz definition
INSERT INTO assessment_definitions (slug, title, description, version, total_questions)
VALUES (
  'initial_quiz_v1',
  'Evaluación Emocional Inicial',
  'Test de 36 preguntas para establecer el punto de partida emocional del usuario',
  1,
  36
) ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- TABLE 2: assessment_questions
-- Bank of questions
-- ============================================
CREATE TABLE IF NOT EXISTS assessment_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_definition_id uuid REFERENCES assessment_definitions(id) ON DELETE CASCADE,
  code text NOT NULL,
  domain text NOT NULL CHECK (domain IN ('recognition', 'understanding', 'management')),
  question_type text NOT NULL CHECK (question_type IN ('single_choice', 'ranking')),
  prompt text NOT NULL,
  media_type text DEFAULT 'none' CHECK (media_type IN ('none', 'image', 'video')),
  media_url text,
  order_index integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(assessment_definition_id, code)
);

-- ============================================
-- TABLE 3: assessment_options
-- Response options for each question
-- ============================================
CREATE TABLE IF NOT EXISTS assessment_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES assessment_questions(id) ON DELETE CASCADE NOT NULL,
  option_key text NOT NULL,
  label text NOT NULL,
  display_order integer NOT NULL,
  is_correct boolean DEFAULT false,
  weight numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(question_id, option_key)
);

-- ============================================
-- TABLE 4: assessment_question_metadata
-- For rankings or special configurations
-- ============================================
CREATE TABLE IF NOT EXISTS assessment_question_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES assessment_questions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  correct_order_json jsonb,
  extra_rules_json jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================
-- TABLE 5: assessment_sessions
-- One session per user attempt
-- ============================================
CREATE TABLE IF NOT EXISTS assessment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  assessment_definition_id uuid REFERENCES assessment_definitions(id) ON DELETE CASCADE NOT NULL,
  session_type text DEFAULT 'baseline' CHECK (session_type IN ('baseline', 'checkpoint', 'retest')),
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  started_at timestamp with time zone DEFAULT now() NOT NULL,
  completed_at timestamp with time zone,
  total_time_ms integer,
  current_question_index integer DEFAULT 0,
  completed_questions_count integer DEFAULT 0,
  is_first_assessment boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================
-- TABLE 6: assessment_answers
-- Each individual response
-- ============================================
CREATE TABLE IF NOT EXISTS assessment_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES assessment_sessions(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES assessment_questions(id) ON DELETE CASCADE NOT NULL,
  domain text NOT NULL CHECK (domain IN ('recognition', 'understanding', 'management')),
  question_type text NOT NULL CHECK (question_type IN ('single_choice', 'ranking')),
  presented_order integer NOT NULL,
  selected_option_id uuid REFERENCES assessment_options(id),
  selected_option_key text,
  selected_order_json jsonb,
  is_correct boolean DEFAULT false,
  raw_score numeric DEFAULT 0,
  response_time_ms integer,
  shown_at timestamp with time zone NOT NULL,
  answered_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================
-- TABLE 7: assessment_results
-- Final summary of the session
-- ============================================
CREATE TABLE IF NOT EXISTS assessment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES assessment_sessions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recognition_score_raw numeric DEFAULT 0,
  recognition_score_100 numeric DEFAULT 0,
  understanding_score_raw numeric DEFAULT 0,
  understanding_score_100 numeric DEFAULT 0,
  management_score_raw numeric DEFAULT 0,
  management_score_100 numeric DEFAULT 0,
  global_score_raw numeric DEFAULT 0,
  global_score_100 numeric DEFAULT 0,
  strongest_domain text,
  weakest_domain text,
  total_time_ms integer,
  average_response_time_ms integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================
-- TABLE 8: profile_assessment_baseline
-- Links user to their official baseline
-- ============================================
CREATE TABLE IF NOT EXISTS profile_assessment_baseline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  baseline_session_id uuid REFERENCES assessment_sessions(id) ON DELETE CASCADE NOT NULL,
  baseline_result_id uuid REFERENCES assessment_results(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_assessment_questions_definition ON assessment_questions(assessment_definition_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_domain ON assessment_questions(domain);
CREATE INDEX IF NOT EXISTS idx_assessment_options_question ON assessment_options(question_id);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_profile ON assessment_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_status ON assessment_sessions(status);
CREATE INDEX IF NOT EXISTS idx_assessment_answers_session ON assessment_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_assessment_answers_profile ON assessment_answers(profile_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_profile ON assessment_results(profile_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- assessment_definitions - read only for all authenticated users
ALTER TABLE assessment_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS assessment_definitions_select ON assessment_definitions;
CREATE POLICY assessment_definitions_select ON assessment_definitions
  FOR SELECT TO authenticated USING (true);

-- assessment_questions - read only for all authenticated users
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS assessment_questions_select ON assessment_questions;
CREATE POLICY assessment_questions_select ON assessment_questions
  FOR SELECT TO authenticated USING (true);

-- assessment_options - read only for all authenticated users
ALTER TABLE assessment_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS assessment_options_select ON assessment_options;
CREATE POLICY assessment_options_select ON assessment_options
  FOR SELECT TO authenticated USING (true);

-- assessment_question_metadata - read only for all authenticated users
ALTER TABLE assessment_question_metadata ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS assessment_question_metadata_select ON assessment_question_metadata;
CREATE POLICY assessment_question_metadata_select ON assessment_question_metadata
  FOR SELECT TO authenticated USING (true);

-- assessment_sessions - users can only access their own
ALTER TABLE assessment_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS assessment_sessions_select_own ON assessment_sessions;
CREATE POLICY assessment_sessions_select_own ON assessment_sessions
  FOR SELECT USING (profile_id = auth.uid());
DROP POLICY IF EXISTS assessment_sessions_insert_own ON assessment_sessions;
CREATE POLICY assessment_sessions_insert_own ON assessment_sessions
  FOR INSERT WITH CHECK (profile_id = auth.uid());
DROP POLICY IF EXISTS assessment_sessions_update_own ON assessment_sessions;
CREATE POLICY assessment_sessions_update_own ON assessment_sessions
  FOR UPDATE USING (profile_id = auth.uid());

-- assessment_answers - users can only access their own
ALTER TABLE assessment_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS assessment_answers_select_own ON assessment_answers;
CREATE POLICY assessment_answers_select_own ON assessment_answers
  FOR SELECT USING (profile_id = auth.uid());
DROP POLICY IF EXISTS assessment_answers_insert_own ON assessment_answers;
CREATE POLICY assessment_answers_insert_own ON assessment_answers
  FOR INSERT WITH CHECK (profile_id = auth.uid());
DROP POLICY IF EXISTS assessment_answers_update_own ON assessment_answers;
CREATE POLICY assessment_answers_update_own ON assessment_answers
  FOR UPDATE USING (profile_id = auth.uid());

-- assessment_results - users can only access their own
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS assessment_results_select_own ON assessment_results;
CREATE POLICY assessment_results_select_own ON assessment_results
  FOR SELECT USING (profile_id = auth.uid());
DROP POLICY IF EXISTS assessment_results_insert_own ON assessment_results;
CREATE POLICY assessment_results_insert_own ON assessment_results
  FOR INSERT WITH CHECK (profile_id = auth.uid());

-- profile_assessment_baseline - users can only access their own
ALTER TABLE profile_assessment_baseline ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profile_assessment_baseline_select_own ON profile_assessment_baseline;
CREATE POLICY profile_assessment_baseline_select_own ON profile_assessment_baseline
  FOR SELECT USING (profile_id = auth.uid());
DROP POLICY IF EXISTS profile_assessment_baseline_insert_own ON profile_assessment_baseline;
CREATE POLICY profile_assessment_baseline_insert_own ON profile_assessment_baseline
  FOR INSERT WITH CHECK (profile_id = auth.uid());
