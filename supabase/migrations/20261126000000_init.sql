
create extension if not exists pgcrypto;

create type public.member_role as enum ('owner', 'admin', 'manager', 'agent');
create type public.stage_kind as enum ('open', 'won', 'lost');
create type public.appointment_status as enum (
  'scheduled', 'confirmed', 'rescheduled', 'completed', 'no_show', 'cancelled'
);
create type public.call_direction as enum ('incoming', 'outgoing');
create type public.call_status as enum ('answered', 'missed', 'busy', 'failed');

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       text,
  created_at  timestamptz not null default now()
);

create table public.projects (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(name) between 2 and 80),
  slug           text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$'),
  industry       text,
  contact_label  text not null default 'Customers',
  brand_color    text check (brand_color is null or brand_color ~ '^#[0-9a-fA-F]{6}$'),
  logo_url       text,
  timezone       text not null default 'Asia/Kolkata',
  created_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now()
);

-- Secrets live apart from projects so ordinary members can't read them.
create table public.project_secrets (
  project_id  uuid primary key references public.projects (id) on delete cascade,
  api_key     text not null unique default encode(gen_random_bytes(24), 'hex'),
  created_at  timestamptz not null default now()
);

create table public.branches (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  name        text not null,
  code        text,
  city        text,
  address     text,
  phone       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.project_members (
  project_id  uuid not null references public.projects (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        public.member_role not null default 'agent',
  branch_id   uuid references public.branches (id) on delete set null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.lead_stages (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  name        text not null,
  color       text not null default '#a08a5c',
  position    int  not null default 0,
  kind        public.stage_kind not null default 'open',
  created_at  timestamptz not null default now(),
  unique (project_id, name)
);

create table public.lead_sources (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  name        text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (project_id, name)
);

create table public.services (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  name        text not null,
  category    text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (project_id, name)
);

create table public.contacts (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  name         text not null,
  phone        text,
  phone_key    text generated always as (right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 10)) stored,
  email        text,
  branch_id    uuid references public.branches (id) on delete set null,
  service_id   uuid references public.services (id) on delete set null,
  source_id    uuid references public.lead_sources (id) on delete set null,
  assigned_to  uuid references public.profiles (id) on delete set null,
  notes        text,
  created_at   timestamptz not null default now()
);

create table public.leads (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects (id) on delete cascade,
  name             text not null,
  phone            text,
  phone_key        text generated always as (right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 10)) stored,
  email            text,
  stage_id         uuid not null references public.lead_stages (id) on delete restrict,
  source_id        uuid references public.lead_sources (id) on delete set null,
  service_id       uuid references public.services (id) on delete set null,
  branch_id        uuid references public.branches (id) on delete set null,
  assigned_to      uuid references public.profiles (id) on delete set null,
  contact_id       uuid references public.contacts (id) on delete set null,
  notes            text,
  follow_up_at     timestamptz,
  enquiry_count    int not null default 1,
  last_enquiry_at  timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.lead_activities (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  lead_id     uuid not null references public.leads (id) on delete cascade,
  type        text not null default 'note'
              check (type in ('note', 'stage_change', 'enquiry', 'call', 'appointment', 'system')),
  body        text not null,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table public.appointments (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects (id) on delete cascade,
  lead_id           uuid references public.leads (id) on delete set null,
  contact_id        uuid references public.contacts (id) on delete set null,
  branch_id         uuid references public.branches (id) on delete set null,
  service_id        uuid references public.services (id) on delete set null,
  assigned_to       uuid references public.profiles (id) on delete set null,
  scheduled_at      timestamptz not null,
  duration_minutes  int not null default 30 check (duration_minutes between 5 and 600),
  status            public.appointment_status not null default 'scheduled',
  notes             text,
  created_by        uuid references auth.users (id) on delete set null,
  created_at        timestamptz not null default now(),
  check (lead_id is not null or contact_id is not null)
);

create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects (id) on delete cascade,
  title         text not null,
  notes         text,
  due_at        timestamptz not null,
  lead_id       uuid references public.leads (id) on delete cascade,
  assigned_to   uuid references public.profiles (id) on delete set null,
  completed_at  timestamptz,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);

create table public.call_logs (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects (id) on delete cascade,
  lead_id           uuid references public.leads (id) on delete set null,
  contact_id        uuid references public.contacts (id) on delete set null,
  contact_name      text,
  phone             text not null,
  direction         public.call_direction not null default 'incoming',
  status            public.call_status not null default 'answered',
  agent_status      text,
  handled_by        text,
  branch_id         uuid references public.branches (id) on delete set null,
  duration_seconds  int not null default 0 check (duration_seconds >= 0),
  recording_url     text,
  called_at         timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index on public.project_members (user_id);
create index on public.branches (project_id);
create index on public.lead_stages (project_id, position);
create index on public.lead_sources (project_id);
create index on public.services (project_id);
create index on public.leads (project_id, stage_id, created_at desc);
create index on public.leads (project_id, created_at desc);
create index on public.leads (project_id, phone_key);
create index on public.leads (project_id, follow_up_at) where follow_up_at is not null;
create index on public.lead_activities (lead_id, created_at desc);
create index on public.contacts (project_id, created_at desc);
create index on public.contacts (project_id, phone_key);
create index on public.appointments (project_id, scheduled_at);
create index on public.tasks (project_id, due_at);
create index on public.call_logs (project_id, called_at desc);

-- security definer so RLS policies don't recurse
create or replace function public.is_member(p_project uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project and user_id = auth.uid() and is_active
  );
$$;

create or replace function public.has_role(p_project uuid, p_roles public.member_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project and user_id = auth.uid() and is_active and role = any (p_roles)
  );
$$;

create or replace function public.is_admin(p_project uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(p_project, array['owner', 'admin']::public.member_role[]);
$$;

create or replace function public.shares_project(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.project_members a
    join public.project_members b on a.project_id = b.project_id
    where a.user_id = auth.uid() and b.user_id = p_user
  );
$$;

create or replace function public.slugify(p_text text)
returns text language sql immutable as $$
  select left(trim(both '-' from regexp_replace(lower(coalesce(p_text, '')), '[^a-z0-9]+', '-', 'g')), 40);
$$;

create or replace function public.create_project_for(
  p_owner uuid,
  p_name text,
  p_industry text default null,
  p_contact_label text default null
) returns public.projects
language plpgsql security definer set search_path = public as $$
declare
  v_slug    text := public.slugify(p_name);
  v_project public.projects;
begin
  if char_length(coalesce(trim(p_name), '')) < 2 then
    raise exception 'Project name must be at least 2 characters';
  end if;

  if char_length(v_slug) < 3 then
    v_slug := 'project-' || v_slug;
  end if;
  v_slug := trim(both '-' from v_slug);
  while exists (select 1 from public.projects where slug = v_slug) loop
    v_slug := left(public.slugify(p_name), 40) || '-' || substr(md5(random()::text), 1, 4);
    v_slug := trim(both '-' from v_slug);
  end loop;

  insert into public.projects (name, slug, industry, contact_label, created_by)
  values (
    trim(p_name),
    v_slug,
    nullif(trim(p_industry), ''),
    coalesce(nullif(trim(p_contact_label), ''), 'Customers'),
    p_owner
  )
  returning * into v_project;

  insert into public.project_secrets (project_id) values (v_project.id);
  insert into public.project_members (project_id, user_id, role) values (v_project.id, p_owner, 'owner');

  insert into public.branches (project_id, name, code) values (v_project.id, 'Main Branch', 'MAIN');

  insert into public.lead_stages (project_id, name, color, position, kind) values
    (v_project.id, 'New Lead',           '#a08a5c', 1, 'open'),
    (v_project.id, 'Follow-up',          '#6b8afd', 2, 'open'),
    (v_project.id, 'Contacted',          '#f97316', 3, 'open'),
    (v_project.id, 'Appointment Booked', '#14b8a6', 4, 'open'),
    (v_project.id, 'No Show',            '#eab308', 5, 'open'),
    (v_project.id, 'Lost',               '#78716c', 6, 'lost'),
    (v_project.id, 'Converted',          '#22c55e', 7, 'won');

  insert into public.lead_sources (project_id, name)
  select v_project.id, unnest(array[
    'Website', 'Website Chatbot', 'Meta Ads', 'Instagram', 'Facebook',
    'Google Ads', 'WhatsApp', 'Inbound Call', 'Walk-in', 'Referral'
  ]);

  insert into public.services (project_id, name, category)
  values (v_project.id, 'General Consultation', 'Consultation');

  return v_project;
end;
$$;

create or replace function public.create_project(
  p_name text,
  p_industry text default null,
  p_contact_label text default null
) returns public.projects
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  return public.create_project_for(auth.uid(), p_name, p_industry, p_contact_label);
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)), new.email)
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.get_project_branding(p_slug text)
returns table (name text, slug text, logo_url text, brand_color text, industry text)
language sql stable security definer set search_path = public as $$
  select name, slug, logo_url, brand_color, industry from public.projects where slug = p_slug;
$$;

create or replace function public.capture_lead(
  p_project      uuid,
  p_name         text,
  p_phone        text default null,
  p_email        text default null,
  p_source       text default null,
  p_service      text default null,
  p_branch_id    uuid default null,
  p_assigned_to  uuid default null,
  p_notes        text default null,
  p_stage_id     uuid default null,
  p_follow_up_at timestamptz default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_key       text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  v_existing  public.leads;
  v_stage     uuid;
  v_source    uuid;
  v_service   uuid;
  v_lead_id   uuid;
begin
  if not (public.is_member(p_project) or coalesce(auth.role(), '') = 'service_role') then
    raise exception 'Not allowed';
  end if;
  if coalesce(trim(p_name), '') = '' and v_key = '' then
    raise exception 'A name or phone number is required';
  end if;

  if p_stage_id is not null and not exists (select 1 from public.lead_stages where id = p_stage_id and project_id = p_project) then
    p_stage_id := null;
  end if;
  if p_branch_id is not null and not exists (select 1 from public.branches where id = p_branch_id and project_id = p_project) then
    p_branch_id := null;
  end if;
  if p_assigned_to is not null and not exists (select 1 from public.project_members where user_id = p_assigned_to and project_id = p_project) then
    p_assigned_to := null;
  end if;

  if coalesce(trim(p_source), '') <> '' then
    select id into v_source from public.lead_sources
      where project_id = p_project and lower(name) = lower(trim(p_source));
    if v_source is null then
      insert into public.lead_sources (project_id, name) values (p_project, trim(p_source))
      returning id into v_source;
    end if;
  end if;

  if coalesce(trim(p_service), '') <> '' then
    select id into v_service from public.services
      where project_id = p_project and lower(name) = lower(trim(p_service));
    if v_service is null then
      insert into public.services (project_id, name) values (p_project, trim(p_service))
      returning id into v_service;
    end if;
  end if;

  if char_length(v_key) >= 7 then
    select * into v_existing from public.leads
      where project_id = p_project and phone_key = v_key
      order by created_at desc limit 1;
  end if;

  if v_existing.id is not null then
    update public.leads
       set enquiry_count = enquiry_count + 1,
           last_enquiry_at = now(),
           source_id = coalesce(v_source, source_id),
           service_id = coalesce(v_service, service_id),
           follow_up_at = coalesce(p_follow_up_at, follow_up_at)
     where id = v_existing.id;

    insert into public.lead_activities (project_id, lead_id, type, body, created_by)
    values (
      p_project, v_existing.id, 'enquiry',
      'Repeat enquiry' || coalesce(' from ' || nullif(trim(p_source), ''), '')
        || coalesce(': ' || nullif(trim(p_notes), ''), ''),
      auth.uid()
    );
    return jsonb_build_object('id', v_existing.id, 'repeat', true);
  end if;

  v_stage := p_stage_id;
  if v_stage is null then
    select id into v_stage from public.lead_stages
      where project_id = p_project and kind = 'open'
      order by position limit 1;
  end if;

  insert into public.leads (
    project_id, name, phone, email, stage_id, source_id, service_id,
    branch_id, assigned_to, notes, follow_up_at
  ) values (
    p_project,
    coalesce(nullif(trim(p_name), ''), p_phone),
    nullif(trim(p_phone), ''),
    nullif(trim(p_email), ''),
    v_stage, v_source, v_service, p_branch_id, p_assigned_to,
    nullif(trim(p_notes), ''),
    p_follow_up_at
  ) returning id into v_lead_id;

  return jsonb_build_object('id', v_lead_id, 'repeat', false);
end;
$$;

create or replace function public.convert_lead(p_lead uuid)
returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_lead    public.leads;
  v_contact uuid;
  v_won     uuid;
begin
  select * into v_lead from public.leads where id = p_lead;
  if v_lead.id is null then
    raise exception 'Lead not found';
  end if;

  if v_lead.contact_id is not null then
    return v_lead.contact_id;
  end if;

  if char_length(v_lead.phone_key) >= 7 then
    select id into v_contact from public.contacts
      where project_id = v_lead.project_id and phone_key = v_lead.phone_key limit 1;
  end if;

  if v_contact is null then
    insert into public.contacts (project_id, name, phone, email, branch_id, service_id, source_id, assigned_to, notes)
    values (v_lead.project_id, v_lead.name, v_lead.phone, v_lead.email, v_lead.branch_id,
            v_lead.service_id, v_lead.source_id, v_lead.assigned_to, v_lead.notes)
    returning id into v_contact;
  end if;

  select id into v_won from public.lead_stages
    where project_id = v_lead.project_id and kind = 'won' order by position limit 1;

  update public.leads
     set contact_id = v_contact,
         stage_id = coalesce(v_won, stage_id),
         follow_up_at = null
   where id = p_lead;

  return v_contact;
end;
$$;

create or replace function public.touch_lead()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_from text;
  v_to   text;
begin
  new.updated_at := now();
  if new.stage_id is distinct from old.stage_id then
    select name into v_from from public.lead_stages where id = old.stage_id;
    select name into v_to   from public.lead_stages where id = new.stage_id;
    insert into public.lead_activities (project_id, lead_id, type, body, created_by)
    values (new.project_id, new.id, 'stage_change',
            'Moved from ' || coalesce(v_from, '?') || ' to ' || coalesce(v_to, '?'), auth.uid());
  end if;
  return new;
end;
$$;

create trigger leads_touch before update on public.leads
  for each row execute function public.touch_lead();

create or replace function public.protect_last_owner()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_project uuid := coalesce(old.project_id, new.project_id);
begin
  if old.role = 'owner' and old.is_active
     and (tg_op = 'DELETE' or new.role <> 'owner' or not new.is_active) then
    if not exists (
      select 1 from public.project_members
      where project_id = v_project and user_id <> old.user_id and role = 'owner' and is_active
    ) and exists (select 1 from public.projects where id = v_project)
      and exists (select 1 from public.profiles where id = old.user_id) then
      raise exception 'A project must keep at least one active owner';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger members_protect_owner before update or delete on public.project_members
  for each row execute function public.protect_last_owner();

-- security invoker, so these obey RLS
create or replace function public.dashboard_stats(
  p_project uuid,
  p_from timestamptz default null,
  p_to timestamptz default null
) returns jsonb
language sql stable security invoker set search_path = public as $$
  with l as (
    select * from public.leads
    where project_id = p_project
      and (p_from is null or created_at >= p_from)
      and (p_to is null or created_at < p_to)
  ),
  a as (
    select * from public.appointments
    where project_id = p_project
      and (p_from is null or scheduled_at >= p_from)
      and (p_to is null or scheduled_at < p_to)
  )
  select jsonb_build_object(
    'total_leads',   (select count(*) from l),
    'converted',     (select count(*) from l where contact_id is not null),
    'booked',        (select count(*) from a where status in ('scheduled', 'confirmed', 'rescheduled')),
    'no_show',       (select count(*) from a where status = 'no_show'),
    'repeat',        (select count(*) from l where enquiry_count > 1),
    'stages', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', s.id, 'name', s.name, 'color', s.color, 'kind', s.kind,
               'count', (select count(*) from l where l.stage_id = s.id))
             order by s.position)
      from public.lead_stages s where s.project_id = p_project
    ), '[]'::jsonb)
  );
