"use client"

import { useLanguage } from "@/lib/language-context"

type Status = "applied" | "pending" | "approved" | "rejected"

const statusStyles: Record<Status, string> = {
  applied: "bg-primary/10 text-primary",
  pending: "bg-warning/20 text-warning-foreground",
  approved: "bg-success/20 text-success",
  rejected: "bg-destructive/10 text-destructive",
}

const statusKeys: Record<Status, string> = {
  applied: "statusApplied",
  pending: "statusPending",
  approved: "statusApproved",
  rejected: "statusRejected",
}

export function StatusBadge({ status }: { status: Status }) {
  const { t } = useLanguage()

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[status]}`}
    >
      {t(statusKeys[status])}
    </span>
  )
}
