import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { BrandMark } from './brand-mark';
import { MainNav, NavLinks } from './main-nav';
import { UserMenu } from './user-menu';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <aside className="bg-sidebar text-sidebar-foreground flex flex-col md:sticky md:top-0 md:h-svh md:w-60 md:shrink-0">
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
        <UserMenu />
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 md:py-10">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
