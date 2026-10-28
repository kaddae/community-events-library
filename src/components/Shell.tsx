import type { ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { useLibrary } from '@/lib/store';
import { copy } from '@/content/copy';

function AddedNotice() {
  const lastAdded = useLibrary((s) => s.lastAdded);
  const items = useLibrary((s) => s.items);
  const cart = useLibrary((s) => s.cart);
  const { pathname } = useLocation();
  const [visibleAt, setVisibleAt] = useState<number | null>(null);

  useEffect(() => {
    if (!lastAdded || Date.now() - lastAdded.at > 4000) return;
    setVisibleAt(lastAdded.at);
    const t = setTimeout(() => setVisibleAt(null), 4000);
    return () => clearTimeout(t);
  }, [lastAdded]);

  const item = lastAdded && items.find((i) => i.id === lastAdded.itemId);
  const qty = lastAdded ? cart.find((c) => c.itemId === lastAdded.itemId)?.quantity ?? 1 : 0;
  const show = Boolean(visibleAt && item && pathname !== '/request');

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      {show && item && (
        <div key={visibleAt} className="added-notice pointer-events-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-[1.5px] border-secondary bg-secondary px-4 py-3 text-secondary-foreground shadow-lg">
          <span>Added {qty} × {item.name}</span>
          <Link to="/request" className="min-h-10 content-center font-bold underline underline-offset-4">View request list</Link>
        </div>
      )}
    </div>
  );
}

export default function Shell({ children }: { children: ReactNode }) {
  const cart = useLibrary((s) => s.cart);
  const lastAdded = useLibrary((s) => s.lastAdded);
  const persona = useLibrary((s) => s.persona);
  const signOut = useLibrary((s) => s.signOut);
  const { pathname } = useLocation();
  // Different items on the list, not units: 20 chairs + a PA reads "(2)".
  const count = cart.length;

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  const navCls = ({ isActive }: { isActive: boolean }) =>
    `label-caps flex min-h-12 items-center px-1 ${isActive ? 'text-secondary underline underline-offset-8 decoration-2' : 'text-muted-foreground hover:text-secondary'}`;

  return (
    <div className="flex min-h-screen flex-col">
      {persona === 'librarian' && (
        <div className="bg-secondary text-secondary-foreground">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-1.5 text-sm">
            <Link to="/librarian" className="font-semibold underline underline-offset-4">Librarian dashboard</Link>
            <button onClick={() => { void signOut(); }} className="min-h-10 underline underline-offset-4">Sign out</button>
          </div>
        </div>
      )}

      <header className="bg-background">
        <div className="mx-auto max-w-5xl px-4 pt-3">
          <div className="flex min-w-0 items-center gap-3">
            {/* Same place as the site name link, so it's skipped by keyboard and screen readers. */}
            <Link to="/" tabIndex={-1} aria-hidden="true" className="shrink-0">
              <img
                data-asset="logo-d-2"
                alt=""
                className="h-16 w-16 object-contain sm:h-20 sm:w-20"
                style={{ mixBlendMode: 'multiply' }}
              />
            </Link>
            <div className="flex min-w-0 flex-col">
              <Link to="/" className="font-display masthead block text-xl leading-tight text-secondary sm:text-2xl">
                {copy.shared.siteName}
              </Link>
              <span className="label-caps block text-muted-foreground" style={{ fontSize: '0.7rem' }}>
                {copy.shared.placeCity} ·{' '}
                {[copy.shared.groupProject, copy.shared.civicWorks].map((org, i) => (
                  <span key={org.url}>
                    {i > 0 && ' x '}
                    <a
                      href={org.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block py-1.5 underline decoration-1 underline-offset-4 hover:text-secondary"
                    >
                      {org.name}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </span>
                ))}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-30 bg-background">
        <nav className="mx-auto flex max-w-5xl items-center justify-end gap-4 px-4 py-2 sm:justify-start">
          <NavLink to="/" end className={navCls}>Library</NavLink>
          <NavLink to="/about" className={navCls}>About</NavLink>
          <Link
            key={lastAdded?.at ?? 0}
            to="/request"
            className={`${lastAdded && Date.now() - lastAdded.at < 1500 ? 'pulse-once' : ''} paper-card ml-auto flex min-h-12 items-center gap-2 border-[1.5px] border-secondary px-3 font-bold text-secondary`}
          >
            <ClipboardList size={20} aria-hidden />
            {count > 0 ? `Checkout (${count})` : 'Checkout'}
          </Link>
        </nav>
        <div className="gp-band" aria-hidden />
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:py-10">{children}</main>

      <footer>
        <div className="cw-band" aria-hidden />
        <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 text-base">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1 sm:max-w-xs">
              <p className="font-display text-lg text-secondary">{copy.shared.supportedBy}</p>
              <p className="text-muted-foreground">{copy.shared.address}</p>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="https://groupproject.group"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex transition-opacity hover:opacity-70"
              >
                <img
                  data-asset="logo-d"
                  alt="GROUP PROJECT website (opens in a new tab)"
                  className="h-20 w-20 object-contain"
                  style={{ mixBlendMode: 'multiply' }}
                />
              </a>
              <a
                href="https://www.civicworksct.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center transition-opacity hover:opacity-70"
              >
                <img
                  data-asset="cw-tertiary-logo-1"
                  alt="Civic Works website (opens in a new tab)"
                  className="h-9 w-auto object-contain"
                  style={{ mixBlendMode: 'multiply' }}
                />
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between" style={{ borderTop: 'var(--rule-soft)', paddingTop: '1rem' }}>
            <Link to="/librarian" className="label-caps min-h-12 content-center text-muted-foreground hover:text-secondary">
              Librarians
            </Link>
          </div>
        </div>
      </footer>

      <AddedNotice />
      {/* Source for the site icon only; never shown. */}
      <img data-asset="logo-cropped" alt="" aria-hidden="true" hidden />
    </div>
  );
}