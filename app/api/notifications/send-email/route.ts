/**
 * POST /api/notifications/send-email
 * Admin sends an email blast for a notification.
 * Supports four targeting modes:
 *   A) personalEmail — single specific address
 *   B) targetCategory — users of a specific category
 *   C) scholarshipId  — applicants + category-matching users
 *   D) (default)      — all registered users
 */

import { NextRequest, NextResponse } from "next/server";
import { sendBatchEmails } from "@/lib/email";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Scholarship from "@/models/Scholarship";
import Notification from "@/models/Notification";
import { auth } from "@/lib/auth";

// Type colours and labels used in the email
const TYPE_CONFIG = {
  info:    { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", emoji: "ℹ️",  label: "Information" },
  warning: { color: "#d97706", bg: "#fffbeb", border: "#fde68a", emoji: "⚠️",  label: "Important Notice" },
  success: { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", emoji: "✅",  label: "Good News" },
} as const;

// Build the notification email HTML
function buildNotificationEmail(params: {
  notifTitle: string;
  notifMessage: string;
  notifType: "info" | "warning" | "success";
  scholarship?: {
    title: string; titleHi?: string; titleGu?: string;
    amount: number; deadline: string; eligibility?: string;
    applyLink?: string; category?: string[];
  } | null;
  recipientName?: string;
}): string {
  const { notifTitle, notifMessage, notifType, scholarship, recipientName } = params;
  const cfg = TYPE_CONFIG[notifType] || TYPE_CONFIG.info;

  const scholarshipSection = scholarship ? `
    <div style="margin-top:20px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:12px 20px;">
        <span style="color:white;font-size:14px;font-weight:700;">🎓 Scholarship Details</span>
      </div>
      <div style="padding:20px;">
        <p style="margin:0 0 4px;font-size:18px;font-weight:800;color:#1a1a2e;">${scholarship.title}</p>
        ${scholarship.titleHi ? `<p style="margin:0 0 2px;font-size:13px;color:#667eea;">${scholarship.titleHi}</p>` : ""}
        ${scholarship.titleGu ? `<p style="margin:0 0 12px;font-size:13px;color:#059669;">${scholarship.titleGu}</p>` : ""}
        <table style="width:100%;border-collapse:collapse;margin-top:8px;">
          <tr>
            <td style="padding:8px 12px;background:#f1f5f9;font-size:13px;color:#64748b;font-weight:600;width:40%;">💰 Amount</td>
            <td style="padding:8px 12px;font-size:14px;font-weight:700;color:#16a34a;">₹${scholarship.amount.toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-size:13px;color:#64748b;font-weight:600;">📅 Deadline</td>
            <td style="padding:8px 12px;font-size:14px;font-weight:700;color:#dc2626;">${new Date(scholarship.deadline).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</td>
          </tr>
          ${scholarship.eligibility ? `<tr><td style="padding:8px 12px;background:#f1f5f9;font-size:13px;color:#64748b;font-weight:600;">✅ Eligibility</td><td style="padding:8px 12px;font-size:13px;color:#374151;">${scholarship.eligibility}</td></tr>` : ""}
          ${scholarship.category?.length ? `<tr><td style="padding:8px 12px;font-size:13px;color:#64748b;font-weight:600;">🏷️ Category</td><td style="padding:8px 12px;font-size:13px;color:#374151;">${scholarship.category.join(", ")}</td></tr>` : ""}
        </table>
        ${scholarship.applyLink ? `<div style="margin-top:16px;text-align:center;"><a href="${scholarship.applyLink}" style="display:inline-block;background:linear-gradient(135deg,#667eea,#764ba2);color:white;font-weight:700;font-size:14px;padding:12px 32px;border-radius:10px;text-decoration:none;">Apply Now →</a></div>` : ""}
      </div>
    </div>` : "";

  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:32px auto;padding:0 16px 32px;">
  <div style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:16px 16px 0 0;padding:24px 28px;text-align:center;">
    <span style="font-size:28px;">🎓</span>
    <h1 style="margin:0;color:white;font-size:22px;font-weight:800;">ScholarPath</h1>
    <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">Scholarship Portal Notification</p>
  </div>
  <div style="background:white;padding:28px;border-radius:0 0 16px 16px;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
    ${recipientName ? `<p style="margin:0 0 16px;font-size:14px;color:#64748b;">Hello <strong style="color:#1a1a2e;">${recipientName}</strong> 👋</p>` : ""}
    <div style="background:${cfg.bg};border:1.5px solid ${cfg.border};border-radius:12px;padding:18px 20px;margin-bottom:8px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:18px;">${cfg.emoji}</span>
        <span style="font-size:11px;font-weight:700;color:${cfg.color};text-transform:uppercase;letter-spacing:0.5px;">${cfg.label}</span>
      </div>
      <p style="margin:0 0 6px;font-size:18px;font-weight:800;color:#1a1a2e;">${notifTitle}</p>
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${notifMessage}</p>
    </div>
    ${scholarshipSection}
    <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
      This email was sent by ScholarPath Admin.<br>
      Any questions? <a href="mailto:${process.env.EMAIL_USER}" style="color:#667eea;text-decoration:none;">contact us</a>.
    </p>
  </div>
  <p style="text-align:center;margin:16px 0 0;font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} ScholarPath · All rights reserved</p>
</div>
</body></html>`;
}

// Decide which users should receive the email based on the request params
async function resolveTargetUsers(params: {
  personalEmail?: string;
  targetCategory?: string;
  scholarship?: any;
}): Promise<{ email: string; name?: string }[]> {
  const { personalEmail, targetCategory, scholarship } = params;

  // Case A: single specific email
  if (personalEmail) {
    return [{ email: personalEmail, name: personalEmail.split("@")[0] }];
  }

  // Case B: filter by category
  if (targetCategory && targetCategory !== "all") {
    const users = await User.find(
      {
        $or: [
          { casteCategory: { $regex: new RegExp(`^${targetCategory}$`, "i") } },
          { category:      { $regex: new RegExp(`^${targetCategory}$`, "i") } },
        ],
      },
      { email: 1, name: 1, _id: 0 }
    );
    // Fall back to all users if none found for that category
    return users.length > 0 ? users : User.find({}, { email: 1, name: 1, _id: 0 });
  }

  // Case C: scholarship applicants + users whose category matches the scholarship
  if (scholarship) {
    const applicantEmails: string[] = scholarship.applicants || [];
    const categories: string[] = scholarship.category || [];

    const applicants = await User.find(
      { email: { $in: applicantEmails } },
      { email: 1, name: 1, _id: 0 }
    );

    let categoryUsers: any[] = [];
    if (categories.length > 0 && !categories.includes("Any")) {
      categoryUsers = await User.find(
        {
          email: { $nin: applicantEmails },
          $or: [
            { casteCategory: { $in: categories.map((c) => c.toLowerCase()) } },
            { category:      { $in: categories } },
          ],
        },
        { email: 1, name: 1, _id: 0 }
      );
    }

    // Deduplicate by email
    const seen = new Set<string>();
    const combined: { email: string; name?: string }[] = [];
    for (const u of [...applicants, ...categoryUsers]) {
      if (!seen.has(u.email)) {
        seen.add(u.email);
        combined.push({ email: u.email, name: u.name });
      }
    }
    return combined.length > 0 ? combined : User.find({}, { email: 1, name: 1, _id: 0 });
  }

  // Case D: everyone
  return User.find({}, { email: 1, name: 1, _id: 0 });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { notificationId, scholarshipId, targetCategory, personalEmail } = await req.json();

    if (!notificationId) {
      return NextResponse.json({ error: "notificationId required" }, { status: 400 });
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    const scholarship = scholarshipId ? await Scholarship.findById(scholarshipId) : null;

    const targetUsers = await resolveTargetUsers({ personalEmail, targetCategory, scholarship });
    if (targetUsers.length === 0) {
      return NextResponse.json({ error: "No users found to send email" }, { status: 404 });
    }

    const { success, failed } = await sendBatchEmails(
      targetUsers,
      `${notification.title} — ScholarPath`,
      (name) => buildNotificationEmail({
        notifTitle:   notification.title,
        notifMessage: notification.message,
        notifType:    notification.type,
        scholarship:  scholarship
          ? { title: scholarship.title, titleHi: scholarship.titleHi, titleGu: scholarship.titleGu, amount: scholarship.amount, deadline: scholarship.deadline, eligibility: scholarship.eligibility, applyLink: scholarship.applyLink, category: scholarship.category }
          : null,
        recipientName: name,
      })
    );

    if (success === 0) {
      return NextResponse.json({ error: `No emails sent. ${failed} failed.` }, { status: 500 });
    }

    return NextResponse.json({
      message: failed === 0
        ? `✅ ${success} student${success > 1 ? "s" : ""} emailed successfully!`
        : `⚠️ ${success}/${targetUsers.length} emails sent (${failed} failed)`,
      success,
      failed,
      total: targetUsers.length,
    });
  } catch (error: any) {
    console.error("[SendEmail] Error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
