import Scholarship from "@/models/Scholarship";
import ScholarshipForm from "@/components/admin/ScholarshipForm";
import connectDB from "@/lib/mongodb";
import { notFound } from "next/navigation";

export default async function EditScholarshipPage({ params }: { params: { id: string } }) {
  await connectDB();
  const s = await Scholarship.findById(params.id).lean() as any;
  if (!s) notFound();

  const data = {
    _id: s._id.toString(),
    title: s.title,
    description: s.description,
    amount: s.amount.toString(),
    eligibility: s.eligibility,
    category: Array.isArray(s.category) ? s.category.join(", ") : s.category,
    deadline: s.deadline ? new Date(s.deadline).toISOString().split("T")[0] : "",
    applyLink: s.applyLink || "",
    youtubeLink: s.youtubeLink || "",
    isActive: s.isActive,
    level: s.level,
    course: s.course,
    state: s.state,
    gender: s.gender,
    income: s.income?.toString() || "",
    documents: s.documents || "",
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Scholarship</h1>
      <ScholarshipForm initialData={data} isEdit />
    </div>
  );
}