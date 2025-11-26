<script lang="ts">
  const icons = [
    '★',
    '☆',
    '❤',
    '◆',
    '◇',
    '⬤',
    '⬛',
    '▲',
    '▼',
    '▶',
    '◀',
    '☀',
    '☾',
    '☁',
    '☂',
    '⚡',
    '✓',
    '✕',
    '！',
    '？',
    '＠',
    '＃',
    '＆',
    '♪',
    '✎',
  ]

  const colors = ['#c7a443', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6']

  export let icon: string = ''
  export let color: string = ''
  export let onChange: (icon: string, color: string) => void

  let open = false

  function toggleOpen(event: MouseEvent) {
    event.stopPropagation()
    open = !open
  }

  function selectIcon(newIcon: string) {
    const nextColor = color || colors[0]
    onChange(newIcon, nextColor)
    open = false
  }

  function selectColor(newColor: string) {
    const nextIcon = icon || icons[0]
    onChange(nextIcon, newColor)
    open = false
  }
</script>

<div
  class="badge-container"
  role="presentation"
  on:click|stopPropagation
  on:keydown|stopPropagation
  tabindex="-1"
>
  <button
    class="badge"
    aria-label="badge"
    style={`color: ${color || 'var(--text)'}`}
    on:click|stopPropagation={toggleOpen}
    type="button"
  >
    {icon || '+'}
  </button>
  {#if open}
    <div class="panel">
      <div class="icons">
        {#each icons as ic}
          <button
            type="button"
            class:active={ic === icon}
            style={`color:${color || 'var(--text)'}`}
            on:click={() => selectIcon(ic)}
          >
            {ic}
          </button>
        {/each}
      </div>
      <div class="colors">
        {#each colors as c}
          <button
            type="button"
            class="color"
            class:active={c === color}
            style={`background:${c}`}
            aria-label={`color ${c}`}
            on:click={() => selectColor(c)}
          ></button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .badge-container {
    position: absolute;
    top: 0.35rem;
    right: 0.35rem;
  }

  .badge {
    background: var(--surface-2, rgba(0, 0, 0, 0.08));
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 0.2rem 0.4rem;
    min-width: 1.5rem;
    height: 1.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.9rem;
    line-height: 1;
  }

  .panel {
    position: absolute;
    top: 2rem;
    right: 0;
    background: var(--surface-1, #fff);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.5rem;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
    z-index: 5;
    width: 200px;
  }

  .icons {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.25rem;
    margin-bottom: 0.5rem;
  }

  .icons button {
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--surface-1, #fff);
    cursor: pointer;
    padding: 0.35rem;
    font-size: 0.95rem;
    line-height: 1;
  }

  .icons button.active {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent) inset;
  }

  .colors {
    display: flex;
    gap: 0.4rem;
    justify-content: center;
  }

  .color {
    width: 1.4rem;
    height: 1.4rem;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
  }

  .color.active {
    border-color: var(--border);
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  }
</style>
