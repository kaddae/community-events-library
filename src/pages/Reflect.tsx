import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLibrary, lineIdFromToken, type TipInput } from '@/lib/store';
import { isConfigured } from '@/lib/supabase';
import {
  reflectionContext, submitReflection, requestReflectionContext, submitRequestReflection,
  type ReflectionContext, type RequestReflectionContext, type RequestReflectionItem,
} from '@/lib/api';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { copy } from '@/content/copy';

function NoMatch() {
  return <p className="text-lg">This link doesn't match a returned item. Write the librarians at {copy.shared.librarianEmail} and they'll sort it out.</p>;
}

function Thanks({ fresh, itemName, itemSlug }: { fresh: boolean; itemName: string; itemSlug: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl">{fresh ? copy.reflect.thanks : 'You already left a note for this one — thank you.'}</h1>
      <Link to={`/items/${itemSlug}`} className="font-semibold text-secondary underline underline-offset-4">See the {itemName.toLowerCase()}'s biography</Link>
    </div>
  );
}

function GroupThanks({ fresh }: { fresh: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl">{fresh ? copy.reflect.groupThanks : 'You already sent this one in — thank you.'}</h1>
      <Link to="/" className="font-semibold text-secondary underline underline-offset-4">Back to the shelf</Link>
    </div>
  );
}

