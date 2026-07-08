/**
 * GET   /api/student/notifications — fetch notifications for the logged-in student
 * PATCH /api/student/notifications — mark all notifications as read
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth-helpers";
import connectDB from "@/lib/mongodb";
import StudentNotification from "@/models/StudentNotification";

// Helper: get the student's email from their session token
async function getStudentEmail(req: NextRequest): Promise<string | null> {
  const token = await getSessionToken(req);
  return token?.email ? String(token.email) : null;
}

// Fetch this student's notifications + unread count
export async function GET(req: NextRequest) {
  try {
    const email = await getStudentEmail(req);
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const notifications = await StudentNotification.find({ userEmail: email })
      .sort({ createdAt: -1 })
      .limit(20);
    const unreadCount = await StudentNotification.countDocuments({
      userEmail: email,
      isRead: false,
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Mark all of this student's notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const email = await getStudentEmail(req);
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    await StudentNotification.updateMany(
      { userEmail: email, isRead: false },
      { $set: { isRead: true } }
    );

    return NextResponse.json({ message: "All marked as read" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
