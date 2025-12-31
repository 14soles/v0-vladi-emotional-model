-- Create table to track which users have marked posts as seen
-- This ensures the "visto" state persists across sessions

CREATE TABLE IF NOT EXISTS user_seen_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES emotion_entries(id) ON DELETE CASCADE,
  seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, entry_id)
);

-- Add RLS policies
ALTER TABLE user_seen_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own seen posts"
  ON user_seen_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark posts as seen"
  ON user_seen_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unmark their seen posts"
  ON user_seen_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_user_seen_posts_user ON user_seen_posts(user_id);
CREATE INDEX idx_user_seen_posts_entry ON user_seen_posts(entry_id);