// One request, one page: a required "how did it go" plus optional, collapsed item tips.
function GroupForm({ firstName, eventName, items, onSave }: {
  firstName: string; eventName: string; items: RequestReflectionItem[];
  onSave: (text: string, okToShare: boolean, tips: TipInput[]) => Promise<void>;
}) {
  const [text, setText] = useState('');
  const [share, setShare] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [tips, setTips] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const tippable = items.filter((i) => !i.tipped);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(text, share, tippable.map((i) => ({ lineId: i.lineId, tip: tips[i.lineId] ?? '' })));
    } catch (err) {
      setError(`That didn't save: ${(err as Error).message}`);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-xl flex-col gap-5">
      <h1 className="text-3xl">{copy.reflect.groupTitle}</h1>
      <p className="text-lg">Hi {firstName}, thanks for bringing everything back from the {eventName}.</p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tm">{copy.reflect.gatheringLabel}</Label>
        <Textarea id="tm" required rows={4} maxLength={1200} value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <label className="flex min-h-11 items-start gap-3">
        <Checkbox checked={share} onChange={(e) => setShare(e.target.checked)} className="mt-1" />
        <span>
          {copy.reflect.shareLabel}
          <span className="block text-sm text-muted-foreground">{copy.reflect.shareHint}</span>
        </span>
      </label>

      {tippable.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="shelf-rule text-xl">{copy.reflect.tipsTitle}</h2>
          <p className="text-muted-foreground">{copy.reflect.tipsHint}</p>
          <ul className="stamp-border">
            {tippable.map((i) => (
              <li key={i.lineId} className="hairline-soft last:border-0">
                <button type="button" aria-expanded={!!open[i.lineId]}
                  onClick={() => setOpen({ ...open, [i.lineId]: !open[i.lineId] })}
                  className="flex min-h-12 w-full items-center justify-between px-3 text-left font-semibold text-secondary">
                  {i.itemName}
                  <span aria-hidden>{open[i.lineId] ? '−' : '+'}</span>
                </button>
                {open[i.lineId] && (
                  <div className="px-3 pb-3">
                    <Textarea rows={2} maxLength={600} aria-label={`Tip for the ${i.itemName}`}
                      placeholder={copy.reflect.tipPlaceholder} value={tips[i.lineId] ?? ''}
                      onChange={(e) => setTips({ ...tips, [i.lineId]: e.target.value })} />
                  </div>
                )}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">Tips show on the item's page with your first name and the gathering.</p>
        </section>
      )}

      {error && <p className="font-semibold text-destructive" role="alert">{error}</p>}
      <button type="submit" disabled={saving} className="big-action bg-primary px-5 text-primary-foreground disabled:opacity-60">
        {saving ? 'Sending…' : copy.reflect.groupSubmit}
      </button>
    </form>
  );
}

function ReflectForm({ firstName, itemName, defaultEvent, onSave }: {
  firstName: string; itemName: string; defaultEvent: string;
  onSave: (eventName: string, tip: string, howItWent: string) => Promise<void>;
}) {
  const [eventName, setEventName] = useState(defaultEvent);
  const [tip, setTip] = useState('');
  const [howItWent, setHowItWent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(eventName, tip, howItWent);
    } catch (err) {
      setError(`That didn't save: ${(err as Error).message}`);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-xl flex-col gap-5">
      <h1 className="text-3xl">{copy.reflect.title}</h1>
      <p className="text-lg">Hi {firstName}, thanks for bringing back the {itemName.toLowerCase()}.</p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ev">What gathering did you use it for?</Label>
        <Input id="ev" required value={eventName} onChange={(e) => setEventName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tip">{copy.reflect.tipLabel}</Label>
        <Textarea id="tip" required rows={3} maxLength={600} value={tip} onChange={(e) => setTip(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="how">{copy.reflect.howLabel}</Label>
        <Input id="how" maxLength={300} value={howItWent} onChange={(e) => setHowItWent(e.target.value)} />
      </div>
      <p className="text-muted-foreground">It shows on the item's page with your first name and the gathering.</p>
      {error && <p className="font-semibold text-destructive" role="alert">{error}</p>}
      <button type="submit" disabled={saving} className="big-action bg-primary px-5 text-primary-foreground disabled:opacity-60">
        {saving ? 'Saving…' : copy.reflect.submit}
      </button>
    </form>
  );
}

function PreviewGroupReflect({ groupId }: { groupId: string }) {
  const groups = useLibrary((s) => s.groups);
  const lines = useLibrary((s) => s.lines);
  const items = useLibrary((s) => s.items);
  const reflections = useLibrary((s) => s.reflections);
  const testimonials = useLibrary((s) => s.testimonials);
  const addGroupReflection = useLibrary((s) => s.addGroupReflection);
  const [done, setDone] = useState(false);

  const group = groups.find((g) => g.id === groupId)!;
  const returned: RequestReflectionItem[] = lines
    .filter((l) => l.groupId === groupId && l.status === 'returned')
    .flatMap((l) => {
      const item = items.find((i) => i.id === l.itemId);
      return item ? [{ lineId: l.id, itemId: item.id, itemName: item.name, itemSlug: item.slug, tipped: reflections.some((r) => r.lineId === l.id) }] : [];
    });
  const already = testimonials.some((t) => t.groupId === groupId);

  if (returned.length === 0) return <NoMatch />;
  if (done || already) return <GroupThanks fresh={done} />;

  return (
    <GroupForm firstName={group.host.firstName} eventName={group.eventName} items={returned}
      onSave={async (text, okToShare, tips) => { addGroupReflection(groupId, text, okToShare, tips); setDone(true); }} />
  );
}

function PreviewLineReflect({ lineId }: { lineId: string | null }) {
  const lines = useLibrary((s) => s.lines);
  const groups = useLibrary((s) => s.groups);
  const items = useLibrary((s) => s.items);
  const reflections = useLibrary((s) => s.reflections);
  const addReflection = useLibrary((s) => s.addReflection);
  const [done, setDone] = useState(false);

  const line = lines.find((l) => l.id === lineId);
  const group = groups.find((g) => g.id === line?.groupId);
  const item = items.find((i) => i.id === line?.itemId);
  const already = reflections.some((r) => r.lineId === lineId);

  if (!line || !group || !item || line.status !== 'returned') return <NoMatch />;
  if (done || already) return <Thanks fresh={done} itemName={item.name} itemSlug={item.slug} />;

  return (
    <ReflectForm
      firstName={group.host.firstName}
      itemName={item.name}
      defaultEvent={group.eventName}
      onSave={async (eventName, tip, howItWent) => {
        addReflection({ lineId: line.id, itemId: item.id, firstName: group.host.firstName, eventName, tip, howItWent });
        setDone(true);
      }}
    />
  );
}

// Preview tokens encode either a request id (one link per request) or a line id (older links).
function PreviewReflect() {
  const { token = '' } = useParams();
  const id = lineIdFromToken(token);
  const groups = useLibrary((s) => s.groups);
  return groups.some((g) => g.id === id) ? <PreviewGroupReflect groupId={id!} /> : <PreviewLineReflect lineId={id} />;
}

type LiveCtx = { kind: 'group'; ctx: RequestReflectionContext } | { kind: 'line'; ctx: ReflectionContext } | null;

function LiveReflect() {
  const { token = '' } = useParams();
  const refreshShelf = useLibrary((s) => s.refreshShelf);
  const [found, setFound] = useState<LiveCtx | undefined>(undefined);
  const [loadError, setLoadError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const group = await requestReflectionContext(token);
      if (group) return { kind: 'group', ctx: group } as LiveCtx;
      const line = await reflectionContext(token);
      return line ? ({ kind: 'line', ctx: line } as LiveCtx) : null;
    })()
      .then((c) => { if (active) setFound(c); })
      .catch((e: Error) => { if (active) setLoadError(e.message); });
    return () => { active = false; };
  }, [token]);

  if (loadError) return <p className="text-lg" role="alert">This page didn't load ({loadError}). Try the link again in a minute.</p>;
  if (found === undefined) return <p className="text-lg text-muted-foreground">Finding your request…</p>;
  if (!found) return <NoMatch />;

  if (found.kind === 'group') {
    const ctx = found.ctx;
    if (done || ctx.already) return <GroupThanks fresh={done} />;
    if (ctx.items.length === 0) return <NoMatch />;
    return (
      <GroupForm firstName={ctx.firstName} eventName={ctx.eventName} items={ctx.items}
        onSave={async (text, okToShare, tips) => {
          await submitRequestReflection(token, text, okToShare, tips);
          await refreshShelf().catch(() => undefined);
          setDone(true);
        }} />
    );
  }

  const ctx = found.ctx;
  if (done || ctx.already) return <Thanks fresh={done} itemName={ctx.itemName} itemSlug={ctx.itemSlug} />;
  return (
    <ReflectForm
      firstName={ctx.firstName}
      itemName={ctx.itemName}
      defaultEvent={ctx.eventName}
      onSave={async (eventName, tip, howItWent) => {
        await submitReflection(token, eventName, tip, howItWent);
        await refreshShelf().catch(() => undefined);
        setDone(true);
      }}
    />
  );
}

export default function Reflect() {
  return isConfigured ? <LiveReflect /> : <PreviewReflect />;
}