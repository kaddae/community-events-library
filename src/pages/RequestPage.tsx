import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLibrary, availableFor } from '@/lib/store';
import { QuantityStepper } from '@/components/Bits';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { copy } from '@/content/copy';

const blank = {
  firstName: '', lastName: '', email: '', phone: '', affiliation: '',
  eventName: '', eventDate: '', neededFrom: '', returnBy: '', pickupWindow: '', description: '', notes: '',
};

export default function RequestPage() {
  const items = useLibrary((s) => s.items);
  const lines = useLibrary((s) => s.lines);
  const cart = useLibrary((s) => s.cart);
  const setCartQty = useLibrary((s) => s.setCartQty);
  const submitRequest = useLibrary((s) => s.submitRequest);
  const navigate = useNavigate();
  const [f, setF] = useState(blank);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const set = (k: keyof typeof blank) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (f.returnBy && f.neededFrom && f.returnBy < f.neededFrom) {
      setError('The return date comes before the pickup date — check those two.');
      return;
    }
    setSending(true);
    const { firstName, lastName, email, phone, affiliation, ...event } = f;
    const id = submitRequest({ host: { firstName, lastName, email, phone, affiliation }, ...event });
    navigate(`/request/sent/${id}`);
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl">{copy.request.title}</h1>
        <p className="text-lg">{copy.request.empty}</p>
        <Link to="/" className="big-action inline-flex items-center self-start bg-primary px-5 text-primary-foreground">Go to the shelf</Link>
      </div>
    );
  }

  const field = (k: keyof typeof blank, label: string, type = 'text', required = true) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={k}>{label}{!required && <span className="text-muted-foreground"> (optional)</span>}</Label>
      <Input id={k} type={type} required={required} value={f[k]} onChange={set(k)} />
    </div>
  );

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_1.3fr]">
      <section className="flex flex-col gap-3 md:sticky md:top-6 md:self-start">
        <h1 className="text-3xl">{copy.request.title}</h1>
        <ul className="stamp-border">
          {cart.map((c) => {
            const item = items.find((i) => i.id === c.itemId);
            if (!item) return null;
            return (
              <li key={c.itemId} className="hairline-soft flex flex-wrap items-center justify-between gap-3 p-3 last:border-0">
                <Link to={`/items/${item.slug}`} className="font-semibold text-secondary underline-offset-4 hover:underline">{item.name}</Link>
                <QuantityStepper value={c.quantity} max={availableFor(item, lines)} onChange={(n) => setCartQty(item.id, n)} label={item.name} />
              </li>
            );
          })}
        </ul>
        <Link to="/" className="font-semibold text-secondary underline underline-offset-4">Add something else</Link>
      </section>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <h2 className="shelf-rule text-2xl">About you</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {field('firstName', 'First name')}
          {field('lastName', 'Last name')}
          {field('email', 'Email', 'email')}
          {field('phone', 'Phone', 'tel')}
        </div>
        {field('affiliation', 'Group, block, or organization', 'text', false)}

        <h2 className="shelf-rule text-2xl">{copy.request.formTitle}</h2>
        {field('eventName', 'Name of the gathering')}
        <div className="grid gap-4 sm:grid-cols-3">
          {field('eventDate', 'Date', 'date')}
          {field('neededFrom', 'Pick up on', 'date')}
          {field('returnBy', 'Bring back by', 'date')}
        </div>
        {field('pickupWindow', 'When can you pick up?')}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">What's the gathering?</Label>
          <Textarea id="description" required rows={3} value={f.description} onChange={set('description')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Anything else the librarians should know <span className="text-muted-foreground">(optional)</span></Label>
          <Textarea id="notes" rows={2} value={f.notes} onChange={set('notes')} />
        </div>
        {error && <p className="font-semibold text-destructive" role="alert">{error}</p>}
        <button type="submit" disabled={sending} className="big-action bg-primary px-5 text-primary-foreground disabled:opacity-60">
          {sending ? 'Sending…' : copy.request.submit}
        </button>
      </form>
    </div>
  );
}