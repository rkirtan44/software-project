"use client"

import { useEffect, useMemo, useState } from "react"
import { useLanguage } from "@/lib/language-context"
import {
  deleteVaultDocument,
  listVaultDocuments,
  putVaultDocument,
  type DocumentCategory,
  type VaultDocument,
} from "@/lib/document-vault"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const CATEGORIES: DocumentCategory[] = [
  "Aadhaar",
  "PAN",
  "Photo",
  "Signature",
  "Income Certificate",
  "Caste Certificate",
  "Domicile Certificate",
  "Marksheet",
  "Bonafide Certificate",
  "Bank Passbook",
  "Admission Letter",
  "Fee Receipt",
  "Disability Certificate",
  "Other",
]

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return "-"
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  const gb = mb / 1024
  return `${gb.toFixed(1)} GB`
}

export default function StudentDocumentsPage() {
  const { t } = useLanguage()

  const [docs, setDocs] = useState<VaultDocument[]>([])
  const [loading, setLoading] = useState(true)

  // upload form
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState("")
  const [category, setCategory] = useState<DocumentCategory>("Other")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  // list filters
  const [q, setQ] = useState("")
  const [catFilter, setCatFilter] = useState<DocumentCategory | "All">("All")

  async function refresh() {
    setLoading(true)
    try {
      const list = await listVaultDocuments()
      setDocs(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return docs.filter((d) => {
      const catOk = catFilter === "All" || d.category === catFilter
      if (!catOk) return false
      if (!query) return true
      const hay = `${d.name} ${d.category} ${d.originalFileName ?? ""} ${d.notes ?? ""}`.toLowerCase()
      return hay.includes(query)
    })
  }, [docs, q, catFilter])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setSaving(true)
    try {
      await putVaultDocument({ file, name, category, notes })
      setFile(null)
      setName("")
      setCategory("Other")
      setNotes("")
      ;(document.getElementById("vault-file") as HTMLInputElement | null)?.value && null
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await deleteVaultDocument(id)
    await refresh()
  }

  async function handleDownload(id: string) {
    const mod = await import("@/lib/document-vault")
    const row = await mod.getVaultDocument(id)
    if (!row) return
    const blob = new Blob([row.data], { type: row.mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = row.originalFileName || row.name
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("documentsVaultTitle") || "Document Vault"}</h1>
          <p className="text-sm text-muted-foreground">
            {t("documentsVaultSubtitle") ||
              "Upload and store scholarship documents safely on this device (offline)."}
          </p>
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>{t("uploadDocument") || "Upload Document"}</CardTitle>
            <CardDescription>
              {t("uploadDocumentHint") || "You can upload any document used in scholarships."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vault-file">{t("chooseFile") || "Choose file"}</Label>
                <Input
                  id="vault-file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="vault-name">{t("documentName") || "Document name"}</Label>
                  <Input
                    id="vault-name"
                    placeholder={t("documentNamePlaceholder") || "e.g. Income Certificate 2025"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="vault-category">{t("documentType") || "Document type"}</Label>
                  <select
                    id="vault-category"
                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="vault-notes">{t("notes") || "Notes"}</Label>
                <Textarea
                  id="vault-notes"
                  placeholder={t("notesPlaceholder") || "Optional…"}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={!file || saving}>
                  {saving ? (t("saving") || "Saving…") : (t("saveDocument") || "Save document")}
                </Button>
                <Button type="button" variant="secondary" onClick={refresh} disabled={saving}>
                  {t("refresh") || "Refresh"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>{t("myDocuments") || "My Documents"}</CardTitle>
            <CardDescription>
              {t("myDocumentsHint") || "Search, download, or delete your stored documents."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
              <div className="flex gap-3 flex-1">
                <Input
                  placeholder={t("searchDocuments") || "Search documents…"}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <select
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  value={catFilter}
                  onChange={(e) => setCatFilter(e.target.value as any)}
                >
                  <option value="All">{t("allTypes") || "All Types"}</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-muted-foreground">
                {loading ? (t("loading") || "Loading…") : `${filtered.length} ${t("files") || "files"}`}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">{t("documentName") || "Document name"}</th>
                    <th className="text-left px-4 py-3 font-semibold">{t("documentType") || "Type"}</th>
                    <th className="text-left px-4 py-3 font-semibold">{t("size") || "Size"}</th>
                    <th className="text-left px-4 py-3 font-semibold">{t("uploaded") || "Uploaded"}</th>
                    <th className="text-left px-4 py-3 font-semibold">{t("actions") || "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr key={d.id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="font-medium">{d.name}</div>
                        {d.notes && <div className="text-xs text-muted-foreground line-clamp-1">{d.notes}</div>}
                      </td>
                      <td className="px-4 py-3">{d.category}</td>
                      <td className="px-4 py-3">{formatBytes(d.size)}</td>
                      <td className="px-4 py-3">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" type="button" onClick={() => handleDownload(d.id)}>
                            {t("download") || "Download"}
                          </Button>
                          <Button size="sm" variant="destructive" type="button" onClick={() => handleDelete(d.id)}>
                            {t("delete") || "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                        {t("noDocuments") || "No documents saved yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

