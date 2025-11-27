<script lang="ts">
  import { _ } from '../../lib/i18n'
  import {
    searchQuery,
    isSearchOpen,
    searchResults,
    handleSearchInput,
    closeSearch,
    clearSearch,
    selectNextResult,
    selectPrevResult,
    getSelectedResult,
  } from '../../lib/search'
  import SearchResults from './SearchResults.svelte'

  export let onResultClick: (leafId: string, line: number) => void

  let inputElement: HTMLInputElement

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      closeSearch()
      inputElement?.blur()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectNextResult()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectPrevResult()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      let result = getSelectedResult()
      // 選択されていない場合は最初の結果を使用
      if (!result && $searchResults.length > 0) {
        result = $searchResults[0]
      }
      if (result) {
        onResultClick(result.leafId, result.line)
        closeSearch()
      }
    }
  }

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement
    handleSearchInput(target.value)
  }

  function handleFocus() {
    isSearchOpen.set(true)
  }

  function handleBlur(e: FocusEvent) {
    // 結果クリック時はblurより先にclickが発火するので少し遅延
    setTimeout(() => {
      if (!document.activeElement?.closest('.search-container')) {
        closeSearch()
      }
    }, 150)
  }

  function handleClear() {
    clearSearch()
    inputElement?.focus()
  }
</script>

<div class="search-container" role="search">
  <div class="search-input-wrapper">
    <svg
      class="search-icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
    <input
      bind:this={inputElement}
      type="text"
      placeholder={$_('search.placeholder')}
      value={$searchQuery}
      on:input={handleInput}
      on:keydown={handleKeydown}
      on:focus={handleFocus}
      on:blur={handleBlur}
      aria-label={$_('search.placeholder')}
    />
    {#if $searchQuery}
      <button
        class="clear-button"
        on:click={handleClear}
        title={$_('search.clear')}
        aria-label={$_('search.clear')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    {/if}
  </div>

  {#if $isSearchOpen && $searchQuery}
    <SearchResults {onResultClick} />
  {/if}
</div>

<style>
  .search-container {
    position: relative;
    flex: 1;
    max-width: 300px;
    margin: 0 0.5rem;
  }

  .search-input-wrapper {
    display: flex;
    align-items: center;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    padding: 0.4rem 0.6rem;
    gap: 0.4rem;
  }

  :global([data-theme='greenboard']) .search-input-wrapper,
  :global([data-theme='dotsD']) .search-input-wrapper,
  :global([data-theme='dotsF']) .search-input-wrapper {
    background: rgba(255, 255, 255, 0.1);
  }

  .search-icon {
    width: 16px;
    height: 16px;
    color: var(--text);
    opacity: 0.6;
    flex-shrink: 0;
  }

  input {
    flex: 1;
    border: none;
    background: none;
    color: var(--text);
    font-size: 0.9rem;
    outline: none;
    min-width: 0;
  }

  input::placeholder {
    color: var(--text);
    opacity: 0.5;
  }

  .clear-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.2rem;
    border: none;
    background: none;
    cursor: pointer;
    color: var(--text);
    opacity: 0.6;
    border-radius: 4px;
  }

  .clear-button:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.1);
  }

  :global([data-theme='greenboard']) .clear-button:hover,
  :global([data-theme='dotsD']) .clear-button:hover,
  :global([data-theme='dotsF']) .clear-button:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .clear-button svg {
    width: 14px;
    height: 14px;
  }

  @media (max-width: 600px) {
    .search-container {
      max-width: 150px;
    }
  }
</style>
