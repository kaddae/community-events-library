import { useState } from 'react';
import { Link } from 'react-router-dom';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useLibrary, availableFor, reflectToken, type ItemInput, type LineStatus } from '@/lib/store';
import { isConfigured, magicLinkReturnUrl } from '@/lib/supabase';
import { sendMagicLink } from '@/lib/api';
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

function ReturnAddress() {
  const origin = `${location.origin}/**`;
  return (
    <div className="flex flex-col gap-1 border-l-4 border-secondary pl-3 text-sm">
      <p className="font-semibold text-secondary">Allow this address in Supabase</p>
      <p className="text-muted-foreground">Authentication → URL Configuration → Redirect URLs:</p>
      <code className="break-all bg-muted px-2 py-1">{origin}</code>
      <p className="text-muted-foreground">Sign-in links return to <span className="break-all">{magicLinkReturnUrl()}</span></p>
    </div>
  );
}

function SignIn() {
  const setPersona = useLibrary((s) => s.setPersona);
  const signOut = useLibrary((s) => s.signOut);
  const signedInEmail = useLibrary((s) => s.signedInEmail);
  const [email, setEmail] = useState(isConfigured ? '' : copy.shared.librarianEmail);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (isConfigured && signedInEmail) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <h1 className="text-3xl">Not on the librarian list</h1>
        <p className="text-lg">You're signed in as {signedInEmail}, but that address isn't on the librarian allowlist. Ask a steward at {copy.shared.librarianEmail} to add you.</p>
        <button onClick={() => { void signOut(); }} className="min-h-12 border-[1.5px] border-secondary font-semibold text-secondary">Sign out</button>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConfigured) { setPersona('librarian'); return; }
    setBusy(true); setError('');
    try { await sendMagicLink(email); setSent(true); }
    catch (err) { setError(`The link didn't send: ${(err as Error).message}`); }
    setBusy(false);
  }

  if (sent) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <h1 className="text-3xl">Check your email</h1>
        <p className="text-lg">A sign-in link is on its way to {email}. Open it in this same browser, since links only work where they were requested.</p>
        <button onClick={() => setSent(false)} className="text-left text-secondary underline underline-offset-4">Use a different address</button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-3xl">Librarian sign-in</h1>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="em">Email</Label>
        <Input id="em" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {error && <p className="font-semibold text-destructive" role="alert">{error}</p>}
      <button type="submit" disabled={busy} className="big-action bg-primary px-5 text-primary-foreground disabled:opacity-60">
        {busy ? 'Sending…' : isConfigured ? 'Email me a sign-in link' : 'Sign in'}
      </button>
      {isConfigured ? <ReturnAddress /> : (
        <p className="text-sm text-muted-foreground">Preview sign-in. Real sign-in links go out once Supabase keys are set.</p>
      )}
    </form>
  );
}

function Requests() {
  const groups = useLibrary((s) => s.groups);
  const lines = useLibrary((s) => s.lines);
  const items = useLibrary((s) => s.items);
  const reflections = useLibrary((s) => s.reflections);
  const setLineStatus = useLibrary((s) => s.setLineStatus);
  const [copied, setCopied] = useState('');
  const [working, setWorking] = useState('');
  const [error, setError] = useState('');
  const today = new Date();
  const sorted = [...groups].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const change = async (lineId: string, to: LineStatus) => {
    setWorking(lineId); setError('');
    try { await setLineStatus(lineId, to); }
    catch (e) { setError(`That didn't save: ${(e as Error).message}`); }
    setWorking('');
  };

  const copyLink = async (lineId: string, token?: string) => {
    const t = isConfigured ? token : reflectToken(lineId);
    if (!t) { setError('No reflection link on this line yet. Refresh the page and try again.'); return; }
    const url = `${location.origin}${location.pathname}#/reflect/${t}`;
    try { await navigator.clipboard.writeText(url); } catch { window.prompt('Copy this link', url); }
    setCopied(lineId);
  };

  if (sorted.length === 0) return <p className="text-lg">No requests yet. The first one will show up here.</p>;

  return (
    <div className="flex flex-col gap-5">
      {error && <p className="font-semibold text-destructive" role="alert">{error}</p>}
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
                const free = item ? availableFor(item, lines) : 0;
                return (
                  <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2" style={{ borderTop: 'var(--rule-soft)' }}>
                    <span className="flex items-center gap-2">
                      {l.quantity} × {item?.name}
                      <Badge variant="outline">{statusLabel[l.status]}</Badge>
                      {overdue && <Badge variant="secondary">Past return date</Badge>}
                      {l.status === 'pending' && item && l.quantity > free && (
                        <span className="text-sm text-destructive">only {free} free</span>
                      )}
                    </span>
                    <span className="flex flex-wrap gap-2">
                      {(actions[l.status] ?? []).map((a) => (
                        <button key={a.to} disabled={working === l.id} onClick={() => { void change(l.id, a.to); }}
                          className={`min-h-11 px-3 font-semibold disabled:opacity-50 ${a.primary ? 'bg-primary text-primary-foreground' : 'border-[1.5px] border-secondary text-secondary'}`}>
                          {a.label}
                        </button>
                      ))}
                      {l.status === 'returned' && (reflected
                        ? <span className="text-sm text-muted-foreground">Tip left</span>
                        : <button onClick={() => { void copyLink(l.id, l.reflectionToken); }} className="min-h-11 border-[1.5px] border-secondary px-3 font-semibold text-secondary">
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

  async function apply(rows: ItemInput[]) {
    setBusy(true); setErrors([]);
    try { await applySync(rows); setPreview(null); setMsg(`Synced ${rows.length} rows.`); }
    catch (e) { setErrors([`The sync didn't save: ${(e as Error).message}`]); }
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
          {busy && !preview ? 'Reading…' : 'Preview changes'}
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
            <button onClick={() => { void apply(preview); }} disabled={busy}
              className="big-action bg-primary text-primary-foreground disabled:opacity-60">
              {busy ? 'Saving…' : `Apply ${preview.length} rows`}
            </button>
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
  const authReady = useLibrary((s) => s.authReady);
  const resetDemo = useLibrary((s) => s.resetDemo);
  const lines = useLibrary((s) => s.lines);
  const pending = lines.filter((l) => l.status === 'pending').length;

  if (!authReady) return <p className="text-lg text-muted-foreground">Checking your sign-in…</p>;
  if (persona !== 'librarian') return <SignIn />;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-3xl">The librarians' desk</h1>
        {!isConfigured && (
          <button onClick={() => { if (confirm('Reset all preview data to the starting shelf?')) resetDemo(); }}
            className="text-sm text-muted-foreground underline underline-offset-4">Reset preview data</button>
        )}
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