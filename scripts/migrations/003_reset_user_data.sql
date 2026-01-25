-- =====================================================
-- RESET USER DATA FOR FRESH START
-- This script clears all user activity data while 
-- preserving user accounts and profiles
-- =====================================================

-- 1. Clear intervention logs
TRUNCATE TABLE interventions_log CASCADE;

-- 2. Clear emotion episodes (junction table first)
TRUNCATE TABLE emotion_episode_entries CASCADE;
TRUNCATE TABLE emotion_episodes CASCADE;

-- 3. Clear user events/telemetry
TRUNCATE TABLE user_events CASCADE;

-- 4. Clear app sessions
TRUNCATE TABLE app_sessions CASCADE;

-- 5. Clear emotion entries (main emotion data)
TRUNCATE TABLE emotion_entries CASCADE;

-- 6. Clear chat/conversation history if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vladi_conversations') THEN
    TRUNCATE TABLE vladi_conversations CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
    TRUNCATE TABLE chat_messages CASCADE;
  END IF;
END $$;

-- 7. Clear social feed reactions if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'emotion_reactions') THEN
    TRUNCATE TABLE emotion_reactions CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'emotion_comments') THEN
    TRUNCATE TABLE emotion_comments CASCADE;
  END IF;
END $$;

-- NOTE: The following are PRESERVED:
-- - auth.users (user accounts)
-- - profiles (user profile data)
-- - friend_requests (pending friend requests)
-- - friendships (existing friendships)
-- - user settings/preferences

SELECT 'User data reset complete. Accounts and profiles preserved.' as status;
