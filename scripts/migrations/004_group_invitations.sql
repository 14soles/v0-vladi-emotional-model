-- Migration: Add group invitations table for tracking invites to privacy groups
-- This allows users to invite contacts to their groups and track acceptance

-- Create group_invitations table
CREATE TABLE IF NOT EXISTS public.group_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.privacy_groups(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone DEFAULT now(),
  responded_at timestamp with time zone,
  UNIQUE(group_id, to_user_id)
);

-- Enable RLS
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for group_invitations
CREATE POLICY "invitations_select_related" ON public.group_invitations
  FOR SELECT USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
  );

CREATE POLICY "invitations_insert_own" ON public.group_invitations
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "invitations_update_recipient" ON public.group_invitations
  FOR UPDATE USING (auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = to_user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_group_invitations_to_user ON public.group_invitations(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_group_invitations_from_user ON public.group_invitations(from_user_id);
