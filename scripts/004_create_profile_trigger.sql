-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  generated_username TEXT;
  base_username TEXT;
  counter INT := 0;
BEGIN
  -- Extract base username from email
  base_username := split_part(NEW.email, '@', 1);
  base_username := regexp_replace(lower(base_username), '[^a-z0-9]', '', 'g');
  
  -- Generate unique username
  generated_username := base_username || floor(random() * 1000)::text;
  
  -- Keep trying until we find a unique username
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = generated_username) LOOP
    counter := counter + 1;
    generated_username := base_username || floor(random() * 10000)::text;
    
    -- Safety check to prevent infinite loop
    IF counter > 100 THEN
      generated_username := base_username || gen_random_uuid()::text;
      EXIT;
    END IF;
  END LOOP;

  -- Insert the profile
  INSERT INTO public.profiles (
    id,
    username,
    email,
    phone,
    display_name,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    generated_username,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
