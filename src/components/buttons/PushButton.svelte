<script lang="ts">
  import { _ } from '../../lib/i18n'
  import OctocatPushIcon from '../icons/OctocatPushIcon.svelte'

  export let onPush: () => void
  export let isDirty: boolean
  export let disabled: boolean = false
  /** 無効時の理由（クリックしたらトースト表示） */
  export let disabledReason: string = ''
  /** 無効時のクリックハンドラ */
  export let onDisabledClick: ((reason: string) => void) | null = null
  /** DOM ID（ツアー用） */
  export let id: string = ''

  function handleClick() {
    if (disabled) {
      if (disabledReason && onDisabledClick) {
        onDisabledClick(disabledReason)
      }
    } else {
      onPush()
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="push-button-wrapper" id={id || undefined} on:click={handleClick}>
  <button
    type="button"
    class="push-button"
    {disabled}
    title={$_('header.push')}
    aria-label={$_('header.push')}
  >
    <OctocatPushIcon />
  </button>
  {#if isDirty}
    <span class="notification-badge"></span>
  {/if}
</div>

<style>
  .push-button-wrapper {
    position: relative;
  }

  .push-button {
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

  .push-button:hover:not(:disabled) {
    opacity: 0.7;
  }

  .push-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .push-button :global(svg) {
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
