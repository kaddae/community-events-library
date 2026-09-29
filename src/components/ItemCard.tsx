import { Link } from 'react-router-dom';
import { useLibrary, availableFor, latestReflection, type Item } from '@/lib/store';
import { PhotoSlot, StampTag, QuantityStepper } from '@/components/Bits';

export function AddToRequest({ item, available }: { item: Item; available: number }) {
  const cart = useLibrary((s) => s.cart);
  const setCartQty = useLibrary((s) => s.setCartQty);
  const inCart = cart.find((c) => c.itemId === item.id)?.quantity ?? 0;

  if (inCart > 0) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper value={inCart} max={available} onChange={(n) => setCartQty(item.id, n)} label={item.name} />
        <span className="text-sm text-muted-foreground">on your list</span>
      </div>
    );
  }
  return (
    <button
      type="button"
      disabled={available === 0}
      onClick={() => setCartQty(item.id, 1)}
      className="big-action w-full bg-primary px-4 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
    >
      {available > 0 ? 'Add to request' : item.status === 'repair' ? 'Being repaired' : 'All out right now'}
    </button>
  );
}

export default function ItemCard({ item }: { item: Item }) {
  const lines = useLibrary((s) => s.lines);
  const reflections = useLibrary((s) => s.reflections);
  const available = availableFor(item, lines);
  const tip = latestReflection([item.id], reflections);
  const kind = item.status === 'repair' ? 'repair' : available > 0 ? 'in' : 'out';

  return (
    <article className="stamp-border flex flex-col">
      <div className="hairline flex items-start justify-between gap-2 px-3 py-2.5">
        <Link to={`/items/${item.slug}`} className="label-caps min-h-8 text-secondary hover:underline" style={{ fontSize: '0.9rem' }}>
          {item.name}
        </Link>
        <StampTag kind={kind} />
      </div>
      <Link to={`/items/${item.slug}`} aria-label={`About the ${item.name}`}>
        <PhotoSlot item={item} />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-3">
        <p className="text-sm text-muted-foreground">
          {available} of {item.quantityTotal} available
        </p>
        {tip && (
          <p className="text-base leading-snug">
            “{tip.tip}” <span className="text-muted-foreground">— {tip.firstName}, {tip.eventName}</span>
          </p>
        )}
        <div className="mt-auto pt-1">
          <AddToRequest item={item} available={available} />
        </div>
      </div>
    </article>
  );
}