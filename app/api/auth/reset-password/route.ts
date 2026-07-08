import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { email, token, password } = await req.json();

    if (!email || !token || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email });

    if (!user || !user.resetToken || !user.resetTokenExpires) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    if (user.resetToken !== token) {
      return NextResponse.json({ error: "Invalid reset token" }, { status: 400 });
    }

    if (new Date() > new Date(user.resetTokenExpires)) {
      await User.findOneAndUpdate({ email }, { $unset: { resetToken: 1, resetTokenExpires: 1 } });
      return NextResponse.json({ error: "Reset link has expired. Please request a new one." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.findOneAndUpdate(
      { email },
      {
        password: hashedPassword,
        $unset: { resetToken: 1, resetTokenExpires: 1 },
      }
    );

    return NextResponse.json({ message: "Password reset successfully! You can now login." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
