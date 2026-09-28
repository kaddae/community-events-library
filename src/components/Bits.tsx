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

export function QuantityStepper({
  value, max, onChange, label,
}: { value: number; max: number; onChange: (n: number) => void; label: string }) {
  const btn = 'flex h-12 w-12 items-center justify-center border-[1.5px] border-secondary text-secondary disabled:opacity-35';
  return (
    <div className="flex items-center" role="group" aria-label={`Quantity of ${label}`}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} aria-label={`One fewer ${label}`}>
        <Minus size={20} />
      </button>
      <span className="flex h-12 min-w-14 items-center justify-center border-y-[1.5px] border-secondary px-2 text-lg font-bold" aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`One more ${label}`}>
        <Plus size={20} />
      </button>
    </div>
  );
}