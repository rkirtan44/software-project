/**
 * POST /api/auth/forgot-password
 * Sends a password reset link to the user's email.
 * The link contains a secure token valid for 1 hour.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { transporter, FROM_ADDRESS } from "@/lib/email";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email });

    // Always return the same response to avoid revealing whether an email is registered
    if (!user) {
      return NextResponse.json({
        message: "If this email is registered, a reset link has been sent.",
      });
    }

    // Generate a secure token, valid for 1 hour
    const token   = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await User.findOneAndUpdate({ email }, { resetToken: token, resetTokenExpires: expires });

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: email,
      subject: "Reset Your ScholarPath Password",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px;background:#f8fafc;border-radius:16px;">
          <div style="background:linear-gradient(135deg,#1d4ed8,#4f46e5);border-radius:12px;padding:20px 24px;text-align:center;margin-bottom:20px;">
            <span style="color:white;font-size:22px;">🎓</span>
            <span style="color:white;font-weight:800;font-size:18px;margin-left:8px;">ScholarPath</span>
          </div>
          <div style="background:white;border-radius:14px;padding:28px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
            <h2 style="color:#1a1a2e;margin:0 0 8px;font-size:22px;">Reset Your Password</h2>
            <p style="color:#64748b;font-size:14px;margin:0 0 24px;">
              Hello <strong>${user.name || "there"}</strong>, we received a request to reset your ScholarPath password.
            </p>
            <div style="text-align:center;margin-bottom:24px;">
              <a href="${resetUrl}"
                style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#4f46e5);color:white;font-weight:700;font-size:15px;padding:14px 36px;border-radius:12px;text-decoration:none;">
                Reset Password →
              </a>
            </div>
            <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:10px;padding:12px 16px;margin-bottom:16px;">
              <p style="margin:0;font-size:13px;color:#92400e;">
                ⏰ This link expires in <strong>1 hour</strong>. If you didn't request this, ignore this email.
              </p>
            </div>
            <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
              ScholarPath — Scholarship Portal · Gujarat & Central
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({
      message: "If this email is registered, a reset link has been sent.",
    });
  } catch (err: any) {
    console.error("[ForgotPassword] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
