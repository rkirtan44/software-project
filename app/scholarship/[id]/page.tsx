"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";

interface Scholarship {
  _id: string;
  title: string;
  titleHi?: string;
  titleGu?: string;
  description: string;
  descriptionHi?: string;
  descriptionGu?: string;
  amount: number;
  eligibility: string;
  eligibilityHi?: string;
  eligibilityGu?: string;
  category: string[];
  deadline: string;
  applyLink?: string;
}

export default function ScholarshipsPage() {
  const { data: session } = useSession();
  const { lang, t } = useLanguage();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/scholarships")
      .then((r) => r.json())
      .then((d) => {
        setScholarships(d.scholarships || []);
        setLoading(false);
      });
  }, []);

  // ✅ Return the correct field based on language
  function getLocalized(s: Scholarship, field: "title" | "description" | "eligibility"): string {
    if (lang === "hi") {
      const hi = s[`${field}Hi` as keyof Scholarship] as string | undefined;
      if (hi) return hi;
    }
    if (lang === "gu") {
      const gu = s[`${field}Gu` as keyof Scholarship] as string | undefined;
      if (gu) return gu;
    }
    return s[field] as string;
  }

  async function handleApply(id: string, applyLink?: string) {
    if (applyLink) {
      window.open(applyLink, "_blank");
      return;
    }
    if (!session) {
      setMsg(t("loginRequired") || "Please login first");
      return;
    }
    setApplying(id);
    const res = await fetch("/api/scholarships", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scholarshipId: id }),
    });
    const data = await res.json();
    setMsg(data.message || data.error);
    setApplying(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-lg font-semibold text-gray-900">
          ← {t("studentDashboard") || "Dashboard"}
        </Link>
        <span className="text-sm font-medium text-gray-700">
          {t("allScholarships") || "All Scholarships"}
        </span>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">
          {t("availableScholarships") || "Available Scholarships"}
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          {t("browseScholarships") || "Browse and apply for scholarships"}
        </p>

        {msg && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-4 py-3 text-sm mb-4">
            {msg}
          </div>
        )}

        {loading ? (
          <p className="text-gray-400 text-center py-12">
            {t("loading") || "Loading scholarships..."}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scholarships.map((s) => (
              <div key={s._id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  {/* ✅ Title updates immediately when the language changes */}
                  <h3 className="font-semibold text-gray-900 text-base leading-tight">
                    {getLocalized(s, "title")}
                  </h3>
                  <span className="text-lg font-bold text-green-600 ml-2 shrink-0">
                    ₹{s.amount.toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                  {getLocalized(s, "description")}
                </p>
                <div className="text-xs text-gray-400 space-y-1 mb-4">
                  <p>
                    {t("eligibility") || "Eligibility"}: {getLocalized(s, "eligibility")}
                  </p>
                  <p>
                    {t("category") || "Category"}: {s.category?.join(", ") || "All"}
                  </p>
                  <p className="text-orange-500 font-medium">
                    {t("deadline") || "Deadline"}:{" "}
                    {new Date(s.deadline).toLocaleDateString(
                      lang === "gu" ? "gu-IN" : lang === "hi" ? "hi-IN" : "en-IN"
                    )}
                  </p>
                </div>
                <button
                  onClick={() => handleApply(s._id, s.applyLink)}
                  disabled={applying === s._id}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition disabled:opacity-50"
                >
                  {applying === s._id
                    ? t("loading") || "Applying..."
                    : s.applyLink
                    ? t("applyNow") || "Apply on Official Website ↗"
                    : t("applyNow") || "Apply Now"}
                </button>
              </div>
            ))}
            {scholarships.length === 0 && (
              <p className="text-gray-400 text-center py-12 col-span-2">
                {t("noScholarships") || "No scholarships available at the moment"}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
