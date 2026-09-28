import { Link, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useLibrary, availableFor } from '@/lib/store';
import { PhotoSlot, StampTag, TodoText } from '@/components/Bits';
import { AddToRequest } from '@/components/ItemCard';
import { copy } from '@/content/copy';

export default function ItemDetail() {
  const { slug } = useParams();
  const items = useLibrary((s) => s.items);
  const lines = useLibrary((s) => s.lines);
  const reflections = useLibrary((s) => s.reflections);
  const status = useLibrary((s) => s.status);
  const item = items.find((i) => i.slug === slug);

  if (!item && status === 'loading') {
    return <p className="text-lg text-muted-foreground">Checking the shelf…</p>;
  }

  if (!item) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl">Not on the shelf</h1>
        <Link to="/" className="font-semibold text-secondary underline underline-offset-4">Back to the shelf</Link>
      </div>
    );
  }

  const available = availableFor(item, lines);
  const kind = item.status === 'repair' ? 'repair' : available > 0 ? 'in' : 'out';
  const bio = reflections
    .filter((r) => r.itemId === item.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_1.1fr]">
      <div className="stamp-border self-start">
        <PhotoSlot item={item} size="full" />
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Link to="/" className="label-caps text-muted-foreground hover:text-secondary">← {item.category}</Link>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-4xl">{item.name}</h1>
            <StampTag kind={kind} />
          </div>
          <p className="text-lg">{item.description}</p>
          <p className="label-caps text-secondary">{available} of {item.quantityTotal} on the shelf</p>
        </div>

        <AddToRequest item={item} available={available} />

        <section className="flex flex-col gap-2">
          <h2 className="shelf-rule text-xl">{copy.item.careNotesTitle}</h2>
          <TodoText text={item.careNotes} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="shelf-rule text-xl">{copy.item.biographyTitle}</h2>
          {bio.length === 0 ? (
            <p className="text-muted-foreground">{copy.item.biographyEmpty}</p>
          ) : (
            <ol className="flex flex-col">
              {bio.map((r) => (
                <li key={r.id} className="hairline-soft grid grid-cols-[5.5rem_1fr] gap-3 py-3">
                  <span className="label-caps pt-1 text-muted-foreground">{format(parseISO(r.createdAt), 'MMM d yyyy')}</span>
                  <div>
                    <p className="font-semibold">{r.firstName} · {r.eventName}</p>
                    <p>Tip: {r.tip}</p>
                    {r.howItWent && <p className="text-muted-foreground">{r.howItWent}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}