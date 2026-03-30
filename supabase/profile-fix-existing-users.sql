-- Run ONCE in Supabase → SQL Editor if you see:
--   insert or update on table "inspirations" violates foreign key constraint "inspirations_user_id_fkey"
--
-- Cause: your user exists in auth.users but not in public.profiles (e.g. account
-- created before the signup trigger, or trigger failed).

-- Allow the app to upsert your own profile row (extension/dashboard self-heal).
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Backfill profile rows for any auth user that is missing one.
insert into public.profiles (id, email)
select u.id, coalesce(u.email, '')
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
);
