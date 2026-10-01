import { supabase, magicLinkReturnUrl } from '@/lib/supabase';
import type {
  CartLine, Category, EmailKind, Item, ItemInput, ItemStatus, LineStatus, Reflection, RequestGroup, RequestLine,
  Testimonial, TestimonialReview, TipInput,
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
  // Added in 0005; missing until that migration runs.
  replacement_cost?: number | null; deposit?: number | null;
}
interface ReflectionRow {
  id: string; line_id: string | null; item_id: string; first_name: string; event_name: string;
  tip: string; how_it_went: string; created_at: string;
}
interface HostRow { first_name: string; last_name: string; email: string; phone: string; affiliation: string }
interface GroupRow {
  id: string; created_at: string; event_name: string; event_date: string; needed_from: string;
  return_by: string; pickup_window: string; description: string; notes: string;
  // The contact details this request was sent with (added in 0003).
  host_first_name: string | null; host_last_name: string | null;
  host_phone: string | null; host_affiliation: string | null;
  reflection_token: string | null;
  // Added in 0006; missing until that migration runs.
  checkout_email_at?: string | null; return_email_at?: string | null; late_email_at?: string | null;
  hosts: HostRow | null;
}
interface TestimonialRow {
  id: string; group_id: string | null; first_name: string; event_name: string; body: string;
  ok_to_share: boolean; review: string; created_at: string;
}
interface LineRow {
  id: string; group_id: string; item_id: string; quantity: number; status: string;
  checked_out_at: string | null; returned_at: string | null; reflection_token: string | null;
}

const toItem = (r: ItemRow): Item => ({
  id: r.id, slug: r.slug, name: r.name, category: r.category as Category, description: r.description,
  careNotes: r.care_notes, quantityTotal: r.quantity_total, status: r.status as ItemStatus,
  photo: r.photo ?? undefined, held: r.held ?? 0,
  replacementCost: r.replacement_cost ?? null, deposit: r.deposit ?? null,
});
const toReflection = (r: ReflectionRow): Reflection => ({
  id: r.id, lineId: r.line_id ?? '', itemId: r.item_id, firstName: r.first_name, eventName: r.event_name,
  tip: r.tip, howItWent: r.how_it_went, createdAt: r.created_at,
});
const toGroup = (r: GroupRow): RequestGroup => ({
  id: r.id, createdAt: r.created_at, eventName: r.event_name, eventDate: r.event_date,
  neededFrom: r.needed_from, returnBy: r.return_by, pickupWindow: r.pickup_window,
  description: r.description, notes: r.notes,
  reflectionToken: r.reflection_token ?? undefined,
  emailsSent: {
    ...(r.checkout_email_at ? { checkout: r.checkout_email_at } : {}),
    ...(r.return_email_at ? { returned: r.return_email_at } : {}),
    ...(r.late_email_at ? { late: r.late_email_at } : {}),
  },
  host: {
    firstName: r.host_first_name ?? r.hosts?.first_name ?? '',
    lastName: r.host_last_name ?? r.hosts?.last_name ?? '',
    email: r.hosts?.email ?? '',
    phone: r.host_phone ?? r.hosts?.phone ?? '',
    affiliation: r.host_affiliation ?? r.hosts?.affiliation ?? '',
  },
});
const toLine = (r: LineRow): RequestLine => ({
  id: r.id, groupId: r.group_id, itemId: r.item_id, quantity: r.quantity, status: r.status as LineStatus,
  checkedOutAt: r.checked_out_at ?? undefined, returnedAt: r.returned_at ?? undefined,
  reflectionToken: r.reflection_token ?? undefined,
});

const toTestimonial = (r: TestimonialRow): Testimonial => ({
  id: r.id, groupId: r.group_id ?? '', firstName: r.first_name, eventName: r.event_name, text: r.body,
  okToShare: r.ok_to_share, review: r.review as TestimonialReview, createdAt: r.created_at,
});

