/**
 * GET    /api/scholarships/[id] — get a single scholarship
 * PUT    /api/scholarships/[id] — admin edits a scholarship and emails applicants
 * DELETE /api/scholarships/[id] — admin deletes a scholarship and emails applicants
 */

import { NextRequest, NextResponse } from "next/server";
import { sendBatchEmails } from "@/lib/email";
import connectDB from "@/lib/mongodb";
import Scholarship from "@/models/Scholarship";
import User from "@/models/User";
import { auth } from "@/lib/auth";

// Check which fields changed between old and new data
function detectChanges(oldData: any, newData: any): string[] {
  const changes: string[] = [];

  if (newData.amount !== undefined && oldData.amount !== newData.amount)
    changes.push(`Amount changed to ₹${Number(newData.amount).toLocaleString("en-IN")}`);

  if (newData.deadline !== undefined && String(oldData.deadline) !== String(newData.deadline))
    changes.push(`Deadline updated to ${new Date(newData.deadline).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`);

  if (newData.eligibility !== undefined && oldData.eligibility !== newData.eligibility)
    changes.push("Eligibility criteria updated");

  if (newData.isActive !== undefined && oldData.isActive !== newData.isActive)
    changes.push(newData.isActive ? "Scholarship is now Active" : "Scholarship is now Inactive");

  if (newData.applyLink !== undefined && oldData.applyLink !== newData.applyLink)
    changes.push("Application link updated");

  return changes;
}

// Email template for scholarship edits
function buildEditEmail(params: {
  studentName?: string;
  scholarship: { title: string; amount: number; deadline: string; eligibility: string; category: string[]; applyLink?: string };
  changes: string[];
}): string {
  const { studentName, scholarship, changes } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "#";

  const details = [
    ["💰 Amount",    `₹${scholarship.amount.toLocaleString("en-IN")}`],
    ["📅 Last Date", new Date(scholarship.deadline).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })],
    ["✅ Eligibility", scholarship.eligibility],
    ["🏷️ Category",  scholarship.category.join(", ")],
  ];

  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:32px auto;padding:0 16px 32px;">
  <div style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:16px 16px 0 0;padding:24px 28px;text-align:center;">
    <span style="font-size:28px;">🎓</span>
    <h1 style="margin:8px 0 0;color:white;font-size:22px;font-weight:800;">ScholarHub</h1>
    <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">Scholarship Update</p>
  </div>
  <div style="background:white;padding:28px;border-radius:0 0 16px 16px;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
    ${studentName ? `<p style="margin:0 0 16px;font-size:14px;color:#64748b;">Hello <strong style="color:#1a1a2e;">${studentName}</strong> 👋</p>` : ""}
    <div style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:12px;padding:14px 18px;margin-bottom:18px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:18px;">✏️</span>
        <span style="font-size:11px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:0.5px;">Scholarship Updated</span>
      </div>
      <p style="margin:0 0 4px;font-size:18px;font-weight:800;color:#1a1a2e;">${scholarship.title}</p>
      <p style="margin:0;font-size:13px;color:#64748b;">The admin has updated this scholarship.</p>
    </div>
    ${changes.length > 0 ? `
    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:14px 18px;margin-bottom:18px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#d97706;text-transform:uppercase;">What was updated:</p>
      ${changes.map(c => `<p style="margin:0 0 4px;font-size:13px;color:#92400e;">• ${c}</p>`).join("")}
    </div>` : ""}
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:18px;">
      ${details.map(([label, value], i) => `
      <div style="display:flex;padding:10px 16px;background:${i % 2 === 0 ? "#f1f5f9" : "white"};">
        <span style="font-size:13px;color:#64748b;font-weight:600;width:130px;flex-shrink:0;">${label}</span>
        <span style="font-size:13px;color:#1a1a2e;font-weight:700;">${value}</span>
      </div>`).join("")}
    </div>
    ${scholarship.applyLink ? `
    <div style="text-align:center;margin-bottom:18px;">
      <a href="${scholarship.applyLink}" style="display:inline-block;background:linear-gradient(135deg,#667eea,#764ba2);color:white;font-weight:700;font-size:14px;padding:13px 32px;border-radius:12px;text-decoration:none;">Apply Now →</a>
    </div>` : ""}
    <p style="margin:18px 0 0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
      Visit <a href="${appUrl}" style="color:#667eea;text-decoration:none;">ScholarHub Portal</a> for more scholarships.
    </p>
  </div>
  <p style="text-align:center;margin:16px 0 0;font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} ScholarHub · All rights reserved</p>
