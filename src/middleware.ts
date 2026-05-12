import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple middleware that checks for session token cookie
// The actual auth check happens in API routes and page components
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow auth routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Allow API webhooks (no auth, validated by signature)
  if (
    pathname.startsWith("/api/whatsapp/webhook") ||
    pathname.startsWith("/api/stripe/webhook")
  ) {
    return NextResponse.next();
  }

  // Allow public assets
  if (
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check for auth session token (set by NextAuth)
  const sessionToken =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value;

  // Redirect to login if no session
  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};