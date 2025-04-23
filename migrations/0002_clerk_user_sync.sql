-- Modify the public.users table for Clerk integration

-- 1. Drop the existing foreign key constraint if it exists
--    (Constraint name might vary, check your schema if this fails)
--    Common default name: users_auth_user_id_fkey
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_auth_user_id_fkey;

-- 2. Change the data type of auth_user_id from UUID to TEXT
ALTER TABLE public.users
ALTER COLUMN auth_user_id TYPE TEXT;

-- 3. Add a UNIQUE constraint to the auth_user_id column
--    This ensures each Clerk user maps to only one profile in your table.
ALTER TABLE public.users
ADD CONSTRAINT users_auth_user_id_unique UNIQUE (auth_user_id);

-- Note: You might need to handle existing data in the auth_user_id column
-- if you have users created with the old Supabase UUID format before running this.
-- Consider clearing the public.users table or migrating existing UUIDs if necessary.