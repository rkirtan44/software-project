/**
 * GET  /api/notifications — list all notifications
 * POST /api/notifications — admin creates a notification and emails targeted users
 */

import { NextRequest, NextResponse } from "next/server";
import { sendBatchEmails } from "@/lib/email";
import connectDB from "@/lib/mongodb";
import Notification from "@/models/Notification";
import Scholarship from "@/models/Scholarship";
import User from "@/models/User";
import { auth } from "@/lib/auth";

// Simple email HTML for a notification (used in background send)
function buildSimpleNotificationEmail(params: {
  title: string;
  message: string;
  type: string;
  recipientName?: string;
}): string {
  const { title, message, type, recipientName } = params;
  const colors: Record<string, { bg: string; color: string; emoji: string }> = {
    info:    { bg: "#eff6ff", color: "#1d4ed8", emoji: "ℹ️" },
    warning: { bg: "#fffbeb", color: "#d97706", emoji: "⚠️" },
    success: { bg: "#f0fdf4", color: "#16a34a", emoji: "✅" },
  };
  const c = colors[type] || colors.info;
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  return `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px;background:#f8fafc;border-radius:16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#4f46e5);border-radius:14px;padding:14px 24px;">
          <span style="color:white;font-size:22px;">🎓</span>
          <span style="color:white;font-weight:800;font-size:18px;margin-left:8px;">ScholarPath</span>
        </div>
      </div>
      <div style="background:white;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <div style="background:${c.bg};padding:20px 24px;border-bottom:2px solid ${c.color}20;">
          <p style="margin:0;font-size:13px;font-weight:700;color:${c.color};text-transform:uppercase;letter-spacing:1px;">${c.emoji} Scholarship Notification</p>
          <h2 style="margin:6px 0 0;color:#1a1a2e;font-size:20px;">${title}</h2>
        </div>
        <div style="padding:24px;">
          ${recipientName ? `<p style="color:#64748b;font-size:14px;margin:0 0 16px;">Hello <strong>${recipientName}</strong>,</p>` : ""}
          <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">${message}</p>
          <a href="${appUrl}" style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#4f46e5);color:white;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;">Open ScholarPath →</a>
        </div>
        <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #f0f0f0;">
          <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">This email was sent by ScholarPath admin.</p>
        </div>
      </div>
    </div>`;
}

// Determine which users to email for a notification
async function getTargetUsers(scholarshipId?: string): Promise<{ email: string; name?: string }[]> {
  if (!scholarshipId) {
    return User.find({}, { email: 1, name: 1, _id: 0 });
  }

  const scholarship = await Scholarship.findById(scholarshipId);
  if (!scholarship) return User.find({}, { email: 1, name: 1, _id: 0 });

  const categories: string[] = Array.isArray(scholarship.category)
    ? scholarship.category
    : [scholarship.category];

  // Collect applicants and users whose category matches
  const [applicants, categoryUsers] = await Promise.all([
    scholarship.applicants?.length
      ? User.find({ _id: { $in: scholarship.applicants } }, { email: 1, name: 1 })
      : Promise.resolve([]),
    User.find({
      $or: [{ category: { $in: categories } }, { category: "General" }],
    }, { email: 1, name: 1 }),
  ]);

  // Deduplicate
  const seen = new Set<string>();
  const users: { email: string; name?: string }[] = [];
  for (const u of [...applicants, ...categoryUsers]) {
    if (!seen.has(u.email)) {
      seen.add(u.email);
      users.push({ email: u.email, name: u.name });
    }
  }
  return users;
}

// GET — list all notifications
export async function GET() {
  try {
    await connectDB();
    const notifications = await Notification.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ notifications });
  } catch {
    return NextResponse.json({ notifications: [], error: "DB error" }, { status: 500 });
  }
}

// POST — admin creates a notification and emails targeted users
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { title, message, type, scholarshipId } = await req.json();

    const notification = await Notification.create({
      title,
      message,
      type,
      scholarshipId: scholarshipId || null,
    });

    // Send emails in the background
    getTargetUsers(scholarshipId)
      .then(async (users) => {
        if (!users.length) return;
        await sendBatchEmails(
          users,
          `${title} — ScholarPath`,
          (name) => buildSimpleNotificationEmail({ title, message, type, recipientName: name })
        );
        console.log(`[ScholarPath] Notification emails sent to ${users.length} users`);
      })
      .catch((err) => console.error("[ScholarPath] Notification email error:", err));

    return NextResponse.json({ notification, message: "Notification sent!" }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
