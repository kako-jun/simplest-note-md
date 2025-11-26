import JSZip from 'jszip'

export interface ImportedLeafData {
  title: string
  content: string
  updatedAt?: number
}

export interface ImportParseResult {
  source: 'simplenote'
  leaves: ImportedLeafData[]
  skipped: number
  errors: string[]
}

function sanitizeTitle(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.length === 0) return 'Untitled'
  return trimmed
}

function deriveTitleFromContent(content: string, fallback: string): string {
  const lines = content.split(/\r?\n/).map((l) => l.trim())
  const nonEmpty = lines.find((l) => l.length > 0)
  const base = sanitizeTitle(nonEmpty || fallback)
  return base.length > 80 ? `${base.slice(0, 80)}…` : base
}

async function parseSimpleNoteJson(buffer: ArrayBuffer): Promise<ImportParseResult | null> {
  try {
    const text = new TextDecoder().decode(buffer)
    const parsed = JSON.parse(text)
    const notes = Array.isArray(parsed?.activeNotes) ? parsed.activeNotes : []
    if (notes.length === 0) return null

    const leaves: ImportedLeafData[] = []
    const errors: string[] = []

    notes.forEach((n: any, idx: number) => {
      if (!n || typeof n.content !== 'string') {
        errors.push(`note_${idx}: missing content`)
        return
      }
      const title = deriveTitleFromContent(n.content, n.id || `Note ${idx + 1}`)
      const updatedAt = n.lastModified ? Date.parse(n.lastModified) : undefined
      leaves.push({
        title,
        content: n.content,
        updatedAt: Number.isFinite(updatedAt) ? updatedAt : undefined,
      })
    })

    return { source: 'simplenote', leaves, skipped: errors.length, errors }
  } catch (e) {
    return null
  }
}

async function parseSimpleNoteZip(buffer: ArrayBuffer): Promise<ImportParseResult | null> {
  const zip = await JSZip.loadAsync(buffer)
  const files = Object.values(zip.files).filter(
    (f) =>
      !f.dir && (f.name.toLowerCase().endsWith('.txt') || f.name.toLowerCase().endsWith('.json'))
  )

  if (files.length === 0) return null

  const leaves: ImportedLeafData[] = []
  const errors: string[] = []

  for (const file of files) {
    try {
      const content = await file.async('string')
      if (file.name.toLowerCase().endsWith('.json')) {
        const sub = await parseSimpleNoteJson(new TextEncoder().encode(content).buffer)
        if (sub) {
          leaves.push(...sub.leaves)
          errors.push(...sub.errors)
        }
        continue
      }
      const namePart = file.name.split('/').pop() || 'Untitled'
      const title = sanitizeTitle(namePart.replace(/\.txt$/i, ''))
      leaves.push({ title, content })
    } catch (e: any) {
      errors.push(`${file.name}: ${e?.message || 'parse error'}`)
    }
  }

  return {
    source: 'simplenote',
    leaves,
    skipped: errors.length,
    errors,
  }
}

async function parseSimpleNoteTxt(
  buffer: ArrayBuffer,
  fileName: string
): Promise<ImportParseResult> {
  const decoder = new TextDecoder()
  const content = decoder.decode(buffer)
  const title = sanitizeTitle(fileName.replace(/\.txt$/i, ''))
  return {
    source: 'simplenote',
    leaves: [{ title, content }],
    skipped: 0,
    errors: [],
  }
}

/**
 * SimpleNote のエクスポート（json/zip/txt）を自動判定してパースする
 */
export async function parseSimpleNoteFile(file: File): Promise<ImportParseResult | null> {
  const lower = file.name.toLowerCase()
  const buffer = await file.arrayBuffer()

  if (lower.endsWith('.json')) {
    return parseSimpleNoteJson(buffer)
  }

  if (lower.endsWith('.txt')) {
    return parseSimpleNoteTxt(buffer, file.name)
  }

  if (lower.endsWith('.zip')) {
    return parseSimpleNoteZip(buffer)
  }

  return null
}
