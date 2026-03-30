-- Lightbulb Supabase Schema
-- Run this in the Supabase SQL editor

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  created_at timestamp with time zone default now() not null
);

-- Automatically create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);


-- ============================================================
-- INSPIRATIONS
-- ============================================================
create table if not exists public.inspirations (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  url                   text not null,
  page_title            text,
  creator_handle        text,
  annotation            text not null,
  category              text not null,
  ai_suggested_category text,
  thumbnail_url         text,
  created_at            timestamp with time zone default now() not null
);

-- Index for fetching a user's inspirations in order
create index if not exists inspirations_user_id_created_at_idx
  on public.inspirations(user_id, created_at desc);

-- RLS
alter table public.inspirations enable row level security;

create policy "Users can view their own inspirations"
  on public.inspirations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own inspirations"
  on public.inspirations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own inspirations"
  on public.inspirations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own inspirations"
  on public.inspirations for delete
  using (auth.uid() = user_id);
