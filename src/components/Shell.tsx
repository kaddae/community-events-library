import type { ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ClipboardList } from 'lucide-react';
import { useLibrary } from '@/lib/store';
import { copy } from '@/content/copy';

export default function Shell({ children }: { children: ReactNode }) {
  const cart = useLibrary((s) => s.cart);
  const persona = useLibrary((s) => s.persona);
  const signOut = useLibrary((s) => s.signOut);
  const { pathname } = useLocation();
  const count = cart.reduce((n, c) => n + c.quantity, 0);

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

      <header className="border-b-[1.5px] border-secondary bg-background">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
          <Link to="/" className="min-w-0">
            <span className="font-display block text-xl leading-tight text-secondary sm:text-2xl">{copy.shared.siteName}</span>
            <span className="label-caps block text-muted-foreground" style={{ fontSize: '0.7rem' }}>{copy.shared.placeLine}</span>
          </Link>
          <nav className="flex items-center gap-4">
            <NavLink to="/" end className={navCls}>Shelf</NavLink>
            <NavLink to="/about" className={navCls}>About</NavLink>
            <Link
              to="/request"
              className={`flex min-h-12 items-center gap-2 border-[1.5px] px-3 font-bold ${
                count > 0 ? 'border-primary bg-primary text-primary-foreground' : 'border-secondary text-secondary'
              }`}
            >
              <ClipboardList size={20} aria-hidden />
              Request list ({count})
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:py-10">{children}</main>

      <footer className="border-t-[1.5px] border-secondary">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-base sm:flex-row sm:items-center sm:justify-between">
          <p>
            {copy.shared.stewardLine}{' '}
            <a className="font-semibold text-secondary underline underline-offset-4" href={`mailto:${copy.shared.librarianEmail}`}>
              {copy.shared.librarianEmail}
            </a>
          </p>
          <Link to="/librarian" className="label-caps min-h-12 content-center text-muted-foreground hover:text-secondary">
            Librarians
          </Link>
        </div>
      </footer>
    </div>
  );
}