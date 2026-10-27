import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLibrary, CATEGORIES, KIT_KEYS, type Category } from '@/lib/store';
import ItemCard from '@/components/ItemCard';
import { TodoText, fill } from '@/components/Bits';
import { copy } from '@/content/copy';

type View = 'all' | Category;

export default function Catalog() {
  const items = useLibrary((s) => s.items);
  const status = useLibrary((s) => s.status);
  const loadError = useLibrary((s) => s.loadError);
  const startKit = useLibrary((s) => s.startKit);
  const navigate = useNavigate();
  const [view, setView] = useState<View>('all');

  const shelf = items.filter((i) => i.status !== 'retired');
  const owned = shelf.reduce((n, i) => n + i.quantityTotal, 0);
  const shown = view === 'all' ? shelf : shelf.filter((i) => i.category === view);
  const kits = KIT_KEYS.map((key) => ({ key, inKit: shelf.filter((i) => (i[key] ?? 0) > 0) })).filter((k) => k.inKit.length > 0);
  // Only categories that have something in them get a button.
  const views: View[] = ['all', ...CATEGORIES.filter((c) => shelf.some((i) => i.category === c))];

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <TodoText text={copy.home.who} className="text-lg" />
        <p className="label-caps text-secondary">{fill(copy.home.countLine, { count: String(owned) })}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="shelf-rule text-xl">{copy.about.howTitle}</h2>
        <ol className="flex flex-col gap-2">
          {[copy.about.borrow, copy.about.giveBack].map((line, i) => (
            <li key={i} className="grid grid-cols-[1.75rem_1fr] gap-2">
              <span className="font-display text-lg text-secondary">{i + 1}.</span>
              <TodoText text={line} />
            </li>
          ))}
        </ol>
        <Link to="/about" className="self-start font-semibold text-secondary underline underline-offset-4">
          {copy.about.title}
        </Link>
      </section>

      {status === 'loading' && <p className="text-lg text-muted-foreground">Checking the library…</p>}
      {status === 'error' && (
        <p className="text-lg" role="alert">
          The library didn't load ({loadError}). Try again in a minute, or write {copy.shared.librarianEmail}.
        </p>
      )}
      {status === 'ready' && shelf.length === 0 && <p className="text-lg">{copy.home.emptyShelf}</p>}

      {kits.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="shelf-rule text-2xl">{copy.kits.title}</h2>
            <p className="text-muted-foreground">{copy.kits.hint}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
          {kits.map(({ key, inKit }) => {
            const canGo = inKit.some((i) => i.status === 'active');
            return (
              <article key={key} className="stamp-border paper-card flex flex-col">
                <div className="kit-band" data-kit={key} aria-hidden />
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <h3 className="text-2xl">{copy.kits[key].title}</h3>
                  <p>{inKit.map((i) => `${Math.min(i[key] ?? 0, i.quantityTotal)} × ${i.name}`).join(', ')}</p>
                  {canGo ? (
                    <button type="button" onClick={() => { startKit(key); navigate('/request'); }}
                      className="big-action mt-auto bg-primary px-4 text-primary-foreground">
                      {copy.kits.start}
                    </button>
                  ) : (
                    <p className="mt-auto text-muted-foreground">{copy.kits.none}</p>
                  )}
                </div>
              </article>
            );
          })}
          </div>
        </section>
      )}

      {status === 'ready' && shelf.length > 0 && (
        <div className="flex flex-col gap-1">
          <h2 className="shelf-rule text-2xl">{copy.home.itemsTitle}</h2>
          <p className="text-muted-foreground">{copy.home.itemsHint}</p>
        </div>
      )}

      {views.length > 2 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label={copy.home.filterLabel}>
          {views.map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}
              data-cat={v === 'all' ? undefined : v}
              className={`flex min-h-11 items-center gap-2 border-[1.5px] border-secondary px-4 font-semibold ${view === v ? 'bg-secondary text-secondary-foreground' : 'text-secondary'}`}>
              <span aria-hidden className={v === 'all' ? 'gp-chip' : 'cat-chip'} />
              {v === 'all' ? copy.kits.everything : v}
            </button>
          ))}
        </div>
      )}

      {CATEGORIES.map((cat) => {
        const group = shown.filter((i) => i.category === cat);
        if (group.length === 0) return null;
        return (
          <section key={cat} className="flex flex-col gap-4">
            <h3 className="shelf-rule cat-rule text-xl" data-cat={cat}>{cat}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((item) => <ItemCard key={item.id} item={item} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}