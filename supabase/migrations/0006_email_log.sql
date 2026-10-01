-- 0006: Records when each librarian email went out for a request, so two
-- librarians don't send the same one by accident. Nothing is removed.

alter table public.request_groups
  add column checkout_email_at timestamptz,
  add column return_email_at timestamptz,
  add column late_email_at timestamptz;

-- Librarians only. Stamps the time the checkout, return, or late email was sent.
create or replace function public.mark_email_sent(p_group uuid, p_kind text)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_librarian() then
    raise exception 'Only librarians can do that.';
  end if;
  if p_kind not in ('checkout', 'returned', 'late') then
    raise exception 'Unknown email type.';
  end if;

  update public.request_groups set
    checkout_email_at = case when p_kind = 'checkout' then now() else checkout_email_at end,
    return_email_at = case when p_kind = 'returned' then now() else return_email_at end,
    late_email_at = case when p_kind = 'late' then now() else late_email_at end
  where id = p_group;

  if not found then raise exception 'That request is not on the desk.'; end if;
end;
$$;

revoke execute on function public.mark_email_sent(uuid, text) from public, anon;
grant execute on function public.mark_email_sent(uuid, text) to authenticated;