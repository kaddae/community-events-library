-- 0015: a fourth item status, 'inactive' = we have it, not lending right now.
-- Public behavior matches 'retired': off the Library page, not requestable
-- (submit_request() already accepts only 'active'). No rows are changed.
-- 0001 created this check without a name, so Postgres called it items_status_check.

alter table public.items drop constraint if exists items_status_check;
alter table public.items
  add constraint items_status_check check (status in ('active', 'repair', 'inactive', 'retired'));

notify pgrst, 'reload schema';