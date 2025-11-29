<script lang="ts">
  import { _ } from '../../lib/i18n'
  import OctocatPushIcon from '../icons/OctocatPushIcon.svelte'

  export let onSave: () => void
  export let isDirty: boolean
  export let disabled: boolean = false
  /** 無効時の理由（クリックしたらトースト表示） */
  export let disabledReason: string = ''
  /** 無効時のクリックハンドラ */
  export let onDisabledClick: ((reason: string) => void) | null = null

  function handleClick() {
    if (disabled) {
      if (disabledReason && onDisabledClick) {
        onDisabledClick(disabledReason)
      }
    } else {
      onSave()
    }
  }
</script>

<div class="save-button-wrapper">
  <button
    type="button"
    class="save-button"
    class:disabled
    on:click={handleClick}
    title={$_('common.save')}
    aria-label={$_('common.save')}
  >
    <OctocatPushIcon />
  </button>
  {#if isDirty}
    <span class="notification-badge"></span>
  {/if}
</div>

<style>
  .save-button-wrapper {
    position: relative;
  }

  .save-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    color: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.2s;
  }

  .save-button:hover:not(.disabled) {
    opacity: 0.7;
  }

  .save-button.disabled {
    opacity: 0.4;
    cursor: pointer;
  }

  .save-button :global(svg) {
    width: 32px;
    height: 20px;
  }

  .notification-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 8px;
    height: 8px;
    background: #ef4444;
    border-radius: 50%;
    pointer-events: none;
  }
</style>
