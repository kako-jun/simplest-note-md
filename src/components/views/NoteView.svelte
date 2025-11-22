<script lang="ts">
  import type { Note, Leaf } from '../../lib/types'

  export let currentNote: Note
  export let subNotes: Note[]
  export let leaves: Leaf[]
  export let onSelectNote: (note: Note) => void
  export let onSelectLeaf: (leaf: Leaf) => void
  export let onCreateNote: () => void
  export let onCreateLeaf: () => void
  export let onDeleteNote: () => void
  export let onDragStartNote: (note: Note) => void
  export let onDragStartLeaf: (leaf: Leaf) => void
  export let onDragOver: (e: DragEvent) => void
  export let onDropNote: (note: Note) => void
  export let onDropLeaf: (leaf: Leaf) => void
  export let getNoteItems: (noteId: string) => string[]
  export let disabled: boolean = false

  const canHaveSubNote = !currentNote.parentId
</script>

<section class="view-container">
  <div class="card-grid">
    {#each subNotes as subNote (subNote.id)}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="note-card note-group-card"
        draggable="true"
        role="button"
        tabindex="0"
        on:dragstart={() => onDragStartNote(subNote)}
        on:dragover={onDragOver}
        on:drop|preventDefault={() => onDropNote(subNote)}
        on:click={() => onSelectNote(subNote)}
      >
        <strong>{subNote.name}</strong>
        <div class="card-meta">
          {#each getNoteItems(subNote.id) as item}
            <small class="note-item">{item}</small>
          {/each}
        </div>
      </div>
    {/each}
    {#each leaves as leaf (leaf.id)}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="note-card"
        draggable="true"
        role="button"
        tabindex="0"
        on:dragstart={() => onDragStartLeaf(leaf)}
        on:dragover={onDragOver}
        on:drop|preventDefault={() => onDropLeaf(leaf)}
        on:click={() => onSelectLeaf(leaf)}
      >
        <strong>{leaf.title}</strong>
        <div class="card-meta">
          <small>更新: {new Date(leaf.updatedAt).toLocaleDateString()}</small>
        </div>
      </div>
    {/each}
  </div>
</section>

<div class="toolbar-fixed">
  <button
    type="button"
    class="secondary icon-only"
    on:click={onDeleteNote}
    title="ノートを削除"
    aria-label="ノートを削除"
    {disabled}
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
      class="button-icon"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  </button>

  {#if canHaveSubNote}
    <button
      type="button"
      class="secondary icon-only"
      on:click={onCreateNote}
      title="新規サブノート"
      aria-label="新規サブノート"
      {disabled}
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
        class="button-icon"
      >
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        <line x1="12" y1="11" x2="12" y2="17" />
        <line x1="9" y1="14" x2="15" y2="14" />
      </svg>
    </button>
  {/if}

  <div style="flex: 1;"></div>

  <button
    type="button"
    class="icon-only create-button"
    on:click={onCreateLeaf}
    title="新規リーフ"
    aria-label="新規リーフ"
  >
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
      class="button-icon"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  </button>
</div>

<style>
  .view-container {
    padding: 1rem;
    height: calc(100vh - 80px - 60px);
    overflow-y: auto;
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .note-card {
    padding: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--bg-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .note-group-card {
    background: var(--bg-tertiary);
  }

  .note-card:hover {
    border-color: var(--accent-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .card-meta {
    margin-top: 0.5rem;
    color: var(--text-secondary);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .note-item {
    display: block;
  }

  .toolbar-fixed {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-top: 1px solid rgba(0, 0, 0, 0.15);
    padding: 0.75rem 1rem;
    z-index: 10;
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  :global([data-theme='campus']) .toolbar-fixed,
  :global([data-theme='whiteboard']) .toolbar-fixed {
    background: rgba(255, 255, 255, 0.7);
    border-top: 1px solid rgba(0, 0, 0, 0.15);
  }

  :global([data-theme='greenboard']) .toolbar-fixed,
  :global([data-theme='dotsD']) .toolbar-fixed,
  :global([data-theme='dotsF']) .toolbar-fixed {
    background: rgba(0, 0, 0, 0.4);
    border-top: 1px solid rgba(255, 255, 255, 0.15);
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.2s;
  }

  button:hover {
    opacity: 0.7;
  }

  button.secondary {
    background: none;
    color: var(--text-primary);
  }

  :global(.button-icon) {
    margin: 0;
  }

  .icon-only {
    padding: 0.25rem;
  }

  .create-button {
    color: var(--accent-color);
  }

  .create-button:hover {
    opacity: 0.7;
  }

  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
