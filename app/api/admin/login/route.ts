/**
 * POST /api/admin/login
 * Legacy endpoint — validates admin credentials using env variables.
 * The main admin login flow goes through NextAuth (/api/auth/[...nextauth]).
 * Credentials and token are now read from environment variables, not hardcoded.
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const validUsername = process.env.ADMIN_USERNAME;
    const validPassword = process.env.ADMIN_PASSWORD;

    if (!validUsername || !validPassword) {
      return NextResponse.json(
        { error: "Admin credentials not configured" },
        { status: 500 }
      );
    }

    if (username !== validUsername || password !== validPassword) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    return NextResponse.json({ message: "Admin login successful" });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
