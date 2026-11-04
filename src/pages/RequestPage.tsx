import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useLibrary, availableFor } from '@/lib/store';
import { QuantityStepper, TodoText, DepositNotice, InfoToggle, VenmoText, fill } from '@/components/Bits';
import { sendRequestEmail } from '@/lib/email';
import {
  pickupDays, returnDays, pickupWindowStart, slotKey, dayLabel, hoursLabel, startLabel, formatSlot,
  slotsToWindow, slotDays,
} from '@/lib/slots';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { copy } from '@/content/copy';

const blank = {
  firstName: '', lastName: '', email: '', phone: '', affiliation: '',
  eventName: '', eventDate: '', returnBy: '', description: '', notes: '',
  heardFrom: '',
};

// '' = not picked yet, '0' = Not this time, 'other' = typed amount.
type Pledge = '' | '0' | 'other' | `${number}`;

// ISO yyyy-mm-dd strings compare correctly as plain strings.
function dateProblem(d: { eventDate: string; returnBy: string }, today: string): string {
  if (d.eventDate && d.eventDate < today) return 'The gathering date has already passed. Pick today or later.';
  if (d.returnBy && d.eventDate && d.returnBy < d.eventDate) return 'The drop-off day is before the gathering. Bring things back on or after it.';
  return '';
}

const choiceCls = (on: boolean) =>
  `min-h-11 border-[1.5px] border-secondary px-3 font-semibold ${on ? 'bg-secondary text-secondary-foreground' : 'text-secondary'}`;

