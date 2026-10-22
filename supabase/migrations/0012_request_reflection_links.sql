-- 0012: One reflection link per request, plus testimonials.
-- Brings in what 0004 meant to add (that file never sat in this folder, so it
-- never ran). Written to be safe if any piece of it already exists.

-- The request's reflection link ---------------------------------------------

alter table public.request_groups
  add column if not exists reflection_token text unique;

-- When any item in a request is marked returned, the request gets its link.
create or replace function public.stamp_group_token()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.status = 'returned' and old.status is distinct from 'returned' then
    update public.request_groups
    set reflection_token = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
    where id = new.group_id and reflection_token is null;
  end if;
  return new;
end;
$$;

drop trigger if exists request_lines_group_token on public.request_lines;
create trigger request_lines_group_token
  after update of status on public.request_lines
  for each row execute function public.stamp_group_token();

-- Requests that already have something back get their link now.
update public.request_groups g
set reflection_token = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
where g.reflection_token is null
  and exists (select 1 from public.request_lines l where l.group_id = g.id and l.status = 'returned');

-- Testimonials ----------------------------------------------------------------

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  group_id uuid unique references public.request_groups(id) on delete set null,
  first_name text not null,
  event_name text not null default '',
  body text not null check (char_length(body) between 1 and 1200),
  ok_to_share boolean not null default false,
  review text not null default 'waiting' check (review in ('waiting', 'approved', 'hidden')),
  created_at timestamptz not null default now(),
  -- Public only with the host's OK.
  check (review <> 'approved' or ok_to_share)
);
alter table public.testimonials enable row level security;

drop policy if exists "anyone reads shared testimonials" on public.testimonials;
drop policy if exists "librarians read testimonials" on public.testimonials;
drop policy if exists "librarians review testimonials" on public.testimonials;
drop policy if exists "librarians remove testimonials" on public.testimonials;

-- Written only through submit_request_reflection().
create policy "anyone reads shared testimonials" on public.testimonials
  for select using (ok_to_share and review = 'approved');
create policy "librarians read testimonials" on public.testimonials
  for select to authenticated using (public.is_librarian());
create policy "librarians review testimonials" on public.testimonials
  for update to authenticated using (public.is_librarian()) with check (public.is_librarian());
create policy "librarians remove testimonials" on public.testimonials
  for delete to authenticated using (public.is_librarian());

-- What the reflection page needs to greet the host -------------------------

create or replace function public.request_reflection_context(p_token text)
returns json
language sql stable security definer
set search_path = public
as $$
  select json_build_object(
    'firstName', g.host_first_name,
    'eventName', g.event_name,
    'already', exists (select 1 from public.testimonials t where t.group_id = g.id),
    'items', coalesce((
      select json_agg(json_build_object(
        'lineId', l.id, 'itemId', i.id, 'itemName', i.name, 'itemSlug', i.slug,
        'tipped', exists (select 1 from public.reflections r where r.line_id = l.id)
      ) order by i.name)
      from public.request_lines l join public.items i on i.id = l.item_id
      where l.group_id = g.id and l.status = 'returned'
    ), '[]'::json)
  )
  from public.request_groups g
  where g.reflection_token = p_token and p_token is not null and p_token <> '';
$$;

create or replace function public.submit_request_reflection(
  p_token text, p_testimonial text, p_ok_to_share boolean, p_tips jsonb
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_group public.request_groups%rowtype;
  v_tip jsonb;
  v_line public.request_lines%rowtype;
  v_text text;
begin
  select * into v_group from public.request_groups
  where reflection_token = p_token and p_token is not null and p_token <> '';
  if not found then raise exception 'This link does not match a request.'; end if;
  if not exists (select 1 from public.request_lines where group_id = v_group.id and status = 'returned') then
    raise exception 'Nothing from this request has come back yet.';
  end if;
  if trim(coalesce(p_testimonial, '')) = '' then raise exception 'Tell us how the gathering went.'; end if;

  -- One reflection per request, even if it is sent twice at once.
  perform pg_advisory_xact_lock(hashtext('request_reflection:' || v_group.id::text));
  if exists (select 1 from public.testimonials where group_id = v_group.id) then return; end if;

  insert into public.testimonials (group_id, first_name, event_name, body, ok_to_share)
  values (v_group.id, v_group.host_first_name, v_group.event_name,
          left(trim(p_testimonial), 1200), coalesce(p_ok_to_share, false));

  if jsonb_typeof(p_tips) = 'array' then
    for v_tip in select value from jsonb_array_elements(p_tips) limit 30 loop
      v_text := left(trim(coalesce(v_tip ->> 'tip', '')), 600);
      continue when v_text = '';
      select * into v_line from public.request_lines
      where id = (v_tip ->> 'lineId')::uuid and group_id = v_group.id and status = 'returned';
      continue when not found;
      insert into public.reflections (line_id, item_id, first_name, event_name, tip, how_it_went)
      values (v_line.id, v_line.item_id, v_group.host_first_name, v_group.event_name, v_text, '')
      on conflict (line_id) do nothing;
    end loop;
  end if;
end;
$$;

grant execute on function public.request_reflection_context(text) to anon, authenticated;
grant execute on function public.submit_request_reflection(text, text, boolean, jsonb) to anon, authenticated;

notify pgrst, 'reload schema';