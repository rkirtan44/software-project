/**
 * Scholarship Monitor — Database-based checks only (no external fetching)
 *
 * Checks every scholarship in our own database for:
 *  1. Expired deadline but still marked Active → flag as "status" change
 *  2. Deadline within 7 days → urgent warning
 *  3. Missing applyLink → flag as incomplete
 *
 * GET  /api/admin/monitor-scholarships — return all unresolved alerts
 * POST /api/admin/monitor-scholarships — run a fresh scan
 */

export const maxDuration = 10;

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Scholarship from "@/models/Scholarship";
import Notification from "@/models/Notification";
import ScholarshipMonitorLog from "@/models/ScholarshipMonitorLog";
import { auth } from "@/lib/auth";

// ── GET: return all unresolved alerts ────────────────────────
export async function GET() {
  try {
    await connectDB();

    const logs = await ScholarshipMonitorLog.find({ resolved: false, status: "changed" })
      .sort({ checkedAt: -1 })
      .lean();

    // Sort: urgent first
    const weight: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    logs.sort((a, b) => (weight[a.severity] ?? 4) - (weight[b.severity] ?? 4));

    return NextResponse.json({ logs, total: logs.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── POST: run a database-based scan ──────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const scholarships = await Scholarship.find({}).lean();
    if (scholarships.length === 0) {
      return NextResponse.json({ message: "No scholarships found.", scanned: 0, alerts: 0 });
    }

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    let alertCount = 0;

    for (const s of scholarships) {
      const sid = (s._id as any).toString();
      const deadline = new Date(s.deadline as Date);
      const changes: any[] = [];
      let severity: "urgent" | "high" | "medium" | "low" = "low";

      // ── Check 1: Expired but still Active ──
      if (s.isActive && deadline < now) {
        changes.push({
          field: "isActive",
          oldValue: "Active",
          newValue: "Inactive",
          suggestedAction: "Deadline has passed — mark this scholarship as Inactive",
        });
        severity = "urgent";

        // Auto-fix: mark inactive in DB
        await Scholarship.findByIdAndUpdate(s._id, { $set: { isActive: false } });
      }

      // ── Check 2: Deadline within 7 days and still Active ──
      if (s.isActive && deadline >= now && deadline <= sevenDaysFromNow) {
        const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        changes.push({
          field: "deadline",
          oldValue: deadline.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
          newValue: `Expiring in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`,
          suggestedAction: `Deadline is approaching — notify students soon`,
        });
        severity = "high";
      }

      // ── Check 3: Missing apply link ──
      if (!s.applyLink || s.applyLink.trim() === "") {
        changes.push({
          field: "applyLink",
          oldValue: "(empty)",
          newValue: "Add apply link",
          suggestedAction: "This scholarship has no application link — add one",
        });
        if (severity === "low") severity = "medium";
      }

      if (changes.length === 0) continue;

      // Duplicate guard — skip if same scholarship already has an unresolved alert for same fields
      const changedFields = changes.map((c: any) => c.field);
      const existing = await ScholarshipMonitorLog.findOne({
        scholarshipId: s._id,
        resolved: false,
        status: "changed",
        "changes.field": { $all: changedFields },
      });
      if (existing) continue;

      // Build notification message
      const lines = changes.map((c: any) =>
        `• ${c.field}: ${c.oldValue} → ${c.newValue}. ${c.suggestedAction}.`
      ).join("\n");

      const notification = await Notification.create({
        title: `⚠️ Action needed: ${s.title}`,
        message: `Scholarship review required.\n\n${lines}`,
        type: "monitor_alert",
        scholarshipId: s._id,
        isActive: true,
      });

      await ScholarshipMonitorLog.create({
        scholarshipId: s._id,
        scholarshipTitle: s.title,
        sourceUrl: s.applyLink || "(no link)",
        status: "changed",
        changes,
        severity,
        notificationId: notification._id,
        resolved: false,
        checkedAt: now,
      });

      alertCount++;
    }

    return NextResponse.json({
      message: `Scan complete. ${alertCount} alert(s) generated.`,
      scanned: scholarships.length,
      alerts: alertCount,
      warnings: 0,
    });
  } catch (err: any) {
    console.error("Monitor error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
