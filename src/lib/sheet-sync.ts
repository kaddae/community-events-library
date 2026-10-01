import { CATEGORIES, type Category, type Item, type ItemInput, type ItemStatus } from '@/lib/store';

// Sheet columns: name, slug, category, quantity_total, status, description, care_notes,
// replacement_cost (optional), deposit (optional)
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

// Whole dollars: "$180", "180", "1,200" and "180.00" all work. Blank means none.
// Returns undefined when the cell can't be read as whole dollars.
export function parseDollars(raw: string): number | null | undefined {
  const s = raw.trim();
  if (s === '') return null;
  const m = s.replace(/^\$\s*/, '').replace(/,/g, '').match(/^(\d+)(?:\.0{1,2})?$/);
  return m ? parseInt(m[1], 10) : undefined;
}

export interface SyncResult { rows: ItemInput[]; errors: string[] }

export function rowsToItems(rows: string[][], existing: Item[]): SyncResult {
  const [header, ...body] = rows;
  const errors: string[] = [];
  if (!header) return { rows: [], errors: ['The sheet is empty.'] };
  const col = (n: string) => header.findIndex((h) => h.trim().toLowerCase() === n);
  const idx = { name: col('name'), slug: col('slug'), category: col('category'), qty: col('quantity_total'),
    status: col('status'), description: col('description'), care: col('care_notes'),
    cost: col('replacement_cost'), deposit: col('deposit') };
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

    // Amounts: only included when the sheet has the column, so a sheet
    // without it leaves saved amounts alone. A row with an unreadable
    // amount is left out of the sync until it's fixed.
    const amounts: Partial<Pick<ItemInput, 'replacementCost' | 'deposit'>> = {};
    let bad = false;
    ([['cost', 'replacementCost', 'replacement_cost'], ['deposit', 'deposit', 'deposit']] as const).forEach(([key, field, label]) => {
      if (idx[key] < 0) return;
      const v = parseDollars(get(idx[key]));
      if (v === undefined) {
        errors.push(`Row ${n + 2} (${name}): ${label} "${get(idx[key])}" isn't whole dollars, so this row was skipped.`);
        bad = true;
      } else amounts[field] = v;
    });
    if (bad) return;

    out.push({
      slug, name, status,
      category: (cat ?? prev?.category ?? 'Furniture') as Category,
      quantityTotal: Number.isFinite(qty) ? qty : prev?.quantityTotal ?? 0,
      description: get(idx.description) || prev?.description || '',
      careNotes: get(idx.care) || prev?.careNotes || '',
      ...amounts,
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