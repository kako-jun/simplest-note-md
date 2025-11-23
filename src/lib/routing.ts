import type { Note, Leaf } from './types'

/**
 * パス解決の結果
 */
export interface PathResolution {
  type: 'home' | 'note' | 'leaf'
  note: Note | null
  leaf: Leaf | null
}

/**
 * パス文字列からノート・リーフを解決する
 *
 * @param path - パス文字列（例: "仕事>会議>議事録"）
 * @param notes - 全ノート配列
 * @param leaves - 全リーフ配列
 * @returns パス解決結果
 */
export function resolvePath(path: string, notes: Note[], leaves: Leaf[]): PathResolution {
  // ホームまたは空パス
  if (!path || path === '/' || path === '') {
    return { type: 'home', note: null, leaf: null }
  }

  // パスを分割（">" で区切る、URLエンコード不要）
  const segments = path.split('>')
  if (segments.length === 0 || segments[0] === '') {
    return { type: 'home', note: null, leaf: null }
  }

  // デコード（念のため）
  const decodedSegments = segments.map((s) => decodeURIComponent(s))

  // 1番目: ルートノートを探す
  const rootNote = notes.find((n) => !n.parentId && n.name === decodedSegments[0])
  if (!rootNote) {
    // ノートが見つからない場合はホームに戻す
    return { type: 'home', note: null, leaf: null }
  }

  // 1セグメントのみ: ルートノートを返す
  if (decodedSegments.length === 1) {
    return { type: 'note', note: rootNote, leaf: null }
  }

  // 2番目: サブノートまたはリーフを探す
  const secondName = decodedSegments[1]

  // サブノートを探す
  const subNote = notes.find((n) => n.parentId === rootNote.id && n.name === secondName)

  if (subNote && decodedSegments.length === 2) {
    // 2セグメント: サブノートを返す
    return { type: 'note', note: subNote, leaf: null }
  }

  if (!subNote && decodedSegments.length === 2) {
    // サブノートが見つからない場合、リーフを探す
    const leaf = leaves.find((l) => l.noteId === rootNote.id && l.title === secondName)
    if (leaf) {
      return { type: 'leaf', note: rootNote, leaf }
    }
    // リーフも見つからない場合はルートノートに戻す
    return { type: 'note', note: rootNote, leaf: null }
  }

  // 3番目: リーフを探す（サブノート配下）
  if (subNote && decodedSegments.length === 3) {
    const leafTitle = decodedSegments[2]
    const leaf = leaves.find((l) => l.noteId === subNote.id && l.title === leafTitle)
    if (leaf) {
      return { type: 'leaf', note: subNote, leaf }
    }
    // リーフが見つからない場合はサブノートに戻す
    return { type: 'note', note: subNote, leaf: null }
  }

  // それ以外は階層が深すぎるのでルートノートに戻す
  return { type: 'note', note: rootNote, leaf: null }
}

/**
 * ノート・リーフからパス文字列を生成する
 *
 * @param note - ノート
 * @param leaf - リーフ（オプション）
 * @param notes - 全ノート配列
 * @returns パス文字列（例: "仕事>会議>議事録"）
 */
export function buildPath(note: Note | null, leaf: Leaf | null, notes: Note[]): string {
  if (!note) {
    return ''
  }

  const segments: string[] = []

  // 親ノートがあれば追加
  if (note.parentId) {
    const parentNote = notes.find((n) => n.id === note.parentId)
    if (parentNote) {
      segments.push(parentNote.name)
    }
  }

  // 現在のノートを追加
  segments.push(note.name)

  // リーフがあれば追加
  if (leaf) {
    segments.push(leaf.title)
  }

  return segments.join('>')
}
