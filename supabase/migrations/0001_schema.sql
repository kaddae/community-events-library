-- Community Events Lending Library: one shared shelf, requests, biographies.
-- Hosts' contact details never reach the public side. Only librarians
-- (emails on librarian_allowlist) can read hosts, request groups, and lines.
-- The public reads the shelf and biographies and calls three functions.

-- Librarians --------------------------------------------------------------

create table public.librarian_allowlist (
  email text primary key check (email = lower(email)),
  name text not null default '',
  added_at timestamptz not null default now()
);
alter table public.librarian_allowlist enable row level security;

create or replace function public.is_librarian()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select auth.uid() is not null and exists (
    select 1 from public.librarian_allowlist
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- No insert/update/delete policies: the allowlist changes only via SQL by a steward.
create policy "librarians read the allowlist" on public.librarian_allowlist
  for select to authenticated using (public.is_librarian());

-- Items -------------------------------------------------------------------

create table public.items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null check (category in ('Furniture', 'Sound/AV', 'Lights/Power', 'Signage', 'Safety')),
  description text not null default '',
  care_notes text not null default '',
  quantity_total integer not null default 0 check (quantity_total >= 0),
  status text not null default 'active' check (status in ('active', 'repair', 'retired')),
  photo text,
  created_at timestamptz not null default now()
);
alter table public.items enable row level security;

create policy "anyone reads the shelf" on public.items
  for select using (true);
create policy "librarians add items" on public.items
  for insert to authenticated with check (public.is_librarian());
create policy "librarians edit items" on public.items
  for update to authenticated using (public.is_librarian()) with check (public.is_librarian());
create policy "librarians remove items" on public.items
  for delete to authenticated using (public.is_librarian());

-- Hosts -------------------------------------------------------------------

create table public.hosts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email)),
  first_name text not null,
  last_name text not null default '',
  phone text not null default '',
  affiliation text not null default '',
  created_at timestamptz not null default now()
);
alter table public.hosts enable row level security;

create policy "librarians read hosts" on public.hosts
  for select to authenticated using (public.is_librarian());
create policy "librarians add hosts" on public.hosts
  for insert to authenticated with check (public.is_librarian());
create policy "librarians edit hosts" on public.hosts
  for update to authenticated using (public.is_librarian()) with check (public.is_librarian());
create policy "librarians remove hosts" on public.hosts
  for delete to authenticated using (public.is_librarian());

-- Request groups (one per submitted form) ---------------------------------

create table public.request_groups (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.hosts(id) on delete cascade,
  event_name text not null,
  event_date date not null,
  needed_from date not null,
  return_by date not null,
  pickup_window text not null default '',
  description text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  check (return_by >= needed_from)
);
create index request_groups_host_idx on public.request_groups (host_id);
alter table public.request_groups enable row level security;

create policy "librarians read requests" on public.request_groups
  for select to authenticated using (public.is_librarian());
create policy "librarians add requests" on public.request_groups
  for insert to authenticated with check (public.is_librarian());
create policy "librarians edit requests" on public.request_groups
  for update to authenticated using (public.is_librarian()) with check (public.is_librarian());
create policy "librarians remove requests" on public.request_groups
  for delete to authenticated using (public.is_librarian());

-- Request lines (one per item in a request) -------------------------------

create table public.request_lines (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.request_groups(id) on delete cascade,
  item_id uuid not null references public.items(id),
  quantity integer not null check (quantity > 0),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'checked_out', 'returned', 'declined')),
  checked_out_at timestamptz,
  returned_at timestamptz,
  reflection_token text unique,
  created_at timestamptz not null default now()
);
create index request_lines_group_idx on public.request_lines (group_id);
create index request_lines_item_idx on public.request_lines (item_id);
alter table public.request_lines enable row level security;

create policy "librarians read lines" on public.request_lines
  for select to authenticated using (public.is_librarian());
create policy "librarians add lines" on public.request_lines
  for insert to authenticated with check (public.is_librarian());
create policy "librarians edit lines" on public.request_lines
  for update to authenticated using (public.is_librarian()) with check (public.is_librarian());
create policy "librarians remove lines" on public.request_lines
  for delete to authenticated using (public.is_librarian());

-- Timestamps + a random reflection token, stamped when a line changes status.
create or replace function public.stamp_line_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'checked_out' and old.status is distinct from 'checked_out' then
    new.checked_out_at := now();
  end if;
  if new.status = 'returned' and old.status is distinct from 'returned' then
    new.returned_at := now();
    new.reflection_token := coalesce(
      old.reflection_token,
      replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
    );
  end if;
  return new;
end;
$$;

create trigger request_lines_stamp
  before update of status on public.request_lines
  for each row execute function public.stamp_line_status();

-- Reflections (the item biography) ----------------------------------------

create table public.reflections (
  id uuid primary key default gen_random_uuid(),
  line_id uuid unique references public.request_lines(id) on delete set null,
  item_id uuid not null references public.items(id) on delete cascade,
  first_name text not null,
  event_name text not null,
  tip text not null check (char_length(tip) between 1 and 600),
  how_it_went text not null default '' check (char_length(how_it_went) <= 300),
  created_at timestamptz not null default now()
);
create index reflections_item_idx on public.reflections (item_id);
alter table public.reflections enable row level security;

-- Written only through submit_reflection(); librarians can remove one if needed.
create policy "anyone reads biographies" on public.reflections
  for select using (true);
