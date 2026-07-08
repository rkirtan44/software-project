/**
 * GET  /api/scholarships — list all scholarships (auto-deactivates expired ones)
 * POST /api/scholarships — create a new scholarship and email all students (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { sendBatchEmails } from "@/lib/email";
import connectDB from "@/lib/mongodb";
import Scholarship from "@/models/Scholarship";
import User from "@/models/User";
import { auth } from "@/lib/auth";

// Auto-deactivate scholarships whose deadline has passed
async function deactivateExpiredScholarships() {
  await Scholarship.updateMany(
    { deadline: { $lt: new Date() }, isActive: true },
    { $set: { isActive: false } }
  );
}

// Build the "new scholarship" notification email HTML
function buildNewScholarshipEmail(params: {
  studentName?: string;
  scholarship: {
    title: string;
    amount: number;
    deadline: string;
    eligibility: string;
    category: string[];
    applyLink?: string;
    description?: string;
  };
}): string {
  const { studentName, scholarship } = params;
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
    <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">New Scholarship Available!</p>
  </div>
  <div style="background:white;padding:28px;border-radius:0 0 16px 16px;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
    ${studentName ? `<p style="margin:0 0 16px;font-size:14px;color:#64748b;">Hello <strong style="color:#1a1a2e;">${studentName}</strong> 👋</p>` : ""}
    <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;padding:14px 18px;margin-bottom:18px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:18px;">✅</span>
        <span style="font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.5px;">New Scholarship Added</span>
      </div>
      <p style="margin:0 0 5px;font-size:18px;font-weight:800;color:#1a1a2e;">${scholarship.title}</p>
      <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">${scholarship.description || "A new scholarship opportunity is now available."}</p>
    </div>
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
      This email was sent by ScholarHub Admin.<br>
      Visit <a href="${appUrl}" style="color:#667eea;text-decoration:none;">ScholarHub Portal</a> for more scholarships.
    </p>
  </div>
  <p style="text-align:center;margin:16px 0 0;font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} ScholarHub · All rights reserved</p>
</div>
</body></html>`;
}

// GET — return all scholarships
export async function GET() {
  try {
    await connectDB();
    await deactivateExpiredScholarships();

    const scholarships = await Scholarship.find({})
      .select("title titleHi titleGu description amount eligibility category deadline applyLink youtubeLink isActive level course state gender income documents applicants createdAt")
      .sort({ createdAt: -1 });

    return NextResponse.json({ scholarships });
  } catch {
    return NextResponse.json({ scholarships: [], error: "DB error" }, { status: 500 });
  }
}

// POST — admin creates a new scholarship and notifies all students
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const scholarship = await Scholarship.create(body);

    // Send emails in the background — don't block the response
    User.find({}, { email: 1, name: 1, _id: 0 })
      .then(async (users) => {
        if (!users.length) return;
        await sendBatchEmails(
          users,
          `🎓 New Scholarship: ${scholarship.title} — ScholarHub`,
          (name) => buildNewScholarshipEmail({
            studentName: name,
            scholarship: {
              title:       scholarship.title,
              amount:      scholarship.amount,
              deadline:    scholarship.deadline,
              eligibility: scholarship.eligibility,
              category:    scholarship.category,
              applyLink:   scholarship.applyLink,
              description: scholarship.description,
            },
          })
        );
        console.log(`[ScholarHub] New scholarship emails sent to ${users.length} students`);
      })
      .catch((err) => console.error("[ScholarHub] Email send error:", err));

    return NextResponse.json(
      { scholarship, message: "Scholarship added! Emails are being sent to all students." },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "DB error" }, { status: 500 });
  }
}
