/**
 * POST /api/auth/verify-credentials
 * Checks email + password WITHOUT creating a session.
 * Returns { valid: true } or { valid: false, error: string }
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ valid: false, error: "Email and password required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return NextResponse.json({ valid: false, error: "Email or password is incorrect. Please register first." });
    }

    const isValid = await bcrypt.compare(password as string, user.password);
    if (!isValid) {
      return NextResponse.json({ valid: false, error: "Email or password is incorrect. Please register first." });
    }

    return NextResponse.json({ valid: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ valid: false, error: "Server error" }, { status: 500 });
  }
}
