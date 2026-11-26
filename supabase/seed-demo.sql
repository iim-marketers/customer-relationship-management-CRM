-- 1. Sign up in the app (this creates your project).
-- 2. Replace 'your-project-slug' below with your project's slug (see /projects).
-- 3. Run this whole file in Supabase → SQL Editor.
do $$
declare
  v_slug    text := 'your-project-slug';
  v_project uuid;
  v_owner   uuid;
  v_first   text[] := array['Aarav','Diya','Vihaan','Ananya','Ishaan','Saanvi','Reyansh','Aadhya','Kabir','Myra',
                            'Arjun','Kiara','Rohan','Meera','Vivaan','Riya','Aditya','Pari','Karan','Neha'];
  v_last    text[] := array['Sharma','Iyer','Reddy','Gowda','Nair','Patel','Rao','Menon','Gupta','Das','Shetty','Kulkarni'];
  v_notes   text[] := array['Wants a consultation this week','Asked about pricing','Planning to visit next month',
                            'Back pain for 3 months','Interested in the monsoon offer','Call after 6pm',
                            'Comparing with another provider','Referred by a friend', null, null];
  r record;
begin
  select id, created_by into v_project, v_owner from public.projects where slug = v_slug;
  if v_project is null then
    raise exception 'No project with slug %. Edit v_slug at the top of this script.', v_slug;
  end if;

  insert into public.branches (project_id, name, code, city)
  values (v_project, 'City Centre', 'CC', 'Bengaluru'), (v_project, 'Lakeside', 'LS', 'Bengaluru')
  on conflict do nothing;
  insert into public.services (project_id, name, category)
  values (v_project, 'Follow-up Visit', 'Consultation'), (v_project, 'Full Body Therapy', 'Therapy'),
         (v_project, 'Premium Package', 'Package')
  on conflict do nothing;

  insert into public.leads (project_id, name, phone, stage_id, source_id, service_id, branch_id, assigned_to,
                            notes, enquiry_count, created_at, last_enquiry_at, follow_up_at)
  select v_project,
         v_first[1 + floor(random() * array_length(v_first, 1))::int] || ' ' ||
           v_last[1 + floor(random() * array_length(v_last, 1))::int],
         '+91' || (9000000000 + floor(random() * 999999999))::bigint,
         (select id from public.lead_stages s where s.project_id = v_project and g > 0 order by random() limit 1),
         (select id from public.lead_sources s where s.project_id = v_project and g > 0 order by random() limit 1),
         (select id from public.services s where s.project_id = v_project and g > 0 order by random() limit 1),
         (select id from public.branches s where s.project_id = v_project and g > 0 order by random() limit 1),
         case when random() < 0.6 then v_owner end,
         v_notes[1 + floor(random() * array_length(v_notes, 1))::int],
         case when random() < 0.12 then 2 + floor(random() * 3)::int else 1 end,
         t, t + (random() * interval '3 days'),
         null
  from generate_series(1, 150) g,
       lateral (select now() - (random() * interval '60 days') as t) ts;

  update public.leads l
     set follow_up_at = date_trunc('hour', now()) + ((floor(random() * 12) - 4) * interval '1 day')
                        + (floor(random() * 9) * interval '1 hour')
   where l.project_id = v_project
     and l.stage_id in (select id from public.lead_stages where project_id = v_project and kind = 'open')
     and random() < 0.5;

  for r in
    select l.id from public.leads l join public.lead_stages s on s.id = l.stage_id
    where l.project_id = v_project and s.kind = 'won' and l.contact_id is null
  loop
    perform public.convert_lead(r.id);
  end loop;

  insert into public.appointments (project_id, lead_id, contact_id, branch_id, service_id, assigned_to,
                                   scheduled_at, duration_minutes, status)
  select v_project, l.id, l.contact_id, l.branch_id, l.service_id, l.assigned_to,
         date_trunc('hour', now()) + ((floor(random() * 14) - 7) * interval '1 day') + (floor(random() * 8) * interval '1 hour'),
         (array[30, 45, 60])[1 + floor(random() * 3)::int],
         (array['scheduled','confirmed','completed','no_show','rescheduled','cancelled'])[1 + floor(random() * 6)::int]::public.appointment_status
  from public.leads l
  where l.project_id = v_project and random() < 0.3;

  insert into public.tasks (project_id, title, due_at, lead_id, assigned_to, created_by, completed_at)
  select v_project,
         (array['Call back with pricing','Send treatment brochure','Confirm appointment','Check on recovery'])[1 + floor(random() * 4)::int],
         date_trunc('hour', now()) + ((floor(random() * 8) - 3) * interval '1 day') + interval '10 hours',
         l.id, v_owner, v_owner,
         case when random() < 0.25 then now() end
  from public.leads l
  where l.project_id = v_project and random() < 0.12;

  insert into public.call_logs (project_id, lead_id, contact_name, phone, direction, status, agent_status,
                                handled_by, branch_id, duration_seconds, called_at)
  select v_project, l.id, l.name, l.phone,
         (array['incoming','outgoing'])[1 + floor(random() * 2)::int]::public.call_direction,
         (array['answered','answered','answered','missed','busy'])[1 + floor(random() * 5)::int]::public.call_status,
         (array['connected','connected','drop'])[1 + floor(random() * 3)::int],
         'Agent ' || (8000000000 + floor(random() * 99999999))::bigint,
         l.branch_id, floor(random() * 300)::int,
         l.created_at + (random() * interval '2 days')
  from public.leads l
  where l.project_id = v_project and random() < 0.5;

  raise notice 'Demo data added to %', v_slug;
end $$;
