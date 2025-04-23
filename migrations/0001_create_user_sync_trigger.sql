-- Function to handle new user creation (Now Dropped)
-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS TRIGGER
-- LANGUAGE plpgsql
-- SECURITY DEFINER -- Allows the function to run with the permissions of the user who defined it, necessary for accessing auth.users
-- AS $$
-- BEGIN
--   -- Insert a new row into public.users, linking it to the auth.users record via UUID
--   -- This assumes your public.users table has an 'auth_user_id' column (UUID)
--   -- Adjust the INSERT statement if your public.users table has other required columns
--   -- or different column names.
--   INSERT INTO public.users (auth_user_id)
--   VALUES (NEW.id);
--
--   -- Example: If your public.users table also has an 'email' column:
--   -- INSERT INTO public.users (auth_user_id, email)
--   -- VALUES (NEW.id, NEW.email);
--
--   -- Example: If you have 'created_at' and 'updated_at' managed by default values or other triggers,
--   -- they should be handled automatically. If not, you might need to set them here:
--   -- INSERT INTO public.users (auth_user_id, created_at, updated_at)
--   -- VALUES (NEW.id, now(), now());
--
--   RETURN NEW; -- The result is ignored for AFTER triggers, but it's good practice
-- END;
-- $$;

-- Trigger to execute the function after a new user is added to auth.users (Now Dropped)
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.handle_new_user();

-- Drop the function and trigger as they are replaced by Clerk handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();