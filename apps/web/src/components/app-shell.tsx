'use client';

import { ChartColumnBig, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const NAVIGATION = [
  { href: '/employees', label: 'Directory', icon: UsersRound },
  { href: '/insights', label: 'Pay insights', icon: ChartColumnBig },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

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

          <nav aria-label="Main" className="flex gap-1 md:mt-8 md:flex-col">
            {NAVIGATION.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                    'focus-visible:ring-sidebar-ring outline-none focus-visible:ring-2',
                    active
                      ? 'bg-sidebar-accent text-white'
                      : 'hover:bg-sidebar-accent/60 hover:text-white',
                  )}
                >
                  <Icon className={cn('size-4', active && 'text-brass')} aria-hidden />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
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
