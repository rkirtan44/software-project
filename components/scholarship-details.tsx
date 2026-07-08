"use client"

import { useState } from "react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useScholarshipStore } from "@/lib/use-scholarship-store"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  ArrowLeft,
  Calendar,
  IndianRupee,
  Award,
  Building2,
  Tag,
  CheckCircle,
} from "lucide-react"

// ✅ FIX: Scholarship ke saare language fields ke liye helper
function getLocalized(
  scholarship: any,
  field: string,
  lang: string
): string {
  if (lang === "hi") {
    const hiVal = scholarship[`${field}Hi`]
    if (hiVal) return hiVal
  }
  if (lang === "gu") {
    const guVal = scholarship[`${field}Gu`]
    if (guVal) return guVal
  }
  return scholarship[field] || ""
}

export function ScholarshipDetails({ id }: { id: string }) {
  const { t, lang, isLoaded } = useLanguage()  // ✅ lang lo
  const { getScholarship, hasApplied, applyForScholarship, isLoaded: dataLoaded } = useScholarshipStore()
  const [justApplied, setJustApplied] = useState(false)

  if (!isLoaded || !dataLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const scholarship = getScholarship(id)
  const alreadyApplied = hasApplied(id)

  if (!scholarship) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center">
          <p className="mb-4 text-lg text-muted-foreground">Scholarship not found</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToHome")}
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  // ✅ FIX: Har field ke liye localized value nikalo
  const localizedTitle       = getLocalized(scholarship, "title",       lang)
  const localizedDescription = getLocalized(scholarship, "description", lang)
  const localizedEligibility = getLocalized(scholarship, "eligibility", lang)

  function handleApply() {
    if (!scholarship) return
    const success = applyForScholarship(scholarship.id, scholarship.title)
    if (success) setJustApplied(true)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
          {/* Back Link */}
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToHome")}
          </Link>

          {/* Success Message */}
          {justApplied && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-5 py-4">
              <CheckCircle className="h-5 w-5 text-success" />
              <p className="text-sm font-medium text-success">
                {t("applicationSubmitted")}
              </p>
            </div>
          )}

          {/* Main Card */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {/* Header */}
            <div className="border-b border-border bg-secondary/30 px-6 py-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {scholarship.category}
                </span>
                <span className="text-xs text-muted-foreground">
                  {scholarship.provider}
                </span>
              </div>
              {/* ✅ FIX: Localized title */}
              <h1 className="text-balance text-2xl font-bold text-foreground md:text-3xl">
                {localizedTitle}
              </h1>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              {/* Info Grid */}
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-4">
                  <IndianRupee className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("scholarshipAmount")}</p>
                    <p className="text-lg font-bold text-foreground">{scholarship.amount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-4">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("applicationDeadline")}</p>
                    <p className="text-lg font-bold text-foreground">{scholarship.deadline}</p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="mb-6 flex flex-col gap-4">
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    {t("description")}
                  </h3>
                  {/* ✅ FIX: Localized description */}
                  <p className="leading-relaxed text-muted-foreground">{localizedDescription}</p>
                </div>
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {t("provider")}
                  </h3>
                  <p className="text-muted-foreground">{scholarship.provider}</p>
                </div>
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    {t("eligibilityCriteria")}
                  </h3>
                  {/* ✅ FIX: Localized eligibility */}
                  <p className="text-muted-foreground">{localizedEligibility}</p>
                </div>
              </div>

              {/* Apply Button */}
              <div className="border-t border-border pt-6">
                {alreadyApplied || justApplied ? (
                  <button
                    disabled
                    className="inline-flex items-center gap-2 rounded-lg bg-muted px-6 py-3 text-sm font-semibold text-muted-foreground"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {t("alreadyApplied")}
                  </button>
                ) : (
                  <button
                    onClick={handleApply}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {t("applyForScholarship")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
