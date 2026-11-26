do $$
begin
  if exists (select 1 from public.project_members group by user_id having count(*) > 1) then
    raise exception 'Some accounts belong to more than one CRM. Remove the extra memberships before applying this migration: select user_id, count(*) from public.project_members group by user_id having count(*) > 1;';
  end if;
end $$;

drop index if exists public.project_members_user_id_idx;
create unique index project_members_one_crm_per_user on public.project_members (user_id);

drop function if exists public.create_project(text, text, text);
