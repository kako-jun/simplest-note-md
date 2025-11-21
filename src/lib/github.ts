/**
 * GitHub API統合
 * GitHubへのファイル保存とSHA取得を担当
 */

import type { Note, Folder, Settings } from './types'

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
  folders: Folder[]
  notes: Note[]
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
function getFolderPath(folder: Folder, allFolders: Folder[]): string {
  const parentFolder = folder.parentId ? allFolders.find((f) => f.id === folder.parentId) : null

  if (parentFolder) {
    return `${parentFolder.name}/${folder.name}`
  }
  return folder.name
}

/**
 * ノートのGitHubパスを構築
 */
function buildPath(note: Note, folders: Folder[]): string {
  const folder = folders.find((f) => f.id === note.folderId)
  if (!folder) return `notes/${note.title}.md`

  const folderPath = getFolderPath(folder, folders)
  return `notes/${folderPath}/${note.title}.md`
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
  note: Note,
  folders: Folder[],
  settings: Settings
): Promise<SaveResult> {
  // 設定の検証
  if (!settings.token || !settings.repoName) {
    return {
      success: false,
      message: 'GitHub設定が不完全です。設定画面でトークンとリポジトリ名を入力してください。',
    }
  }

  const path = buildPath(note, folders)
  const encodedContent = encodeContent(note.content)
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
    return { success: false, message: '❌ トークンが未設定です', folders: [], notes: [] }
  }
  if (!settings.repoName || !settings.repoName.includes('/')) {
    return {
      success: false,
      message: '❌ リポジトリ名が不正です（owner/repo）',
      folders: [],
      notes: [],
    }
  }

  const headers = {
    Authorization: `Bearer ${settings.token}`,
  }

  try {
    const repoRes = await fetch(`https://api.github.com/repos/${settings.repoName}`, { headers })
    if (repoRes.status === 404) {
      return { success: false, message: '❌ リポジトリが見つかりません', folders: [], notes: [] }
    }
    if (repoRes.status === 401 || repoRes.status === 403) {
      return {
        success: false,
        message: '❌ リポジトリへの権限がありません',
        folders: [],
        notes: [],
      }
    }
    if (!repoRes.ok) {
      return {
        success: false,
        message: `❌ リポジトリ確認に失敗 (${repoRes.status})`,
        folders: [],
        notes: [],
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
        folders: [],
        notes: [],
      }
    }

    const treeData = await treeRes.json()
    const entries: { path: string; type: string }[] = treeData.tree || []

    const folderMap = new Map<string, Folder>()
    const notes: Note[] = []

    const ensureFolder = (pathParts: string[]): string => {
      let parentId: string | undefined
      for (let i = 0; i < pathParts.length; i++) {
        const partial = pathParts.slice(0, i + 1).join('/')
        if (folderMap.has(partial)) {
          parentId = folderMap.get(partial)!.id
          continue
        }
        const folder: Folder = {
          id: crypto.randomUUID(),
          name: pathParts[i],
          parentId,
          order: folderMap.size,
        }
        folderMap.set(partial, folder)
        parentId = folder.id
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
      const folderId = ensureFolder(parts)

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

      notes.push({
        id: crypto.randomUUID(),
        title,
        folderId,
        content,
        updatedAt: Date.now(),
        order: notes.length,
      })
    }

    return {
      success: true,
      message: '✅ Pull OK',
      folders: Array.from(folderMap.values()),
      notes,
    }
  } catch (error) {
    console.error('GitHub pull error:', error)
    return { success: false, message: '❌ ネットワークエラー', folders: [], notes: [] }
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