$$;

create or replace function public.report_stats(
  p_project  uuid,
  p_from     timestamptz default null,
  p_to       timestamptz default null,
  p_branch   uuid default null,
  p_source   uuid default null,
  p_service  uuid default null,
  p_assigned uuid default null
) returns jsonb
language sql stable security invoker set search_path = public as $$
  with l as (
    select * from public.leads
    where project_id = p_project
      and (p_from is null or created_at >= p_from)
      and (p_to is null or created_at < p_to)
      and (p_branch is null or branch_id = p_branch)
      and (p_source is null or source_id = p_source)
      and (p_service is null or service_id = p_service)
      and (p_assigned is null or assigned_to = p_assigned)
  ),
  a as (
    select * from public.appointments
    where project_id = p_project
      and (p_from is null or scheduled_at >= p_from)
      and (p_to is null or scheduled_at < p_to)
      and (p_branch is null or branch_id = p_branch)
      and (p_service is null or service_id = p_service)
      and (p_assigned is null or assigned_to = p_assigned)
  )
  select jsonb_build_object(
    'total_leads',        (select count(*) from l),
    'converted',          (select count(*) from l where contact_id is not null),
    'total_contacts',     (select count(*) from public.contacts c where c.project_id = p_project
                             and (p_from is null or c.created_at >= p_from)
                             and (p_to is null or c.created_at < p_to)
                             and (p_branch is null or c.branch_id = p_branch)),
    'appointments',       (select count(*) from a),
    'no_show',            (select count(*) from a where status = 'no_show'),
    'completed',          (select count(*) from a where status = 'completed'),
    'funnel', coalesce((
      select jsonb_agg(jsonb_build_object('name', s.name, 'color', s.color, 'kind', s.kind,
               'count', (select count(*) from l where l.stage_id = s.id)) order by s.position)
      from public.lead_stages s where s.project_id = p_project
    ), '[]'::jsonb),
    'sources', coalesce((
      select jsonb_agg(x order by (x ->> 'count')::int desc) from (
        select jsonb_build_object('name', coalesce(src.name, 'Unknown'), 'count', count(*),
                                  'converted', count(*) filter (where l.contact_id is not null)) as x
        from l left join public.lead_sources src on src.id = l.source_id
        group by src.name
      ) t
    ), '[]'::jsonb),
    'services', coalesce((
      select jsonb_agg(x order by (x ->> 'count')::int desc) from (
        select jsonb_build_object('name', coalesce(sv.name, 'Not set'), 'count', count(*),
                                  'converted', count(*) filter (where l.contact_id is not null)) as x
        from l left join public.services sv on sv.id = l.service_id
        group by sv.name
      ) t
    ), '[]'::jsonb),
    'team', coalesce((
      select jsonb_agg(x order by (x ->> 'count')::int desc) from (
        select jsonb_build_object('name', coalesce(p.full_name, p.email, 'Unassigned'), 'count', count(*),
                                  'converted', count(*) filter (where l.contact_id is not null)) as x
        from l left join public.profiles p on p.id = l.assigned_to
        group by p.full_name, p.email
      ) t
    ), '[]'::jsonb),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('day', d, 'count', c, 'converted', cv) order by d) from (
        select (created_at at time zone (select timezone from public.projects where id = p_project))::date as d,
               count(*) as c,
               count(*) filter (where contact_id is not null) as cv
        from l group by 1
      ) t
    ), '[]'::jsonb)
  );
