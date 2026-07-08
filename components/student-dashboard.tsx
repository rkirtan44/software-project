"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";

export default function StudentDashboard() {
  const lang = useLanguage();
const t = lang?.t || ((x) => x);
  const [income, setIncome] = useState(0);
  const [category, setCategory] = useState("");
  const [course, setCourse] = useState("");
  const [state, setState] = useState("");
  const [level, setLevel] = useState<"" | "Central" | "State" | "Trust">("");

  const [scholarships, setScholarships] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);

  // Dashboard course filter expects only: School | College.
  // If scholarship has other course values (Engineering/Medical/etc),
  // treat them as College so filters work for all scholarships.
  function normalizeCourse(value: string): "School" | "College" | "Any" {
    if (!value) return "Any";
    if (value === "School") return "School";
    if (value === "College") return "College";
    if (value === "Any") return "Any";
    return "College";
  }

  function normalizeLevel(value: string): "Central" | "State" | "Trust" {
    if (value === "Central" || value === "State" || value === "Trust") return value;
    return "Trust";
  }

  useEffect(() => {
    const data = [
      { name: "National Merit Scholarship", category: "OBC", level: "Central", course: "College", state: "Any" },
      { name: "SC/ST Scholarship", category: "SC", level: "State", course: "Any", state: "Any" },
      { name: "General Talent Scholarship", category: "General", level: "Trust", course: "Any", state: "Any" },
      { name: "National Scholarship Portal (NSP)", category: "Any", level: "Central", course: "Any", state: "Any" },
      { name: "Post Matric Scholarship for SC Students", category: "SC", level: "Central", course: "College", state: "Any" },
      { name: "Pre Matric Scholarship for ST Students", category: "ST", level: "Central", course: "School", state: "Any" },
      { name: "Post Matric Scholarship for ST Students", category: "ST", level: "Central", course: "College", state: "Any" },
      { name: "Post Matric Scholarship for OBC Students", category: "OBC", level: "Central", course: "College", state: "Any" },
      { name: "Merit-cum-Means Scholarship for Minority Students", category: "Minority", level: "Central", course: "College", state: "Any" },
      { name: "AICTE Pragati Scholarship for Girls", category: "Any", level: "Central", course: "College", state: "Any" },
      { name: "AICTE Saksham Scholarship", category: "Any", level: "Central", course: "College", state: "Any" },
      { name: "Mukhyamantri Scholarship Scheme Gujarat", category: "Any", level: "State", course: "College", state: "Gujarat" },
      { name: "Digital Gujarat Scholarship", category: "Any", level: "State", course: "College", state: "Gujarat" },
      { name: "INSPIRE Scholarship", category: "Any", level: "Central", course: "College", state: "Any" },
      { name: "Prime Minister Scholarship", category: "Any", level: "Central", course: "College", state: "Any" },
      { name: "Central Sector Scheme of Scholarship", category: "General", level: "Central", course: "College", state: "Any" },
      { name: "EWS Scholarship Scheme", category: "General", level: "Central", course: "College", state: "Any" },
      { name: "State Merit Scholarship", category: "Any", level: "State", course: "Any", state: "Any" },
      { name: "Girl Child Scholarship Scheme", category: "Any", level: "State", course: "Any", state: "Any" },
      { name: "Minority Scholarship Scheme", category: "Minority", level: "Central", course: "College", state: "Any" },
      { name: "Technical Education Scholarship", category: "Any", level: "Trust", course: "College", state: "Any" },
      { name: "Agriculture Scholarship Scheme", category: "Any", level: "Trust", course: "College", state: "Any" },
      { name: "Medical Scholarship Scheme", category: "Any", level: "Trust", course: "College", state: "Any" },
      { name: "Law Scholarship Scheme", category: "Any", level: "Trust", course: "College", state: "Any" },
      { name: "Sports Scholarship Scheme", category: "Any", level: "Trust", course: "College", state: "Any" },
      { name: "Defence Scholarship Scheme", category: "Any", level: "Central", course: "College", state: "Any" },
      { name: "Research Fellowship Scholarship", category: "Any", level: "Central", course: "College", state: "Any" },
      { name: "PhD Scholarship Scheme", category: "Any", level: "Central", course: "College", state: "Any" },
      { name: "International Study Scholarship", category: "Any", level: "Central", course: "College", state: "Abroad" },
      { name: "Rural Development Scholarship", category: "Any", level: "State", course: "Any", state: "Any" }
    ];

    setScholarships(data);
  }, []);

  // 🔥 Recommendation count
  useEffect(() => {
    const hasAnyPreference = Boolean(category || course || state);

    const result = !hasAnyPreference
      ? []
      : scholarships.filter(
          (s) =>
            (!category || s.category === category || s.category === "Any") &&
            (!level || normalizeLevel(s.level) === level) &&
            (!course ||
              normalizeCourse(s.course) === course ||
              normalizeCourse(s.course) === "Any") &&
            (!state || s.state.toLowerCase().includes(state.toLowerCase()) || s.state === "Any")
        );

    setRecommended(result);
  }, [category, course, level, state, scholarships]);

  const recommendedNames = useMemo(() => new Set(recommended.map((s) => s.name)), [recommended]);

  const filtered = scholarships.filter(
    (s) =>
      (!category || s.category === category || s.category === "Any") &&
      (!level || normalizeLevel(s.level) === level) &&
      (!course || normalizeCourse(s.course) === course || normalizeCourse(s.course) === "Any") &&
      (!state || s.state.toLowerCase().includes(state.toLowerCase()) || s.state === "Any")
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t("studentDashboardTitle") || "Student Dashboard"}</h1>
            <p className="text-sm text-gray-500">
              {t("studentDashboardSubtitle") || "View scholarships and recommendations"}
            </p>
          </div>
          <Link
            href="/student/documents"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            {t("documentsVaultTitle") || "Document Vault"}
          </Link>
        </div>

        {/* 🔝 TOP CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t("studentIncome") || "Student Income"}
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900">₹ {income}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t("totalScholarships") || "Total Scholarships"}
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{scholarships.length}</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              {t("recommendedScholarships") || "Recommended Scholarships"}
            </p>
            <p className="mt-1 text-3xl font-bold text-emerald-900">{recommended.length}</p>
          </div>
        </div>

        {/* 🔍 FILTER */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">
                {t("casteCategory") || "Caste Category"}
              </label>
              <select
                onChange={(e) => setCategory(e.target.value)}
                value={category}
                className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm"
              >
                <option value="">{t("allCategories") || "All Categories"}</option>
                <option>SC</option>
                <option>ST</option>
                <option>OBC</option>
                <option>General</option>
                <option>Minority</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">
                {t("scholarshipType") || "Scholarship Type"}
              </label>
              <select
                onChange={(e) => setLevel(e.target.value as any)}
                value={level}
                className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm"
              >
                <option value="">{t("allTypes") || "All Types"}</option>
                <option value="Central">{t("typeCentral") || "Central"}</option>
                <option value="State">{t("typeState") || "State"}</option>
                <option value="Trust">{t("typeTrust") || "Trust"}</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">{t("course") || "Course"}</label>
              <select
                onChange={(e) => setCourse(e.target.value)}
                value={course}
                className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm"
              >
                <option value="">{t("allCourses") || "All Courses"}</option>
                <option value="School">{t("courseSchool") || "School"}</option>
                <option value="College">{t("courseCollege") || "College"}</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">{t("state") || "State"}</label>
              <input
                placeholder={t("statePlaceholder") || "Type state..."}
                onChange={(e) => setState(e.target.value)}
                value={state}
                className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* 📊 TABLE */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">{t("scholarships") || "Scholarships"}</h2>
            <p className="text-xs text-gray-500">
              {t("showing") || "Showing"}:{" "}
              <span className="font-semibold text-gray-700">{filtered.length}</span>
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">{t("scholarshipName") || "Scholarship Name"}</th>
                  <th className="text-left px-5 py-3 font-semibold">{t("scholarshipType") || "Scholarship Type"}</th>
                  <th className="text-left px-5 py-3 font-semibold">{t("course") || "Course"}</th>
                  <th className="text-left px-5 py-3 font-semibold">{t("state") || "State"}</th>
                  <th className="text-left px-5 py-3 font-semibold">{t("actions") || "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const isRec = recommendedNames.has(s.name);
                  const lv = normalizeLevel(s.level);
                  const levelPill =
                    lv === "Central"
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : lv === "State"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-pink-50 text-pink-700 border-pink-200";

                  return (
                    <tr
                      key={i}
                      className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} ${isRec ? "border-l-4 border-emerald-500" : ""}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{s.name}</span>
                          {isRec && (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
                              ✅ {t("recommended") || "Recommended"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {t("eligibleFor") || "Eligible for"}:{" "}
                          <span className="font-medium">{s.category}</span>
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${levelPill}`}>
                          {lv === "Central"
                            ? (t("typeCentral") || "Central")
                            : lv === "State"
                              ? (t("typeState") || "State")
                              : (t("typeTrust") || "Trust")}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-700">
                          {normalizeCourse(s.course) === "School"
                            ? (t("courseSchool") || "School")
                            : normalizeCourse(s.course) === "College"
                              ? (t("courseCollege") || "College")
                              : (t("any") || "Any")}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-700">{s.state}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button className="rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                            {t("viewDetails") || "Details"}
                          </button>
                          <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95">
                            {t("applyNow") || "Apply"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500">
                      {t("noScholarships") || "No scholarships found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}