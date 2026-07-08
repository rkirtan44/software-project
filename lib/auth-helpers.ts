/**
 * lib/auth-helpers.ts
 * Shared auth utilities for API routes.
 * NextAuth v5 uses different cookie names in dev vs production,
 * so we check all variants to find the active session token.
 */

import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Cookie names used by NextAuth v4 and v5 in various environments
const COOKIE_NAMES = [
  "__Secure-authjs.session-token", // NextAuth v5 production (HTTPS)
  "authjs.session-token",           // NextAuth v5 development (HTTP)
  "__Host-authjs.session-token",    // NextAuth v5 alternative
  "next-auth.session-token",        // NextAuth v4 development
  "__Secure-next-auth.session-token", // NextAuth v4 production
];

/**
 * Attempts to read the session JWT from any known cookie name.
 * Returns the decoded token or null if not authenticated.
 */
export async function getSessionToken(req: NextRequest) {
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

/**
 * Returns true if the request has a valid admin session token.
 */
export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  const token = await getSessionToken(req);
  return token?.role === "admin";
}
