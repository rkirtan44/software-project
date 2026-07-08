"use client"

import { useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { useScholarshipStore } from "@/lib/use-scholarship-store"
import { Footer } from "@/components/footer"
import { StatusBadge } from "@/components/status-badge"
import Link from "next/link"
import { User } from "lucide-react"
import {
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  FileText,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react"
import type { Scholarship } from "@/lib/translations"

type FormData = Omit<Scholarship, "id">

const emptyForm: FormData = {
  title: "",
  description: "",
  category: "General",
  provider: "",
  eligibility: "",
  amount: "",
  deadline: "",
}

const categories = ["General", "Engineering", "Medical", "Arts", "Science", "Commerce"]

export function AdminDashboard() {
  const { t, isLoaded } = useLanguage()
  const {
    scholarships,
    applications,
    isLoaded: dataLoaded,
    addScholarship,
    updateScholarship,
    deleteScholarship,
    updateApplicationStatus,
  } = useScholarshipStore()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [activeTab, setActiveTab] = useState<"scholarships" | "applications">("scholarships")

  if (!isLoaded || !dataLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingId) {
      updateScholarship(editingId, form)
    } else {
      addScholarship(form)
    }
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  function handleEdit(scholarship: Scholarship) {
    setForm({
      title: scholarship.title,
      description: scholarship.description,
      category: scholarship.category,
      provider: scholarship.provider,
      eligibility: scholarship.eligibility,
      amount: scholarship.amount,
      deadline: scholarship.deadline,
    })
    setEditingId(scholarship.id)
    setShowForm(true)
  }

  function handleDelete(id: string) {
    if (window.confirm(t("confirmDelete"))) {
      deleteScholarship(id)
    }
  }

  function handleCancel() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
  <div>
    <h1 className="text-2xl font-bold text-foreground md:text-3xl">
      Admin Dashboard
    </h1>
    <p className="mt-1 text-sm text-muted-foreground">
      Manage scholarships and review student applications
    </p>
  </div>

  <Link
    href="/admin/profile"
    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
  >
    <User className="h-4 w-4" />
    Admin Profile
  </Link>
</div>
          {/* Professional Student Profile Button */}
                      {/* Professional Student Profile Button */}

                    

          {/* Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{scholarships.length}</p>
                <p className="text-xs text-muted-foreground">{t("totalScholarships")}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <FileText className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{applications.length}</p>
                <p className="text-xs text-muted-foreground">{t("totalApplications")}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {applications.filter((a) => a.status === "approved").length}
                </p>
                <p className="text-xs text-muted-foreground">{t("approved")}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-lg border border-border bg-secondary/50 p-1">
            <button
              onClick={() => setActiveTab("scholarships")}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "scholarships"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("manageScholarships")}
            </button>
            <button
              onClick={() => setActiveTab("applications")}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "applications"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("studentApplications")} ({applications.length})
            </button>
          </div>

          {/* Scholarships Tab */}
          {activeTab === "scholarships" && (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-lg font-bold text-foreground">{t("manageScholarships")}</h2>
                <button
                  onClick={() => {
                    setForm(emptyForm)
                    setEditingId(null)
                    setShowForm(true)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  {t("addScholarship")}
                </button>
              </div>

              {/* Form Modal */}
              {showForm && (
                <div className="border-b border-border bg-secondary/20 px-5 py-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-bold text-foreground">
                      {editingId ? t("editScholarship") : t("addScholarship")}
                    </h3>
                    <button
                      onClick={handleCancel}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">
                          {t("scholarshipTitle")}
                        </label>
                        <input
                          type="text"
                          required
                          value={form.title}
                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                          className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">
                          {t("scholarshipProvider")}
                        </label>
                        <input
                          type="text"
                          required
                          value={form.provider}
                          onChange={(e) => setForm({ ...form, provider: e.target.value })}
                          className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">
                          {t("scholarshipCategory")}
                        </label>
                        <select
                          value={form.category}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}
                          className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">
                          {t("scholarshipAmountLabel")}
                        </label>
                        <input
                          type="text"
                          required
                          value={form.amount}
                          onChange={(e) => setForm({ ...form, amount: e.target.value })}
                          className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">
                          {t("scholarshipDeadline")}
                        </label>
                        <input
                          type="date"
                          required
                          value={form.deadline}
                          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                          className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">
                          {t("scholarshipEligibility")}
                        </label>
                        <input
                          type="text"
                          required
                          value={form.eligibility}
                          onChange={(e) => setForm({ ...form, eligibility: e.target.value })}
                          className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">
                        {t("scholarshipDescription")}
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        {t("save")}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Scholarships Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("scholarshipTitle")}
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("scholarshipCategory")}
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("scholarshipAmountLabel")}
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("scholarshipDeadline")}
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {scholarships.map((s) => (
                      <tr key={s.id} className="transition-colors hover:bg-secondary/30">
                        <td className="px-5 py-4 text-sm font-medium text-foreground">{s.title}</td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">{s.category}</td>
                        <td className="px-5 py-4 text-sm font-medium text-foreground">{s.amount}</td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">{s.deadline}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(s)}
                              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              {t("edit")}
                            </button>
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {t("delete")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Applications Tab */}
          {activeTab === "applications" && (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-lg font-bold text-foreground">{t("studentApplications")}</h2>
              </div>

              {applications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground">{t("noStudentApplications")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-secondary/50">
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {t("studentName")}
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {t("scholarshipName")}
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {t("appliedDate")}
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {t("status")}
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {t("actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {applications.map((app) => (
                        <tr key={app.id} className="transition-colors hover:bg-secondary/30">
                          <td className="px-5 py-4 text-sm font-medium text-foreground">
                            {app.studentName}
                          </td>
                          <td className="px-5 py-4 text-sm text-foreground">
                            {app.scholarshipTitle}
                          </td>
                          <td className="px-5 py-4 text-sm text-muted-foreground">
                            {app.appliedDate}
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={app.status} />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateApplicationStatus(app.id, "approved")}
                                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success/10"
                                disabled={app.status === "approved"}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                {t("approve")}
                              </button>
                              <button
                                onClick={() => updateApplicationStatus(app.id, "rejected")}
                                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                                disabled={app.status === "rejected"}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                {t("reject")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
