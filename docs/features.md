# 主要機能の実装

SimplestNote.mdの主要機能の実装詳細について説明します。

## エディタ管理

### 初期化

```typescript
function initializeEditor() {
  if (!editorContainer) return

  const extensions = [
    basicSetup,
    markdown(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    history(),
    EditorView.updateListener.of((update) => {
      if (update.docChanged && currentNote) {
        updateNoteContent(currentNote.id, update.state.doc.toString())
      }
    }),
  ]

  // テーマがdarkの場合はダークテーマを追加
  if (settings.theme === 'dark') {
    extensions.push(editorDarkTheme)
  }

  const startState = EditorState.create({
    doc: currentNote?.content || '',
    extensions,
  })

  editorView = new EditorView({
    state: startState,
    parent: editorContainer,
  })
}
```

### コンテンツリセット

ノート切り替え時にエディタ内容を更新。

```typescript
function resetEditorContent(content: string) {
  if (!editorView) return

  const newState = EditorState.create({
    doc: content,
    extensions: editorView.state.extensions,
  })

  editorView.setState(newState)
}
```

### 自動保存

エディタの変更を検知して自動保存。

```typescript
EditorView.updateListener.of((update) => {
  if (update.docChanged && currentNote) {
    updateNoteContent(currentNote.id, update.state.doc.toString())
  }
})
```

---

## パンくずナビゲーション

現在位置を階層的に表示。

```typescript
function getBreadcrumbs() {
  const crumbs: Array<{
    label: string
    action: () => void
    id: string
    type: 'home' | 'folder' | 'note' | 'settings'
  }> = []

  // 常にホームを追加
  crumbs.push({
    label: 'SimplestNote.md',
    action: goHome,
    id: 'home',
    type: 'home',
  })

  // 設定画面の場合
  if (currentView === 'settings') {
    crumbs.push({
      label: '設定',
      action: goSettings,
      id: 'settings',
      type: 'settings',
    })
    return crumbs
  }

  // フォルダ階層を追加
  if (currentFolder) {
    const parentFolder = folders.find((f) => f.id === currentFolder.parentId)
    if (parentFolder) {
      crumbs.push({
        label: parentFolder.name,
        action: () => selectFolder(parentFolder),
        id: parentFolder.id,
        type: 'folder',
      })
    }
    crumbs.push({
      label: currentFolder.name,
      action: () => selectFolder(currentFolder),
      id: currentFolder.id,
      type: 'folder',
    })
  }

  // ノート編集中の場合
  if (currentNote) {
    crumbs.push({
      label: currentNote.title,
      action: () => {},
      id: currentNote.id,
      type: 'note',
    })
  }

  return crumbs
}
```

### インライン編集

パンくずリストから直接名前を変更可能。

```svelte
{#each breadcrumbs as crumb}
  <span>
    {#if editingBreadcrumb === crumb.id}
      {#if crumb.type === 'note'}
        <input bind:this={titleInput} value={crumb.label} ... />
      {:else if crumb.type === 'folder'}
        <input bind:this={folderNameInput} value={crumb.label} ... />
      {/if}
    {:else}
      <button on:click={crumb.action}>{crumb.label}</button>
      <button on:click={() => startEditingBreadcrumb(crumb)}>✏️</button>
    {/if}
  </span>
{/each}
```

---

## モーダルシステム

確認ダイアログとアラートダイアログを統一的に管理。

```typescript
let showModal = false
let modalMessage = ''
let modalType: 'confirm' | 'alert' = 'confirm'
let modalCallback: (() => void) | null = null

function showConfirm(message: string, onConfirm: () => void) {
  modalMessage = message
  modalType = 'confirm'
  modalCallback = onConfirm
  showModal = true
}

function showAlert(message: string) {
  modalMessage = message
  modalType = 'alert'
  modalCallback = null
  showModal = true
}

function confirmModal() {
  if (modalCallback) {
    modalCallback()
  }
  closeModal()
}
```

### 使用例

```typescript
// 削除確認
showConfirm('このノートを削除しますか？', () => {
  notes = notes.filter((n) => n.id !== currentNote!.id)
  persistNotes()
  goToParentFolder()
})

// エラー通知
showAlert('GitHub同期に失敗しました。')
```

## 2ペイン表示

### アスペクト比判定

画面のアスペクト比（横 > 縦）で2ペイン表示を自動切替。

```typescript
// アスペクト比を監視して isDualPane を更新（横 > 縦で2ペイン表示）
const updateDualPane = () => {
  isDualPane = window.innerWidth > window.innerHeight
}
updateDualPane()

window.addEventListener('resize', updateDualPane)
```

### レスポンシブレイアウト

```svelte
<div class="content-wrapper" class:single-pane={!isDualPane}>
  <div class="pane-divider" class:hidden={!isDualPane}></div>
  <div class="left-column">
    <!-- 左ペイン -->
  </div>
  <div class="right-column" class:hidden={!isDualPane}>
    <!-- 右ペイン -->
  </div>
</div>
```

### CSS Grid切替

```css
.content-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  /* ... */
}

.content-wrapper.single-pane {
  grid-template-columns: 1fr;
}

.hidden {
  display: none;
}
```

