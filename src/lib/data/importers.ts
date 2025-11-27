import JSZip from 'jszip'

export interface ImportedLeafData {
  title: string
  content: string
  updatedAt?: number
  sanitized?: string
}

export interface ImportParseResult {
  source: 'simplenote'
  leaves: ImportedLeafData[]
  skipped: number
  errors: string[]
  sanitizedTitles: string[]
}

function sanitizeTitle(raw: string, sanitizedList: string[]): string {
  const trimmed = raw.trim()
  if (trimmed.length === 0) return 'Untitled'
  // Replace path separators and problematic chars to avoid unintended folders
  const cleaned = trimmed.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ')
  const limited = cleaned.slice(0, 80)
  if (cleaned !== trimmed) {
    sanitizedList.push(`${trimmed} -> ${limited || 'Untitled'}`)
  }
  return limited.length === 0 ? 'Untitled' : limited
}

function deriveTitleFromContent(
  content: string,
  fallback: string,
  sanitizedList: string[]
): string {
  const lines = content.split(/\r?\n/).map((l) => l.trim())
  const nonEmpty = lines.find((l) => l.length > 0)
  const base = sanitizeTitle(nonEmpty || fallback, sanitizedList)
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
    const sanitizedTitles: string[] = []

    notes.forEach((n: any, idx: number) => {
      if (!n || typeof n.content !== 'string') {
        errors.push(`note_${idx}: missing content`)
        return
      }
      const title = deriveTitleFromContent(n.content, n.id || `Note ${idx + 1}`, sanitizedTitles)
      const updatedAt = n.lastModified ? Date.parse(n.lastModified) : undefined
      leaves.push({
        title,
        content: n.content,
        updatedAt: Number.isFinite(updatedAt) ? updatedAt : undefined,
        sanitized:
          sanitizedTitles.length && sanitizedTitles[sanitizedTitles.length - 1] !== title
            ? sanitizedTitles[sanitizedTitles.length - 1]
            : undefined,
      })
    })

    return { source: 'simplenote', leaves, skipped: errors.length, errors, sanitizedTitles }
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
  const sanitizedTitles: string[] = []

  for (const file of files) {
    try {
      const content = await file.async('string')
      if (file.name.toLowerCase().endsWith('.json')) {
        const sub = await parseSimpleNoteJson(new TextEncoder().encode(content).buffer)
        if (sub) {
          leaves.push(...sub.leaves)
          errors.push(...sub.errors)
          sanitizedTitles.push(...(sub.sanitizedTitles || []))
        }
        continue
      }
      const namePart = file.name.split('/').pop() || 'Untitled'
      const title = sanitizeTitle(namePart.replace(/\.txt$/i, ''), sanitizedTitles)
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
    sanitizedTitles,
  }
}

async function parseSimpleNoteTxt(
  buffer: ArrayBuffer,
  fileName: string
): Promise<ImportParseResult> {
  const decoder = new TextDecoder()
  const content = decoder.decode(buffer)
  const sanitizedTitles: string[] = []
  const title = sanitizeTitle(fileName.replace(/\.txt$/i, ''), sanitizedTitles)
  return {
    source: 'simplenote',
    leaves: [{ title, content }],
    skipped: 0,
    errors: [],
    sanitizedTitles,
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

export interface ImportResult {
  newNote: {
    id: string
    name: string
    order: number
  }
  reportLeaf: {
    id: string
    title: string
    noteId: string
    content: string
    updatedAt: number
    order: number
  }
  importedLeaves: Array<{
    id: string
    title: string
    noteId: string
    content: string
    updatedAt: number
    order: number
  }>
  errors?: string[]
}

export interface ImportOptions {
  existingNoteNames: string[]
  existingNotesCount: number
  existingLeavesMaxOrder: number
  translate: (key: string, options?: { values?: Record<string, any> }) => string
}

/**
 * SimpleNoteファイルをインポートし、Note/Leafデータを生成する
 */
export async function processImportFile(
  file: File,
  options: ImportOptions
): Promise<{ success: false; error: string } | { success: true; result: ImportResult }> {
  const parsed = await parseSimpleNoteFile(file)
  if (!parsed || parsed.leaves.length === 0) {
    return { success: false, error: 'unsupportedFile' }
  }

  const { existingNoteNames, existingNotesCount, existingLeavesMaxOrder, translate } = options

  // ユニークなノート名を生成
  const baseName = 'SimpleNote'
  const existingSet = new Set(existingNoteNames)
  let noteName = `${baseName}1`
  let suffix = 1
  while (existingSet.has(noteName)) {
    suffix += 1
    noteName = `${baseName}${suffix}`
  }

  const noteId = crypto.randomUUID()
  const noteOrder = existingNotesCount

  const newNote = {
    id: noteId,
    name: noteName,
    order: noteOrder,
  }

  const baseLeafOrder = existingLeavesMaxOrder + 1

  const importedLeaves = parsed.leaves.map((leaf, idx) => ({
    id: crypto.randomUUID(),
    title: leaf.title,
    noteId,
    content: leaf.content,
    updatedAt: leaf.updatedAt ?? Date.now(),
    order: baseLeafOrder + 1 + idx,
  }))

  // レポート生成
  const skipped = parsed.skipped || 0
  const reportTitle = translate('settings.importExport.importReportTitle')
  const perItemLines = importedLeaves.map((leaf) =>
    translate('settings.importExport.importReportPerItemLine', { values: { title: leaf.title } })
  )

  const sanitizedLines =
    parsed.sanitizedTitles && parsed.sanitizedTitles.length > 0
      ? [
          translate('settings.importExport.importReportSanitizedHeader'),
          ...parsed.sanitizedTitles.map((entry) =>
            translate('settings.importExport.importReportSanitizedLine', { values: { entry } })
          ),
        ]
      : []

  const errorLines =
    parsed.errors?.length && parsed.errors.length > 0
      ? [
          translate('settings.importExport.importReportErrorsHeader'),
          ...parsed.errors.map((msg) =>
            translate('settings.importExport.importReportErrorLine', { values: { message: msg } })
          ),
        ]
      : []

  const reportLines = [
    translate('settings.importExport.importReportHeader'),
    translate('settings.importExport.importReportSource'),
    translate('settings.importExport.importReportCount', {
      values: { count: importedLeaves.length },
    }),
    translate('settings.importExport.importReportSkipped', { values: { skipped } }),
    translate('settings.importExport.importReportPlacement', { values: { noteName } }),
    translate('settings.importExport.importReportUnsupported'),
    ...sanitizedLines,
    translate('settings.importExport.importReportPerItemHeader'),
    ...perItemLines,
    parsed.errors?.length ? translate('settings.importExport.importReportHasErrors') : '',
    translate('settings.importExport.importReportConsole'),
    ...errorLines,
  ].filter(Boolean)

  const reportLeaf = {
    id: crypto.randomUUID(),
    title: reportTitle,
    noteId,
    content: reportLines.join('\n'),
    updatedAt: Date.now(),
    order: baseLeafOrder,
  }

  return {
    success: true,
    result: {
      newNote,
      reportLeaf,
      importedLeaves,
      errors: parsed.errors,
    },
  }
}
