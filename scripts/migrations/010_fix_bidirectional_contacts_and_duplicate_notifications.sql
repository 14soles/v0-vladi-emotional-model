-- Migration: Fix bidirectional contacts and duplicate notifications
-- ============================================

-- ============================================
-- ISSUE 1: Bidirectional contacts on friend request acceptance
-- Problem: When user A accepts user B's friend request, user A cannot 
-- insert a contact entry for user B (because RLS requires auth.uid() = user_id)
-- 
-- Solution: Create a SECURITY DEFINER function that handles the full acceptance
-- flow and can insert contacts for both users
-- ============================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_friend_request_accepted ON public.friend_requests;

-- Create function to handle friend request acceptance
CREATE OR REPLACE FUNCTION public.handle_friend_request_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_profile RECORD;
  accepter_profile RECORD;
  requester_contact_id uuid;
  accepter_contact_id uuid;
  requester_todos_group_id uuid;
  accepter_todos_group_id uuid;
BEGIN
  -- Only process when status changes to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    
    -- Get profiles for both users
    SELECT id, display_name, username INTO requester_profile
    FROM public.profiles WHERE id = NEW.from_user_id;
    
    SELECT id, display_name, username INTO accepter_profile
    FROM public.profiles WHERE id = NEW.to_user_id;
    
    -- Create/update contact for accepter (adding the requester)
    INSERT INTO public.contacts (user_id, contact_user_id, contact_name, friendship_status)
    VALUES (
      NEW.to_user_id,
      NEW.from_user_id,
      COALESCE(requester_profile.display_name, requester_profile.username, 'Usuario'),
      'accepted'
    )
    ON CONFLICT (user_id, contact_user_id) 
    DO UPDATE SET friendship_status = 'accepted', contact_name = EXCLUDED.contact_name
    RETURNING id INTO accepter_contact_id;
    
    -- Create/update contact for requester (adding the accepter) - THIS IS THE CRITICAL PART
    INSERT INTO public.contacts (user_id, contact_user_id, contact_name, friendship_status)
    VALUES (
      NEW.from_user_id,
      NEW.to_user_id,
      COALESCE(accepter_profile.display_name, accepter_profile.username, 'Usuario'),
      'accepted'
    )
    ON CONFLICT (user_id, contact_user_id) 
    DO UPDATE SET friendship_status = 'accepted', contact_name = EXCLUDED.contact_name
    RETURNING id INTO requester_contact_id;
    
    -- Get "Todos" groups for both users
    SELECT id INTO accepter_todos_group_id
    FROM public.privacy_groups 
    WHERE user_id = NEW.to_user_id AND name = 'Todos';
    
    SELECT id INTO requester_todos_group_id
    FROM public.privacy_groups 
    WHERE user_id = NEW.from_user_id AND name = 'Todos';
    
    -- Add to accepter's "Todos" group
    IF accepter_todos_group_id IS NOT NULL AND accepter_contact_id IS NOT NULL THEN
      INSERT INTO public.group_members (group_id, contact_id)
      VALUES (accepter_todos_group_id, accepter_contact_id)
      ON CONFLICT (group_id, contact_id) DO NOTHING;
    END IF;
    
    -- Add to requester's "Todos" group
    IF requester_todos_group_id IS NOT NULL AND requester_contact_id IS NOT NULL THEN
      INSERT INTO public.group_members (group_id, contact_id)
      VALUES (requester_todos_group_id, requester_contact_id)
      ON CONFLICT (group_id, contact_id) DO NOTHING;
    END IF;
    
    -- Create acceptance notification for the original requester
    INSERT INTO public.acceptance_notifications (notification_type, from_user_id, to_user_id)
    VALUES ('friend_accepted', NEW.to_user_id, NEW.from_user_id);
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for friend request acceptance
CREATE TRIGGER on_friend_request_accepted
  AFTER UPDATE ON public.friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_friend_request_accepted();


-- ============================================
-- ISSUE 2: Duplicate notifications for comments
-- Problem: The database trigger creates notifications AND the frontend code 
-- ALSO creates notifications, resulting in duplicates
-- 
-- Solution A: Add a unique constraint to prevent duplicates
-- Solution B: Modify the trigger to use ON CONFLICT
-- ============================================

-- Add unique constraint on social_notifications for comment notifications
-- This prevents duplicate notifications for the same comment
ALTER TABLE public.social_notifications 
  DROP CONSTRAINT IF EXISTS social_notifications_comment_unique;

-- Use a partial unique index instead of constraint for flexibility
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_notifications_comment_unique 
  ON public.social_notifications (entry_id, from_user_id, notification_type, COALESCE(comment_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE notification_type IN ('comment', 'comment_reply');

-- Also add unique index for view notifications (one view notification per user per entry)
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_notifications_view_unique 
  ON public.social_notifications (entry_id, from_user_id, notification_type)
  WHERE notification_type = 'view';

-- Update the comment notification function to use upsert
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
    IF parent_author_id IS NOT NULL AND parent_author_id != NEW.author_id THEN
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
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  -- Notify entry owner about the comment (if not commenting on own entry)
  IF entry_owner_id IS NOT NULL AND entry_owner_id != NEW.author_id THEN
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
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update the view notification function to use upsert
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
  IF entry_owner_id IS NULL OR entry_owner_id = NEW.viewer_id THEN
    RETURN NEW;
  END IF;
  
  -- Create notification (use upsert to avoid duplicates)
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
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Clean up any existing duplicate notifications
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY entry_id, from_user_id, notification_type, comment_id
    ORDER BY created_at DESC
  ) as rn
  FROM public.social_notifications
  WHERE notification_type IN ('comment', 'comment_reply')
)
DELETE FROM public.social_notifications 
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Clean up duplicate view notifications
WITH view_duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY entry_id, from_user_id, notification_type
    ORDER BY created_at DESC
  ) as rn
  FROM public.social_notifications
  WHERE notification_type = 'view'
)
DELETE FROM public.social_notifications 
WHERE id IN (SELECT id FROM view_duplicates WHERE rn > 1);
