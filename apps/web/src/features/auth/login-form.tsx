'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { fieldAria, FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api-client';
import { useSignIn } from '@/lib/queries';
import { safeNextPath } from './redirects';

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Enter your username'),
  password: z.string().min(1, 'Enter your password'),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signIn = useSignIn();
  const { register, handleSubmit, formState, setError } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });
  const { errors } = formState;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signIn.mutateAsync(values);
      router.replace(safeNextPath(searchParams.get('next')));
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not sign in. Try again.';
      setError('root', { message });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      {errors.root && (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {errors.root.message}
        </p>
      )}
      <FormField id="username" label="Username" error={errors.username?.message}>
        <Input
          autoComplete="username"
          autoFocus
          {...register('username')}
          {...fieldAria('username', errors.username?.message)}
        />
      </FormField>
      <FormField id="password" label="Password" error={errors.password?.message}>
        <Input
          type="password"
          autoComplete="current-password"
          {...register('password')}
          {...fieldAria('password', errors.password?.message)}
        />
      </FormField>
      <Button type="submit" size="lg" disabled={formState.isSubmitting} className="mt-2">
        {formState.isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
