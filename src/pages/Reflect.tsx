import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLibrary, lineIdFromToken } from '@/lib/store';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { copy } from '@/content/copy';

export default function Reflect() {
  const { token = '' } = useParams();
  const lineId = lineIdFromToken(token);
  const line = useLibrary((s) => s.lines).find((l) => l.id === lineId);
  const group = useLibrary((s) => s.groups).find((g) => g.id === line?.groupId);
  const item = useLibrary((s) => s.items).find((i) => i.id === line?.itemId);
  const already = useLibrary((s) => s.reflections).some((r) => r.lineId === lineId);
  const addReflection = useLibrary((s) => s.addReflection);
  const [eventName, setEventName] = useState(group?.eventName ?? '');
  const [tip, setTip] = useState('');
  const [howItWent, setHowItWent] = useState('');
  const [done, setDone] = useState(false);

  if (!line || !group || !item || line.status !== 'returned') {
    return <p className="text-lg">This link doesn't match a returned item. Write the librarians at {copy.shared.librarianEmail} and they'll sort it out.</p>;
  }

  if (done || already) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl">{done ? copy.reflect.thanks : 'You already left a note for this one — thank you.'}</h1>
        <Link to={`/items/${item.slug}`} className="font-semibold text-secondary underline underline-offset-4">See the {item.name.toLowerCase()}'s biography</Link>
      </div>
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    addReflection({ lineId: line!.id, itemId: item!.id, firstName: group!.host.firstName, eventName, tip, howItWent });
    setDone(true);
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-xl flex-col gap-5">
      <h1 className="text-3xl">{copy.reflect.title}</h1>
      <p className="text-lg">Hi {group.host.firstName} — thanks for bringing back the {item.name.toLowerCase()}.</p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ev">What gathering did you use it for?</Label>
        <Input id="ev" required value={eventName} onChange={(e) => setEventName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tip">{copy.reflect.tipLabel}</Label>
        <Textarea id="tip" required rows={3} value={tip} onChange={(e) => setTip(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="how">{copy.reflect.howLabel}</Label>
        <Input id="how" value={howItWent} onChange={(e) => setHowItWent(e.target.value)} />
      </div>
      <p className="text-muted-foreground">It shows on the item's page with your first name and the gathering.</p>
      <button type="submit" className="big-action bg-primary px-5 text-primary-foreground">{copy.reflect.submit}</button>
    </form>
  );
}