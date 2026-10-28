-- 0014: "How did you hear about the lending library?" on requests.
-- Adds heard_from to request_groups. Like phone and email, only signed-in
-- librarians can read it (request_groups RLS is unchanged).
-- submit_request() keeps the same inputs and is replaced in place. It is the
-- 0013 version plus heard_from. Nothing is removed.

alter table public.request_groups
  add column if not exists heard_from text not null default '';

create or replace function public.submit_request(p_host jsonb, p_group jsonb, p_lines jsonb)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_host ->> 'email', '')));
  v_first text := left(trim(coalesce(p_host ->> 'firstName', '')), 80);
  v_last text := left(trim(coalesce(p_host ->> 'lastName', '')), 80);
  v_phone text := left(trim(coalesce(p_host ->> 'phone', '')), 40);
  v_affil text := left(trim(coalesce(p_host ->> 'affiliation', '')), 160);
  v_event date := nullif(p_group ->> 'eventDate', '')::date;
  v_from date := nullif(p_group ->> 'neededFrom', '')::date;
  v_latest date := nullif(p_group ->> 'pickupLatest', '')::date;
  v_back date := nullif(p_group ->> 'returnBy', '')::date;
  v_pledge integer := case
    when coalesce(p_group ->> 'donationPledge', '') ~ '^[0-9]{1,6}$'
      then least(10000, (p_group ->> 'donationPledge')::integer)
    else null
  end;
  v_heard text := left(trim(coalesce(p_group ->> 'heardFrom', '')), 500);
  v_host uuid;
  v_group uuid;
  v_recent integer;
  v_line jsonb;
  v_item uuid;
begin
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'A working email address is needed.';
  end if;
  if v_first = '' then raise exception 'A first name is needed.'; end if;
  if v_phone = '' then raise exception 'A phone number is needed.'; end if;
  if v_event is null or v_from is null or v_back is null then
    raise exception 'The gathering, pickup, and return dates are all needed.';
  end if;
  if v_back < v_from then raise exception 'The return date comes before the pickup date.'; end if;
  if v_latest is not null and v_latest < v_from then
    raise exception 'The latest pickup day comes before the earliest.';
  end if;
  if v_latest is not null and v_latest > v_event then
    raise exception 'The latest pickup day comes after the gathering.';
  end if;
  if jsonb_typeof(p_lines) is distinct from 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'The request list is empty.';
  end if;
  if jsonb_array_length(p_lines) > 30 then raise exception 'Too many items in one request.'; end if;

  insert into public.hosts (email, first_name, last_name, phone, affiliation)
  values (v_email, v_first, v_last, v_phone, v_affil)
  on conflict (email) do nothing;
  select id into v_host from public.hosts where email = v_email;

  perform pg_advisory_xact_lock(hashtext('submit_request:' || v_email));
  select count(*) into v_recent from public.request_groups
  where host_id = v_host and created_at > now() - interval '1 hour';
  if v_recent >= 3 then
    raise exception 'This email has already sent 3 requests in the last hour.';
  end if;

  insert into public.request_groups
    (host_id, host_first_name, host_last_name, host_phone, host_affiliation,
     event_name, event_date, needed_from, pickup_latest, return_by, pickup_window, description, notes,
     donation_pledge, heard_from)
  values (
    v_host, v_first, v_last, v_phone, v_affil,
    left(trim(coalesce(p_group ->> 'eventName', '')), 200),
    v_event, v_from, v_latest, v_back,
    left(trim(coalesce(p_group ->> 'pickupWindow', '')), 200),
    left(trim(coalesce(p_group ->> 'description', '')), 2000),
    left(trim(coalesce(p_group ->> 'notes', '')), 2000),
    v_pledge, v_heard
  )
  returning id into v_group;

  for v_line in select value from jsonb_array_elements(p_lines) loop
    v_item := (v_line ->> 'itemId')::uuid;
    if not exists (select 1 from public.items where id = v_item and status = 'active') then
      raise exception 'One of those items is not in the library right now.';
    end if;
    insert into public.request_lines (group_id, item_id, quantity)
    values (v_group, v_item, greatest(1, least(500, coalesce((v_line ->> 'quantity')::integer, 1))));
  end loop;

  return v_group;
end;
$$;

grant execute on function public.submit_request(jsonb, jsonb, jsonb) to anon, authenticated;

notify pgrst, 'reload schema';