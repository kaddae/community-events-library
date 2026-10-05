-- 0007: Lets a signed-in librarian add a tip from the desk (a tip the host
-- said out loud at the counter, posted only with their OK). This policy was
-- written earlier to a file outside supabase/migrations/, so it never ran.
-- Safe to run whether or not the policy already exists. Nothing is removed.

drop policy if exists "librarians add tips from the desk" on public.reflections;

create policy "librarians add tips from the desk" on public.reflections
  for insert to authenticated with check (public.is_librarian());