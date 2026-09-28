import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seedItems, seedGroups, seedLines, seedReflections } from '@/data/seed';

export type Category = 'Furniture' | 'Sound/AV' | 'Lights/Power' | 'Signage' | 'Safety';
export const CATEGORIES: Category[] = ['Furniture', 'Sound/AV', 'Lights/Power', 'Signage', 'Safety'];
export type ItemStatus = 'active' | 'repair' | 'retired';

export interface Item {
  id: string; slug: string; name: string; category: Category; description: string;
  careNotes: string; quantityTotal: number; status: ItemStatus; photo?: string;
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
  checkedOutAt?: string; returnedAt?: string;
}
export interface Reflection {
  id: string; lineId: string; itemId: string; firstName: string; eventName: string;
  tip: string; howItWent: string; createdAt: string;
}
export interface CartLine { itemId: string; quantity: number }
export type Persona = 'host' | 'librarian';
export type ItemInput = Omit<Item, 'id' | 'photo'>;

export const newId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

// Availability = total − quantities approved or checked out. Pending doesn't hold stock.
export function availableFor(item: Item, lines: RequestLine[]) {
  if (item.status !== 'active') return 0;
  const held = lines
    .filter((l) => l.itemId === item.id && (l.status === 'approved' || l.status === 'checked_out'))
    .reduce((n, l) => n + l.quantity, 0);
  return Math.max(0, item.quantityTotal - held);
}

export function latestReflection(itemIds: string[], reflections: Reflection[]) {
  return [...reflections]
    .filter((r) => itemIds.includes(r.itemId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

// Preview token: the line id, encoded. The backend pass swaps in an HMAC-signed token.
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
  setCartQty: (itemId: string, quantity: number) => void;
  submitRequest: (input: Omit<RequestGroup, 'id' | 'createdAt'>) => string;
  setLineStatus: (lineId: string, status: LineStatus) => void;
  addReflection: (r: Omit<Reflection, 'id' | 'createdAt'>) => void;
  applySync: (incoming: ItemInput[]) => void;
  setPersona: (p: Persona) => void;
  resetDemo: () => void;
}

const seedState = () => ({
  items: seedItems, groups: seedGroups, lines: seedLines, reflections: seedReflections,
  cart: [] as CartLine[], persona: 'host' as Persona,
});

export const useLibrary = create<State>()(
  persist(
    (set, get) => ({
      ...seedState(),

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

      submitRequest: (input) => {
        const groupId = newId('grp');
        const { cart } = get();
        set((s) => ({
          groups: [...s.groups, { ...input, id: groupId, createdAt: new Date().toISOString() }],
          lines: [
            ...s.lines,
            ...cart.map((c) => ({ id: newId('ln'), groupId, itemId: c.itemId, quantity: c.quantity, status: 'pending' as LineStatus })),
          ],
          cart: [],
        }));
        return groupId;
      },

      setLineStatus: (lineId, status) =>
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
        })),

      addReflection: (r) =>
        set((s) => ({
          reflections: [...s.reflections, { ...r, id: newId('rf'), createdAt: new Date().toISOString() }],
        })),

      applySync: (incoming) =>
        set((s) => {
          const bySlug = new Map(s.items.map((i) => [i.slug, i]));
          incoming.forEach((row) => {
            const existing = bySlug.get(row.slug);
            bySlug.set(row.slug, existing ? { ...existing, ...row } : { ...row, id: newId('item') });
          });
          return { items: [...bySlug.values()] };
        }),

      setPersona: (persona) => set({ persona }),
      resetDemo: () => set(seedState()),
    }),
    { name: 'nh-lending-library-v1' }
  )
);