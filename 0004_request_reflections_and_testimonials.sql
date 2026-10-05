create policy "librarians add tips from the desk" on public.reflections
  for insert to authenticated with check (public.is_librarian());