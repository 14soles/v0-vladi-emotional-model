-- Add unique constraint for user_id and contact_user_id on contacts table
-- This allows proper upsert operations when accepting friend requests

-- First, remove any duplicates that might exist
DELETE FROM public.contacts a USING public.contacts b 
WHERE a.id > b.id 
AND a.user_id = b.user_id 
AND a.contact_user_id = b.contact_user_id
AND a.contact_user_id IS NOT NULL;

-- Add the unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'contacts_user_id_contact_user_id_key'
  ) THEN
    ALTER TABLE public.contacts 
    ADD CONSTRAINT contacts_user_id_contact_user_id_key 
    UNIQUE (user_id, contact_user_id);
  END IF;
END $$;

-- Update RLS policy to allow users to delete contacts where they are the contact_user_id
-- This is needed for removing mutual friendships
DROP POLICY IF EXISTS "contacts_delete_as_contact" ON public.contacts;
CREATE POLICY "contacts_delete_as_contact" ON public.contacts 
FOR DELETE USING (auth.uid() = contact_user_id);
