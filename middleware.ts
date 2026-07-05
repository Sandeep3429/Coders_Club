import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Explicitly check if the request matches the standalone project path
  if (pathname.startsWith('/projects/codersclub')) {
    // Return NextResponse.next() to bypass any custom application routing,
    // allowing Next.js static file server to handle the request directly from public folder.
    return NextResponse.next();
  }

  // Add custom portfolio site routing logic here
  return NextResponse.next();
}

// Ensure the middleware runs only for relevant paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
