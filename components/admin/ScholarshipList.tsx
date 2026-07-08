"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Scholarship {
  _id: string;
  title: string;
  amount: number;
  deadline: string;
  category: string[];
  level: string;
  isActive: boolean;
}

export default function ScholarshipList({ scholarships }: { scholarships: Scholarship[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Do you want to delete "${title}"?`)) return;
    setDeletingId(id);
    await fetch(`/api/scholarships/${id}`, { method: "DELETE" });
    setDeletingId(null);
    router.refresh();
  };

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 text-left">
          <tr>
            {["Title","Amount","Category","Level","Deadline","Status","Actions"]
              .map(h => <th key={h} className="px-4 py-3">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y">
          {scholarships.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">
              No scholarships. Add a new one!
            </td></tr>
          )}
          {scholarships.map(s => (
            <tr key={s._id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium max-w-[200px] truncate">{s.title}</td>
              <td className="px-4 py-3">₹{s.amount.toLocaleString("en-IN")}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {s.category.map(c => (
                    <span key={c} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{c}</span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-gray-600">{s.level}</td>
              <td className="px-4 py-3 text-gray-600">
                {new Date(s.deadline).toLocaleDateString("en-IN")}
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  s.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                }`}>{s.isActive ? "Active" : "Inactive"}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-3">
                  <Link href={`/admin/scholarships/${s._id}/edit`}
                    className="text-blue-600 hover:underline font-medium">Edit</Link>
                  <button onClick={() => handleDelete(s._id, s.title)}
                    disabled={deletingId === s._id}
                    className="text-red-500 hover:underline font-medium disabled:opacity-40">
                    {deletingId === s._id ? "..." : "Delete"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}