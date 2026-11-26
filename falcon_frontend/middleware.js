import { NextResponse } from 'next/server';
import {
  UNDER_CONSTRUCTION_MODE,
  isUnderConstructionHost,
  isAllowedDuringMaintenance,
} from './src/config/siteMode';

export function middleware(request) {
  const rawHost =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    request.nextUrl.hostname ||
    '';

  if (!UNDER_CONSTRUCTION_MODE || !isUnderConstructionHost(rawHost)) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (pathname === '/under-construction' || isAllowedDuringMaintenance(pathname)) {
    return NextResponse.next();
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = '/under-construction';

  const response = NextResponse.rewrite(rewriteUrl);
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('Cache-Control', 'no-store, must-revalidate');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
