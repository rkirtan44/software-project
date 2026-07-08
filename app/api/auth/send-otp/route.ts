/**
 * POST /api/auth/send-otp  — generate a 6-digit OTP, store it, send via email
 * GET  /api/auth/send-otp  — verify the OTP and clear it from the database
 */

import { NextRequest, NextResponse } from "next/server";
import { transporter, FROM_ADDRESS } from "@/lib/email";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// ── POST: generate and send OTP ───────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email" },
        { status: 404 }
      );
    }

    // Generate a 6-digit OTP, valid for 5 minutes
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    await User.findOneAndUpdate({ email }, { otp, otpExpires });

    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: email,
      subject: "ScholarHub Login OTP",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#4f46e5);border-radius:12px;padding:12px 24px;">
              <span style="color:white;font-size:20px;">🎓</span>
              <span style="color:white;font-weight:700;font-size:18px;margin-left:8px;">ScholarHub</span>
            </div>
          </div>
          <div style="background:white;border-radius:16px;padding:32px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
            <h2 style="color:#1a1a2e;margin:0 0 8px;">Login OTP</h2>
            <p style="color:#64748b;font-size:14px;margin:0 0 28px;">This OTP is valid for only <strong>5 minutes</strong></p>
            <div style="background:linear-gradient(135deg,#1d4ed8,#4f46e5);border-radius:16px;padding:24px;margin-bottom:24px;">
              <span style="color:white;font-size:40px;font-weight:800;letter-spacing:10px;">${otp}</span>
            </div>
            <p style="color:#94a3b8;font-size:12px;">If you didn't request this, please ignore.</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ message: "OTP sent successfully!" });
  } catch (error) {
    console.error("[OTP] Send error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}

// ── GET: verify OTP ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const otp   = searchParams.get("otp");

    if (!email || !otp) {
      return NextResponse.json({ valid: false, error: "Email and OTP required" });
    }

    await connectDB();
    const user = await User.findOne({ email });

    if (!user?.otp || !user?.otpExpires) {
      return NextResponse.json({ valid: false, error: "OTP has expired. Please request a new one." });
    }

    // Check expiry
    if (new Date() > new Date(user.otpExpires)) {
      await User.findOneAndUpdate({ email }, { $unset: { otp: 1, otpExpires: 1 } });
      return NextResponse.json({ valid: false, error: "OTP has expired. Please request a new one." });
    }

    if (user.otp !== otp) {
      return NextResponse.json({ valid: false, error: "Incorrect OTP. Please try again." });
    }

    // OTP is correct — clear it so it can't be reused
    await User.findOneAndUpdate({ email }, { $unset: { otp: 1, otpExpires: 1 } });
    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("[OTP] Verify error:", error);
    return NextResponse.json({ valid: false, error: "Server error" }, { status: 500 });
  }
}
