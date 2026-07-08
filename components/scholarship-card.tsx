"use client"

import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { Calendar, IndianRupee, Award } from "lucide-react"
import type { Scholarship } from "@/lib/translations"

const categoryColors: Record<string, string> = {
  General: "bg-primary/10 text-primary",
  Engineering: "bg-chart-1/15 text-chart-1",
  Medical: "bg-destructive/10 text-destructive",
  Arts: "bg-chart-4/15 text-chart-4",
  Science: "bg-accent/15 text-accent",
  Commerce: "bg-chart-3/15 text-chart-3",
}

// ✅ FIX: Return the correct title based on language
function getLocalizedTitle(scholarship: Scholarship, lang: string): string {
  if (lang === "hi" && (scholarship as any).titleHi) return (scholarship as any).titleHi
  if (lang === "gu" && (scholarship as any).titleGu) return (scholarship as any).titleGu
  return scholarship.title
}

export function ScholarshipCard({ scholarship }: { scholarship: Scholarship }) {
  const { t, lang } = useLanguage()  // ✅ include lang too

  const colorClass = categoryColors[scholarship.category] || categoryColors.General

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg">
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}>
            {scholarship.category}
          </span>
          <span className="text-xs text-muted-foreground">{scholarship.provider}</span>
        </div>

        {/* ✅ pass lang to show localized title */}
        <h3 className="mb-2 text-balance text-lg font-bold text-foreground group-hover:text-primary transition-colors">
          {getLocalizedTitle(scholarship, lang)}
        </h3>

        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {scholarship.description}
        </p>

        <div className="mt-auto flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <IndianRupee className="h-4 w-4 text-accent" />
            <span className="font-semibold">{scholarship.amount}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{t("deadline")}: {scholarship.deadline}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Award className="h-4 w-4" />
            <span className="line-clamp-1">{scholarship.eligibility}</span>
          </div>
        </div>
      </div>

      <div className="flex border-t border-border">
        <Link
          href={`/scholarship/${scholarship.id}`}
          className="flex flex-1 items-center justify-center py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
        >
          {t("viewDetails")}
        </Link>
      </div>
    </div>
  )
}