</div>
</body></html>`;
}

// Email template for scholarship deletion
function buildDeleteEmail(params: { studentName?: string; scholarshipTitle: string }): string {
  const { studentName, scholarshipTitle } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "#";

  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:32px auto;padding:0 16px 32px;">
  <div style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:16px 16px 0 0;padding:24px 28px;text-align:center;">
    <span style="font-size:28px;">🎓</span>
    <h1 style="margin:8px 0 0;color:white;font-size:22px;font-weight:800;">ScholarHub</h1>
    <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">Scholarship Notice</p>
  </div>
  <div style="background:white;padding:28px;border-radius:0 0 16px 16px;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
    ${studentName ? `<p style="margin:0 0 16px;font-size:14px;color:#64748b;">Hello <strong style="color:#1a1a2e;">${studentName}</strong> 👋</p>` : ""}
    <div style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:12px;padding:14px 18px;margin-bottom:18px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:18px;">🗑️</span>
        <span style="font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.5px;">Scholarship Removed</span>
      </div>
      <p style="margin:0 0 4px;font-size:18px;font-weight:800;color:#1a1a2e;">${scholarshipTitle}</p>
      <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
        This scholarship has been removed. Please visit ScholarHub to explore other available scholarships.
      </p>
    </div>
    <div style="text-align:center;margin-bottom:18px;">
      <a href="${appUrl}" style="display:inline-block;background:linear-gradient(135deg,#667eea,#764ba2);color:white;font-weight:700;font-size:14px;padding:13px 32px;border-radius:12px;text-decoration:none;">View Other Scholarships →</a>
    </div>
    <p style="margin:18px 0 0;font-size:12px;color:#94a3b8;text-align:center;">This email was sent by ScholarHub Admin.</p>
  </div>
  <p style="text-align:center;margin:16px 0 0;font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} ScholarHub · All rights reserved</p>
</div>
</body></html>`;
}

// GET — fetch a single scholarship by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const scholarship = await Scholarship.findById(id);
    if (!scholarship) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(scholarship);
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

// PUT — admin edits a scholarship, emails applicants about the changes
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    // Fetch old data so we can detect what changed
    const oldScholarship = await Scholarship.findById(id);
    if (!oldScholarship) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await Scholarship.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: false }
    );
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Email applicants in the background if something meaningful changed
    const applicantEmails: string[] = oldScholarship.applicants || [];
    if (applicantEmails.length > 0) {
      const changes = detectChanges(oldScholarship, body);
      const hasMeaningfulChange = changes.length > 0 || Object.keys(body).some((k) =>
        ["title", "description", "eligibility", "amount", "deadline", "applyLink", "documents"].includes(k)
      );

      if (hasMeaningfulChange) {
        User.find({ email: { $in: applicantEmails } }, { email: 1, name: 1, _id: 0 })
          .then(async (users) => {
            if (!users.length) return;
            await sendBatchEmails(
              users,
              `✏️ Scholarship Updated: ${updated.title} — ScholarHub`,
              (name) => buildEditEmail({
                studentName: name,
                scholarship: {
                  title:       updated.title,
                  amount:      updated.amount,
                  deadline:    updated.deadline,
                  eligibility: updated.eligibility,
                  category:    updated.category,
                  applyLink:   updated.applyLink,
                },
                changes,
              })
            );
            console.log(`[ScholarHub] Edit emails sent to ${users.length} applicants`);
          })
          .catch((err) => console.error("[ScholarHub] Edit email error:", err));
      }
    }

    return NextResponse.json({ scholarship: updated, message: "Updated!" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "DB error" }, { status: 500 });
  }
}

// DELETE — admin removes a scholarship, emails applicants
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const scholarship = await Scholarship.findById(id);
    if (!scholarship) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const applicantEmails: string[] = scholarship.applicants || [];
    const scholarshipTitle = scholarship.title;

    await Scholarship.findByIdAndDelete(id);

    // Email applicants in the background
    if (applicantEmails.length > 0) {
      User.find({ email: { $in: applicantEmails } }, { email: 1, name: 1, _id: 0 })
        .then(async (users) => {
          if (!users.length) return;
          await sendBatchEmails(
            users,
            `🗑️ Scholarship Removed: ${scholarshipTitle} — ScholarHub`,
            (name) => buildDeleteEmail({ studentName: name, scholarshipTitle })
          );
          console.log(`[ScholarHub] Delete emails sent to ${users.length} applicants`);
        })
        .catch((err) => console.error("[ScholarHub] Delete email error:", err));
    }

    return NextResponse.json({ message: "Deleted!" });
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
