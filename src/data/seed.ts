import type { Item, RequestGroup, RequestLine, Reflection } from '@/lib/store';

// Starter inventory from the plan. Quantities are placeholders —
// the Google Sheet sync on the librarian dashboard sets the real counts.
const CARE_TODO = 'TODO: librarians — add care notes (setup time, what is in the bag, how to pack it back up).';

const item = (slug: string, name: string, category: Item['category'], quantityTotal: number, description: string): Item => ({
  id: `item_${slug}`, slug, name, category, quantityTotal, description, careNotes: CARE_TODO, status: 'active',
});

export const seedItems: Item[] = [
  item('folding-tables', 'Folding tables', 'Furniture', 6, '6-foot folding tables for food, sign-in, or a craft station.'),
  item('folding-chairs', 'Folding chairs', 'Furniture', 40, 'Metal folding chairs, stacked on a cart.'),
  item('pop-up-tent', 'Pop-up tent', 'Furniture', 2, '10×10 pop-up canopy with weights.'),
  item('coolers', 'Coolers', 'Furniture', 3, 'Large wheeled coolers for drinks and ice.'),
  item('pa-and-mic', 'PA + mic', 'Sound/AV', 1, 'Portable speaker with one wireless mic.'),
  item('projector-screen', 'Projector + screen', 'Sound/AV', 1, 'Projector, tripod screen, and HDMI cable.'),
  item('walkie-talkies', 'Walkie-talkies', 'Sound/AV', 6, 'Two-way radios for volunteers spread across a site.'),
  item('string-lights', 'String lights', 'Lights/Power', 4, 'Outdoor string lights, about 48 feet per strand.'),
  item('extension-cords', 'Extension cords', 'Lights/Power', 8, 'Outdoor-rated extension cords.'),
  item('chalkboard-signs', 'Chalkboard signs', 'Signage', 4, 'A-frame sidewalk chalkboards. Chalk included.'),
  item('name-tags', 'Name tags', 'Signage', 4, 'Packs of blank name tags with markers.'),
  item('ada-ramp', 'ADA ramp', 'Safety', 1, 'Portable ramp for a step or curb.'),
  item('stanchions', 'Stanchions', 'Safety', 6, 'Posts with retractable belts for lines and walkways.'),
];

const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};
const stamp = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString();

const nadia = {
  firstName: 'Nadia', lastName: 'Reyes', email: 'nadia@example.com', phone: '(203) 555-0142',
  affiliation: 'Block party committee', example: true,
};

export const seedGroups: RequestGroup[] = [
  {
    id: 'grp_fair', createdAt: stamp(-30), host: nadia, eventName: 'Edgewood Park fair',
    eventDate: day(-24), neededFrom: day(-25), returnBy: day(-22), pickupWindow: 'Friday after 5',
    description: 'Craft and face-painting table at the fair.', notes: '',
  },
  {
    id: 'grp_block', createdAt: stamp(-1), host: nadia, eventName: 'July block party',
    eventDate: day(12), neededFrom: day(11), returnBy: day(13), pickupWindow: 'Thursday evening',
    description: 'Potluck and music for our block, about 60 neighbors.', notes: 'We can bring a car for pickup.',
  },
];

export const seedLines: RequestLine[] = [
  { id: 'ln_fair_tent', groupId: 'grp_fair', itemId: 'item_pop-up-tent', quantity: 1, status: 'returned', checkedOutAt: stamp(-25), returnedAt: stamp(-22) },
  { id: 'ln_block_pa', groupId: 'grp_block', itemId: 'item_pa-and-mic', quantity: 1, status: 'pending' },
  { id: 'ln_block_chairs', groupId: 'grp_block', itemId: 'item_folding-chairs', quantity: 20, status: 'pending' },
  { id: 'ln_block_tables', groupId: 'grp_block', itemId: 'item_folding-tables', quantity: 3, status: 'pending' },
];

export const seedReflections: Reflection[] = [
  {
    id: 'rf_fair_tent', lineId: 'ln_fair_tent', itemId: 'item_pop-up-tent', firstName: 'Nadia',
    eventName: 'Edgewood Park fair', tip: 'Takes fifteen minutes and two people to set up — bring a friend.',
    howItWent: 'Kept the face-painting table dry through a surprise shower.', createdAt: stamp(-21),
  },
];