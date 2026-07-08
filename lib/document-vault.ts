export type DocumentCategory =
  | "Aadhaar"
  | "PAN"
  | "Photo"
  | "Signature"
  | "Income Certificate"
  | "Caste Certificate"
  | "Domicile Certificate"
  | "Marksheet"
  | "Bonafide Certificate"
  | "Bank Passbook"
  | "Admission Letter"
  | "Fee Receipt"
  | "Disability Certificate"
  | "Other"

export type VaultDocument = {
  id: string
  name: string
  category: DocumentCategory
  mime: string
  size: number
  createdAt: number
  notes?: string
  originalFileName?: string
}

type VaultDocumentRow = VaultDocument & { data: ArrayBuffer }

const DB_NAME = "scholarhub_vault"
const DB_VERSION = 1
const STORE = "documents"

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" })
        store.createIndex("createdAt", "createdAt", { unique: false })
        store.createIndex("category", "category", { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode)
        const store = transaction.objectStore(STORE)
        const req = run(store)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
        transaction.oncomplete = () => db.close()
        transaction.onerror = () => db.close()
        transaction.onabort = () => db.close()
      }),
  )
}

export async function listVaultDocuments(): Promise<VaultDocument[]> {
  const rows = await tx<VaultDocumentRow[]>("readonly", (store) => store.getAll() as any)
  return rows
    .map(({ data: _data, ...meta }) => meta)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export async function getVaultDocument(id: string): Promise<VaultDocumentRow | null> {
  const row = await tx<VaultDocumentRow | undefined>("readonly", (store) => store.get(id) as any)
  return row ?? null
}

export async function deleteVaultDocument(id: string): Promise<void> {
  await tx("readwrite", (store) => store.delete(id))
}

export async function putVaultDocument(input: {
  file: File
  name?: string
  category: DocumentCategory
  notes?: string
}): Promise<VaultDocument> {
  const buf = await input.file.arrayBuffer()
  const id = crypto.randomUUID()

  const doc: VaultDocumentRow = {
    id,
    name: (input.name?.trim() || input.file.name).slice(0, 120),
    category: input.category,
    mime: input.file.type || "application/octet-stream",
    size: input.file.size,
    createdAt: Date.now(),
    notes: input.notes?.trim() ? input.notes.trim().slice(0, 500) : undefined,
    originalFileName: input.file.name,
    data: buf,
  }

  await tx("readwrite", (store) => store.put(doc) as any)
  const { data: _data, ...meta } = doc
  return meta
}