$$;

alter table public.profiles         enable row level security;
alter table public.projects         enable row level security;
alter table public.project_secrets  enable row level security;
alter table public.project_members  enable row level security;
alter table public.branches         enable row level security;
alter table public.lead_stages      enable row level security;
alter table public.lead_sources     enable row level security;
alter table public.services         enable row level security;
alter table public.contacts         enable row level security;
alter table public.leads            enable row level security;
alter table public.lead_activities  enable row level security;
alter table public.appointments     enable row level security;
alter table public.tasks            enable row level security;
alter table public.call_logs        enable row level security;

create policy "profiles: read self or teammates" on public.profiles
  for select to authenticated using (id = auth.uid() or public.shares_project(id));
create policy "profiles: update self" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "projects: members read" on public.projects
  for select to authenticated using (public.is_member(id));
create policy "projects: admins update" on public.projects
  for update to authenticated using (public.is_admin(id)) with check (public.is_admin(id));
create policy "projects: owners delete" on public.projects
  for delete to authenticated using (public.has_role(id, array['owner']::public.member_role[]));

create policy "secrets: admins read" on public.project_secrets
  for select to authenticated using (public.is_admin(project_id));
create policy "secrets: admins rotate" on public.project_secrets
  for update to authenticated using (public.is_admin(project_id)) with check (public.is_admin(project_id));

