/**
 * proxy.ts  (Next.js 16 uses "proxy" instead of "middleware")
 * Route protection — redirects unauthenticated users to /login.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// These paths are accessible without being logged in
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/api/register",
  "/api/admin/setup",
  "/api/contact",
  "/_next",
  "/favicon.ico",
  "/icon",
  "/apple-icon",
  "/placeholder",
  "/logout.png",
];

// NextAuth v5 uses different cookie names in dev vs production
const COOKIE_NAMES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Host-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

async function getSessionToken(req: NextRequest) {
  for (const cookieName of COOKIE_NAMES) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName,
    });
    if (token) return token;
  }
  return null;
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Let public paths through without auth check
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  if (isPublic) return NextResponse.next();

  const token = await getSessionToken(req);
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png|.*\\.svg|.*\\.jpg|.*\\.ico).*)"],
};
