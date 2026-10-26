import { useEffect, useId, useState, type ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';
import { copy } from '@/content/copy';
import { useLibrary, depositsFor, describeDeposits, type Item } from '@/lib/store';

// Fills {name} slots in a copy string: fill('About {amount}', { amount: '$180' }).
export const fill = (text: string, vars: Record<string, string>) =>
  text.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);

// Deposit due at pickup for whatever is listed. Shows nothing when no deposit applies.
export function DepositNotice({ entries }: { entries: { itemId: string }[] }) {
  const items = useLibrary((s) => s.items);
  const { list } = depositsFor(entries, items);
  if (list.length === 0) return null;
  return (
    <div className="flex flex-col gap-1 border-l-4 border-primary bg-muted px-4 py-3">
      <p><span className="font-bold">{copy.request.depositLead}</span> {describeDeposits(list)}.</p>
      <p className="text-muted-foreground">{copy.request.depositReturn}</p>
    </div>
  );
}

// A round "?" beside a heading. Hover (mouse), keyboard focus, or a tap opens
// a short note under the heading. A second tap or Escape closes it.
export function InfoToggle({
  title, text, className = '', children,
}: { title: string; text: string; className?: string; children: ReactNode }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [focused, setFocused] = useState(false);
  const show = open || hover || focused;

  return (
    <div
      className="flex flex-col gap-2"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && show) { setOpen(false); setHover(false); setFocused(false); }
      }}
    >
      <div className={`flex items-center gap-1 ${className}`}>
        {children}
        <button
          type="button"
          aria-label={title}
          aria-expanded={show}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHover(true); }}
          onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHover(false); }}
          onFocus={(e) => { if (e.currentTarget.matches(':focus-visible')) setFocused(true); }}
          onBlur={() => setFocused(false)}
          className="flex h-11 w-11 shrink-0 items-center justify-center text-secondary"
        >
          <span aria-hidden className={`flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-secondary font-bold ${show ? 'bg-secondary text-secondary-foreground' : ''}`}>
            ?
          </span>
        </button>
      </div>
      {show && (
        <div id={id} role="note" className="flex flex-col gap-1 border-l-4 border-secondary bg-muted px-4 py-3">
          <p className="font-bold">{title}</p>
          <p>{text}</p>
        </div>
      )}
    </div>
  );
}

export function TodoText({ text, className = '' }: { text: string; className?: string }) {
  const isTodo = text.trim().startsWith('TODO');
  return <p className={`${isTodo ? 'todo-note' : ''} ${className}`}>{text}</p>;
}


export function PhotoSlot({ item, size = 'card' }: { item: Item; size?: 'card' | 'full' }) {
  if (item.photo) {
    return <img data-asset={item.photo} alt={item.name} className="aspect-[4/3] w-full object-cover" style={{ borderBottom: 'var(--rule)' }} />;
  }
  return (
    <div className="photo-slot flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 px-4 text-center">
      <span className="font-display text-lg text-secondary">{item.name}</span>
      <span className={`text-muted-foreground ${size === 'card' ? 'text-sm' : 'text-base'}`}>
        {size === 'card' ? copy.shared.photoNeededShort : copy.shared.photoNeededFull}
      </span>
    </div>
  );
}

// − [typed number] +. The typed number is saved on blur or Enter, so deleting
// "4" to type "40" doesn't remove the item. 0 removes it; over the max drops to the max.
export function QuantityStepper({
  value, max, onChange, label,
}: { value: number; max: number; onChange: (n: number) => void; label: string }) {
  const [draft, setDraft] = useState(String(value));
  const [note, setNote] = useState('');
  useEffect(() => { setDraft(String(value)); }, [value]);

  const commit = () => {
    const n = parseInt(draft, 10);
    if (!Number.isFinite(n) || draft.trim() === '') { setDraft(String(value)); return; }
    if (n <= 0) { setNote(''); onChange(0); return; }
    if (n > max) {
      setNote(`The library has ${max} in all`);
      setDraft(String(max));
      if (max !== value) onChange(max);
      return;
    }
    setNote('');
    if (n !== value) onChange(n); else setDraft(String(value));
  };

  const step = (n: number) => { setNote(''); onChange(n); };
  const btn = 'flex h-12 w-12 items-center justify-center border-[1.5px] border-secondary text-secondary disabled:opacity-35';

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center" role="group" aria-label={`Quantity of ${label}`}>
        <button type="button" className={btn} onClick={() => step(value - 1)} aria-label={`One fewer ${label}`}>
          <Minus size={20} />
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label={`How many ${label}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
          onFocus={(e) => e.target.select()}
          className="h-12 w-16 border-y-[1.5px] border-secondary bg-transparent px-1 text-center text-lg font-bold"
        />
        <button type="button" className={btn} onClick={() => step(value + 1)} disabled={value >= max} aria-label={`One more ${label}`}>
          <Plus size={20} />
        </button>
      </div>
      {note && <span className="text-sm text-muted-foreground" aria-live="polite">{note}</span>}
    </div>
  );
}