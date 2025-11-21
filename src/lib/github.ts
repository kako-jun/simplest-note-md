/**
 * GitHub API統合
 * GitHubへのファイル保存とSHA取得を担当
 */

import type { Leaf, Note, Settings } from './types'

export interface SaveResult {
  success: boolean
  message: string
}

export interface TestResult {
  success: boolean
  message: string
}

export interface PullResult {
  success: boolean
  message: string
  notes: Note[]
  leaves: Leaf[]
}
/**
 * UTF-8テキストをBase64エンコード
 */
function encodeContent(content: string): string {
  return btoa(unescape(encodeURIComponent(content)))
}

/**
 * フォルダパスを構築
 */
function getFolderPath(note: Note, allNotes: Note[]): string {
  const parentNote = note.parentId ? allNotes.find((f) => f.id === note.parentId) : null

  if (parentNote) {
    return `${parentNote.name}/${note.name}`
  }
  return note.name
}

function buildPath(leaf: Leaf, notes: Note[]): string {
  const note = notes.find((f) => f.id === leaf.noteId)
  if (!note) return `notes/${leaf.title}.md`

  const folderPath = getFolderPath(note, notes)
  return `notes/${folderPath}/${leaf.title}.md`
}

/**
 * 既存ファイルのSHAを取得
 * ファイルが存在しない場合はnullを返す
 */
export async function fetchCurrentSha(path: string, settings: Settings): Promise<string | null> {
  const url = `https://api.github.com/repos/${settings.repoName}/contents/${path}`

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${settings.token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      return data.sha
    }
    return null // ファイルが存在しない
  } catch (error) {
    console.error('SHA fetch error:', error)
    return null
  }
}

/**
 * GitHubにノートを保存
 */
export async function saveToGitHub(
  leaf: Leaf,
  notes: Note[],
  settings: Settings
): Promise<SaveResult> {
  // 設定の検証
  if (!settings.token || !settings.repoName) {
    return {
      success: false,
      message: 'GitHub設定が不完全です。設定画面でトークンとリポジトリ名を入力してください。',
    }
  }

  const path = buildPath(leaf, notes)
  const encodedContent = encodeContent(leaf.content)
  const sha = await fetchCurrentSha(path, settings)

  const body: any = {
    message: 'auto-sync',
    content: encodedContent,
    committer: {
      name: settings.username || 'SimplestNote User',
      email: settings.email || 'user@example.com',
    },
  }

  // 既存ファイルの場合はSHAを含める
  if (sha) {
    body.sha = sha
  }

  const url = `https://api.github.com/repos/${settings.repoName}/contents/${path}`

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${settings.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (response.ok) {
      return {
        success: true,
        message: '✅ GitHubに保存しました',
      }
    } else {
      const error = await response.json()
      return {
        success: false,
        message: `❌ 同期エラー: ${error.message}`,
      }
    }
  } catch (error) {
    return {
      success: false,
      message: '❌ ネットワークエラー',
    }
  }
}

/**
 * GitHubからの簡易Pull（接続確認＋notesディレクトリ参照）
 * データのマージはせず、アクセス可否だけを確認する
 */
