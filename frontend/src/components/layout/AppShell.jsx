import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ListIcon, XIcon } from '@phosphor-icons/react';
import { SidebarContent, ThemeToggle } from './Sidebar.jsx';
import { AdaptiveBanner } from './AdaptiveBanner.jsx';
import { Logo } from '../brand/Logo.jsx';
import { PageTransition } from '../ui/Motion.jsx';

export function AppShell() {
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();

  /* A route change always closes the drawer, including browser back. */
  useEffect(() => setDrawer(false), [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawer]);

  return (
    <div className="min-h-dvh bg-paper">
      {/* Desktop rail. Fixed, so only the content column scrolls. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] border-r border-line bg-surface lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile bar. */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setDrawer(true)}
          aria-label="Open navigation"
          className="-ml-2 grid size-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-raised"
        >
          <ListIcon size={20} weight="bold" />
        </button>
        <Logo size={24} />
        <ThemeToggle />
      </header>

      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-sand-950/45 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawer(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="absolute inset-y-0 left-0 w-[278px] border-r border-line bg-surface"
            >
              <button
                type="button"
                onClick={() => setDrawer(false)}
                aria-label="Close navigation"
                className="absolute top-4 right-3 z-10 grid size-9 place-items-center rounded-full text-ink-faint transition-colors hover:bg-raised hover:text-ink"
              >
                <XIcon size={18} weight="bold" />
              </button>
              <SidebarContent onNavigate={() => setDrawer(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <main className="lg:pl-[264px]">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <AdaptiveBanner />
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
