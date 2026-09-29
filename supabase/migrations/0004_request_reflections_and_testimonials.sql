-- 0004: One reflection link per request, private-by-default testimonials,
-- and tips that librarians type in at the desk. Nothing is dropped:
-- per-item links already sent keep working through reflection_context()
-- and submit_reflection() from 0001.

-- One link per request ------------------------------------------------------

alter table public.request_groups
  add column reflection_token text unique;

-- A request gets its link the first time any of its items is marked returned.
-- Runs as the librarian making the change, who can already edit requests.
create or replace function public.stamp_group_reflection_token()
returns trigger
language plpgsql
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

create trigger request_lines_group_token
  after update of status on public.request_lines
  for each row execute function public.stamp_group_reflection_token();

-- Requests that already have something returned get their link now.
update public.request_groups g
set reflection_token = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
where g.reflection_token is null
  and exists (
    select 1 from public.request_lines l
    where l.group_id = g.id and l.status = 'returned'
  );

-- Testimonials ----------------------------------------------------------------
-- Private by default. Public only when the host said OK to share AND a
-- librarian approved it. The check constraint means an unshared
-- testimonial can never be approved, even by mistake.

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  group_id uuid unique references public.request_groups(id) on delete set null,
  first_name text not null,
  event_name text not null default '',
  body text not null check (char_length(body) between 1 and 1200),
  ok_to_share boolean not null default false,
  review text not null default 'waiting' check (review in ('waiting', 'approved', 'hidden')),
  created_at timestamptz not null default now(),
  check (review <> 'approved' or ok_to_share)
);
create index testimonials_created_idx on public.testimonials (created_at desc);
alter table public.testimonials enable row level security;

create policy "anyone reads shared, approved testimonials" on public.testimonials
  for select using (ok_to_share and review = 'approved');
create policy "librarians read all testimonials" on public.testimonials
  for select to authenticated using (public.is_librarian());
create policy "librarians review testimonials" on public.testimonials
  for update to authenticated using (public.is_librarian()) with check (public.is_librarian());
create policy "librarians remove testimonials" on public.testimonials
  for delete to authenticated using (public.is_librarian());
-- No insert policy: hosts write only through submit_request_reflection().

-- Tips said out loud at the counter -------------------------------------------

create policy "librarians add tips from the desk" on public.reflections
  for insert to authenticated with check (public.is_librarian());

-- Public functions --------------------------------------------------------

-- What the request reflection page needs: first name, gathering, and the
-- returned items (with whether each already has a tip). Null if no match.
create or replace function public.request_reflection_context(p_token text)
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select jsonb_build_object(
    'firstName', coalesce(nullif(g.host_first_name, ''), h.first_name),
    'eventName', g.event_name,
    'already', exists (select 1 from public.testimonials t where t.group_id = g.id),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'lineId', l.id,
        'itemId', i.id,
        'itemName', i.name,
        'itemSlug', i.slug,
        'tipped', exists (select 1 from public.reflections r where r.line_id = l.id)
      ) order by i.name)
      from public.request_lines l
      join public.items i on i.id = l.item_id
      where l.group_id = g.id and l.status = 'returned'
    ), '[]'::jsonb)
  )
  from public.request_groups g
  join public.hosts h on h.id = g.host_id
  where g.reflection_token = p_token;
$$;

-- One testimonial (required) plus any optional item tips, in one step.
-- p_tips: [{ "lineId": "...", "tip": "..." }, ...]
create or replace function public.submit_request_reflection(
  p_token text, p_testimonial text, p_ok_to_share boolean, p_tips jsonb
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_group public.request_groups%rowtype;
  v_line public.request_lines%rowtype;
  v_first text;
  v_tips jsonb := coalesce(p_tips, '[]'::jsonb);
  v_tip jsonb;
  v_text text;
begin
  select * into v_group from public.request_groups where reflection_token = p_token;
  if not found then raise exception 'This link does not match a returned request.'; end if;
  if trim(coalesce(p_testimonial, '')) = '' then
    raise exception 'A line about how the gathering went is needed.';
  end if;
  if jsonb_typeof(v_tips) <> 'array' then raise exception 'Tips arrived in the wrong shape.'; end if;
  if jsonb_array_length(v_tips) > 30 then raise exception 'Too many tips in one reflection.'; end if;

  select coalesce(nullif(v_group.host_first_name, ''), h.first_name) into v_first
  from public.hosts h where h.id = v_group.host_id;

  insert into public.testimonials (group_id, first_name, event_name, body, ok_to_share)
  values (v_group.id, v_first, v_group.event_name, left(trim(p_testimonial), 1200), coalesce(p_ok_to_share, false))
  on conflict (group_id) do nothing;

  for v_tip in select value from jsonb_array_elements(v_tips) loop
    v_text := left(trim(coalesce(v_tip ->> 'tip', '')), 600);
    continue when v_text = '';
    select * into v_line from public.request_lines
    where id = (v_tip ->> 'lineId')::uuid and group_id = v_group.id and status = 'returned';
    continue when not found;
    insert into public.reflections (line_id, item_id, first_name, event_name, tip, how_it_went)
    values (v_line.id, v_line.item_id, v_first, v_group.event_name, v_text, '')
    on conflict (line_id) do nothing;
  end loop;
end;
$$;

grant execute on function public.request_reflection_context(text) to anon, authenticated;
grant execute on function public.submit_request_reflection(text, text, boolean, jsonb) to anon, authenticated;