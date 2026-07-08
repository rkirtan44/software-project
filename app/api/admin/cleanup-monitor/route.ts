/**
 * GET /api/admin/cleanup-monitor
 * Marks all non-"changed" unresolved monitor logs as resolved
 * so they move to history and don't clutter the alert view.
 * Requires admin session.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import ScholarshipMonitorLog from "@/models/ScholarshipMonitorLog";

export async function GET(req: NextRequest) {
  // Only admins can trigger cleanup
  const session = await auth();
  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    // "ok", "unreachable", and "error" logs don't need admin attention — resolve them
    const result = await ScholarshipMonitorLog.updateMany(
      { resolved: false, status: { $in: ["unreachable", "ok", "error"] } },
      { $set: { resolved: true, resolvedAt: new Date() } }
    );

    return NextResponse.json({
      message: `Cleaned up ${result.modifiedCount} logs.`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
