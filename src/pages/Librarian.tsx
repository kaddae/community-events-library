import { useState } from 'react';
import { Link } from 'react-router-dom';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useLibrary, availableFor, reflectToken, type ItemInput, type LineStatus } from '@/lib/store';
import { parseCSV, rowsToItems, loadSheet } from '@/lib/sheet-sync';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { copy } from '@/content/copy';

const actions: Partial<Record<LineStatus, { to: LineStatus; label: string; primary?: boolean }[]>> = {
  pending: [{ to: 'approved', label: 'Approve', primary: true }, { to: 'declined', label: 'Decline' }],
  approved: [{ to: 'checked_out', label: 'Check out', primary: true }],
  checked_out: [{ to: 'returned', label: 'Mark returned', primary: true }],
};
const statusLabel: Record<LineStatus, string> = {
  pending: 'Waiting', approved: 'Approved', checked_out: 'Out', returned: 'Returned', declined: 'Declined',
};

function SignIn() {
  const setPersona = useLibrary((s) => s.setPersona);
  const [email, setEmail] = useState(copy.shared.librarianEmail);
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-3xl">Librarian sign-in</h1>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="em">Email</Label>
        <Input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <button onClick={() => setPersona('librarian')} className="big-action bg-primary px-5 text-primary-foreground">Sign in</button>
      <p className="text-sm text-muted-foreground">Preview sign-in. The magic-link email arrives once the backend is connected.</p>
    </div>
  );
}

