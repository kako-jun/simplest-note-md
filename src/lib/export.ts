import JSZip from 'jszip'
import type { Leaf, Note, Metadata } from './types'
import { get } from 'svelte/store'
import { leaves } from './stores'
import { showPushToast } from './ui'

/**
 * リーフをMarkdownファイルとしてダウンロード
 */
export function downloadLeafAsMarkdown(
  leafId: string,
  isOperationsLocked: boolean,
  translate: (key: string) => string
): void {
  if (isOperationsLocked) {
    showPushToast(translate('toast.needInitialPullDownload'), 'error')
    return
  }

  const allLeaves = get(leaves)
  const targetLeaf = allLeaves.find((l) => l.id === leafId)
  if (!targetLeaf) return

  const blob = new Blob([targetLeaf.content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${targetLeaf.title}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export interface ExportNotesOptions {
  gitPolicyLine: string
  infoFooterLine: string
}

export type ExportNotesFailure = 'empty' | 'error'

export interface ExportNotesResult {
  success: boolean
  blob?: Blob
  reason?: ExportNotesFailure
  error?: unknown
}

/**
 * notes/ 配下の構造と metadata.json を含む ZIP を生成する。
 * .git は含めない（履歴なしの作業ツリー相当）。
 */
export async function buildNotesZip(
  notes: Note[],
  leaves: Leaf[],
  metadata: Metadata | undefined,
  options: ExportNotesOptions
): Promise<ExportNotesResult> {
  if (notes.length === 0 && leaves.length === 0) {
    return { success: false, reason: 'empty' }
  }

  try {
    const zip = new JSZip()
    const notesFolder = zip.folder('notes')
    if (!notesFolder) {
      throw new Error('Failed to create notes folder in ZIP')
    }

    // ルートに.gitkeep
    notesFolder.file('.gitkeep', '')

    const noteMap = new Map<string, Note>(notes.map((n) => [n.id, n]))
    const buildFolderPath = (note: Note): string => {
      const segments: string[] = []
      let current: Note | undefined | null = note
      while (current) {
        segments.unshift(current.name)
        current = current.parentId ? noteMap.get(current.parentId) || null : null
      }
      return segments.join('/')
    }

    // ノートごとにディレクトリと.gitkeep
    for (const note of notes) {
      const folderPath = buildFolderPath(note)
      if (folderPath) {
        notesFolder.folder(folderPath)
        notesFolder.file(`${folderPath}/.gitkeep`, '')
      }
    }

    // リーフを追加
    const sortedLeaves = [...leaves].sort((a, b) => a.order - b.order)
    for (const leaf of sortedLeaves) {
      const note = noteMap.get(leaf.noteId) || null
      const folderPath = note ? buildFolderPath(note) : ''
      const path = folderPath ? `${folderPath}/${leaf.title}.md` : `${leaf.title}.md`
      notesFolder.file(path, leaf.content)
    }

    // metadata.json
    const metadataToWrite: Metadata = {
      version: 1,
      pushCount: metadata?.pushCount ?? 0,
      notes: {},
      leaves: {},
    }

    for (const note of notes) {
      const folderPath = buildFolderPath(note)
      const meta: Record<string, unknown> = { id: note.id, order: note.order }
      if (note.badgeIcon !== undefined) meta.badgeIcon = note.badgeIcon
      if (note.badgeColor !== undefined) meta.badgeColor = note.badgeColor
      metadataToWrite.notes[folderPath] = meta as Metadata['notes'][string]
    }

    for (const leaf of leaves) {
      const note = noteMap.get(leaf.noteId) || null
      const folderPath = note ? buildFolderPath(note) : ''
      const relativePath = folderPath ? `${folderPath}/${leaf.title}.md` : `${leaf.title}.md`
      const meta: Record<string, unknown> = {
        id: leaf.id,
        updatedAt: leaf.updatedAt,
        order: leaf.order,
      }
      if (leaf.badgeIcon !== undefined) meta.badgeIcon = leaf.badgeIcon
      if (leaf.badgeColor !== undefined) meta.badgeColor = leaf.badgeColor
      metadataToWrite.leaves[relativePath] = meta as Metadata['leaves'][string]
    }

    notesFolder.file('metadata.json', JSON.stringify(metadataToWrite, null, 2))

    const infoLines = [
      options.gitPolicyLine,
      options.infoFooterLine,
      `exported_at: ${new Date().toISOString()}`,
    ].join('\n')
    zip.file('EXPORT_INFO.txt', infoLines)

    const blob = await zip.generateAsync({ type: 'blob' })
    return { success: true, blob }
  } catch (error) {
    return { success: false, reason: 'error', error }
  }
}