// Row Level Security decides which testimonials come back: the public gets
// shared + approved ones, a signed-in librarian gets all of them.
// Testimonials are extra, so a problem here shouldn't break the shelf or the desk
// (for example, before migration 0004 has created the table).
const loadTestimonials = async () => {
  const res = await db().from('testimonials').select('*').order('created_at', { ascending: false });
  if (res.error) {
    console.warn(`Testimonials didn't load: ${res.error.message}`);
    return { data: [] as TestimonialRow[], error: null };
  }
  return res;
};

// Public side ---------------------------------------------------------------

export async function loadShelf() {
  const [shelf, refl, tm] = await Promise.all([
    db().rpc('shelf'),
    db().from('reflections').select('*').order('created_at', { ascending: false }),
    loadTestimonials(),
  ]);
  return {
    items: (check(shelf) as ItemRow[]).map(toItem),
    reflections: ((check(refl) ?? []) as ReflectionRow[]).map(toReflection),
    testimonials: ((check(tm) ?? []) as TestimonialRow[]).map(toTestimonial),
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

export interface RequestReflectionItem { lineId: string; itemId: string; itemName: string; itemSlug: string; tipped: boolean }
export interface RequestReflectionContext {
  firstName: string; eventName: string; already: boolean; items: RequestReflectionItem[];
}

export async function requestReflectionContext(token: string): Promise<RequestReflectionContext | null> {
  const ctx = check(await db().rpc('request_reflection_context', { p_token: token })) as RequestReflectionContext | null;
  return ctx ? { ...ctx, items: ctx.items ?? [] } : null;
}

export async function submitRequestReflection(token: string, text: string, okToShare: boolean, tips: TipInput[]) {
  check(await db().rpc('submit_request_reflection', {
    p_token: token, p_testimonial: text, p_ok_to_share: okToShare,
    p_tips: tips.filter((t) => t.tip.trim()).map((t) => ({ lineId: t.lineId, tip: t.tip })),
  }));
}

// Librarians' desk ---------------------------------------------------------

export async function loadDesk() {
  const [groups, lines, tm] = await Promise.all([
    db().from('request_groups').select('*, hosts(*)').order('created_at', { ascending: false }),
    db().from('request_lines').select('*').order('created_at', { ascending: true }),
    loadTestimonials(),
  ]);
  return {
    groups: ((check(groups) ?? []) as GroupRow[]).map(toGroup),
    lines: ((check(lines) ?? []) as LineRow[]).map(toLine),
    testimonials: ((check(tm) ?? []) as TestimonialRow[]).map(toTestimonial),
  };
}

export async function setLineStatus(lineId: string, status: LineStatus) {
  check(await db().from('request_lines').update({ status }).eq('id', lineId));
}

// A tip the host said out loud at the counter, typed in by a librarian with their OK.
export async function addDeskTip(r: Omit<Reflection, 'id' | 'createdAt'>) {
  check(await db().from('reflections').insert({
    line_id: r.lineId, item_id: r.itemId, first_name: r.firstName,
    event_name: r.eventName, tip: r.tip, how_it_went: r.howItWent,
  }));
}

export async function markEmailSent(groupId: string, kind: EmailKind) {
  check(await db().rpc('mark_email_sent', { p_group: groupId, p_kind: kind }));
}

export async function reviewTestimonial(id: string, review: TestimonialReview) {
  check(await db().from('testimonials').update({ review }).eq('id', id));
}

export async function syncItems(rows: ItemInput[]) {
  check(
    await db().from('items').upsert(
      rows.map((r) => ({
        slug: r.slug, name: r.name, category: r.category, description: r.description,
        care_notes: r.careNotes, quantity_total: r.quantityTotal, status: r.status,
        // Only sent when the sheet has the column, so a sheet without it leaves amounts alone.
        ...('replacementCost' in r ? { replacement_cost: r.replacementCost ?? null } : {}),
        ...('deposit' in r ? { deposit: r.deposit ?? null } : {}),
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