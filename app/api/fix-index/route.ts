import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectDB();
    const db = mongoose.connection.db!;
    
    // Delete all indexes from scholarships collection
    const indexes = await db.collection("scholarships").indexes();
    console.log("Current indexes:", indexes);
    
    try {
      await db.collection("scholarships").dropIndex("scholarshipId_1");
      console.log("scholarshipId_1 index dropped!");
    } catch {
      console.log("scholarshipId_1 index not found");
    }

    // Drop collection and start fresh
    await db.collection("scholarships").drop();
    console.log("Collection dropped!");
    
    return NextResponse.json({ 
      message: "✅ Collection reset! Now run the seed." 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ 
      message: "Reset attempt done", 
      error: String(error) 
    });
  }
}
