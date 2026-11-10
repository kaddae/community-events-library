-- 0016: Row Level Security on every table in the public schema.
-- Supabase flagged a table without RLS. Every table the app uses already has
-- it (0001, 0012), so the open one was created outside these migrations.
-- This re-asserts RLS on the known tables (harmless if already on) and then
-- turns it on for anything else in public, naming each one in the log.
--
-- Nothing the app does changes: the site reads items, reflections and shared
-- testimonials under their existing policies; librarians read the desk under
-- theirs; and the public functions run as security definer, which RLS on
-- other tables doesn't touch. A table with RLS and no policies can't be
-- read or changed from the browser at all, which is the safe default for
-- anything the app doesn't know about. No rows and no policies are removed.

alter table public.librarian_allowlist enable row level security;
alter table public.items enable row level security;
alter table public.hosts enable row level security;
alter table public.request_groups enable row level security;
alter table public.request_lines enable row level security;
alter table public.reflections enable row level security;
alter table public.testimonials enable row level security;

do $$
declare
  t record;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and not c.relrowsecurity
  loop
    execute format('alter table public.%I enable row level security', t.relname);
    raise notice 'Row Level Security turned on for public.% (it had none)', t.relname;
  end loop;
end;
$$;

notify pgrst, 'reload schema';