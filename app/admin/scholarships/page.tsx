export const dynamic = "force-dynamic";
import Scholarship from "@/models/Scholarship";
import ScholarshipList from "@/components/admin/ScholarshipList";
import connectDB from "@/lib/mongodb";
import Link from "next/link";

export default async function AdminScholarshipsPage() {
  await connectDB();
  const raw = await Scholarship.find({}).sort({ createdAt: -1 }).lean();
  const scholarships = raw.map((s: any) => ({
    _id: s._id.toString(),
    title: s.title,
    amount: s.amount,
    deadline: s.deadline,
    category: s.category,
    level: s.level,
    isActive: s.isActive,
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Manage Scholarships</h1>
          <p className="text-gray-500 text-sm mt-1">Total: {scholarships.length} scholarships</p>
        </div>
        <Link href="/admin/scholarships/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
          + New Scholarship
        </Link>
      </div>
      <ScholarshipList scholarships={scholarships} />
    </div>
  );
}