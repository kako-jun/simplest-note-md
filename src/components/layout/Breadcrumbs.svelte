<script lang="ts">
  import { _ } from '../../lib/i18n'
  import type { Breadcrumb, BreadcrumbSibling } from '../../lib/types'
  import IconButton from '../buttons/IconButton.svelte'
  import ShareButton from '../buttons/ShareButton.svelte'
  import HomeIcon from '../icons/HomeIcon.svelte'
  import EditIcon from '../icons/EditIcon.svelte'

  export let breadcrumbs: Breadcrumb[]
  export let editingId: string | null = null
  export let onStartEdit: (crumb: Breadcrumb) => void
  export let onSaveEdit: (id: string, newName: string, type: Breadcrumb['type']) => void
  export let onCancelEdit: () => void
  export let onCopyUrl: (() => void) | null = null
  export let onCopyMarkdown: (() => void) | null = null
  export let onShareImage: (() => void) | null = null
  export let isPreview: boolean = false
  export let onSelectSibling: ((id: string, type: 'note' | 'leaf') => void) | null = null

  let inputValue = ''
  let inputElement: HTMLInputElement | null = null
  let openDropdownIndex: number | null = null

  function handleStartEdit(crumb: Breadcrumb) {
    if (crumb.type === 'home' || crumb.type === 'settings') return
    inputValue = crumb.label
    onStartEdit(crumb)
    setTimeout(() => {
      inputElement?.focus()
      inputElement?.select()
    }, 0)
  }

  function handleKeydown(e: KeyboardEvent, crumb: Breadcrumb) {
    if (e.key === 'Enter') {
      if (inputValue.trim()) {
        onSaveEdit(crumb.id, inputValue.trim(), crumb.type)
      }
    } else if (e.key === 'Escape') {
      onCancelEdit()
    }
  }

  function handleBlur(crumb: Breadcrumb) {
    if (inputValue.trim()) {
      onSaveEdit(crumb.id, inputValue.trim(), crumb.type)
    } else {
      onCancelEdit()
    }
  }

  function toggleDropdown(index: number) {
    if (openDropdownIndex === index) {
      openDropdownIndex = null
    } else {
      openDropdownIndex = index
    }
  }

  function closeDropdown() {
    openDropdownIndex = null
  }

  function handleSiblingClick(sibling: BreadcrumbSibling, crumb: Breadcrumb) {
    if (sibling.isCurrent) {
      closeDropdown()
      return
    }
    if (onSelectSibling && (crumb.type === 'note' || crumb.type === 'leaf')) {
      onSelectSibling(sibling.id, crumb.type)
    }
    closeDropdown()
  }

  // ドロップダウン外クリックで閉じる
  function handleWindowClick() {
    closeDropdown()
  }

  // リーフ表示かどうかを判定
  $: isLeafView = breadcrumbs.some((crumb) => crumb.type === 'leaf')
</script>

<svelte:window on:click={handleWindowClick} />

<div class="breadcrumbs">
  <div class="breadcrumbs-left">
    {#each breadcrumbs as crumb, index}
      {#if index > 0}
        <!-- セパレータ: 現在のパンくず（セパレータの右側）にsiblingsがあればドロップダウン表示 -->
        {#if crumb.siblings && crumb.siblings.length > 0}
          <div class="separator-dropdown">
            <button
              class="separator clickable"
              on:click|stopPropagation={() => toggleDropdown(index)}
              title={$_('breadcrumbs.showSiblings')}
              aria-label={$_('breadcrumbs.showSiblings')}
              aria-expanded={openDropdownIndex === index}
            >
              ›
            </button>
            {#if openDropdownIndex === index}
              <div class="dropdown-menu" on:click|stopPropagation>
                {#each crumb.siblings as sibling}
                  <button
                    class="dropdown-item"
                    class:current={sibling.isCurrent}
                    on:click={() => handleSiblingClick(sibling, crumb)}
                  >
                    {sibling.label}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {:else}
          <span class="separator">›</span>
        {/if}
      {/if}

      <span class="breadcrumb-item">
        {#if editingId === crumb.id}
          <input
            bind:this={inputElement}
            bind:value={inputValue}
            on:keydown={(e) => handleKeydown(e, crumb)}
            on:blur={() => handleBlur(crumb)}
            class="breadcrumb-input"
          />
        {:else}
          {#if index === 0}
            <IconButton
              onClick={crumb.action}
              title={$_('breadcrumbs.goHome')}
              ariaLabel={$_('breadcrumbs.goHome')}
            >
              <HomeIcon />
            </IconButton>
          {:else}
            <button
              class="breadcrumb-button text-ellipsis"
              class:current={index === breadcrumbs.length - 1}
              on:click={crumb.action}
            >
              {crumb.label}
            </button>
          {/if}
          {#if index === breadcrumbs.length - 1 && (crumb.type === 'note' || crumb.type === 'leaf')}
            <IconButton
              onClick={() => handleStartEdit(crumb)}
              title={crumb.type === 'leaf'
                ? $_('breadcrumbs.editLeafName')
                : $_('breadcrumbs.editNoteName')}
              ariaLabel={crumb.type === 'leaf'
                ? $_('breadcrumbs.editLeafName')
                : $_('breadcrumbs.editNoteName')}
            >
              <EditIcon />
            </IconButton>
          {/if}
        {/if}
      </span>
    {/each}
  </div>

  {#if isLeafView && onCopyUrl && onCopyMarkdown}
    <ShareButton {onCopyUrl} {onCopyMarkdown} {onShareImage} {isPreview} />
  {/if}
</div>

<style>
  .breadcrumbs {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
    height: 40px;
    background: rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.15);
    font-size: 0.9rem;
    position: relative;
    z-index: 100;
  }

  .breadcrumbs-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: nowrap;
    flex: 1;
    min-width: 0;
    overflow: visible;
  }

  :global([data-theme='greenboard']) .breadcrumbs,
  :global([data-theme='dotsD']) .breadcrumbs,
  :global([data-theme='dotsF']) .breadcrumbs {
    background: rgba(255, 255, 255, 0.15);
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  }

  .separator {
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .separator.clickable {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: background 0.2s;
    font-size: 0.9rem;
  }

  .separator.clickable:hover {
    background: var(--surface-2);
    color: var(--accent);
  }

  .separator-dropdown {
    position: relative;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    background: var(--surface-1);
    border: 1px solid var(--border);
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 150px;
    max-width: 250px;
    max-height: 300px;
    overflow-y: auto;
    z-index: 200;
    margin-top: 4px;
  }

  .dropdown-item {
    display: block;
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    color: var(--text);
    font-size: 0.85rem;
    transition: background 0.15s;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dropdown-item:hover {
    background: var(--surface-2);
  }

  .dropdown-item.current {
    background: var(--accent);
    color: white;
    font-weight: 500;
  }

  .dropdown-item.current:hover {
    background: var(--accent);
  }

  .breadcrumb-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    min-width: 0;
    flex-shrink: 1;
  }

  .breadcrumb-button {
    background: none;
    border: none;
    color: var(--accent);
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    transition: background 0.2s;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    flex-shrink: 1;
  }
  .breadcrumb-button.current {
    color: var(--text);
    cursor: default;
  }

  .breadcrumb-button:hover:not(.current) {
    opacity: 0.7;
  }

  .breadcrumb-input {
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--accent);
    border-radius: 4px;
    background: var(--bg);
    color: var(--text);
    font-size: 0.9rem;
    outline: none;
  }
</style>
