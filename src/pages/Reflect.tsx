import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLibrary, lineIdFromToken } from '@/lib/store';
import { isConfigured } from '@/lib/supabase';
import { reflectionContext, submitReflection, type ReflectionContext } from '@/lib/api';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

function PreviewReflect() {
  const { token = '' } = useParams();
  const lineId = lineIdFromToken(token);
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

function LiveReflect() {
  const { token = '' } = useParams();
  const refreshShelf = useLibrary((s) => s.refreshShelf);
  const [ctx, setCtx] = useState<ReflectionContext | null | undefined>(undefined);
  const [loadError, setLoadError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    reflectionContext(token)
      .then((c) => { if (active) setCtx(c); })
      .catch((e: Error) => { if (active) setLoadError(e.message); });
    return () => { active = false; };
  }, [token]);

  if (loadError) return <p className="text-lg" role="alert">This page didn't load ({loadError}). Try the link again in a minute.</p>;
  if (ctx === undefined) return <p className="text-lg text-muted-foreground">Finding your item…</p>;
  if (!ctx) return <NoMatch />;
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