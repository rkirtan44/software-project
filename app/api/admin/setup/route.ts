/**
 * GET /api/admin/setup
 * One-time utility: creates the admin user in MongoDB.
 * Admin email and password are read from environment variables.
 * Run once after deploying; the route is safe to leave enabled
 * because it does nothing if the admin already exists.
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    await connectDB();

    const adminEmail    = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.local" },
        { status: 500 }
      );
    }

    // Don't create a duplicate admin
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      return NextResponse.json({ message: "Admin already exists." });
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await User.create({
      name: "Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    });

    return NextResponse.json({ message: "Admin user created successfully." });
  } catch (error) {
    console.error("[Setup] Error:", error);
    return NextResponse.json({ error: "Setup failed" }, { status: 500 });
  }
}
