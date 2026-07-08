/**
 * POST   /api/contact  — submit a contact query (public, no auth needed)
 * GET    /api/contact  — fetch all queries (admin only)
 * PATCH  /api/contact  — mark a query as read/unread (admin only)
 * DELETE /api/contact  — delete a query (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth-helpers";
import connectDB from "@/lib/mongodb";
import Contact from "@/models/Contact";

// Helper: returns 401 if the request is not from an admin
async function requireAdmin(req: NextRequest) {
  const token = await getSessionToken(req);
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null; // no error
}

// Anyone can submit a contact query
export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();
    if (!name || !email || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    await connectDB();
    const contact = await Contact.create({ name, email, message });
    return NextResponse.json(
      { message: "Message sent successfully!", contact },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Admin: list all contact queries
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    await connectDB();
    const contacts = await Contact.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ contacts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Admin: toggle read status
export async function PATCH(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    await connectDB();
    const { id, isRead } = await req.json();
    const contact = await Contact.findByIdAndUpdate(id, { isRead }, { new: true });
    return NextResponse.json({ contact });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Admin: delete a query
export async function DELETE(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    await connectDB();
    const { id } = await req.json();
    await Contact.findByIdAndDelete(id);
    return NextResponse.json({ message: "Deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
