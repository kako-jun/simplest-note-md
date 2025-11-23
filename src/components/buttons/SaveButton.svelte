<script lang="ts">
  import { _ } from '../../lib/i18n'

  export let onSave: () => void
  export let isDirty: boolean
</script>

<button
  type="button"
  class="primary save-button"
  on:click={onSave}
  title={$_('common.save')}
  aria-label={$_('common.save')}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
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
  {#if isDirty}
    <span class="notification-badge"></span>
  {/if}
</button>
