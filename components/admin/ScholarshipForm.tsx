"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FormData {
  title: string;
  description: string;
  amount: string;
  eligibility: string;
  category: string;
  deadline: string;
  applyLink: string;
  youtubeLink: string;
  isActive: boolean;
  level: string;
  course: string;
  state: string;
  gender: string;
  income: string;
  documents: string;
}

interface Props {
  initialData?: Partial<FormData & { _id: string }>;
  isEdit?: boolean;
}

const CATEGORIES = ["SC/ST","OBC","Minority","General","EWS","Girls","Sports","Disability","Merit Based","Need Based"];
const LEVELS = ["Central","State","Private","NGO"];
const COURSES = ["College","School","Both"];
const GENDERS = ["Any","Male","Female"];

export default function ScholarshipForm({ initialData, isEdit = false }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    amount: initialData?.amount || "",
    eligibility: initialData?.eligibility || "",
    category: initialData?.category || "",
    deadline: initialData?.deadline || "",
    applyLink: initialData?.applyLink || "",
    youtubeLink: initialData?.youtubeLink || "",
    isActive: initialData?.isActive ?? true,
    level: initialData?.level || "Central",
    course: initialData?.course || "College",
    state: initialData?.state || "Any",
    gender: initialData?.gender || "Any",
    income: initialData?.income || "",
    documents: initialData?.documents || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      amount: Number(form.amount),
      income: Number(form.income),
      category: form.category.split(",").map(c => c.trim()),
      deadline: new Date(form.deadline).toISOString(),
    };

    const url = isEdit ? `/api/scholarships/${initialData?._id}` : "/api/scholarships";
    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (res.ok) { router.push("/admin/scholarships"); router.refresh(); }
    else alert("Something went wrong. Try again.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Scholarship Title *</label>
          <input name="title" value={form.title} onChange={handleChange} required
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Amount (₹) *</label>
          <input name="amount" type="number" value={form.amount} onChange={handleChange} required
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Deadline *</label>
          <input name="deadline" type="date" value={form.deadline} onChange={handleChange} required
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category * <span className="text-gray-400 text-xs">(separate with comma)</span></label>
          <input name="category" value={form.category} onChange={handleChange}
            placeholder="SC/ST, OBC, Girls" required
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Max Income (₹/year)</label>
          <input name="income" type="number" value={form.income} onChange={handleChange}
            placeholder="e.g. 250000"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Level</label>
          <select name="level" value={form.level} onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {LEVELS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Course</label>
          <select name="course" value={form.course} onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {COURSES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">State</label>
          <input name="state" value={form.state} onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Gender</label>
          <select name="gender" value={form.gender} onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {GENDERS.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Apply Link</label>
          <input name="applyLink" value={form.applyLink} onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">YouTube Link</label>
          <input name="youtubeLink" value={form.youtubeLink} onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Eligibility *</label>
          <textarea name="eligibility" value={form.eligibility} onChange={handleChange}
            required rows={3}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Description *</label>
          <textarea name="description" value={form.description} onChange={handleChange}
            required rows={4}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Documents Required</label>
          <textarea name="documents" value={form.documents} onChange={handleChange}
            rows={2} placeholder="e.g. Aadhar Card, Income Certificate"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" name="isActive" id="isActive"
            checked={form.isActive} onChange={handleChange} className="w-4 h-4" />
          <label htmlFor="isActive" className="text-sm font-medium">Active (visible to users)</label>
        </div>

      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Saving..." : isEdit ? "Update" : "Add"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="border px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  );
}