create policy "members: members read" on public.project_members
  for select to authenticated using (public.is_member(project_id));
create policy "members: admins insert" on public.project_members
  for insert to authenticated with check (public.is_admin(project_id) and role <> 'owner');
create policy "members: admins update" on public.project_members
  for update to authenticated using (public.is_admin(project_id)) with check (public.is_admin(project_id));
create policy "members: admins delete" on public.project_members
  for delete to authenticated using (public.is_admin(project_id));

do $$
declare t text;
begin
  foreach t in array array['branches', 'lead_stages', 'lead_sources', 'services'] loop
    execute format('create policy "%1$s: members read" on public.%1$I for select to authenticated using (public.is_member(project_id))', t);
    execute format('create policy "%1$s: admins insert" on public.%1$I for insert to authenticated with check (public.is_admin(project_id))', t);
    execute format('create policy "%1$s: admins update" on public.%1$I for update to authenticated using (public.is_admin(project_id)) with check (public.is_admin(project_id))', t);
    execute format('create policy "%1$s: admins delete" on public.%1$I for delete to authenticated using (public.is_admin(project_id))', t);
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array['contacts', 'leads', 'lead_activities', 'appointments', 'tasks', 'call_logs'] loop
    execute format('create policy "%1$s: members read" on public.%1$I for select to authenticated using (public.is_member(project_id))', t);
    execute format('create policy "%1$s: members insert" on public.%1$I for insert to authenticated with check (public.is_member(project_id))', t);
    execute format('create policy "%1$s: members update" on public.%1$I for update to authenticated using (public.is_member(project_id)) with check (public.is_member(project_id))', t);
    execute format('create policy "%1$s: managers delete" on public.%1$I for delete to authenticated using (public.has_role(project_id, array[''owner'',''admin'',''manager'']::public.member_role[]))', t);
  end loop;
end $$;

revoke execute on function public.create_project_for(uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.get_project_branding(text) to anon, authenticated;
grant execute on function public.create_project(text, text, text) to authenticated;
grant execute on function public.capture_lead(uuid, text, text, text, text, text, uuid, uuid, text, uuid, timestamptz) to authenticated, service_role;
grant execute on function public.convert_lead(uuid) to authenticated;
grant execute on function public.dashboard_stats(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.report_stats(uuid, timestamptz, timestamptz, uuid, uuid, uuid, uuid) to authenticated;
