-- Fix friend_requests RLS policies to allow senders to update/delete their own requests

-- Drop the existing update policy
DROP POLICY IF EXISTS "requests_update_recipient" ON public.friend_requests;

-- Create new update policy that allows both sender and recipient to update
CREATE POLICY "requests_update_involved" ON public.friend_requests 
  FOR UPDATE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Add delete policy so users can delete requests they sent
CREATE POLICY "requests_delete_sender" ON public.friend_requests 
  FOR DELETE USING (auth.uid() = from_user_id);
