-- 0017: merge three duplicate items made by a sheet import.
-- The sheet's names gained sizes in brackets, so the import built new slugs
-- and added second rows instead of updating the originals.
--
-- For each duplicate slug below: find the ONE older item with the same loose
-- name (no capitals, no bracketed part, no plural s, no punctuation). If there
-- is exactly one, move the duplicate's request lines and tips onto it, then
-- DELETE the duplicate row. If there is none, or more than one, nothing is
-- changed for that slug and the log says so.

do $$
declare
  d record;
  v_keep uuid;
  v_keep_name text;
  v_count integer;
begin
  for d in
    select i.id, i.slug, i.name, i.created_at,
           regexp_replace(regexp_replace(regexp_replace(lower(i.name), '\([^)]*\)', '', 'g'), 's\M', '', 'g'), '[^a-z0-9]+', '', 'g') as key
    from public.items i
    where i.slug in ('pop-up-tent-10x10', 'folding-table-6ft', 'small-folding-table-4ft')
  loop
    select count(*), (array_agg(o.id order by o.created_at))[1], (array_agg(o.name order by o.created_at))[1]
      into v_count, v_keep, v_keep_name
    from public.items o
    where o.id <> d.id
      and o.created_at < d.created_at
      and regexp_replace(regexp_replace(regexp_replace(lower(o.name), '\([^)]*\)', '', 'g'), 's\M', '', 'g'), '[^a-z0-9]+', '', 'g') = d.key;

    if v_count <> 1 then
      raise notice 'Left % alone: found % older items with a matching name.', d.slug, v_count;
      continue;
    end if;

    update public.reflections set item_id = v_keep where item_id = d.id;
    update public.request_lines set item_id = v_keep where item_id = d.id;
    delete from public.items where id = d.id;
    raise notice 'Merged % into "%" and deleted the duplicate.', d.slug, v_keep_name;
  end loop;
end;
$$;