import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibrary, availableFor, CATEGORIES, KIT_KEYS, type KitKey } from '@/lib/store';
import ItemCard from '@/components/ItemCard';
import { TodoText } from '@/components/Bits';
import { copy } from '@/content/copy';

type View = 'all' | KitKey;

export default function Catalog() {
  const items = useLibrary((s) => s.items);
  const lines = useLibrary((s) => s.lines);
  const status = useLibrary((s) => s.status);
  const loadError = useLibrary((s) => s.loadError);
  const startKit = useLibrary((s) => s.startKit);
  const navigate = useNavigate();
  const [view, setView] = useState<View>('all');

  const shelf = items.filter((i) => i.status !== 'retired');
  const onShelf = shelf.reduce((n, i) => n + availableFor(i, lines), 0);
  const shown = view === 'all' ? shelf : shelf.filter((i) => (i[view] ?? 0) > 0);
  const kits = KIT_KEYS.map((key) => ({ key, inKit: shelf.filter((i) => (i[key] ?? 0) > 0) })).filter((k) => k.inKit.length > 0);
  const views: View[] = ['all', ...kits.map((k) => k.key)];

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <TodoText text={copy.home.who} className="text-lg" />
        <p className="label-caps text-secondary">{onShelf} items available</p>
      </section>

      {status === 'loading' && <p className="text-lg text-muted-foreground">Checking the library…</p>}
      {status === 'error' && (
        <p className="text-lg" role="alert">
          The library didn't load ({loadError}). Try again in a minute, or write {copy.shared.librarianEmail}.
        </p>
      )}
      {status === 'ready' && shelf.length === 0 && <p className="text-lg">{copy.home.emptyShelf}</p>}

      {kits.length > 0 && (
        <section className="grid gap-4 md:grid-cols-2">
          {kits.map(({ key, inKit }) => {
            const canGo = inKit.some((i) => i.status === 'active');
            return (
              <article key={key} className="stamp-border flex flex-col gap-3 p-4">
                <h2 className="text-2xl">{copy.kits[key].title}</h2>
                <p>{inKit.map((i) => `${Math.min(i[key] ?? 0, i.quantityTotal)} × ${i.name}`).join(', ')}</p>
                {canGo ? (
                  <button type="button" onClick={() => { startKit(key); navigate('/request'); }}
                    className="big-action mt-auto bg-primary px-4 text-primary-foreground">
                    {copy.kits.start}
                  </button>
                ) : (
                  <p className="mt-auto text-muted-foreground">{copy.kits.none}</p>
                )}
              </article>
            );
          })}
        </section>
      )}

      {kits.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Show items for">
          {views.map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}
              className={`min-h-11 border-[1.5px] border-secondary px-4 font-semibold ${view === v ? 'bg-secondary text-secondary-foreground' : 'text-secondary'}`}>
              {v === 'all' ? copy.kits.everything : copy.kits[v].picker}
            </button>
          ))}
        </div>
      )}

      {CATEGORIES.map((cat) => {
        const group = shown.filter((i) => i.category === cat);
        if (group.length === 0) return null;
        return (
          <section key={cat} className="flex flex-col gap-4">
            <h3 className="shelf-rule text-xl">{cat}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((item) => <ItemCard key={item.id} item={item} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}