### 動作

- **スマホ縦向き**: 1ペイン表示
- **スマホ横向き**: 2ペイン表示
- **PC横長画面**: 2ペイン表示
- **画面回転時**: 自動的に切り替わる

## ノート階層制限

### 2階層制限の実装

ルートノート→サブノートの2階層までに制限。

```typescript
function createNote(parentId?: string) {
  if (isOperationsLocked) return
  const allNotes = $notes

  // 階層制限チェック: サブノートの下にはサブノートを作成できない
  if (parentId) {
    const parentNote = allNotes.find((n) => n.id === parentId)
    if (parentNote && parentNote.parentId) {
      showAlert('サブノートの下にはサブノートを作成できません。')
      return
    }
  }

  // ... ノート作成処理
}
```

### UIでの制御

```svelte
<script>
  // リアクティブ宣言: currentNoteが変わるたびに再計算
  $: canHaveSubNote = !currentNote.parentId
</script>

{#if canHaveSubNote}
  <button on:click={onCreateNote}>新規サブノート</button>
{/if}
```

### 階層構造

```
ホーム
├── ノート1 (ルートノート)
│   ├── サブノート1 ← サブノート作成可能
│   │   └── リーフ ← サブノート作成不可、リーフのみ作成可能
│   └── サブノート2
└── ノート2 (ルートノート)
    └── サブノート3
```

---

## リーフのタイトルと#見出しの同期

### 双方向同期の仕様

リーフのタイトルとコンテンツの1行目の`# 見出し`が自動的に同期します。

#### コンテンツ → タイトル

1行目が `# ` で始まる場合、リーフのタイトルが自動更新されます。

```typescript
function extractH1Title(content: string): string | null {
  const firstLine = content.split('\n')[0]
  const match = firstLine.match(/^# (.+)/)
  return match ? match[1].trim() : null
}

function updateLeafContent(content: string, leafId: string) {
  const h1Title = extractH1Title(content)
  const newTitle = h1Title || targetLeaf.title

  // グローバルストアを更新（左右ペイン両方に反映される）
  const updatedLeaves = allLeaves.map((n) =>
    n.id === leafId ? { ...n, content, title: newTitle, updatedAt: Date.now() } : n
  )
  updateLeaves(updatedLeaves)
}
```

#### タイトル → コンテンツ

パンくずリストでタイトルを変更すると、1行目の`# 見出し`も自動更新されます。

```typescript
function updateH1Title(content: string, newTitle: string): string {
  const lines = content.split('\n')
  const firstLine = lines[0]
  if (firstLine.match(/^# /)) {
    lines[0] = `# ${newTitle}`
    return lines.join('\n')
  }
  return content
}

function saveEditBreadcrumb(id: string, newName: string, type: 'leaf') {
  const targetLeaf = allLeaves.find((n) => n.id === id)
  let updatedContent = targetLeaf?.content || ''

  if (targetLeaf && extractH1Title(targetLeaf.content)) {
    updatedContent = updateH1Title(targetLeaf.content, newName.trim())
  }

  updateLeaves(
    allLeaves.map((n) =>
      n.id === id ? { ...n, title: newName.trim(), content: updatedContent } : n
    )
  )
}
```

### 新規リーフの初期コンテンツ

リーフを新規作成すると、以下の初期コンテンツが設定されます：

```markdown
# リーフ1
```

- 1行目: `# リーフ名`（自動生成されたタイトルが見出しになる）
- 2行目: 空行
- 3行目: 空行（カーソル位置）

```typescript
function createLeaf() {
  const uniqueTitle = generateUniqueName('リーフ', existingTitles)

  const newLeaf: Leaf = {
    id: crypto.randomUUID(),
    title: uniqueTitle,
    noteId: $currentNote.id,
    content: `# ${uniqueTitle}\n\n`,
    updatedAt: Date.now(),
    order: noteLeaves.length,
  }
}
```

### 適用条件

- **`#` のみ対応**: `## 見出し2` や `### 見出し3` には適用されません
- **スペース必須**: `#見出し`（スペースなし）はマッチしません
- **1行目のみ**: 2行目以降の見出しは無視されます

### 2ペイン表示での同期

左右のペインで同じリーフを開いている場合、どちらかのペインで編集すると**両方のペインに即座に反映**されます。

```typescript
function updateLeafContent(content: string, leafId: string) {
  // グローバルストアを更新（左右ペイン両方に反映される）
  updateLeaves(updatedLeaves)

  // 左ペインのリーフを編集している場合は currentLeaf も更新
  if ($currentLeaf?.id === leafId) {
    currentLeaf.update(...)
  }

  // 右ペインのリーフを編集している場合は rightLeaf も更新
  if (rightLeaf?.id === leafId) {
    rightLeaf = { ...rightLeaf, content, title: newTitle, updatedAt: Date.now() }
  }
}
```

**動作例**:

- 左ペインでリーフAを編集 → 右ペインでも同じリーフAを開いている場合、即座に同期
- 左ペインでリーフA、右ペインでリーフBを編集 → それぞれ独立して動作
