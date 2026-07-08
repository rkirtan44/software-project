/**
 * PUT  /api/admin/[id] — update a scholarship by ID
 * DELETE /api/admin/[id] — delete a scholarship by ID
 * Auth: requires a valid admin session (NextAuth JWT).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Scholarship from "@/models/Scholarship";

// Check that the caller has an admin session
async function requireAdmin() {
  const session = await auth();
  return session?.user && (session.user as { role?: string }).role === "admin";
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const scholarship = await Scholarship.findByIdAndUpdate(params.id, body, {
      new: true,
    });
    if (!scholarship) {
      return NextResponse.json({ error: "Scholarship not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Scholarship updated successfully!", scholarship });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const scholarship = await Scholarship.findByIdAndDelete(params.id);
    if (!scholarship) {
      return NextResponse.json({ error: "Scholarship not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Scholarship deleted successfully!" });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
