import { supabase, magicLinkReturnUrl } from '@/lib/supabase';
import type {
  CartLine, Category, Item, ItemInput, ItemStatus, LineStatus, Reflection, RequestGroup, RequestLine,
} from '@/lib/store';

// Every call the app makes to Supabase. Row Level Security is the boundary:
// the public reads the shelf and biographies and calls three functions;
// everything else needs a signed-in librarian on the allowlist.

function db() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}
function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

interface ItemRow {
  id: string; slug: string; name: string; category: string; description: string; care_notes: string;
  quantity_total: number; status: string; photo: string | null; held: number;
}
interface ReflectionRow {
  id: string; line_id: string | null; item_id: string; first_name: string; event_name: string;
  tip: string; how_it_went: string; created_at: string;
}
interface HostRow { first_name: string; last_name: string; email: string; phone: string; affiliation: string }
interface GroupRow {
  id: string; created_at: string; event_name: string; event_date: string; needed_from: string;
  return_by: string; pickup_window: string; description: string; notes: string; hosts: HostRow | null;
}
interface LineRow {
  id: string; group_id: string; item_id: string; quantity: number; status: string;
  checked_out_at: string | null; returned_at: string | null; reflection_token: string | null;
}

const toItem = (r: ItemRow): Item => ({
  id: r.id, slug: r.slug, name: r.name, category: r.category as Category, description: r.description,
  careNotes: r.care_notes, quantityTotal: r.quantity_total, status: r.status as ItemStatus,
  photo: r.photo ?? undefined, held: r.held ?? 0,
});
const toReflection = (r: ReflectionRow): Reflection => ({
  id: r.id, lineId: r.line_id ?? '', itemId: r.item_id, firstName: r.first_name, eventName: r.event_name,
  tip: r.tip, howItWent: r.how_it_went, createdAt: r.created_at,
});
const toGroup = (r: GroupRow): RequestGroup => ({
  id: r.id, createdAt: r.created_at, eventName: r.event_name, eventDate: r.event_date,
  neededFrom: r.needed_from, returnBy: r.return_by, pickupWindow: r.pickup_window,
  description: r.description, notes: r.notes,
  host: {
    firstName: r.hosts?.first_name ?? '', lastName: r.hosts?.last_name ?? '', email: r.hosts?.email ?? '',
    phone: r.hosts?.phone ?? '', affiliation: r.hosts?.affiliation ?? '',
  },
});
const toLine = (r: LineRow): RequestLine => ({
  id: r.id, groupId: r.group_id, itemId: r.item_id, quantity: r.quantity, status: r.status as LineStatus,
  checkedOutAt: r.checked_out_at ?? undefined, returnedAt: r.returned_at ?? undefined,
  reflectionToken: r.reflection_token ?? undefined,
});

// Public side ---------------------------------------------------------------

export async function loadShelf() {
  const [shelf, refl] = await Promise.all([
    db().rpc('shelf'),
    db().from('reflections').select('*').order('created_at', { ascending: false }),
  ]);
  return {
    items: (check(shelf) as ItemRow[]).map(toItem),
    reflections: ((check(refl) ?? []) as ReflectionRow[]).map(toReflection),
  };
}

export async function submitRequest(input: Omit<RequestGroup, 'id' | 'createdAt'>, cart: CartLine[]) {
  const { host, ...group } = input;
  const res = await db().rpc('submit_request', {
    p_host: host,
    p_group: group,
    p_lines: cart.map((c) => ({ itemId: c.itemId, quantity: c.quantity })),
  });
  return check(res) as string;
}

export interface ReflectionContext {
  firstName: string; eventName: string; itemId: string; itemName: string; itemSlug: string; already: boolean;
}

export async function reflectionContext(token: string): Promise<ReflectionContext | null> {
  const rows = check(await db().rpc('reflection_context', { p_token: token })) as {
    first_name: string; event_name: string; item_id: string; item_name: string; item_slug: string; already: boolean;
  }[] | null;
  const r = rows?.[0];
  return r
    ? { firstName: r.first_name, eventName: r.event_name, itemId: r.item_id, itemName: r.item_name, itemSlug: r.item_slug, already: r.already }
    : null;
}

export async function submitReflection(token: string, eventName: string, tip: string, howItWent: string) {
  check(await db().rpc('submit_reflection', { p_token: token, p_event_name: eventName, p_tip: tip, p_how: howItWent }));
}

// Librarians' desk ---------------------------------------------------------

export async function loadDesk() {
  const [groups, lines] = await Promise.all([
    db().from('request_groups').select('*, hosts(*)').order('created_at', { ascending: false }),
    db().from('request_lines').select('*').order('created_at', { ascending: true }),
  ]);
  return {
    groups: ((check(groups) ?? []) as GroupRow[]).map(toGroup),
    lines: ((check(lines) ?? []) as LineRow[]).map(toLine),
  };
}

export async function setLineStatus(lineId: string, status: LineStatus) {
  check(await db().from('request_lines').update({ status }).eq('id', lineId));
}

export async function syncItems(rows: ItemInput[]) {
  check(
    await db().from('items').upsert(
      rows.map((r) => ({
        slug: r.slug, name: r.name, category: r.category, description: r.description,
        care_notes: r.careNotes, quantity_total: r.quantityTotal, status: r.status,
      })),
      { onConflict: 'slug' }
    )
  );
}

// Auth -----------------------------------------------------------------------

export async function sendMagicLink(email: string) {
  const { error } = await db().auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo: magicLinkReturnUrl() },
  });
  if (error) throw new Error(error.message);
}

export async function signOut() {
  await db().auth.signOut();
}

export async function isLibrarian() {
  return Boolean(check(await db().rpc('is_librarian')));
}

export function onAuthChange(cb: (email: string | null) => void) {
  const { data } = db().auth.onAuthStateChange((_event, session) => {
    // Deferred on purpose: supabase-js can deadlock if another call runs inside this callback.
    setTimeout(() => {
      if (session && new URLSearchParams(location.search).has('code')) {
        history.replaceState(null, '', location.pathname + location.hash);
      }
      cb(session?.user.email ?? null);
    }, 0);
  });
  return () => data.subscription.unsubscribe();
}