/**
 * パンくずリスト生成ユーティリティ
 */
import type { Note, Leaf, Breadcrumb, BreadcrumbSibling, View } from '../types'
import { isNoteSaveable } from '../utils/priority'

type Pane = 'left' | 'right'

/**
 * 兄弟ノートを取得（同じ親を持つノート）
 */
function getSiblingNotes(
  noteId: string,
  parentId: string | undefined,
  allNotes: Note[]
): BreadcrumbSibling[] {
  return allNotes
    .filter((n) => n.parentId === parentId && isNoteSaveable(n))
    .sort((a, b) => a.order - b.order)
    .map((n) => ({
      id: n.id,
      label: n.name,
      isCurrent: n.id === noteId,
    }))
}

/**
 * 兄弟リーフを取得（同じノートに属するリーフ）
 */
function getSiblingLeaves(leafId: string, noteId: string, allLeaves: Leaf[]): BreadcrumbSibling[] {
  return allLeaves
    .filter((l) => l.noteId === noteId)
    .sort((a, b) => a.order - b.order)
    .map((l) => ({
      id: l.id,
      label: l.title,
      isCurrent: l.id === leafId,
    }))
}

/**
 * パンくずリストを生成
 */
export function getBreadcrumbs(
  view: View,
  note: Note | null,
  leaf: Leaf | null,
  allNotes: Note[],
  pane: Pane,
  goHome: (pane: Pane) => void,
  selectNote: (note: Note, pane: Pane) => void,
  allLeaves: Leaf[] = []
): Breadcrumb[] {
  const crumbs: Breadcrumb[] = []
  const suffix = pane === 'right' ? '-right' : ''

  // ルートノートの兄弟（= 全ルートノート）
  const rootSiblings = allNotes
    .filter((n) => !n.parentId && isNoteSaveable(n))
    .sort((a, b) => a.order - b.order)
    .map((n) => ({
      id: n.id,
      label: n.name,
      isCurrent: false, // homeは現在位置ではない
    }))

  crumbs.push({
    label: 'Agasteer',
    action: () => goHome(pane),
    id: `home${suffix}`,
    type: 'home',
    siblings: rootSiblings.length > 0 ? rootSiblings : undefined,
  })

  // ノートのパンくず（仮想ノートは除外）
  if (note && isNoteSaveable(note)) {
    const parentNote = allNotes.find((f) => f.id === note.parentId)
    if (parentNote) {
      // 親ノートの兄弟（= 祖父母の子供）
      const parentSiblings = getSiblingNotes(parentNote.id, parentNote.parentId, allNotes)
      crumbs.push({
        label: parentNote.name,
        action: () => selectNote(parentNote, pane),
        id: `${parentNote.id}${suffix}`,
        type: 'note',
        siblings: parentSiblings.length > 1 ? parentSiblings : undefined,
      })
    }

    // 現在のノートの兄弟
    const noteSiblings = getSiblingNotes(note.id, note.parentId, allNotes)
    crumbs.push({
      label: note.name,
      action: () => selectNote(note, pane),
      id: `${note.id}${suffix}`,
      type: 'note',
      siblings: noteSiblings.length > 1 ? noteSiblings : undefined,
    })
  }

  if (leaf) {
    // リーフの兄弟（= 同じノート内のリーフ）
    const leafSiblings = getSiblingLeaves(leaf.id, leaf.noteId, allLeaves)
    crumbs.push({
      label: leaf.title,
      action: () => {},
      id: `${leaf.id}${suffix}`,
      type: 'leaf',
      siblings: leafSiblings.length > 1 ? leafSiblings : undefined,
    })
  }

  return crumbs
}

/**
 * リーフのコンテンツから # 見出しを抽出
 */
export function extractH1Title(content: string): string | null {
  const firstLine = content.split('\n')[0]
  const match = firstLine.match(/^# (.+)/)
  return match ? match[1].trim() : null
}

/**
 * リーフのコンテンツの1行目の # 見出しを更新
 */
export function updateH1Title(content: string, newTitle: string): string {
  const lines = content.split('\n')
  const firstLine = lines[0]
  if (firstLine.match(/^# /)) {
    lines[0] = `# ${newTitle}`
    return lines.join('\n')
  }
  return content
}
