import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json();

    if (!key) {
      return NextResponse.json({ error: "Admin key required" }, { status: 400 });
    }

    const validKey = process.env.ADMIN_SECRET_KEY;

    if (!validKey) {
      return NextResponse.json({ error: "Admin key not configured" }, { status: 500 });
    }

    if (key !== validKey) {
      return NextResponse.json({ valid: false, error: "Invalid admin key" }, { status: 401 });
    }

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}