import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seedItems, seedGroups, seedLines, seedReflections } from '@/data/seed';
import { isConfigured, supabase } from '@/lib/supabase';
import * as api from '@/lib/api';

export type Category = 'Furniture' | 'Sound/AV' | 'Lights/Power' | 'Signage' | 'Safety';
export const CATEGORIES: Category[] = ['Furniture', 'Sound/AV', 'Lights/Power', 'Signage', 'Safety'];
export type ItemStatus = 'active' | 'repair' | 'retired';

export interface Item {
  id: string; slug: string; name: string; category: Category; description: string;
  careNotes: string; quantityTotal: number; status: ItemStatus; photo?: string;
  // Server-computed (approved + checked out). Present only when connected to Supabase.
  held?: number;
}
export interface Host {
  firstName: string; lastName: string; email: string; phone: string; affiliation: string; example?: boolean;
}
export interface RequestGroup {
  id: string; createdAt: string; host: Host; eventName: string; eventDate: string;
  neededFrom: string; returnBy: string; pickupWindow: string; description: string; notes: string;
}
export type LineStatus = 'pending' | 'approved' | 'checked_out' | 'returned' | 'declined';
export interface RequestLine {
  id: string; groupId: string; itemId: string; quantity: number; status: LineStatus;
  checkedOutAt?: string; returnedAt?: string; reflectionToken?: string;
}
export interface Reflection {
  id: string; lineId: string; itemId: string; firstName: string; eventName: string;
  tip: string; howItWent: string; createdAt: string;
}
export interface CartLine { itemId: string; quantity: number }
export type Persona = 'host' | 'librarian';
export type ItemInput = Omit<Item, 'id' | 'photo' | 'held'>;
export type LoadStatus = 'loading' | 'ready' | 'error';

export const newId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

// Availability = total − quantities approved or checked out. Pending doesn't hold stock.
// Connected: the server's count. Preview: counted from local lines.
export function availableFor(item: Item, lines: RequestLine[]) {
  if (item.status !== 'active') return 0;
  const held = item.held ?? lines
    .filter((l) => l.itemId === item.id && (l.status === 'approved' || l.status === 'checked_out'))
    .reduce((n, l) => n + l.quantity, 0);
  return Math.max(0, item.quantityTotal - held);
}

