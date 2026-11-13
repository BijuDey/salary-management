'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LOGIN_PATH } from '@/features/auth/redirects';
import { useSession, useSignOut } from '@/lib/queries';

/** Who is signed in, and the way out. Sits at the foot of the sidebar. */
export function UserMenu() {
  const router = useRouter();
  const { data: session } = useSession();
  const signOut = useSignOut();

  const handleSignOut = () =>
    signOut.mutate(undefined, { onSettled: () => router.replace(LOGIN_PATH) });

  return (
    <div className="border-sidebar-border mt-auto flex items-center justify-between gap-2 border-t px-5 py-3 md:py-4">
      <div className="min-w-0">
        <p className="text-sidebar-foreground/70 text-xs">Signed in as</p>
        <p className="truncate text-sm text-white">{session?.username ?? '…'}</p>
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signOut.isPending}
        aria-label="Sign out"
        title="Sign out"
        className="hover:bg-sidebar-accent focus-visible:ring-sidebar-ring rounded-md p-2 outline-none hover:text-white focus-visible:ring-2"
      >
        <LogOut className="size-4" aria-hidden />
      </button>
    </div>
  );
}
