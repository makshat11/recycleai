import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Leaf, Menu, ScanLine, X } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/scan', label: 'AI Scanner' },
  { to: '/actions', label: 'My Eco Actions' },
  { to: '/dashboard', label: 'Impact Dashboard' },
  { to: '/about', label: 'How It Works' },
];

export function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      className="group flex items-center gap-2.5 rounded-xl py-1 pr-2 focus-visible:ring-2 focus-visible:ring-eco"
      aria-label="RecycleVision AI home"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-forest text-mint shadow-soft transition group-hover:bg-eco-600">
        <Leaf className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="leading-tight">
        <span className="block text-[1.05rem] font-extrabold text-forest">RecycleVision AI</span>
        <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-eco-600">
          Give it a second life
        </span>
      </span>
    </Link>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b transition-all duration-300',
        scrolled
          ? 'border-eco-100 bg-cream/90 shadow-soft backdrop-blur-md'
          : 'border-transparent bg-cream/70 backdrop-blur-sm',
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-forest focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <nav className="container-page flex h-[4.5rem] items-center justify-between gap-4" aria-label="Main">
        <Brand />

        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-3.5 py-2 text-sm font-semibold transition',
                    isActive ? 'bg-mint text-forest' : 'text-muted hover:bg-eco-50 hover:text-forest',
                  )
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden lg:block">
          <ButtonLink to="/scan" size="sm">
            <ScanLine className="h-4 w-4" aria-hidden="true" />
            Start Scanning
          </ButtonLink>
        </div>

        <Button
          variant="secondary"
          size="sm"
          className="lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </Button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden border-t border-eco-100 bg-cream lg:hidden"
          >
            <ul className="container-page flex flex-col gap-1 py-4">
              {LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'block rounded-2xl px-4 py-3 text-[0.95rem] font-semibold transition',
                        isActive ? 'bg-mint text-forest' : 'text-muted hover:bg-eco-50 hover:text-forest',
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
              <li className="pt-2">
                <ButtonLink to="/scan" fullWidth>
                  <ScanLine className="h-4 w-4" aria-hidden="true" />
                  Start Scanning
                </ButtonLink>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