function Requests() {
  const groups = useLibrary((s) => s.groups);
  const lines = useLibrary((s) => s.lines);
  const items = useLibrary((s) => s.items);
  const reflections = useLibrary((s) => s.reflections);
  const setLineStatus = useLibrary((s) => s.setLineStatus);
  const [copied, setCopied] = useState('');
  const today = new Date();
  const sorted = [...groups].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const copyLink = async (lineId: string) => {
    const url = `${location.origin}${location.pathname}#/reflect/${reflectToken(lineId)}`;
    try { await navigator.clipboard.writeText(url); } catch { window.prompt('Copy this link', url); }
    setCopied(lineId);
  };

  if (sorted.length === 0) return <p className="text-lg">No requests yet. The first one will show up here.</p>;

  return (
    <div className="flex flex-col gap-5">
      {sorted.map((g) => {
        const gl = lines.filter((l) => l.groupId === g.id);
        const late = differenceInCalendarDays(today, parseISO(g.returnBy)) > 0;
        return (
          <article key={g.id} className="stamp-border">
            <header className="hairline flex flex-wrap items-baseline justify-between gap-2 px-3 py-2.5">
              <h2 className="text-xl">{g.eventName}</h2>
              <span className="text-sm text-muted-foreground">{g.eventDate} · pickup {g.neededFrom}, {g.pickupWindow} · back {g.returnBy}</span>
            </header>
            <div className="flex flex-col gap-1 px-3 py-2.5">
              <p className="font-semibold">
                {g.host.firstName} {g.host.lastName}
                {g.host.affiliation && <span className="font-normal text-muted-foreground"> · {g.host.affiliation}</span>}
                {g.host.example && <span className="font-normal text-muted-foreground"> (example)</span>}
              </p>
              <p className="text-sm">
                <a className="text-secondary underline underline-offset-4" href={`mailto:${g.host.email}?subject=${encodeURIComponent(g.eventName)}`}>Reply to {g.host.email}</a> · {g.host.phone}
              </p>
              <p>{g.description}</p>
              {g.notes && <p className="text-muted-foreground">Note: {g.notes}</p>}
            </div>
            <ul>
              {gl.map((l) => {
                const item = items.find((i) => i.id === l.itemId);
                const overdue = l.status === 'checked_out' && late;
                const reflected = reflections.some((r) => r.lineId === l.id);
                return (
                  <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2" style={{ borderTop: 'var(--rule-soft)' }}>
                    <span className="flex items-center gap-2">
                      {l.quantity} × {item?.name}
                      <Badge variant="outline">{statusLabel[l.status]}</Badge>
                      {overdue && <Badge variant="secondary">Past return date</Badge>}
                      {l.status === 'pending' && item && l.quantity > availableFor(item, lines) && (
                        <span className="text-sm text-destructive">only {availableFor(item, lines)} free</span>
                      )}
                    </span>
                    <span className="flex flex-wrap gap-2">
                      {(actions[l.status] ?? []).map((a) => (
                        <button key={a.to} onClick={() => setLineStatus(l.id, a.to)}
                          className={`min-h-11 px-3 font-semibold ${a.primary ? 'bg-primary text-primary-foreground' : 'border-[1.5px] border-secondary text-secondary'}`}>
                          {a.label}
                        </button>
                      ))}
                      {l.status === 'returned' && (reflected
                        ? <span className="text-sm text-muted-foreground">Tip left</span>
                        : <button onClick={() => copyLink(l.id)} className="min-h-11 border-[1.5px] border-secondary px-3 font-semibold text-secondary">
                            {copied === l.id ? 'Link copied' : 'Copy reflection link'}
                          </button>)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </article>
        );
      })}
    </div>
  );
}

function Inventory() {
  const items = useLibrary((s) => s.items);
  const lines = useLibrary((s) => s.lines);
  const applySync = useLibrary((s) => s.applySync);
  const [source, setSource] = useState('');
  const [preview, setPreview] = useState<ItemInput[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function dryRun() {
    setBusy(true); setMsg(''); setErrors([]);
    try {
      const res = rowsToItems(parseCSV(await loadSheet(source)), items);
      setPreview(res.rows); setErrors(res.errors);
    } catch (e) { setErrors([(e as Error).message]); setPreview(null); }
    setBusy(false);
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section className="flex flex-col gap-3">
        <h2 className="shelf-rule text-xl">Sync from the Google Sheet</h2>
        <Label htmlFor="src">Published CSV link (or paste the CSV)</Label>
        <Textarea id="src" rows={3} value={source} onChange={(e) => setSource(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/e/…/pub?output=csv" />
        <p className="text-sm text-muted-foreground">Columns: name, slug, category, quantity_total, status, description, care_notes. Items missing from the sheet stay as they are.</p>
        <button onClick={dryRun} disabled={!source.trim() || busy} className="min-h-12 border-[1.5px] border-secondary font-semibold text-secondary disabled:opacity-40">
          {busy ? 'Reading…' : 'Preview changes'}
        </button>
        {errors.map((e) => <p key={e} className="text-destructive">{e}</p>)}
        {preview && (
          <div className="flex flex-col gap-2">
            <ul className="stamp-border text-sm">
              {preview.map((r) => {
                const prev = items.find((i) => i.slug === r.slug);
                const change = !prev ? 'new' : prev.quantityTotal !== r.quantityTotal || prev.status !== r.status || prev.name !== r.name ? 'changed' : 'same';
                return (
                  <li key={r.slug} className="hairline-soft flex justify-between px-3 py-1.5 last:border-0">
                    <span>{r.name} · {r.quantityTotal} · {r.status}</span>
                    <span className={change === 'same' ? 'text-muted-foreground' : 'font-semibold text-secondary'}>{change}</span>
                  </li>
                );
              })}
            </ul>
            <button onClick={() => { applySync(preview); setPreview(null); setMsg(`Synced ${preview.length} rows.`); }}
              className="big-action bg-primary text-primary-foreground">Apply {preview.length} rows</button>
          </div>
        )}
        {msg && <p className="font-semibold text-secondary">{msg}</p>}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="shelf-rule text-xl">On the shelf now</h2>
        <ul className="stamp-border">
          {items.map((i) => (
            <li key={i.id} className="hairline-soft flex justify-between gap-2 px-3 py-2 last:border-0">
              <Link to={`/items/${i.slug}`} className="text-secondary underline-offset-4 hover:underline">{i.name}</Link>
              <span className="text-muted-foreground">{i.status !== 'active' ? i.status : `${availableFor(i, lines)} / ${i.quantityTotal}`}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function Librarian() {
  const persona = useLibrary((s) => s.persona);
  const resetDemo = useLibrary((s) => s.resetDemo);
  const pending = useLibrary((s) => s.lines).filter((l) => l.status === 'pending').length;
  if (persona !== 'librarian') return <SignIn />;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-3xl">The librarians' desk</h1>
        <button onClick={() => { if (confirm('Reset all preview data to the starting shelf?')) resetDemo(); }}
          className="text-sm text-muted-foreground underline underline-offset-4">Reset preview data</button>
      </div>
      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Requests{pending ? ` (${pending} waiting)` : ''}</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>
        <TabsContent value="requests" className="pt-4"><Requests /></TabsContent>
        <TabsContent value="inventory" className="pt-4"><Inventory /></TabsContent>
      </Tabs>
    </div>
  );
}