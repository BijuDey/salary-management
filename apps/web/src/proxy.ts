import { NextResponse, type NextRequest } from 'next/server';
import { loginUrl, SESSION_COOKIE } from '@/features/auth/redirects';

/**
 * Optimistic check: without a session cookie there is no point rendering the app, so go
 * straight to sign-in. This is only a UX shortcut; the API verifies the signed session on
 * every request and is the real security boundary.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }
  const { pathname, search } = request.nextUrl;
  return NextResponse.redirect(new URL(loginUrl(pathname + search), request.url));
}

export const config = {
  // Everything except sign-in, the proxied API, Next.js assets and static files.
  matcher: ['/((?!login|api|_next/static|_next/image|favicon.ico).*)'],
};
