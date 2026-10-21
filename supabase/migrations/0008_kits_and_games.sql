-- 0008: Gathering kits and a Games category.
-- Each item can carry a suggested count for two kits: block_party and
-- indoor_gathering. Blank (null) means the item isn't in that kit. These are
-- suggested amounts for one typical gathering, not everything the library owns.
-- They come in through the Google Sheet sync.
-- Adds "Games" (cornhole, giant Jenga) to the allowed categories.
-- shelf() is dropped and recreated because what it returns changes. It is a
-- read-only view of items, so no data is lost.
-- Safe to run even if the kit columns were already added by hand.

alter table public.items
  add column if not exists block_party integer check (block_party is null or block_party >= 0),
  add column if not exists indoor_gathering integer check (indoor_gathering is null or indoor_gathering >= 0);

alter table public.items drop constraint if exists items_category_check;
alter table public.items add constraint items_category_check
  check (category in ('Furniture', 'Sound/AV', 'Lights/Power', 'Signage', 'Safety', 'Games'));

drop function if exists public.shelf();

create function public.shelf()
returns table (
  id uuid, slug text, name text, category text, description text, care_notes text,
  quantity_total integer, status text, photo text,
  replacement_cost integer, deposit integer,
  block_party integer, indoor_gathering integer, held integer
)
language sql stable security definer
set search_path = public
as $$
  select i.id, i.slug, i.name, i.category, i.description, i.care_notes,
         i.quantity_total, i.status, i.photo,
         i.replacement_cost, i.deposit,
         i.block_party, i.indoor_gathering,
         coalesce((
           select sum(l.quantity) from public.request_lines l
           where l.item_id = i.id and l.status in ('approved', 'checked_out')
         ), 0)::integer
  from public.items i
  order by i.name;
$$;

grant execute on function public.shelf() to anon, authenticated;