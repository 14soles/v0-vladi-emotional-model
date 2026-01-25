-- Migration: Add acceptance notifications table
-- This tracks notifications when someone accepts a friend request or group invitation

-- Create acceptance_notifications table
CREATE TABLE IF NOT EXISTS public.acceptance_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN ('friend_accepted', 'group_accepted')),
  group_id uuid REFERENCES public.privacy_groups(id) ON DELETE CASCADE,
  group_name text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.acceptance_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for acceptance_notifications
CREATE POLICY "acceptance_notifications_select_own" ON public.acceptance_notifications
  FOR SELECT USING (auth.uid() = to_user_id);

CREATE POLICY "acceptance_notifications_insert" ON public.acceptance_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "acceptance_notifications_update_own" ON public.acceptance_notifications
  FOR UPDATE USING (auth.uid() = to_user_id);

CREATE POLICY "acceptance_notifications_delete_own" ON public.acceptance_notifications
  FOR DELETE USING (auth.uid() = to_user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_acceptance_notifications_to_user ON public.acceptance_notifications(to_user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_acceptance_notifications_created ON public.acceptance_notifications(created_at DESC);

-- Also add a delete policy to group_invitations so the sender can cancel
DROP POLICY IF EXISTS "invitations_delete_sender" ON public.group_invitations;
CREATE POLICY "invitations_delete_sender" ON public.group_invitations
  FOR DELETE USING (auth.uid() = from_user_id);
