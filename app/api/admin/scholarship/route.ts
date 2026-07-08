import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Scholarship from "@/models/Scholarship";

async function checkAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "admin") return false;
  return true;
}

export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  await connectDB();
  const scholarships = await Scholarship.find().sort({ createdAt: -1 });
  return NextResponse.json({ scholarships });
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const body = await req.json();
    await connectDB();
    const scholarship = await Scholarship.create({
      title: body.title,
      description: body.description,
      amount: Number(body.amount),
      eligibility: body.eligibility,
      category: Array.isArray(body.category) ? body.category : [body.category],
      deadline: new Date(body.deadline),
      applyLink: body.applyLink || "",
      isActive: body.isActive ?? true,
      level: body.level || "Central",
      course: body.course || "College",
      state: body.state || "Any",
      gender: body.gender || "Any",
      income: Number(body.income) || 999999999,
    });
    return NextResponse.json({ message: "Scholarship added successfully!", scholarship }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const body = await req.json();
    const { _id, ...updateData } = body;
    await connectDB();
    const scholarship = await Scholarship.findByIdAndUpdate(
      _id,
      {
        ...updateData,
        amount: Number(updateData.amount),
        deadline: new Date(updateData.deadline),
        category: Array.isArray(updateData.category) ? updateData.category : [updateData.category],
        income: Number(updateData.income) || 999999999,
      },
      { new: true }
    );
    return NextResponse.json({ message: "Updated successfully!", scholarship });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const { id } = await req.json();
    await connectDB();
    await Scholarship.findByIdAndDelete(id);
    return NextResponse.json({ message: "Deleted successfully!" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}