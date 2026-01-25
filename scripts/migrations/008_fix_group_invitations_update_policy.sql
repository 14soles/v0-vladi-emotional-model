-- Migration: Fix group_invitations update policy to allow from_user to re-invite
-- This allows the inviter to update a rejected invitation to pending status

-- Drop existing update policy
DROP POLICY IF EXISTS "invitations_update_recipient" ON public.group_invitations;

-- Create new policy that allows both recipient to respond AND inviter to re-invite
CREATE POLICY "invitations_update_related" ON public.group_invitations
  FOR UPDATE USING (
    auth.uid() = to_user_id OR auth.uid() = from_user_id
  )
  WITH CHECK (
    auth.uid() = to_user_id OR auth.uid() = from_user_id
  );
