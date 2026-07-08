"use client"

import { useLanguage } from "@/lib/language-context"
import { GraduationCap } from "lucide-react"

export function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-6 text-center lg:px-8">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">{t("footerText")}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {"2026 "}{t("siteName")}{". "}{t("allRightsReserved")}
        </p>
      </div>
    </footer>
  )
}
