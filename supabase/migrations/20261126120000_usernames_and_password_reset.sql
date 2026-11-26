-- Usernames on profiles + one-time codes for "forgot password".

-- -----------------------------------------------------------------------------
-- Usernames
-- -----------------------------------------------------------------------------
-- Stored lowercase. Optional so team members created from Settings (who sign in
-- with their email) don't need one.
alter table public.profiles
  add column username text unique
  check (username ~ '^[a-z0-9_]{3,30}$');

-- On signup: also copy the chosen username into the profile.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    nullif(lower(new.raw_user_meta_data ->> 'username'), '')
  )
  on conflict (id) do nothing;

  if coalesce(new.raw_user_meta_data ->> 'project_name', '') <> '' then
    perform public.create_project_for(
      new.id,
      new.raw_user_meta_data ->> 'project_name',
      new.raw_user_meta_data ->> 'industry',
      new.raw_user_meta_data ->> 'contact_label'
    );
  end if;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Password reset codes
-- -----------------------------------------------------------------------------
-- Only the server (secret key) touches this table: RLS is on with no policies.
create table public.password_reset_codes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  code_hash   text not null,
  attempts    int not null default 0,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index password_reset_codes_user_idx on public.password_reset_codes (user_id, created_at desc);

alter table public.password_reset_codes enable row level security;
revoke all on public.password_reset_codes from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Account lookup for sign-in by username and password reset
-- -----------------------------------------------------------------------------
-- Reads the email from auth.users (users can edit their own profiles row, so
-- profiles.email isn't trustworthy for this). Server-only.
create or replace function public.find_auth_user(p_email text default null, p_username text default null)
returns table (id uuid, email text, full_name text)
language sql stable security definer set search_path = public as $$
  select u.id, u.email::text, p.full_name
  from auth.users u
  left join public.profiles p on p.id = u.id
  where (p_email is not null and lower(u.email) = lower(p_email))
     or (p_username is not null and p.username = lower(p_username))
  limit 1;
$$;

revoke execute on function public.find_auth_user(text, text) from public, anon, authenticated;
grant execute on function public.find_auth_user(text, text) to service_role;
