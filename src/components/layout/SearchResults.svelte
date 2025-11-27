<script lang="ts">
  import { _ } from '../../lib/i18n'
  import { searchResults, selectedResultIndex, closeSearch } from '../../lib/search'
  import type { SearchMatch } from '../../lib/types'

  export let onResultClick: (leafId: string, line: number) => void

  function handleClick(result: SearchMatch) {
    onResultClick(result.leafId, result.line)
    closeSearch()
  }
</script>

{#if $searchResults.length > 0}
  <div class="search-results" role="listbox">
    {#each $searchResults as result, index}
      <button
        class="result-item"
        class:selected={index === $selectedResultIndex}
        role="option"
        aria-selected={index === $selectedResultIndex}
        on:click={() => handleClick(result)}
        on:mouseenter={() => selectedResultIndex.set(index)}
      >
        <div class="result-header">
          <span class="leaf-title">📄 {result.leafTitle}</span>
          <span class="note-name">({result.noteName})</span>
        </div>
        <div class="result-snippet">
          {result.snippet.slice(0, result.matchStart)}<mark
            >{result.snippet.slice(result.matchStart, result.matchEnd)}</mark
          >{result.snippet.slice(result.matchEnd)}
        </div>
      </button>
    {/each}
  </div>
{:else}
  <div class="search-results no-results">
    <span>{$_('search.noResults')}</span>
  </div>
{/if}

<style>
  .search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-height: 300px;
    overflow-y: auto;
    background: var(--bg);
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 100;
  }

  :global([data-theme='greenboard']) .search-results,
  :global([data-theme='dotsD']) .search-results,
  :global([data-theme='dotsF']) .search-results {
    border-color: rgba(255, 255, 255, 0.15);
  }

  .search-results.no-results {
    padding: 1rem;
    text-align: center;
    color: var(--text);
    opacity: 0.7;
  }

  .result-item {
    display: block;
    width: 100%;
    padding: 0.75rem 1rem;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    color: var(--text);
  }

  .result-item:last-child {
    border-bottom: none;
  }

  .result-item:hover,
  .result-item.selected {
    background: rgba(0, 0, 0, 0.05);
  }

  :global([data-theme='greenboard']) .result-item:hover,
  :global([data-theme='greenboard']) .result-item.selected,
  :global([data-theme='dotsD']) .result-item:hover,
  :global([data-theme='dotsD']) .result-item.selected,
  :global([data-theme='dotsF']) .result-item:hover,
  :global([data-theme='dotsF']) .result-item.selected {
    background: rgba(255, 255, 255, 0.1);
  }

  .result-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .leaf-title {
    font-weight: 500;
    font-size: 0.9rem;
  }

  .note-name {
    font-size: 0.8rem;
    opacity: 0.7;
  }

  .result-snippet {
    font-size: 0.85rem;
    opacity: 0.8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .result-snippet mark {
    background: var(--accent);
    color: var(--bg);
    padding: 0 0.15rem;
    border-radius: 2px;
  }
</style>