export async function pullFromGitHub(settings: Settings): Promise<PullResult> {
  if (!settings.token) {
    return { success: false, message: '❌ トークンが未設定です', notes: [], leaves: [] }
  }
  if (!settings.repoName || !settings.repoName.includes('/')) {
    return {
      success: false,
      message: '❌ リポジトリ名が不正です（owner/repo）',
      notes: [],
      leaves: [],
    }
  }

  const headers = {
    Authorization: `Bearer ${settings.token}`,
  }

  try {
    const repoRes = await fetch(`https://api.github.com/repos/${settings.repoName}`, { headers })
    if (repoRes.status === 404) {
      return { success: false, message: '❌ リポジトリが見つかりません', notes: [], leaves: [] }
    }
    if (repoRes.status === 401 || repoRes.status === 403) {
      return {
        success: false,
        message: '❌ リポジトリへの権限がありません',
        notes: [],
        leaves: [],
      }
    }
    if (!repoRes.ok) {
      return {
        success: false,
        message: `❌ リポジトリ確認に失敗 (${repoRes.status})`,
        notes: [],
        leaves: [],
      }
    }

    const repoData = await repoRes.json()
    const defaultBranch = repoData.default_branch || 'main'

    const treeRes = await fetch(
      `https://api.github.com/repos/${settings.repoName}/git/trees/${defaultBranch}?recursive=1`,
      { headers }
    )
    if (!treeRes.ok) {
      return {
        success: false,
        message: `❌ ツリー取得に失敗 (${treeRes.status})`,
        notes: [],
        leaves: [],
      }
    }

    const treeData = await treeRes.json()
    const entries: { path: string; type: string }[] = treeData.tree || []

    const noteMap = new Map<string, Note>()
    const leaves: Leaf[] = []

    const ensureNotePath = (pathParts: string[]): string => {
      let parentId: string | undefined
      for (let i = 0; i < pathParts.length; i++) {
        const partial = pathParts.slice(0, i + 1).join('/')
        if (noteMap.has(partial)) {
          parentId = noteMap.get(partial)!.id
          continue
        }
        const note: Note = {
          id: crypto.randomUUID(),
          name: pathParts[i],
          parentId,
          order: noteMap.size,
        }
        noteMap.set(partial, note)
        parentId = note.id
      }
      return parentId || ''
    }

    const notePaths = entries.filter(
      (e) =>
        e.type === 'blob' && e.path.startsWith('notes/') && e.path.toLowerCase().endsWith('.md')
    )

    for (const entry of notePaths) {
      const relativePath = entry.path.replace(/^notes\//, '')
      const parts = relativePath.split('/').filter(Boolean)
      if (parts.length === 0) continue

      const fileName = parts.pop()!
      const title = fileName.replace(/\.md$/i, '') || 'Untitled'
      const noteId = ensureNotePath(parts)

      // fetch content
      const contentRes = await fetch(
        `https://api.github.com/repos/${settings.repoName}/contents/${entry.path}`,
        { headers }
      )
      if (!contentRes.ok) continue
      const contentData = await contentRes.json()
      let content = ''
      if (contentData.content) {
        try {
          content = decodeURIComponent(escape(atob(contentData.content)))
        } catch (e) {
          content = ''
        }
      }

      leaves.push({
        id: crypto.randomUUID(),
        title,
        noteId,
        content,
        updatedAt: Date.now(),
        order: leaves.length,
      })
    }

    return {
      success: true,
      message: '✅ Pull OK',
      notes: Array.from(noteMap.values()),
      leaves,
    }
  } catch (error) {
    console.error('GitHub pull error:', error)
    return { success: false, message: '❌ ネットワークエラー', notes: [], leaves: [] }
  }
}

/**
 * GitHub接続テスト（認証＋リポジトリ参照）
 */
export async function testGitHubConnection(settings: Settings): Promise<TestResult> {
  if (!settings.token) {
    return { success: false, message: '❌ トークンが未設定です' }
  }
  if (!settings.repoName || !settings.repoName.includes('/')) {
    return { success: false, message: '❌ リポジトリ名が不正です（owner/repo）' }
  }

  const headers = {
    Authorization: `Bearer ${settings.token}`,
  }

  try {
    // 認証確認
    const userRes = await fetch('https://api.github.com/user', { headers })
    if (userRes.status === 401) {
      return { success: false, message: '❌ トークンが無効です' }
    }
    if (!userRes.ok) {
      return { success: false, message: `❌ ユーザー情報取得に失敗 (${userRes.status})` }
    }

    // リポジトリ参照確認
    const repoRes = await fetch(`https://api.github.com/repos/${settings.repoName}`, { headers })
    if (repoRes.status === 404) {
      return { success: false, message: '❌ リポジトリが見つかりません' }
    }
    if (repoRes.status === 401 || repoRes.status === 403) {
      return { success: false, message: '❌ リポジトリへの権限がありません' }
    }
    if (!repoRes.ok) {
      return { success: false, message: `❌ リポジトリ確認に失敗 (${repoRes.status})` }
    }

    return { success: true, message: '✅ 接続OK（認証・リポジトリ参照に成功）' }
  } catch (error) {
    console.error('GitHub test error:', error)
    return { success: false, message: '❌ ネットワークエラー' }
  }
}