export default function RequestPage() {
  const items = useLibrary((s) => s.items);
  const lines = useLibrary((s) => s.lines);
  const cart = useLibrary((s) => s.cart);
  const setCartQty = useLibrary((s) => s.setCartQty);
  const submitRequest = useLibrary((s) => s.submitRequest);
  const navigate = useNavigate();
  const [f, setF] = useState(blank);
  // Chosen pickup slots, as "yyyy-MM-dd HH:mm" keys.
  const [slots, setSlots] = useState<string[]>([]);
  // Used only when no open day falls before the gathering.
  const [pickupFallback, setPickupFallback] = useState('');
  const today = format(new Date(), 'yyyy-MM-dd');
  const dateError = dateProblem(f, today);
  // Honeypot: people never see this field, but form-filling bots tend to fill it in.
  const [trap, setTrap] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [pledge, setPledge] = useState<Pledge>('');
  const [otherAmount, setOtherAmount] = useState('');

  const pDays = pickupDays(f.eventDate);
  const rDays = returnDays(f.eventDate);

  const set = (k: keyof typeof blank) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  // A new gathering date keeps only the picks that still fit around it.
  const setEventDate = (v: string) => {
    const keepReturn = returnDays(v).some((d) => d.date === f.returnBy);
    setF((prev) => ({ ...prev, eventDate: v, returnBy: keepReturn ? prev.returnBy : '' }));
    const keep = new Set(pickupDays(v).flatMap((d) => d.starts.map((s) => slotKey(d.date, s))));
    setSlots((prev) => prev.filter((k) => keep.has(k)));
  };

  const toggleSlot = (key: string) => {
    setError('');
    setSlots((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
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
    let neededFrom: string, pickupLatest: string, pickupWindow: string;
    if (pDays.length > 0) {
      // Drop any slot that has passed while the form was open.
      const open = new Set(pDays.flatMap((d) => d.starts.map((s) => slotKey(d.date, s))));
      const live = slots.filter((k) => open.has(k));
      if (live.length === 0) { setError(copy.request.pickupPick); return; }
      const days = slotDays(live);
      neededFrom = days[0];
      pickupLatest = days[days.length - 1];
      pickupWindow = slotsToWindow(live);
    } else {
      if (!pickupFallback.trim()) { setError(copy.request.pickupNoneNeeded); return; }
      neededFrom = pickupWindowStart(f.eventDate);
      pickupLatest = f.eventDate;
      pickupWindow = pickupFallback.trim();
    }
    if (!f.returnBy) {
      setError(copy.request.returnPick);
      return;
    }
    if (!pledge) {
      setError(copy.request.chipInPick);
      return;
    }
    let donationPledge = Number(pledge);
    if (pledge === 'other') {
      const n = parseInt(otherAmount, 10);
      if (!/^\d+$/.test(otherAmount.trim()) || n < 1) {
        setError(copy.request.chipInOtherError);
        return;
      }
      donationPledge = Math.min(n, 10000);
    }
    setSending(true);
    const { firstName, lastName, email, phone, affiliation, eventName, eventDate, returnBy, description, notes, heardFrom } = f;
    try {
      const id = await submitRequest({
        host: { firstName, lastName, email, phone, affiliation },
        eventName, eventDate, neededFrom, pickupLatest, returnBy, pickupWindow, description, notes, heardFrom,
        donationPledge,
      });
      // The request is saved first. The email only goes out once the database has accepted it.
      let emailFailed = false;
      let emailError = '';
      try {
        const s = useLibrary.getState();
        const group = s.groups.find((g) => g.id === id);
        if (!group) throw new Error('Request not found.');
        await sendRequestEmail(group, s.lines.filter((l) => l.groupId === id), s.items);
      } catch (err) {
        emailFailed = true;
        emailError = (err as Error)?.message || String(err);
      }
      navigate(`/request/sent/${id}`, { state: { emailFailed, emailError } });
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
        <Link to="/" className="big-action inline-flex items-center self-start bg-primary px-5 text-primary-foreground">Go to the library</Link>
      </div>
    );
  }

  const req = <span className="font-bold text-destructive" aria-hidden> *</span>;
  const shortBy = (itemId: string, qty: number) => {
    const item = items.find((i) => i.id === itemId);
    return item ? Math.max(0, qty - availableFor(item, lines)) : 0;
  };
  const anyShort = cart.some((c) => shortBy(c.itemId, c.quantity) > 0);

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
        {anyShort && <p className="border-l-4 border-primary bg-muted px-4 py-3">{copy.request.outNote}</p>}
        <ul className="stamp-border">
          {cart.map((c) => {
            const item = items.find((i) => i.id === c.itemId);
            if (!item) return null;
            const short = shortBy(c.itemId, c.quantity);
            return (
              <li key={c.itemId} className="hairline-soft flex flex-wrap items-center justify-between gap-3 p-3 last:border-0">
                <span className="flex flex-col">
                  <Link to={`/items/${item.slug}`} className="font-semibold text-secondary underline-offset-4 hover:underline">{item.name}</Link>
                  {short > 0 && <span className="text-sm font-semibold text-destructive">{fill(copy.request.outNow, { count: String(short) })}</span>}
                </span>
                <QuantityStepper value={c.quantity} max={item.quantityTotal} onChange={(n) => setCartQty(item.id, n)} label={item.name} />
              </li>
            );
          })}
        </ul>
        <Link to="/" className="font-semibold text-secondary underline underline-offset-4">Add something else</Link>
      </section>

      <form onSubmit={onSubmit} className="relative flex flex-col gap-5">
        <DepositNotice entries={cart} />
        <p className="text-muted-foreground">Fields marked <span className="font-bold text-destructive">*</span> are needed. Everything else is up to you.</p>
        <h2 className="shelf-rule text-2xl">About you</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {field('firstName', 'First name')}
          {field('lastName', 'Last name')}
          {field('email', 'Email', 'email')}
          {field('phone', 'Phone', 'tel')}
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
        <div className="flex flex-col gap-1.5 sm:max-w-xs">
          <Label htmlFor="eventDate">Date{req}</Label>
          <Input id="eventDate" type="date" required min={today} value={f.eventDate}
            aria-invalid={Boolean(dateError) || undefined} aria-describedby={dateError ? 'date-error' : undefined}
            onChange={(e) => setEventDate(e.target.value)} />
          {dateError && <p id="date-error" className="font-semibold text-destructive">{dateError}</p>}
        </div>

        <section className="flex flex-col gap-3" aria-labelledby="pickup-title">
          <h3 id="pickup-title" className="text-xl">{copy.request.pickupTitle}{req}</h3>
          {!f.eventDate ? (
            <p className="text-muted-foreground">{copy.request.pickupNeedDate}</p>
          ) : pDays.length === 0 ? (
            <div className="flex flex-col gap-2">
              <p className="border-l-4 border-primary bg-muted px-4 py-3">{copy.request.pickupNone}</p>
              <Label htmlFor="pickupFallback">{copy.request.pickupNoneLabel}{req}</Label>
              <Input id="pickupFallback" value={pickupFallback} onChange={(e) => setPickupFallback(e.target.value)} />
            </div>
          ) : (
            <>
              <p className="text-muted-foreground">{copy.request.pickupHint}</p>
              {pDays.map((d) => (
                <div key={d.date} role="group" aria-label={dayLabel(d.date)} className="flex flex-col gap-2">
                  <p><span className="font-semibold">{dayLabel(d.date)}</span> <span className="text-muted-foreground">· {hoursLabel(d)}</span></p>
                  <div className="flex flex-wrap gap-2">
                    {d.starts.map((s) => {
                      const key = slotKey(d.date, s);
                      const on = slots.includes(key);
                      return (
                        <button key={key} type="button" aria-pressed={on} aria-label={formatSlot(key)}
                          onClick={() => toggleSlot(key)} className={`${choiceCls(on)} min-w-[4.5rem]`}>
                          {startLabel(s)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="return-title">
          <h3 id="return-title" className="text-xl">{copy.request.returnTitle}{req}</h3>
          {!f.eventDate ? (
            <p className="text-muted-foreground">{copy.request.returnNeedDate}</p>
          ) : (
            <>
              <p className="text-muted-foreground">{copy.request.returnHint}</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={copy.request.returnTitle}>
                {rDays.map((d) => {
                  const on = f.returnBy === d.date;
                  return (
                    <button key={d.date} type="button" aria-pressed={on}
                      onClick={() => { setError(''); setF((prev) => ({ ...prev, returnBy: d.date })); }}
                      className={`${choiceCls(on)} flex flex-col items-start py-1.5 text-left`}>
                      <span>{dayLabel(d.date)}</span>
                      <span className={`text-sm font-normal ${on ? '' : 'text-muted-foreground'}`}>{hoursLabel(d)}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">{copy.request.descriptionLabel}</Label>
          <Textarea id="description" rows={3} value={f.description} onChange={set('description')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Anything else the librarians should know</Label>
          <Textarea id="notes" rows={2} value={f.notes} onChange={set('notes')} />
        </div>
        {field('heardFrom', copy.request.heardFromLabel, 'text', false)}

        <div className="flex flex-col gap-3">
          <InfoToggle title={copy.request.chipInWhyTitle} text={copy.request.chipInWhy} className="shelf-rule">
            <h2 className="text-2xl">{copy.request.chipInTitle}</h2>
          </InfoToggle>
          <p>{copy.request.chipInLead}</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label={copy.request.chipInTitle}>
            {([
              ...copy.request.chipInAmounts.map((a) => [String(a), `$${a}`] as const),
              ['other', copy.request.chipInOther] as const,
              ['0', copy.request.chipInNone] as const,
            ]).map(([value, label]) => (
              <button key={value} type="button" aria-pressed={pledge === value}
                onClick={() => { setPledge(value as Pledge); setError(''); }}
                className={`min-h-11 border-[1.5px] border-secondary px-4 font-semibold ${pledge === value ? 'bg-secondary text-secondary-foreground' : 'text-secondary'}`}>
                {label}
              </button>
            ))}
          </div>
          {pledge === 'other' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="otherAmount">{copy.request.chipInOtherLabel}</Label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold" aria-hidden>$</span>
                <Input id="otherAmount" type="text" inputMode="numeric" pattern="[0-9]*" className="max-w-32"
                  value={otherAmount} onChange={(e) => setOtherAmount(e.target.value.replace(/[^0-9]/g, ''))} />
              </div>
            </div>
          )}
          {pledge !== '' && pledge !== '0' && (
            <p className="border-l-4 border-primary bg-muted px-4 py-3" aria-live="polite">
              <VenmoText text={copy.request.chipInPay} />
            </p>
          )}
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