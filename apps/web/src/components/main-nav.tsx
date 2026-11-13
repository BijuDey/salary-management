'use client';

import { ChartColumnBig, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAVIGATION = [
  { href: '/employees', label: 'Directory', icon: UsersRound },
  { href: '/insights', label: 'Pay insights', icon: ChartColumnBig },
];

/** Navigation with the current section highlighted (reads the URL, so it renders in the browser). */
export function MainNav() {
  return <NavLinks pathname={usePathname()} />;
}

/** Rendered without a pathname while the page streams in. */
export function NavLinks({ pathname }: { pathname?: string }) {
  return (
    <nav aria-label="Main" className="flex gap-1 md:mt-8 md:flex-col">
      {NAVIGATION.map(({ href, label, icon: Icon }) => {
        const active = pathname?.startsWith(href) ?? false;
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
  );
}
