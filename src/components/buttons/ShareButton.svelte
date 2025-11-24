<script lang="ts">
  import { _ } from '../../lib/i18n'
  import { onMount, onDestroy } from 'svelte'

  export let onCopyUrl: () => void
  export let onCopyMarkdown: () => void
  export let onShareImage: (() => void) | null = null
  export let isPreview: boolean = false

  let showMenu = false
  let menuElement: HTMLDivElement
  let supportsWebShare = false

  function toggleMenu() {
    showMenu = !showMenu
  }

  function handleClickOutside(event: MouseEvent) {
    if (menuElement && !menuElement.contains(event.target as Node)) {
      showMenu = false
    }
  }

  function handleCopyUrl() {
    onCopyUrl()
    showMenu = false
  }

  function handleCopyMarkdown() {
    onCopyMarkdown()
    showMenu = false
  }

  function handleShareImage() {
    if (onShareImage) {
      onShareImage()
      showMenu = false
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside)
    // Web Share APIのサポートチェック
    supportsWebShare = !!navigator.share && !!navigator.canShare
  })

  onDestroy(() => {
    document.removeEventListener('click', handleClickOutside)
  })
</script>

<div class="share-container" bind:this={menuElement}>
  <button class="share-button" on:click={toggleMenu} title={$_('share.title')}>
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
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  </button>

  {#if showMenu}
    <div class="share-menu">
      <button class="menu-item" on:click={handleCopyUrl}>
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
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        <span>{$_('share.copyUrl')}</span>
      </button>

      <button class="menu-item" on:click={handleCopyMarkdown}>
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
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        <span>{isPreview ? $_('share.copyImage') : $_('share.copyMarkdown')}</span>
      </button>

      {#if isPreview && supportsWebShare && onShareImage}
        <button class="menu-item" on:click={handleShareImage}>
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
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          <span>{$_('share.shareImage')}</span>
        </button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .share-container {
    position: relative;
    z-index: 1;
  }

  .share-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    opacity: 0.7;
    transition: opacity 0.2s;
    color: var(--accent-color);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .share-button:hover {
    opacity: 1;
  }

  .share-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: var(--bg-primary);
    border: 1px solid var(--text-secondary);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    padding: 0.5rem 0;
    min-width: 200px;
    z-index: 101;
    animation: fadeIn 0.15s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: none;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
    transition: background 0.15s;
    font-size: 0.9rem;
  }

  .menu-item:hover {
    background: var(--bg-secondary);
  }

  .menu-item svg {
    flex-shrink: 0;
    opacity: 0.8;
  }

  .menu-item span {
    flex: 1;
    text-align: left;
  }
</style>
