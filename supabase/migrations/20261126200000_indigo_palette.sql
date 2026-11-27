-- Replace the mauve/pink defaults with the indigo palette.
-- Only rows still using the old default colours are touched; custom colours are kept.
alter table public.lead_stages alter column color set default '#4f46e5';

update public.lead_stages set color = '#0ea5e9' where lower(color) = '#714b67';
update public.lead_stages set color = '#ef4444' where lower(color) = '#e11d48';
update public.projects set brand_color = null where lower(brand_color) = '#714b67';

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
    (v_project.id, 'New Lead',           '#0ea5e9', 1, 'open'),
    (v_project.id, 'Follow-up',          '#6b8afd', 2, 'open'),
    (v_project.id, 'Contacted',          '#f97316', 3, 'open'),
    (v_project.id, 'Appointment Booked', '#14b8a6', 4, 'open'),
    (v_project.id, 'No Show',            '#ef4444', 5, 'open'),
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
