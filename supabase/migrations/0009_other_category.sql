-- 0009: Adds "Other" to the allowed item categories.
-- The old category rule is dropped and immediately replaced with one that
-- includes Other. No items or data are removed.

alter table public.items drop constraint if exists items_category_check;
alter table public.items add constraint items_category_check
  check (category in ('Furniture', 'Sound/AV', 'Lights/Power', 'Signage', 'Safety', 'Games', 'Other'));