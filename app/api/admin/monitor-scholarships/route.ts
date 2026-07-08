/**
 * POST /api/admin/monitor-scholarships
 *
 * Iterates every scholarship that has an applyLink, fetches the live page,
 * extracts key signals (deadline, amount, status keywords), compares them
 * with the stored values, and creates:
 *   - A ScholarshipMonitorLog entry for every scholarship checked
 *   - A Notification (type: "monitor_alert") for every scholarship where
 *     discrepancies are detected
 *
 * Duplicate-guard: if an unresolved alert already exists for the same
 * scholarship + same changed fields, a new one is NOT created.
 *
 * GET /api/admin/monitor-scholarships
 * Returns all unresolved monitor alerts with their change details.
 */

// Vercel max function duration (seconds) — 60 on Pro, 10 on Hobby
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Scholarship from "@/models/Scholarship";
import Notification from "@/models/Notification";
import ScholarshipMonitorLog, {
  IMonitorChange,
  AlertSeverity,
  MonitorStatus,
} from "@/models/ScholarshipMonitorLog";
import { auth } from "@/lib/auth";

// ─── helpers ────────────────────────────────────────────────────────────────

/** Fetch a URL with a 6-second timeout. Returns null on failure. */
async function safeFetch(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6_000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ScholarHubMonitor/1.0; +https://scholarhub.in)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** Strip HTML tags and collapse whitespace */
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── deadline extraction ─────────────────────────────────────────────────────

const MONTH_MAP: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

function makeDate(day: number, month: number, year: number): Date | null {
  if (month < 0 || month > 11) return null;
  if (isNaN(day) || isNaN(year)) return null;
  if (year < 2020 || year > 2035) return null;
  const d = new Date(year, month, day);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Try to extract a deadline date from raw page text.
 * Returns a Date or null.
 */
function extractDeadline(text: string): Date | null {
  const lower = text.toLowerCase();

  // Focus on the section near deadline keywords
  const kwIdx = lower.search(
    /last\s+date|deadline|closing\s+date|apply\s+by|due\s+date|submission\s+date/
  );
  const section = kwIdx !== -1 ? lower.slice(kwIdx, kwIdx + 300) : lower.slice(0, 2000);

  // Pattern 1: dd Month yyyy  (e.g. "31 December 2026", "31st Dec 2026")
  const p1 = /(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})/i;
  const m1 = section.match(p1);
  if (m1) {
    const d = makeDate(parseInt(m1[1]), MONTH_MAP[m1[2].toLowerCase()] ?? -1, parseInt(m1[3]));
    if (d) return d;
  }

  // Pattern 2: Month dd, yyyy  (e.g. "December 31, 2026")
  const p2 = /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i;
  const m2 = section.match(p2);
  if (m2) {
    const d = makeDate(parseInt(m2[2]), MONTH_MAP[m2[1].toLowerCase()] ?? -1, parseInt(m2[3]));
    if (d) return d;
  }

  // Pattern 3: yyyy-mm-dd  (e.g. "2026-12-31")
  const p3 = /(\d{4})-(\d{1,2})-(\d{1,2})/;
  const m3 = section.match(p3);
  if (m3) {
    const d = makeDate(parseInt(m3[3]), parseInt(m3[2]) - 1, parseInt(m3[1]));
    if (d) return d;
  }

  // Pattern 4: dd/mm/yyyy or dd-mm-yyyy  (e.g. "31/12/2026")
  const p4 = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
  const m4 = section.match(p4);
  if (m4) {
    const d = makeDate(parseInt(m4[1]), parseInt(m4[2]) - 1, parseInt(m4[3]));
    if (d) return d;
  }

  return null;
}

// ─── amount extraction ───────────────────────────────────────────────────────

function extractAmount(text: string): number | null {
  // Look near "amount", "scholarship", "award", "stipend", "grant"
  const lower = text.toLowerCase();
  const idx = lower.search(/scholarship\s+amount|award\s+amount|stipend|grant\s+amount|prize\s+money|fellowship\s+amount/);
  const section = idx !== -1 ? text.slice(idx, idx + 400) : text.slice(0, 2000);

  // ₹ 1,00,000 or Rs. 50000 or INR 25000
  const patterns = [
    /(?:₹|rs\.?|inr)\s*([\d,]+)/i,
    /([\d,]+)\s*(?:rupees|inr)/i,
  ];

  for (const pat of patterns) {
    const m = section.match(pat);
    if (m) {
      const val = parseInt(m[1].replace(/,/g, ""), 10);
      if (!isNaN(val) && val > 0) return val;
    }
  }
  return null;
}

// ─── status detection ────────────────────────────────────────────────────────

function detectStatus(text: string): "closed" | "upcoming" | "active" | null {
  const lower = text.toLowerCase();
  if (/applications?\s+(are\s+)?closed|no\s+longer\s+accepting|deadline\s+passed|closed\s+for\s+applications/.test(lower))
    return "closed";
  if (/coming\s+soon|will\s+open|not\s+yet\s+open|upcoming|opens?\s+in/.test(lower))
    return "upcoming";
  if (/apply\s+now|applications?\s+(are\s+)?open|accepting\s+applications/.test(lower))
    return "active";
  return null;
}

// ─── eligibility extraction ──────────────────────────────────────────────────

function extractEligibility(text: string): string | null {
  const lower = text.toLowerCase();
  const idx = lower.search(/eligibility|who\s+can\s+apply|criteria|requirements/);
  if (idx === -1) return null;
  const snippet = text.slice(idx, idx + 500).replace(/\s+/g, " ").trim();
  return snippet.length > 20 ? snippet.slice(0, 300) : null;
}

// ─── severity calculator ─────────────────────────────────────────────────────

function calcSeverity(changes: IMonitorChange[]): AlertSeverity {
  const fields = changes.map((c) => c.field);
  if (fields.includes("deadline") || fields.includes("isActive") || fields.includes("status"))
    return "urgent";
  if (fields.includes("amount")) return "high";
  if (fields.includes("eligibility")) return "medium";
  return "low";
}

// ─── suggested action builder ────────────────────────────────────────────────

function suggestAction(field: string, newValue: string): string {
  switch (field) {
    case "deadline":
      return `Update deadline to ${newValue}`;
    case "amount":
      return `Update scholarship amount to ₹${parseInt(newValue).toLocaleString("en-IN")}`;
    case "eligibility":
      return "Review and update eligibility criteria from the official source";
    case "isActive":
    case "status":
      return newValue === "closed"
        ? "Mark scholarship as Inactive (applications closed)"
        : newValue === "upcoming"
        ? "Mark scholarship as Inactive until it opens"
        : "Mark scholarship as Active";
    case "applyLink":
      return `Update apply link to: ${newValue}`;
    default:
      return `Review and update the '${field}' field`;
  }
}

// ─── duplicate-alert guard ───────────────────────────────────────────────────

async function hasUnresolvedAlert(
  scholarshipId: string,
  fields: string[]
): Promise<boolean> {
  const existing = await ScholarshipMonitorLog.findOne({
    scholarshipId,
    resolved: false,
    status: "changed",
    "changes.field": { $all: fields },
  });
  return !!existing;
}

// ════════════════════════════════════════════════════════════════════════════
// GET — return all unresolved monitor alerts
// ════════════════════════════════════════════════════════════════════════════

export async function GET() {
  try {
    await connectDB();

    // Active alerts = only "changed" status, unresolved
    const logs = await ScholarshipMonitorLog.find({
      resolved: false,
      status: "changed",
    })
      .sort({ checkedAt: -1 })
      .lean();

    // Sort by severity weight — urgent first
    const weight: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    logs.sort((a, b) => (weight[a.severity] ?? 4) - (weight[b.severity] ?? 4));

    return NextResponse.json({ logs, total: logs.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// POST — run the monitoring scan
// ════════════════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Fetch all scholarships that have an applyLink
    const scholarships = await Scholarship.find({
      applyLink: { $exists: true, $ne: "" },
    }).lean();

    if (scholarships.length === 0) {
      return NextResponse.json({
        message: "No scholarships with source URLs found.",
        scanned: 0,
        alerts: 0,
        warnings: 0,
      });
    }

    let alertCount = 0;
    let warningCount = 0;
    const results: Array<{ title: string; status: MonitorStatus; changes: number }> = [];

    // Process in parallel batches of 5 for speed
    const BATCH_SIZE = 5;
    for (let i = 0; i < scholarships.length; i += BATCH_SIZE) {
      const batch = scholarships.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(async (scholarship) => {
      const url = scholarship.applyLink as string;
      const sid = (scholarship._id as any).toString();

      // ── 1. Fetch live page ──────────────────────────────────────────────
      const html = await safeFetch(url);

      if (!html) {
        // Log as unreachable — auto-resolved so it goes straight to history
        await ScholarshipMonitorLog.create({
          scholarshipId: scholarship._id,
          scholarshipTitle: scholarship.title,
          sourceUrl: url,
          status: "unreachable" as MonitorStatus,
          changes: [],
          severity: "low" as AlertSeverity,
          resolved: true,
          resolvedAt: new Date(),
          checkedAt: new Date(),
          errorMessage: `Source URL unreachable: ${url}`,
        });
        return { title: scholarship.title, status: "unreachable" as MonitorStatus, changes: 0, isAlert: false, isWarning: true };
      }

      const text = stripHtml(html);
      const changes: IMonitorChange[] = [];

      // ── 2. Compare deadline ─────────────────────────────────────────────
      const liveDeadline = extractDeadline(text);
      if (liveDeadline) {
        const storedDeadline = new Date(scholarship.deadline as Date);
        const diffDays = Math.abs(
          (liveDeadline.getTime() - storedDeadline.getTime()) / 86_400_000
        );
        if (diffDays > 3) {
          // More than 3 days difference → flag it
          changes.push({
            field: "deadline",
            oldValue: storedDeadline.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }),
            newValue: liveDeadline.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }),
            suggestedAction: suggestAction(
              "deadline",
              liveDeadline.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })
            ),
          });
        }
      }

      // ── 3. Compare amount ───────────────────────────────────────────────
      const liveAmount = extractAmount(text);
      if (liveAmount !== null) {
        const storedAmount = scholarship.amount as number;
        const pctDiff = Math.abs(liveAmount - storedAmount) / (storedAmount || 1);
        if (pctDiff > 0.05) {
          // More than 5% difference
          changes.push({
            field: "amount",
            oldValue: `₹${storedAmount.toLocaleString("en-IN")}`,
            newValue: `₹${liveAmount.toLocaleString("en-IN")}`,
            suggestedAction: suggestAction("amount", String(liveAmount)),
          });
        }
      }

      // ── 4. Compare status ───────────────────────────────────────────────
      const liveStatus = detectStatus(text);
      if (liveStatus) {
        const storedActive = scholarship.isActive as boolean;
        const statusMismatch =
          (liveStatus === "closed" && storedActive) ||
          (liveStatus === "active" && !storedActive);

        if (statusMismatch) {
          changes.push({
            field: "status",
            oldValue: storedActive ? "Active" : "Inactive",
            newValue: liveStatus.charAt(0).toUpperCase() + liveStatus.slice(1),
            suggestedAction: suggestAction("status", liveStatus),
          });
        }
      }

      // ── 5. Eligibility hint ─────────────────────────────────────────────
      const liveEligibility = extractEligibility(text);
      if (liveEligibility) {
        const stored = (scholarship.eligibility as string).toLowerCase();
        // Simple heuristic: if the live snippet shares < 30% words with stored
        const storedWords = new Set(stored.split(/\W+/).filter((w) => w.length > 4));
        const liveWords = liveEligibility
          .toLowerCase()
          .split(/\W+/)
          .filter((w) => w.length > 4);
        const overlap = liveWords.filter((w) => storedWords.has(w)).length;
        const similarity = storedWords.size > 0 ? overlap / storedWords.size : 1;

        if (similarity < 0.3 && liveWords.length > 5) {
          changes.push({
            field: "eligibility",
            oldValue: (scholarship.eligibility as string).slice(0, 120),
            newValue: liveEligibility.slice(0, 120),
            suggestedAction: suggestAction("eligibility", liveEligibility),
          });
        }
      }

      // ── 6. Persist results ──────────────────────────────────────────────
      if (changes.length === 0) {
        // All good — log as "ok" (no notification needed)
        await ScholarshipMonitorLog.create({
          scholarshipId: scholarship._id,
          scholarshipTitle: scholarship.title,
          sourceUrl: url,
          status: "ok" as MonitorStatus,
          changes: [],
          severity: "low" as AlertSeverity,
          resolved: true, // ok logs are auto-resolved
          checkedAt: new Date(),
        });
        return { title: scholarship.title, status: "ok" as MonitorStatus, changes: 0, isAlert: false, isWarning: false };
      }

      // Duplicate guard — skip if same fields already have an open alert
      const changedFields = changes.map((c) => c.field);
      const isDuplicate = await hasUnresolvedAlert(sid, changedFields);
      if (isDuplicate) {
        return { title: scholarship.title, status: "changed" as MonitorStatus, changes: 0, isAlert: false, isWarning: false };
      }

      const severity = calcSeverity(changes);

      // Build a human-readable notification message
      const changeLines = changes
        .map(
          (c) =>
            `• ${c.field.charAt(0).toUpperCase() + c.field.slice(1)}: "${c.oldValue}" → "${c.newValue}". ${c.suggestedAction}.`
        )
        .join("\n");

      const notifTitle = `⚠️ Update detected: ${scholarship.title}`;
      const notifMessage =
        `Discrepancies found between stored data and the official source.\n\n` +
        changeLines +
        `\n\nSource: ${url}`;

      // Create notification
      const notification = await Notification.create({
        title: notifTitle,
        message: notifMessage,
        type: "monitor_alert",
        scholarshipId: scholarship._id,
        isActive: true,
      });

      // Create monitor log
      await ScholarshipMonitorLog.create({
        scholarshipId: scholarship._id,
        scholarshipTitle: scholarship.title,
        sourceUrl: url,
        status: "changed" as MonitorStatus,
        changes,
        severity,
        notificationId: notification._id,
        resolved: false,
        checkedAt: new Date(),
      });

      return { title: scholarship.title, status: "changed" as MonitorStatus, changes: changes.length, isAlert: true, isWarning: false };
      })); // end Promise.all map

      // Aggregate batch results
      for (const r of batchResults) {
        results.push({ title: r.title, status: r.status, changes: r.changes });
        if (r.isAlert) alertCount++;
        if (r.isWarning) warningCount++;
      }
    } // end batch loop

    return NextResponse.json({
      message: `Scan complete. ${alertCount} alert(s) generated, ${warningCount} warning(s).`,
      scanned: scholarships.length,
      alerts: alertCount,
      warnings: warningCount,
      results,
    });
  } catch (err: any) {
    console.error("Monitor error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
