import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { copy } from '@/content/copy';
import type { Item } from '@/lib/store';

export function TodoText({ text, className = '' }: { text: string; className?: string }) {
  const isTodo = text.trim().startsWith('TODO');
  return <p className={`${isTodo ? 'todo-note' : ''} ${className}`}>{text}</p>;
}

export function StampTag({ kind }: { kind: 'in' | 'out' | 'repair' }) {
  const label = kind === 'in' ? 'In' : kind === 'out' ? 'Out' : 'Repair';
  return <span className="status-tag" data-kind={kind}>{label}</span>;
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
      setNote(`Only ${max} available`);
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