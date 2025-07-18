
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Middleware logic is temporarily bypassed for development.
  // When ready for production, restore the logic to protect routes.
  return NextResponse.next();
}

// The matcher is empty to disable the middleware for all routes.
// To re-enable auth protection, restore the matcher:
// export const config = {
//   matcher: ['/admin/:path*', '/my-panel/:path*'],
// };
export const config = {
  matcher: [],
};
