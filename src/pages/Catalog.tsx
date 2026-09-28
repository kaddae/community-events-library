import { useLibrary, availableFor, CATEGORIES } from '@/lib/store';
import ItemCard from '@/components/ItemCard';
import { TodoText } from '@/components/Bits';
import { copy } from '@/content/copy';

export default function Catalog() {
  const items = useLibrary((s) => s.items);
  const lines = useLibrary((s) => s.lines);
  const shelf = items.filter((i) => i.status !== 'retired');
  const onShelf = shelf.reduce((n, i) => n + availableFor(i, lines), 0);
  const total = shelf.reduce((n, i) => n + i.quantityTotal, 0);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col">
        {[copy.home.who, copy.home.borrow, copy.home.giveBack].map((line, i) => (
          <div key={i} className="hairline-soft py-2.5 first:pt-0">
            <TodoText text={line} />
          </div>
        ))}
        <p className="label-caps mt-4 text-secondary">{onShelf} of {total} on the shelf</p>
      </section>

      {shelf.length === 0 && <p className="text-lg">{copy.home.emptyShelf}</p>}

      {CATEGORIES.map((cat) => {
        const group = shelf.filter((i) => i.category === cat);
        if (group.length === 0) return null;
        return (
          <section key={cat} className="flex flex-col gap-4">
            <h2 className="shelf-rule text-2xl">{cat}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((item) => <ItemCard key={item.id} item={item} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}