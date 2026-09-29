import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useLibrary, availableFor } from '@/lib/store';
import { QuantityStepper, TodoText } from '@/components/Bits';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { copy } from '@/content/copy';

const blank = {
  firstName: '', lastName: '', email: '', phone: '', affiliation: '',
  eventName: '', eventDate: '', neededFrom: '', returnBy: '', pickupWindow: '', description: '', notes: '',
};

type Dates = { eventDate: string; neededFrom: string; returnBy: string };

// ISO yyyy-mm-dd strings compare correctly as plain strings.
function dateProblem(d: Dates, today: string): string {
  if (d.eventDate && d.eventDate < today) return 'The gathering date has already passed. Pick today or later.';
  if (d.neededFrom && d.neededFrom < today) return 'That pickup day has already passed. Pick today or later.';
  if (d.neededFrom && d.eventDate && d.neededFrom > d.eventDate) return 'Pickup comes after the gathering. Pick up on or before the day of it.';
  if (d.returnBy && d.eventDate && d.returnBy < d.eventDate) return 'The bring-back day is before the gathering. Bring things back on or after it.';
  if (d.returnBy && d.neededFrom && d.returnBy < d.neededFrom) return 'The return date comes before the pickup date. Check those two.';
  return '';
}

export default function RequestPage() {
  const items = useLibrary((s) => s.items);
  const lines = useLibrary((s) => s.lines);
  const cart = useLibrary((s) => s.cart);
  const setCartQty = useLibrary((s) => s.setCartQty);
  const submitRequest = useLibrary((s) => s.submitRequest);
  const navigate = useNavigate();
  const [f, setF] = useState(blank);
  // Pickup and return follow the gathering date until the host picks them.
  const [touched, setTouched] = useState({ neededFrom: false, returnBy: false });
  const today = format(new Date(), 'yyyy-MM-dd');
  const dateError = dateProblem(f, today);
  // Honeypot: people never see this field, but form-filling bots tend to fill it in.
  const [trap, setTrap] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const set = (k: keyof typeof blank) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  // Filling pickup and return with the gathering date makes their calendars open on that month.
  const setEventDate = (v: string) =>
    setF((prev) => {
      const next = { ...prev, eventDate: v };
      if (!v) return next;
      if (!touched.neededFrom || !prev.neededFrom || prev.neededFrom > v) next.neededFrom = v;
      if (!touched.returnBy || !prev.returnBy || prev.returnBy < v) next.returnBy = v;
      return next;
    });

  const setPickup = (v: string) => {
    setTouched((t) => ({ ...t, neededFrom: true }));
    setF((prev) => ({
      ...prev,
      neededFrom: v,
      returnBy: v && (!prev.returnBy || prev.returnBy < v) ? v : prev.returnBy,
    }));
  };

  const setReturn = (v: string) => {
    setTouched((t) => ({ ...t, returnBy: true }));
    setF((prev) => ({ ...prev, returnBy: v }));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (trap.trim()) {
      navigate('/request/sent/received');
      return;
    }
    if (dateError) {
      setError(dateError);
      return;
    }
    setSending(true);
    const { firstName, lastName, email, phone, affiliation, ...event } = f;
    try {
      const id = await submitRequest({ host: { firstName, lastName, email, phone, affiliation }, ...event });
      navigate(`/request/sent/${id}`);
    } catch (err) {
      setError(`That didn't go through: ${(err as Error).message} Try again, or write the librarians at ${copy.shared.librarianEmail}.`);
      setSending(false);
    }
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

  const req = <span className="font-bold text-primary" aria-hidden> *</span>;

  const dateField = (k: keyof Dates, label: string, onChange: (v: string) => void, min: string, max?: string) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={k}>{label}{req}</Label>
      <Input id={k} type="date" required min={min} max={max || undefined} value={f[k]}
        aria-invalid={Boolean(dateError) || undefined} aria-describedby={dateError ? 'date-error' : undefined}
        onChange={(e) => onChange(e.target.value)} />
    </div>
  );

  const field = (k: keyof typeof blank, label: string, type = 'text', required = true) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={k}>{label}{required && req}</Label>
      <Input id={k} type={type} required={required} value={f[k]} onChange={set(k)} />
    </div>
  );

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_1.3fr]">
      <section className="flex flex-col gap-3 md:sticky md:top-24 md:self-start">
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

      <form onSubmit={onSubmit} className="relative flex flex-col gap-5">
        <p className="text-muted-foreground">Fields marked <span className="font-bold text-primary">*</span> are needed. Everything else is up to you.</p>
        <h2 className="shelf-rule text-2xl">About you</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {field('firstName', 'First name')}
          {field('lastName', 'Last name')}
          {field('email', 'Email', 'email')}
          {field('phone', 'Phone', 'tel', false)}
        </div>
        {field('affiliation', 'Group, block, or organization', 'text', false)}
        <TodoText text={copy.request.privacy} className="text-muted-foreground" />

        <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off"
            value={trap} onChange={(e) => setTrap(e.target.value)} />
        </div>

        <h2 className="shelf-rule text-2xl">{copy.request.formTitle}</h2>
        {field('eventName', 'Name of the gathering')}
        <div className="flex flex-col gap-2">
          <div className="grid gap-4 sm:grid-cols-3">
            {dateField('eventDate', 'Date', setEventDate, today)}
            {dateField('neededFrom', "Day you'd like to pick up", setPickup, today, f.eventDate)}
            {dateField('returnBy', 'Bring back by', setReturn, f.eventDate || f.neededFrom || today)}
          </div>
          {dateError && <p id="date-error" className="font-semibold text-destructive">{dateError}</p>}
        </div>
        {field('pickupWindow', 'What days/times work best for you?', 'text', false)}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">What's the gathering?</Label>
          <Textarea id="description" rows={3} value={f.description} onChange={set('description')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Anything else the librarians should know</Label>
          <Textarea id="notes" rows={2} value={f.notes} onChange={set('notes')} />
        </div>
        {error && <p className="font-semibold text-destructive" role="alert">{error}</p>}
        <TodoText text={copy.request.responseTime} />
        <button type="submit" disabled={sending} className="big-action bg-primary px-5 text-primary-foreground disabled:opacity-60">
          {sending ? 'Sending…' : copy.request.submit}
        </button>
      </form>
    </div>
  );
}