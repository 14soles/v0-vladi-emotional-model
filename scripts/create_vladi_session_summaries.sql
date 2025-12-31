-- Create table for Vladi session summaries
CREATE TABLE IF NOT EXISTS vladi_session_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Session metadata
  mode TEXT NOT NULL CHECK (mode IN ('DATOS', 'EMOCIONAL', 'ACCION', 'REVISION', 'ALERTA')),
  primary_emotion TEXT,
  secondary_emotions TEXT[],
  topic TEXT,
  user_goal TEXT,
  
  -- Data used
  used_snapshot BOOLEAN DEFAULT false,
  used_metrics_7d BOOLEAN DEFAULT false,
  used_metrics_30d BOOLEAN DEFAULT false,
  used_memory BOOLEAN DEFAULT false,
  
  -- Insights and hypotheses
  key_insights JSONB DEFAULT '[]',
  hypotheses TEXT[],
  
  -- Activity tracking
  recommended_activity_id TEXT,
  recommended_activity_title TEXT,
  activity_completed TEXT CHECK (activity_completed IN ('yes', 'no', 'unknown')),
  
  -- Measurements
  pre_intensity_0_10 INTEGER CHECK (pre_intensity_0_10 BETWEEN 0 AND 10),
  post_intensity_0_10 INTEGER CHECK (post_intensity_0_10 BETWEEN 0 AND 10),
  pre_certainty_0_10 INTEGER CHECK (pre_certainty_0_10 BETWEEN 0 AND 10),
  post_certainty_0_10 INTEGER CHECK (post_certainty_0_10 BETWEEN 0 AND 10),
  usefulness_0_10 INTEGER CHECK (usefulness_0_10 BETWEEN 0 AND 10),
  
  -- Follow-up actions
  follow_up JSONB DEFAULT '[]',
  
  -- Flags
  flag_crisis BOOLEAN DEFAULT false,
  flag_medical BOOLEAN DEFAULT false,
  flag_self_harm_mention BOOLEAN DEFAULT false,
  flag_violence_mention BOOLEAN DEFAULT false,
  flag_sensitive BOOLEAN DEFAULT false
);

-- Add RLS policies
ALTER TABLE vladi_session_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own session summaries"
  ON vladi_session_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own session summaries"
  ON vladi_session_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_vladi_sessions_user_created ON vladi_session_summaries(user_id, created_at DESC);
CREATE INDEX idx_vladi_sessions_mode ON vladi_session_summaries(user_id, mode);