create policy "librarians remove reflections" on public.reflections
  for delete to authenticated using (public.is_librarian());

-- Public functions --------------------------------------------------------

-- The shelf with a server-computed held count (approved + checked out),
-- so the public never reads request rows.
create or replace function public.shelf()
returns table (
  id uuid, slug text, name text, category text, description text, care_notes text,
  quantity_total integer, status text, photo text, held integer
)
language sql stable security definer
set search_path = public
as $$
  select i.id, i.slug, i.name, i.category, i.description, i.care_notes,
         i.quantity_total, i.status, i.photo,
         coalesce((
           select sum(l.quantity) from public.request_lines l
           where l.item_id = i.id and l.status in ('approved', 'checked_out')
         ), 0)::integer
  from public.items i
  order by i.name;
$$;

-- One request form → host (upserted by email) + group + lines, in one transaction.
create or replace function public.submit_request(p_host jsonb, p_group jsonb, p_lines jsonb)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_host ->> 'email', '')));
  v_first text := left(trim(coalesce(p_host ->> 'firstName', '')), 80);
  v_event date := nullif(p_group ->> 'eventDate', '')::date;
  v_from date := nullif(p_group ->> 'neededFrom', '')::date;
  v_back date := nullif(p_group ->> 'returnBy', '')::date;
  v_host uuid;
  v_group uuid;
  v_line jsonb;
  v_item uuid;
begin
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'A working email address is needed.';
  end if;
  if v_first = '' then raise exception 'A first name is needed.'; end if;
  if v_event is null or v_from is null or v_back is null then
    raise exception 'The gathering, pickup, and return dates are all needed.';
  end if;
  if v_back < v_from then raise exception 'The return date comes before the pickup date.'; end if;
  if jsonb_typeof(p_lines) is distinct from 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'The request list is empty.';
  end if;
  if jsonb_array_length(p_lines) > 30 then raise exception 'Too many items in one request.'; end if;

  insert into public.hosts (email, first_name, last_name, phone, affiliation)
  values (
    v_email, v_first,
    left(trim(coalesce(p_host ->> 'lastName', '')), 80),
    left(trim(coalesce(p_host ->> 'phone', '')), 40),
    left(trim(coalesce(p_host ->> 'affiliation', '')), 160)
  )
  on conflict (email) do update set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    phone = excluded.phone,
    affiliation = excluded.affiliation
  returning id into v_host;

  insert into public.request_groups
    (host_id, event_name, event_date, needed_from, return_by, pickup_window, description, notes)
  values (
    v_host,
    left(trim(coalesce(p_group ->> 'eventName', '')), 200),
    v_event, v_from, v_back,
    left(trim(coalesce(p_group ->> 'pickupWindow', '')), 200),
    left(trim(coalesce(p_group ->> 'description', '')), 2000),
    left(trim(coalesce(p_group ->> 'notes', '')), 2000)
  )
  returning id into v_group;

  for v_line in select value from jsonb_array_elements(p_lines) loop
    v_item := (v_line ->> 'itemId')::uuid;
    if not exists (select 1 from public.items where id = v_item and status = 'active') then
      raise exception 'One of those items is not on the shelf right now.';
    end if;
    insert into public.request_lines (group_id, item_id, quantity)
    values (v_group, v_item, greatest(1, least(500, coalesce((v_line ->> 'quantity')::integer, 1))));
  end loop;

  return v_group;
end;
$$;

-- What the reflection page needs to greet the host — nothing more.
create or replace function public.reflection_context(p_token text)
returns table (
  first_name text, event_name text, item_id uuid, item_name text, item_slug text, already boolean
)
language sql stable security definer
set search_path = public
as $$
  select h.first_name, g.event_name, i.id, i.name, i.slug,
         exists (select 1 from public.reflections r where r.line_id = l.id)
  from public.request_lines l
  join public.request_groups g on g.id = l.group_id
  join public.hosts h on h.id = g.host_id
  join public.items i on i.id = l.item_id
  where l.reflection_token = p_token and l.status = 'returned';
$$;

create or replace function public.submit_reflection(
  p_token text, p_event_name text, p_tip text, p_how text
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_line public.request_lines%rowtype;
  v_first text;
begin
  select * into v_line from public.request_lines
  where reflection_token = p_token and status = 'returned';
  if not found then raise exception 'This link does not match a returned item.'; end if;
  if trim(coalesce(p_tip, '')) = '' then raise exception 'A tip for the next host is needed.'; end if;

  select h.first_name into v_first
  from public.request_groups g join public.hosts h on h.id = g.host_id
  where g.id = v_line.group_id;

  insert into public.reflections (line_id, item_id, first_name, event_name, tip, how_it_went)
  values (
    v_line.id, v_line.item_id, v_first,
    left(trim(coalesce(p_event_name, '')), 200),
    left(trim(p_tip), 600),
    left(trim(coalesce(p_how, '')), 300)
  )
  on conflict (line_id) do nothing;
end;
$$;

grant execute on function public.shelf() to anon, authenticated;
grant execute on function public.is_librarian() to anon, authenticated;
grant execute on function public.submit_request(jsonb, jsonb, jsonb) to anon, authenticated;
grant execute on function public.reflection_context(text) to anon, authenticated;
grant execute on function public.submit_reflection(text, text, text, text) to anon, authenticated;