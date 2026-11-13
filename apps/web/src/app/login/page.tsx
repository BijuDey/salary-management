import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BrandMark } from '@/components/brand-mark';
import { LoginForm } from '@/features/auth/login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <main className="grid min-h-svh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <BrandMark className="size-10" />
          <div>
            <h1 className="text-2xl font-semibold">Sign in to ACME Pay</h1>
            <p className="text-muted-foreground text-sm">Salary records are confidential.</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-6">
          {/* The form reads ?next= from the URL, which is only known in the browser. */}
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
