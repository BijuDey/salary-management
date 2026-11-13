import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { MainNav, NavLinks } from './main-nav';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <aside className="bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:h-svh md:w-60 md:shrink-0">
        <div className="flex items-center justify-between gap-4 px-5 py-4 md:flex-col md:items-stretch md:py-6">
          <Link href="/employees" className="flex items-center gap-2.5">
            <BrandMark />
            <span className="leading-tight">
              <span className="font-heading block text-base font-semibold text-white">
                ACME Pay
              </span>
              <span className="text-sidebar-foreground/70 hidden text-xs md:block">
                Salary management
              </span>
            </span>
          </Link>

          <Suspense fallback={<NavLinks />}>
            <MainNav />
          </Suspense>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 md:py-10">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}

/** A stack of three bars rising like a pay band: the product's only ornament. */
function BrandMark() {
  return (
    <svg viewBox="0 0 28 28" className="size-7" aria-hidden>
      <rect width="28" height="28" rx="6" fill="#17504f" />
      <rect x="6" y="15" width="4" height="7" rx="1" fill="#9fbab6" />
      <rect x="12" y="10" width="4" height="12" rx="1" fill="#d7e3e1" />
      <rect x="18" y="6" width="4" height="16" rx="1" fill="#c08a2e" />
    </svg>
  );
}
