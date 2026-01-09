-- Create table to store complete conversation messages
CREATE TABLE IF NOT EXISTS vladi_conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Add RLS policies
ALTER TABLE vladi_conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON vladi_conversation_messages
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
  ON vladi_conversation_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_conversation_messages_session ON vladi_conversation_messages(session_id, created_at);
