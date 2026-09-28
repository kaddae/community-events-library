-- Starter shelf from the plan. Quantities are placeholders:
-- the Google Sheet sync on the librarians' desk sets the real counts.
insert into public.items (slug, name, category, quantity_total, description, care_notes) values
  ('folding-tables', 'Folding tables', 'Furniture', 6, '6-foot folding tables for food, sign-in, or a craft station.', 'TODO: librarians — add care notes (setup time, what is in the bag, how to pack it back up).'),
  ('folding-chairs', 'Folding chairs', 'Furniture', 40, 'Metal folding chairs, stacked on a cart.', 'TODO: librarians — add care notes (setup time, what is in the bag, how to pack it back up).'),
  ('pop-up-tent', 'Pop-up tent', 'Furniture', 2, '10×10 pop-up canopy with weights.', 'TODO: librarians — add care notes (setup time, what is in the bag, how to pack it back up).'),
  ('coolers', 'Coolers', 'Furniture', 3, 'Large wheeled coolers for drinks and ice.', 'TODO: librarians — add care notes (setup time, what is in the bag, how to pack it back up).'),
  ('pa-and-mic', 'PA + mic', 'Sound/AV', 1, 'Portable speaker with one wireless mic.', 'TODO: librarians — add care notes (setup time, what is in the bag, how to pack it back up).'),
  ('projector-screen', 'Projector + screen', 'Sound/AV', 1, 'Projector, tripod screen, and HDMI cable.', 'TODO: librarians — add care notes (setup time, what is in the bag, how to pack it back up).'),
  ('walkie-talkies', 'Walkie-talkies', 'Sound/AV', 6, 'Two-way radios for volunteers spread across a site.', 'TODO: librarians — add care notes (setup time, what is in the bag, how to pack it back up).'),
  ('string-lights', 'String lights', 'Lights/Power', 4, 'Outdoor string lights, about 48 feet per strand.', 'TODO: librarians — add care notes (setup time, what is in the bag, how to pack it back up).'),
  ('extension-cords', 'Extension cords', 'Lights/Power', 8, 'Outdoor-rated extension cords.', 'TODO: librarians — add care notes (setup time, what is in the bag, how to pack it back up).'),
  ('chalkboard-signs', 'Chalkboard signs', 'Signage', 4, 'A-frame sidewalk chalkboards. Chalk included.', 'TODO: librarians — add care notes (setup time, what is in the bag, how to pack it back up).'),
  ('name-tags', 'Name tags', 'Signage', 4, 'Packs of blank name tags with markers.', 'TODO: librarians — add care notes (setup time, what is in the bag, how to pack it back up).'),
  ('ada-ramp', 'ADA ramp', 'Safety', 1, 'Portable ramp for a step or curb.', 'TODO: librarians — add care notes (setup time, what is in the bag, how to pack it back up).'),
  ('stanchions', 'Stanchions', 'Safety', 6, 'Posts with retractable belts for lines and walkways.', 'TODO: librarians — add care notes (setup time, what is in the bag, how to pack it back up).')
on conflict (slug) do nothing;

insert into public.librarian_allowlist (email, name) values
  ('grouprojectnhv@gmail.com', 'GROUP PROJECT librarians')
on conflict (email) do nothing;