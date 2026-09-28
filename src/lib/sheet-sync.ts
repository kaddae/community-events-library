import { CATEGORIES, type Category, type Item, type ItemInput, type ItemStatus } from '@/lib/store';

// Sheet columns: name, slug, category, quantity_total, status, description, care_notes
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export interface SyncResult { rows: ItemInput[]; errors: string[] }

export function rowsToItems(rows: string[][], existing: Item[]): SyncResult {
  const [header, ...body] = rows;
  const errors: string[] = [];
  if (!header) return { rows: [], errors: ['The sheet is empty.'] };
  const col = (n: string) => header.findIndex((h) => h.trim().toLowerCase() === n);
  const idx = { name: col('name'), slug: col('slug'), category: col('category'), qty: col('quantity_total'),
    status: col('status'), description: col('description'), care: col('care_notes') };
  if (idx.name < 0) return { rows: [], errors: ['No "name" column found in the first row.'] };

  const out: ItemInput[] = [];
  body.forEach((r, n) => {
    const get = (i: number) => (i >= 0 ? (r[i] ?? '').trim() : '');
    const name = get(idx.name);
    if (!name) return;
    const slug = get(idx.slug) || slugify(name);
    const prev = existing.find((e) => e.slug === slug);
    const cat = CATEGORIES.find((c) => c.toLowerCase() === get(idx.category).toLowerCase());
    const qty = parseInt(get(idx.qty), 10);
    const status = (['active', 'repair', 'retired'].includes(get(idx.status).toLowerCase())
      ? get(idx.status).toLowerCase() : prev?.status ?? 'active') as ItemStatus;
    if (!cat && !prev) errors.push(`Row ${n + 2} (${name}): unknown category "${get(idx.category)}".`);
    out.push({
      slug, name, status,
      category: (cat ?? prev?.category ?? 'Furniture') as Category,
      quantityTotal: Number.isFinite(qty) ? qty : prev?.quantityTotal ?? 0,
      description: get(idx.description) || prev?.description || '',
      careNotes: get(idx.care) || prev?.careNotes || '',
    });
  });
  return { rows: out, errors };
}

export async function loadSheet(source: string): Promise<string> {
  const s = source.trim();
  if (!/^https?:\/\//.test(s)) return s;
  const res = await fetch(s);
  if (!res.ok) throw new Error(`The sheet answered ${res.status}. Is it published to the web as CSV?`);
  return res.text();
}