<script lang="ts">
  import { _ } from '../../../lib/i18n'
  import Footer from '../Footer.svelte'
  import SaveButton from '../../buttons/SaveButton.svelte'

  export let onDownload: () => void
  export let onToggleEdit: () => void
  export let onSave: () => void
  export let disabled: boolean
  export let isDirty: boolean
</script>

<Footer>
  <svelte:fragment slot="left">
    <button
      type="button"
      on:click={onDownload}
      title={$_('footer.downloadImage')}
      aria-label={$_('footer.downloadImage')}
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
  </svelte:fragment>
  <svelte:fragment slot="right">
    <button
      type="button"
      on:click={onToggleEdit}
      title={$_('footer.edit')}
      aria-label={$_('footer.edit')}
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
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </button>

    <SaveButton {onSave} {isDirty} />
  </svelte:fragment>
</Footer>