export function latestReflection(itemIds: string[], reflections: Reflection[]) {
  return [...reflections]
    .filter((r) => itemIds.includes(r.itemId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

// Preview-only token (the line id, encoded). Connected mode uses the random
// token the database stamps on a line when it's marked returned.
export const reflectToken = (lineId: string) => btoa(lineId).replace(/=+$/, '');
export const lineIdFromToken = (token: string) => {
  try { return atob(token); } catch { return null; }
};

interface State {
  items: Item[];
  groups: RequestGroup[];
  lines: RequestLine[];
  reflections: Reflection[];
  cart: CartLine[];
  persona: Persona;
  live: boolean;
  status: LoadStatus;
  loadError: string;
  authReady: boolean;
  signedInEmail: string | null;
  setCartQty: (itemId: string, quantity: number) => void;
  submitRequest: (input: Omit<RequestGroup, 'id' | 'createdAt'>) => Promise<string>;
  setLineStatus: (lineId: string, status: LineStatus) => Promise<void>;
  addReflection: (r: Omit<Reflection, 'id' | 'createdAt'>) => void;
  applySync: (incoming: ItemInput[]) => Promise<void>;
  setPersona: (p: Persona) => void;
  signOut: () => Promise<void>;
  refreshShelf: () => Promise<void>;
  refreshDesk: () => Promise<void>;
  resetDemo: () => void;
}

const dataState = () =>
  isConfigured
    ? { items: [] as Item[], groups: [] as RequestGroup[], lines: [] as RequestLine[], reflections: [] as Reflection[] }
    : { items: seedItems, groups: seedGroups, lines: seedLines, reflections: seedReflections };

const pendingLines = (groupId: string, cart: CartLine[]): RequestLine[] =>
  cart.map((c) => ({ id: newId('ln'), groupId, itemId: c.itemId, quantity: c.quantity, status: 'pending' }));

export const useLibrary = create<State>()(
  persist(
    (set, get) => ({
      ...dataState(),
      cart: [] as CartLine[],
      persona: 'host' as Persona,
      live: isConfigured,
      status: (isConfigured ? 'loading' : 'ready') as LoadStatus,
      loadError: '',
      authReady: !isConfigured,
      signedInEmail: null,

      setCartQty: (itemId, quantity) =>
        set((s) => {
          const rest = s.cart.filter((c) => c.itemId !== itemId);
          if (quantity <= 0) return { cart: rest };
          const exists = s.cart.some((c) => c.itemId === itemId);
          return {
            cart: exists
              ? s.cart.map((c) => (c.itemId === itemId ? { ...c, quantity } : c))
              : [...s.cart, { itemId, quantity }],
          };
        }),

      submitRequest: async (input) => {
        const { cart } = get();
        const groupId = isConfigured ? await api.submitRequest(input, cart) : newId('grp');
        // Kept in memory so the confirmation page can show what was sent;
        // in connected mode the public can't read requests back from the server.
        set((s) => ({
          groups: [...s.groups, { ...input, id: groupId, createdAt: new Date().toISOString() }],
          lines: [...s.lines, ...pendingLines(groupId, cart)],
          cart: [],
        }));
        return groupId;
      },

      setLineStatus: async (lineId, status) => {
        if (isConfigured) {
          await api.setLineStatus(lineId, status);
          await Promise.all([get().refreshDesk(), get().refreshShelf()]);
          return;
        }
        set((s) => ({
          lines: s.lines.map((l) => {
            if (l.id !== lineId) return l;
            const now = new Date().toISOString();
            return {
              ...l,
              status,
              ...(status === 'checked_out' ? { checkedOutAt: now } : {}),
              ...(status === 'returned' ? { returnedAt: now } : {}),
            };
          }),
        }));
      },

      addReflection: (r) =>
        set((s) => ({
          reflections: [...s.reflections, { ...r, id: newId('rf'), createdAt: new Date().toISOString() }],
        })),

      applySync: async (incoming) => {
        if (isConfigured) {
          await api.syncItems(incoming);
          await get().refreshShelf();
          return;
        }
        set((s) => {
          const bySlug = new Map(s.items.map((i) => [i.slug, i]));
          incoming.forEach((row) => {
            const existing = bySlug.get(row.slug);
            bySlug.set(row.slug, existing ? { ...existing, ...row } : { ...row, id: newId('item') });
          });
          return { items: [...bySlug.values()] };
        });
      },

      setPersona: (persona) => set({ persona }),

      signOut: async () => {
        if (isConfigured) await api.signOut();
        set({ persona: 'host', ...(isConfigured ? { groups: [], lines: [], signedInEmail: null } : {}) });
      },

      refreshShelf: async () => {
        if (!isConfigured) return;
        const { items, reflections } = await api.loadShelf();
        set({ items, reflections, status: 'ready', loadError: '' });
      },

      refreshDesk: async () => {
        if (!isConfigured) return;
        const { groups, lines } = await api.loadDesk();
        set({ groups, lines });
      },

      resetDemo: () => {
        if (isConfigured) return;
        set({ ...dataState(), cart: [], persona: 'host' });
      },
    }),
    {
      // Connected mode keeps only the host's request list in this browser.
      name: isConfigured ? 'nh-lending-library-live-v1' : 'nh-lending-library-v1',
      partialize: (s) =>
        (isConfigured
          ? { cart: s.cart }
          : { items: s.items, groups: s.groups, lines: s.lines, reflections: s.reflections, cart: s.cart, persona: s.persona }) as Partial<State>,
    }
  )
);

async function startLive() {
  const state = useLibrary.getState;

  // Fallback: if the magic-link code landed inside the hash (#/librarian?code=…),
  // exchange it here, since supabase-js only looks for it in the query string.
  const m = location.hash.match(/[?&]code=([^&]+)/);
  if (m && supabase) {
    history.replaceState(null, '', location.pathname + location.search + location.hash.replace(/[?&]code=[^&]+/, ''));
    try { await supabase.auth.exchangeCodeForSession(decodeURIComponent(m[1])); } catch { /* the sign-in page shows the signed-out state */ }
  }

  state().refreshShelf().catch((e: Error) => useLibrary.setState({ status: 'error', loadError: e.message }));

  api.onAuthChange(async (email) => {
    if (!email) {
      useLibrary.setState({ signedInEmail: null, persona: 'host', groups: [], lines: [], authReady: true });
      return;
    }
    try {
      const ok = await api.isLibrarian();
      useLibrary.setState({ signedInEmail: email, persona: ok ? 'librarian' : 'host', authReady: true });
      if (ok) await state().refreshDesk();
    } catch (e) {
      useLibrary.setState({ signedInEmail: email, persona: 'host', authReady: true, loadError: (e as Error).message });
    }
  });
}

if (isConfigured) void startLive();