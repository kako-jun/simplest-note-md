<script lang="ts">
  import { onMount } from 'svelte'
  import { EditorState } from '@codemirror/state'
  import { EditorView, keymap } from '@codemirror/view'
  import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
  import { markdown } from '@codemirror/lang-markdown'
  import { basicSetup } from 'codemirror'

  type Settings = {
    token: string
    username: string
    email: string
    repoName: string
    theme: 'light' | 'dark'
  }

  type Folder = {
    id: string
    name: string
    parentId?: string
    order: number
  }

  type Note = {
    id: string
    title: string
    folderId: string
    content: string
    updatedAt: number
  }

  type View = 'home' | 'settings' | 'edit' | 'folder'

  const SETTINGS_KEY = 'simplest-md-note/settings'
  const NOTES_KEY = 'simplest-md-note/notes'
  const FOLDERS_KEY = 'simplest-md-note/folders'

  const defaultSettings: Settings = {
    token: '',
    username: '',
    email: '',
    repoName: '',
    theme: 'light',
  }

  let currentView: View = 'home'
  let settings: Settings = { ...defaultSettings }
  let folders: Folder[] = []
  let notes: Note[] = []
  let currentFolder: Folder | null = null
  let currentNote: Note | null = null
  let statusMessage = ''
  let syncMessage = ''
  let syncError = ''
  let breadcrumbs: Array<{
    label: string
    action: () => void
    id: string
    type: 'home' | 'folder' | 'note' | 'settings'
  }> = []
  let editorContainer: HTMLDivElement | null = null
  let editorView: EditorView | null = null
  let titleInput: HTMLInputElement | null = null
  let originalTitle = ''
  let folderNameInput: HTMLInputElement | null = null
  let originalFolderName = ''
  let editingBreadcrumb: string | null = null
  let draggedFolder: Folder | null = null

  onMount(() => {
    const storedSettings = localStorage.getItem(SETTINGS_KEY)
    if (storedSettings) {
      settings = { ...settings, ...JSON.parse(storedSettings) }
    }
    applyTheme(settings.theme)

    const storedFolders = localStorage.getItem(FOLDERS_KEY)
    console.log('LocalStorage FOLDERS_KEY:', FOLDERS_KEY)
    console.log('Stored folders string:', storedFolders)
    if (storedFolders) {
      const parsedFolders = JSON.parse(storedFolders)
      console.log('Parsed folders:', parsedFolders)
      // 既存フォルダにorderがない場合は追加
      let needsUpdate = false
      const updatedFolders = parsedFolders.map((folder: Folder, index: number) => {
        if (folder.order === undefined) {
          needsUpdate = true
          return { ...folder, order: index }
        }
        return folder
      })
      folders = updatedFolders
      console.log('Assigned folders to state:', folders)
      if (needsUpdate) {
        console.log('Updating folders with order:', folders)
        persistFolders()
      }
    } else {
      console.log('No folders in LocalStorage')
    }

    const storedNotes = localStorage.getItem(NOTES_KEY)
    if (storedNotes) {
      notes = JSON.parse(storedNotes)
    }

    initializeEditor()
  })

  function applyTheme(theme: 'light' | 'dark') {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }

  // テーマ変更を即座に反映
  $: applyTheme(settings.theme)

  // フォルダ変更の監視（デバッグ用）
  $: console.log('Reactive: folders changed, count:', folders.length, folders)

  // リアクティブに計算されるルートフォルダ
  $: rootFolders = folders.filter((f) => !f.parentId).sort((a, b) => a.order - b.order)
  $: console.log('Reactive: rootFolders computed:', rootFolders)

  // リアクティブに計算されるサブフォルダ
  $: subfolders = currentFolder
    ? folders.filter((f) => f.parentId === currentFolder.id).sort((a, b) => a.order - b.order)
    : []
  $: console.log('Reactive: subfolders computed:', subfolders)

  function persistSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    statusMessage = '設定を保存しました。'
    setTimeout(() => (statusMessage = ''), 2000)
  }

  function persistNotes() {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
  }

  function persistFolders() {
    console.log('Persisting folders:', folders)
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders))
    console.log('Saved to LocalStorage:', localStorage.getItem(FOLDERS_KEY))
  }

  function getNextFolderName(): string {
    const pattern = /^フォルダ(\d+)$/
    const numbers = folders
      .map((f) => {
        const match = f.name.match(pattern)
        return match ? parseInt(match[1], 10) : 0
      })
      .filter((n) => n > 0)
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0
    return `フォルダ${maxNumber + 1}`
  }

  function createFolder(parentId?: string) {
    const siblingFolders = folders.filter((f) => f.parentId === parentId)
    const maxOrder =
      siblingFolders.length > 0 ? Math.max(...siblingFolders.map((f) => f.order)) : -1
    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name: getNextFolderName(),
      parentId,
      order: maxOrder + 1,
    }
    console.log('Creating folder:', newFolder)
    folders = [...folders, newFolder]
    console.log('Folders array after adding:', folders)
    persistFolders()
  }

  function selectFolder(folder: Folder) {
    currentFolder = folder
    currentView = 'folder'
  }

  function getBreadcrumbs() {
    const crumbs: Array<{
      label: string
      action: () => void
      id: string
      type: 'home' | 'folder' | 'note' | 'settings'
    }> = [
      {
        label: 'ホーム',
        action: () => {
          console.log('Home breadcrumb clicked!')
          currentView = 'home'
        },
        id: 'home',
        type: 'home',
      },
    ]

    if (currentView === 'settings') {
      crumbs.push({
        label: '設定',
        action: () => {},
        id: 'settings',
        type: 'settings',
      })
    } else if (currentView === 'folder' && currentFolder) {
      if (currentFolder.parentId) {
        const parent = folders.find((f) => f.id === currentFolder.parentId)
        if (parent) {
          crumbs.push({
            label: parent.name,
            action: () => selectFolder(parent),
            id: parent.id,
            type: 'folder',
          })
        }
      }
      crumbs.push({
        label: currentFolder.name,
        action: () => selectFolder(currentFolder),
        id: currentFolder.id,
        type: 'folder',
      })
    } else if (currentView === 'edit' && currentNote) {
      const folder = folders.find((f) => f.id === currentNote.folderId)
      if (folder) {
        if (folder.parentId) {
          const parent = folders.find((f) => f.id === folder.parentId)
          if (parent) {
            crumbs.push({
              label: parent.name,
              action: () => selectFolder(parent),
              id: parent.id,
              type: 'folder',
            })
          }
        }
        crumbs.push({
          label: folder.name,
          action: () => selectFolder(folder),
          id: folder.id,
          type: 'folder',
        })
      }
      crumbs.push({
        label: currentNote.title,
        action: () => {},
        id: currentNote.id,
        type: 'note',
      })
    }

    return crumbs
  }

  // リアクティブに計算されるパンくずリスト
  $: {
    currentView
    currentFolder
    currentNote
    folders
    breadcrumbs = getBreadcrumbs()
  }

  function getNextNoteName(): string {
    const pattern = /^ノート(\d+)$/
    const numbers = notes
      .map((n) => {
        const match = n.title.match(pattern)
        return match ? parseInt(match[1], 10) : 0
      })
      .filter((n) => n > 0)
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0
    return `ノート${maxNumber + 1}`
  }

  function createNewNote() {
    if (!currentFolder) return
    const title = getNextNoteName()
    const newNote: Note = {
      id: crypto.randomUUID(),
      title,
      folderId: currentFolder.id,
      content: `# ${title}\n`,
      updatedAt: Date.now(),
    }
    notes = [newNote, ...notes]
    currentNote = newNote
    currentView = 'edit'
    persistNotes()
    resetEditorContent(newNote.content)
  }

  function selectNote(note: Note) {
    currentNote = note
    currentView = 'edit'
    resetEditorContent(note.content)
  }

  function updateNoteContent(value: string) {
    if (!currentNote) return
    currentNote = { ...currentNote, content: value, updatedAt: Date.now() }
    notes = notes.map((n) => (n.id === currentNote?.id ? currentNote : n))
    persistNotes()
  }

  function updateNoteMeta(key: keyof Note, value: string) {
    if (!currentNote) return
    currentNote = { ...currentNote, [key]: value, updatedAt: Date.now() }
    notes = notes.map((n) => (n.id === currentNote?.id ? currentNote : n))
    persistNotes()
  }

  function startEditingBreadcrumb(id: string, type: 'folder' | 'note') {
    editingBreadcrumb = id
    if (type === 'note' && currentNote) {
      originalTitle = currentNote.title
      setTimeout(() => {
        if (titleInput) {
          titleInput.focus()
          titleInput.select()
        }
      }, 0)
    } else if (type === 'folder') {
      const folder = folders.find((f) => f.id === id)
      if (folder) {
        originalFolderName = folder.name
        setTimeout(() => {
          if (folderNameInput) {
            folderNameInput.focus()
            folderNameInput.select()
          }
        }, 0)
      }
    }
  }

  function finishEditingBreadcrumb() {
    editingBreadcrumb = null
  }

  function cancelEditingBreadcrumb(type: 'folder' | 'note', id: string) {
    if (type === 'note' && currentNote) {
      currentNote.title = originalTitle
      updateNoteMeta('title', originalTitle)
    } else if (type === 'folder') {
      const folder = folders.find((f) => f.id === id)
      if (folder) {
        folder.name = originalFolderName
        folders = folders.map((f) => (f.id === id ? folder : f))
        persistFolders()
      }
    }
    editingBreadcrumb = null
  }

  function handleBreadcrumbKeydown(e: KeyboardEvent, type: 'folder' | 'note', id: string) {
    if (e.key === 'Enter') {
      finishEditingBreadcrumb()
    } else if (e.key === 'Escape') {
      cancelEditingBreadcrumb(type, id)
    }
  }

  function updateFolderName(id: string, name: string) {
    const folder = folders.find((f) => f.id === id)
    if (!folder) return
    folder.name = name
    folders = folders.map((f) => (f.id === id ? folder : f))
    persistFolders()
  }

  function resetEditorContent(content: string) {
    if (editorView) {
      const newState = EditorState.create({
        doc: content,
        extensions: [
          basicSetup,
          markdown(),
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              updateNoteContent(update.state.doc.toString())
            }
          }),
        ],
      })
      editorView.setState(newState)
    }
  }

  function initializeEditor() {
    if (!editorContainer) return

    editorView = new EditorView({
      state: EditorState.create({
        doc: currentNote?.content ?? '',
        extensions: [
          basicSetup,
          markdown(),
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              updateNoteContent(update.state.doc.toString())
            }
          }),
        ],
      }),
      parent: editorContainer,
    })
  }

  $: if (editorContainer && !editorView) {
    initializeEditor()
  }

  $: if (editorView && currentNote) {
    const doc = editorView.state.doc.toString()
    if (doc !== currentNote.content) {
      resetEditorContent(currentNote.content)
    }
  }

  function getFolderPath(folderId: string): string[] {
    const folder = folders.find((f) => f.id === folderId)
    if (!folder) return []

    const path = [folder.name]
    if (folder.parentId) {
      const parent = folders.find((f) => f.id === folder.parentId)
      if (parent) path.unshift(parent.name)
    }
    return path
  }

  function buildPath(note: Note) {
    const segments = ['notes']
    const folderPath = getFolderPath(note.folderId)
    segments.push(...folderPath)
    const fileName = `${note.title.trim() || 'untitled'}.md`
    segments.push(fileName)
    return segments.filter(Boolean).join('/')
  }

  function validateSettings() {
    return settings.token && settings.username && settings.email && settings.repoName
  }

  function encodeContent(content: string) {
    return btoa(unescape(encodeURIComponent(content)))
  }

  async function fetchCurrentSha(path: string, owner: string, repo: string) {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: {
        Authorization: `Bearer ${settings.token}`,
        Accept: 'application/vnd.github+json',
      },
    })

    if (res.status === 200) {
      const data = await res.json()
      return data.sha as string
    }

    if (res.status === 404) {
      return null
    }

    throw new Error(`GitHub API error: ${res.status}`)
  }

  async function saveToGitHub() {
    syncMessage = ''
    syncError = ''

    if (!currentNote) {
      syncError = 'ノートが選択されていません。'
      return
    }

    if (!validateSettings()) {
      syncError = 'ローカルに保存しました（GitHub同期の設定が不足しています）'
      return
    }

    const [owner, repo] = settings.repoName.split('/')
    if (!owner || !repo) {
      syncError = 'リポジトリ名は「owner/repo」で入力してください。'
      return
    }

    const path = buildPath(currentNote)
    const content = encodeContent(currentNote.content)

    try {
      const sha = await fetchCurrentSha(path, owner, repo)
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${settings.token}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github+json',
        },
        body: JSON.stringify({
          message: 'auto-sync',
          content,
          sha: sha ?? undefined,
          committer: {
            name: settings.username,
            email: settings.email,
          },
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || '同期に失敗しました。')
      }

      syncMessage = 'GitHubへ保存しました。'
    } catch (err) {
      syncError = err instanceof Error ? err.message : '同期に失敗しました。'
    }
  }

  function downloadMd() {
    if (!currentNote) return
    const blob = new Blob([currentNote.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentNote.title || 'note'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  function getNotesInFolder(folderId: string) {
    return notes.filter((n) => n.folderId === folderId)
  }

  function getFolderDisplayName(folder: Folder): string {
    if (folder.parentId) {
      const parent = folders.find((f) => f.id === folder.parentId)
      if (parent) return `${parent.name}/${folder.name}`
    }
    return folder.name
  }

  function getRootFolders() {
    const rootFolders = folders.filter((f) => !f.parentId).sort((a, b) => a.order - b.order)
    console.log('getRootFolders called, folders:', folders, 'rootFolders:', rootFolders)
    return rootFolders
  }

  function getSubfolders(parentId: string) {
    return folders.filter((f) => f.parentId === parentId).sort((a, b) => a.order - b.order)
  }

  function handleDragStart(folder: Folder) {
    draggedFolder = folder
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
  }

  function handleDrop(targetFolder: Folder) {
    if (!draggedFolder || draggedFolder.id === targetFolder.id) return
    if (draggedFolder.parentId !== targetFolder.parentId) return // 同じ階層のみ

    const siblingFolders = folders.filter((f) => f.parentId === targetFolder.parentId)
    const sortedSiblings = siblingFolders.sort((a, b) => a.order - b.order)

    const draggedIndex = sortedSiblings.findIndex((f) => f.id === draggedFolder.id)
    const targetIndex = sortedSiblings.findIndex((f) => f.id === targetFolder.id)

    if (draggedIndex === -1 || targetIndex === -1) return

    // 並び替え
    sortedSiblings.splice(draggedIndex, 1)
    sortedSiblings.splice(targetIndex, 0, draggedFolder)

    // order を再設定
    sortedSiblings.forEach((folder, index) => {
      folder.order = index
    })

    folders = [...folders]
    persistFolders()
    draggedFolder = null
  }
</script>

<header>
  <h1 style="cursor: pointer;" on:click={() => (currentView = 'home')}>SimplestNote.md</h1>
  {#if currentView !== 'settings'}
    <button class="icon-button" on:click={() => (currentView = 'settings')} title="設定">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path
          d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
        />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  {/if}
</header>

<main>
  <div
    style="height: 40px; padding: 0 16px; border-bottom: 1px solid var(--border-color); background: var(--bg-secondary); display: flex; align-items: center; gap: 8px; box-sizing: border-box;"
  >
    {#each breadcrumbs as crumb, index}
      {#if index > 0}
        <span style="color: var(--text-secondary);">/</span>
      {/if}
      {#if editingBreadcrumb === crumb.id && (crumb.type === 'folder' || crumb.type === 'note')}
        <div style="display: flex; align-items: center; gap: 4px;">
          {#if crumb.type === 'note'}
            <input
              type="text"
              bind:this={titleInput}
              bind:value={currentNote.title}
              on:keydown={(e) => handleBreadcrumbKeydown(e, 'note', crumb.id)}
              on:input={(e) => updateNoteMeta('title', e.currentTarget.value)}
              style="font-size: 14px; font-weight: 600; border: 1px solid var(--accent-color); border-radius: 4px; padding: 2px 8px; background: var(--bg-primary); color: var(--text-primary); height: 28px; line-height: 1;"
            />
          {:else if crumb.type === 'folder'}
            <input
              type="text"
              bind:this={folderNameInput}
              value={crumb.label}
              on:keydown={(e) => handleBreadcrumbKeydown(e, 'folder', crumb.id)}
              on:input={(e) => updateFolderName(crumb.id, e.currentTarget.value)}
              style="font-size: 14px; font-weight: 600; border: 1px solid var(--accent-color); border-radius: 4px; padding: 2px 8px; background: var(--bg-primary); color: var(--text-primary); height: 28px; line-height: 1;"
            />
          {/if}
          <button
            class="icon-button"
            on:click={() =>
              cancelEditingBreadcrumb(crumb.type === 'note' ? 'note' : 'folder', crumb.id)}
            title="キャンセル"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      {:else}
        <button
          class="breadcrumb-link"
          on:click={(e) => {
            console.log('Breadcrumb button clicked', {
              index,
              total: breadcrumbs.length,
              disabled: crumb.type !== 'home' && index === breadcrumbs.length - 1,
              crumb,
            })
            crumb.action()
          }}
          disabled={crumb.type !== 'home' && index === breadcrumbs.length - 1}
        >
          {#if index === 0}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          {:else}
            {crumb.label}
          {/if}
        </button>
        {#if index === breadcrumbs.length - 1 && (crumb.type === 'folder' || crumb.type === 'note')}
          <button
            class="icon-button"
            on:click={() =>
              startEditingBreadcrumb(crumb.id, crumb.type === 'note' ? 'note' : 'folder')}
            title={crumb.type === 'note' ? 'ノート名を編集' : 'フォルダ名を編集'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
          </button>
        {/if}
      {/if}
    {/each}
  </div>

  {#if currentView === 'settings'}
    <section>
      <div style="display: flex; justify-content: flex-end; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <label style="margin: 0; font-size: 14px;">ダークモード</label>
          <label class="toggle-switch">
            <input
              type="checkbox"
              checked={settings.theme === 'dark'}
              on:change={(e) => (settings.theme = e.currentTarget.checked ? 'dark' : 'light')}
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      <div class="flex-row" style="margin-bottom: 16px;">
        <div class="flex-1">
          <label>リポジトリ名（owner/repo）</label>
          <input type="text" bind:value={settings.repoName} placeholder="owner/repo" />
        </div>
        <div class="flex-1">
          <label>GitHubトークン</label>
          <input type="password" bind:value={settings.token} placeholder="ghp_..." />
        </div>
      </div>
      <div class="flex-row" style="margin-bottom: 16px;">
        <div class="flex-1">
          <label>コミットユーザー名</label>
          <input type="text" bind:value={settings.username} placeholder="your-name" />
        </div>
        <div class="flex-1">
          <label>コミットメールアドレス</label>
          <input type="email" bind:value={settings.email} placeholder="you@example.com" />
        </div>
      </div>
      <div class="toolbar" style="margin-top: 12px; justify-content: flex-end;">
        {#if statusMessage}<span class="status">{statusMessage}</span>{/if}
        <button type="button" on:click={persistSettings}>設定を保存</button>
      </div>
    </section>
  {:else if currentView === 'home'}
    <section>
      <div class="toolbar" style="justify-content: flex-end; margin-bottom: 16px;">
        <button type="button" on:click={() => createFolder()}>新規フォルダ</button>
      </div>
      <div class="card-grid">
        {#each rootFolders as folder}
          <div
            class="note-card"
            draggable="true"
            on:dragstart={() => handleDragStart(folder)}
            on:dragover={handleDragOver}
            on:drop|preventDefault={() => handleDrop(folder)}
            on:click={() => selectFolder(folder)}
            style="cursor: pointer; background: var(--bg-tertiary);"
          >
            <strong>{folder.name}</strong>
            <div style="margin-top: 8px;">
              <small
                >{getNotesInFolder(folder.id).length + getSubfolders(folder.id).length} 項目</small
              >
            </div>
          </div>
        {/each}
        {#if rootFolders.length === 0}
          <p>フォルダがまだありません。</p>
        {/if}
      </div>
    </section>
  {:else if currentView === 'folder' && currentFolder}
    <section>
      <div class="toolbar" style="justify-content: flex-end; margin-bottom: 16px; gap: 8px;">
        {#if !currentFolder.parentId}
          <button type="button" class="secondary" on:click={() => createFolder(currentFolder.id)}
            >新規サブフォルダ</button
          >
        {/if}
        <button type="button" on:click={createNewNote}>新規ノート</button>
      </div>
      <div class="card-grid">
        {#each subfolders as subfolder}
          <div
            class="note-card"
            draggable="true"
            on:dragstart={() => handleDragStart(subfolder)}
            on:dragover={handleDragOver}
            on:drop|preventDefault={() => handleDrop(subfolder)}
            on:click={() => selectFolder(subfolder)}
            style="cursor: pointer; background: var(--bg-tertiary);"
          >
            <strong>{subfolder.name}</strong>
            <div style="margin-top: 8px;">
              <small>{getNotesInFolder(subfolder.id).length} ノート</small>
            </div>
          </div>
        {/each}
        {#each getNotesInFolder(currentFolder.id) as note}
          <div class="note-card" on:click={() => selectNote(note)} style="cursor: pointer;">
            <strong>{note.title}</strong>
            <div style="margin-top: 8px;">
              <small>{new Date(note.updatedAt).toLocaleDateString()}</small>
            </div>
          </div>
        {/each}
        {#if getNotesInFolder(currentFolder.id).length === 0 && subfolders.length === 0}
          <p>ノートとサブフォルダがまだありません。</p>
        {/if}
      </div>
    </section>
  {:else if currentView === 'edit' && currentNote}
    <section>
      <div style="margin: 12px 0;" bind:this={editorContainer}></div>
      <div class="toolbar" style="margin-top: 12px; justify-content: flex-end;">
        {#if syncMessage}<span class="status">{syncMessage}</span>{/if}
        {#if syncError}<span class="status error">{syncError}</span>{/if}
        <button type="button" class="secondary" on:click={downloadMd}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            style="margin-right: 4px;"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download
        </button>
        <button type="button" on:click={saveToGitHub}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            style="margin-right: 4px;"
          >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          Save
        </button>
      </div>
    </section>
  {/if}
</main>
