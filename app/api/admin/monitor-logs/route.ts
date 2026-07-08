/**
 * GET  /api/admin/monitor-logs          — paginated full history log
 * GET  /api/admin/monitor-logs?all=1    — all logs (no pagination)
 * PATCH /api/admin/monitor-logs         — resolve / dismiss an alert
 *   body: { logId: string, resolved: boolean }
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ScholarshipMonitorLog from "@/models/ScholarshipMonitorLog";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "1";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const status = searchParams.get("status"); // filter by status

    const query: Record<string, any> = {};
    if (status) query.status = status;

    if (all) {
      const logs = await ScholarshipMonitorLog.find(query)
        .sort({ checkedAt: -1 })
        .lean();
      return NextResponse.json({ logs, total: logs.length });
    }

    const total = await ScholarshipMonitorLog.countDocuments(query);
    const logs = await ScholarshipMonitorLog.find(query)
      .sort({ checkedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({ logs, total, page, limit });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { logId, resolved } = await req.json();

    if (!logId) {
      return NextResponse.json({ error: "logId is required" }, { status: 400 });
    }

    const update: Record<string, any> = { resolved: !!resolved };
    if (resolved) update.resolvedAt = new Date();

    const log = await ScholarshipMonitorLog.findByIdAndUpdate(logId, update, {
      new: true,
    });

    if (!log) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    return NextResponse.json({ log, message: "Updated" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
