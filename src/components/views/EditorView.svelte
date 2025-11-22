<script lang="ts">
  import MarkdownEditor from '../editor/MarkdownEditor.svelte'
  import type { Leaf, ThemeType } from '../../lib/types'

  export let leaf: Leaf
  export let theme: ThemeType
  export let onContentChange: (content: string) => void
  export let onSave: () => void
  export let onDownload: () => void
  export let onDelete: () => void
  export let disabled: boolean = false
</script>

<section class="editor-section">
  <MarkdownEditor content={leaf.content} {theme} onChange={onContentChange} />
</section>

<div class="toolbar-fixed">
  <button
    type="button"
    class="secondary icon-only"
    on:click={onDelete}
    title="リーフを削除"
    aria-label="リーフを削除"
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

  <button
    type="button"
    class="secondary icon-only"
    on:click={onDownload}
    title="Download"
    aria-label="Download"
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  </button>

  <div style="flex: 1;"></div>

  <button
    type="button"
    class="icon-only save-button"
    on:click={onSave}
    title="Save"
    aria-label="Save"
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
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  </button>
</div>

<style>
  .editor-section {
    padding: 0;
    height: calc(100vh - 80px - 60px);
    overflow: hidden;
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

  .save-button {
    color: var(--accent-color);
  }

  .save-button:hover {
    opacity: 0.7;
  }

  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
