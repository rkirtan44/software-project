"use client"

import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useScholarshipStore } from "@/lib/use-scholarship-store"

import { Footer } from "@/components/footer"
import { ScholarshipCard } from "@/components/scholarship-card"
import { GraduationCap, BookOpen, Users, Trophy } from "lucide-react"

export function Homepage() {
  const { t, isLoaded } = useLanguage()
  const { scholarships, isLoaded: dataLoaded } = useScholarshipStore()

  if (!isLoaded || !dataLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-primary)/0.05,transparent_50%)]" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-16 text-center lg:px-8 lg:py-24">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>

          <h1 className="mb-4 max-w-3xl text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            {t("heroTitle")}
          </h1>

          <p className="mb-8 max-w-2xl text-base text-muted-foreground md:text-lg">
            {t("heroSubtitle")}
          </p>

          <a
            href="#scholarships"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            {t("browseScholarships")}
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card/50">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-border px-4 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-8">

          <div className="flex items-center gap-4 px-6 py-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {scholarships.length}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("availableScholarships")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 px-6 py-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Users className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">1,200+</p>
              <p className="text-sm text-muted-foreground">
                {t("studentsApplied")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 px-6 py-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">
              <Trophy className="h-5 w-5 text-warning-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">95%</p>
              <p className="text-sm text-muted-foreground">
                {t("successRate")}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Scholarships */}
      <section id="scholarships" className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              {t("allScholarships")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("availableScholarships")} ({scholarships.length})
            </p>
          </div>

          {scholarships.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
              <BookOpen className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                {t("noScholarships")}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {scholarships.map((scholarship) => (
                <ScholarshipCard
                  key={scholarship.id}
                  scholarship={scholarship}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}