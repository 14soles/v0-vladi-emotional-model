-- Migration: Complete Social Notifications System
-- This adds notifications for views, comments, and replies

-- ============================================
-- 1. Create social_notifications table (unified notification system)
-- ============================================
CREATE TABLE IF NOT EXISTS public.social_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN (
    'view',           -- Someone viewed your emotion
    'comment',        -- Someone commented on your emotion
    'comment_reply',  -- Someone replied to your comment
    'friend_request', -- Someone sent you a friend request
    'friend_accepted',-- Someone accepted your friend request
    'group_invitation', -- Someone invited you to a group
    'group_accepted'  -- Someone accepted your group invitation
  )),
  entry_id uuid REFERENCES public.emotion_entries(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.emotion_comments(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.privacy_groups(id) ON DELETE CASCADE,
  group_name text,
  emotion_name text, -- Store emotion name for display
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for social_notifications
DROP POLICY IF EXISTS "social_notifications_select_own" ON public.social_notifications;
CREATE POLICY "social_notifications_select_own" ON public.social_notifications
  FOR SELECT USING (auth.uid() = to_user_id);

DROP POLICY IF EXISTS "social_notifications_insert" ON public.social_notifications;
CREATE POLICY "social_notifications_insert" ON public.social_notifications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "social_notifications_update_own" ON public.social_notifications;
CREATE POLICY "social_notifications_update_own" ON public.social_notifications
  FOR UPDATE USING (auth.uid() = to_user_id);

DROP POLICY IF EXISTS "social_notifications_delete_own" ON public.social_notifications;
CREATE POLICY "social_notifications_delete_own" ON public.social_notifications
  FOR DELETE USING (auth.uid() = to_user_id);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_social_notifications_to_user ON public.social_notifications(to_user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_social_notifications_created ON public.social_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_notifications_type ON public.social_notifications(notification_type);

-- ============================================
-- 2. Add parent_comment_id to emotion_comments for replies
-- ============================================
ALTER TABLE public.emotion_comments ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES public.emotion_comments(id) ON DELETE CASCADE;

-- Index for faster reply lookups
CREATE INDEX IF NOT EXISTS idx_emotion_comments_parent ON public.emotion_comments(parent_comment_id);

-- ============================================
-- 3. Update RLS policies for emotion_views to allow reading all views on visible entries
-- ============================================
DROP POLICY IF EXISTS "views_select_own" ON public.emotion_views;
DROP POLICY IF EXISTS "views_select_all" ON public.emotion_views;
CREATE POLICY "views_select_all" ON public.emotion_views 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "views_delete_own" ON public.emotion_views;
CREATE POLICY "views_delete_own" ON public.emotion_views 
  FOR DELETE USING (auth.uid() = viewer_id);

-- ============================================
-- 4. Migrate existing acceptance_notifications to social_notifications
-- ============================================
INSERT INTO public.social_notifications (to_user_id, from_user_id, notification_type, group_id, group_name, is_read, created_at)
SELECT 
  to_user_id, 
  from_user_id, 
  notification_type::text, 
  group_id, 
  group_name, 
  is_read, 
  created_at
FROM public.acceptance_notifications
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. Function to create notification when viewing an emotion
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_emotion_view()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  entry_owner_id uuid;
  entry_emotion text;
BEGIN
  -- Get the entry owner and emotion name
  SELECT user_id, emotion INTO entry_owner_id, entry_emotion
  FROM public.emotion_entries
  WHERE id = NEW.entry_id;
  
  -- Don't notify if viewing own entry
  IF entry_owner_id = NEW.viewer_id THEN
    RETURN NEW;
  END IF;
  
  -- Create notification
  INSERT INTO public.social_notifications (
    to_user_id,
    from_user_id,
    notification_type,
    entry_id,
    emotion_name
  ) VALUES (
    entry_owner_id,
    NEW.viewer_id,
    'view',
    NEW.entry_id,
    entry_emotion
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for emotion views
DROP TRIGGER IF EXISTS on_emotion_view_insert ON public.emotion_views;
CREATE TRIGGER on_emotion_view_insert
  AFTER INSERT ON public.emotion_views
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_emotion_view();

-- ============================================
-- 6. Function to create notification when commenting
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_emotion_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  entry_owner_id uuid;
  entry_emotion text;
  parent_author_id uuid;
BEGIN
  -- Get the entry owner and emotion name
  SELECT user_id, emotion INTO entry_owner_id, entry_emotion
  FROM public.emotion_entries
  WHERE id = NEW.entry_id;
  
  -- Check if this is a reply to another comment
  IF NEW.parent_comment_id IS NOT NULL THEN
    -- Get the parent comment author
    SELECT author_id INTO parent_author_id
    FROM public.emotion_comments
    WHERE id = NEW.parent_comment_id;
    
    -- Don't notify if replying to own comment
    IF parent_author_id != NEW.author_id THEN
      INSERT INTO public.social_notifications (
        to_user_id,
        from_user_id,
        notification_type,
        entry_id,
        comment_id,
        emotion_name
      ) VALUES (
        parent_author_id,
        NEW.author_id,
        'comment_reply',
        NEW.entry_id,
        NEW.id,
        entry_emotion
      );
    END IF;
  END IF;
  
  -- Notify entry owner about the comment (if not commenting on own entry)
  IF entry_owner_id != NEW.author_id THEN
    INSERT INTO public.social_notifications (
      to_user_id,
      from_user_id,
      notification_type,
      entry_id,
      comment_id,
      emotion_name
    ) VALUES (
      entry_owner_id,
      NEW.author_id,
      'comment',
      NEW.entry_id,
      NEW.id,
      entry_emotion
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for comments
DROP TRIGGER IF EXISTS on_emotion_comment_insert ON public.emotion_comments;
CREATE TRIGGER on_emotion_comment_insert
  AFTER INSERT ON public.emotion_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_emotion_comment();

-- ============================================
-- 7. Function to remove view notification when unviewing
-- ============================================
CREATE OR REPLACE FUNCTION public.remove_view_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remove the view notification
  DELETE FROM public.social_notifications
  WHERE from_user_id = OLD.viewer_id
    AND entry_id = OLD.entry_id
    AND notification_type = 'view';
  
  RETURN OLD;
END;
$$;

-- Create trigger for emotion view removal
DROP TRIGGER IF EXISTS on_emotion_view_delete ON public.emotion_views;
CREATE TRIGGER on_emotion_view_delete
  BEFORE DELETE ON public.emotion_views
  FOR EACH ROW
  EXECUTE FUNCTION public.remove_view_notification();
