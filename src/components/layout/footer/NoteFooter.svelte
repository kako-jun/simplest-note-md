<script lang="ts">
  import { _ } from '../../../lib/i18n'
  import Footer from '../Footer.svelte'
  import IconButton from '../../buttons/IconButton.svelte'
  import SaveButton from '../../buttons/SaveButton.svelte'
  import DeleteIcon from '../../icons/DeleteIcon.svelte'
  import FolderPlusIcon from '../../icons/FolderPlusIcon.svelte'
  import FilePlusIcon from '../../icons/FilePlusIcon.svelte'
  import MoveIcon from '../../icons/MoveIcon.svelte'

  export let onDeleteNote: () => void
  export let onMove: () => void
  export let onCreateSubNote: (name: string) => void
  export let onCreateLeaf: (name: string) => void
  export let onSave: () => void
  export let disabled: boolean
  export let isDirty: boolean
  export let canHaveSubNote: boolean
  export let saveDisabled: boolean = false
  export let saveDisabledReason: string = ''
  export let onDisabledSaveClick: ((reason: string) => void) | null = null
</script>

<Footer>
  <svelte:fragment slot="left">
    <IconButton
      onClick={onDeleteNote}
      title={$_('footer.deleteNote')}
      ariaLabel={$_('footer.deleteNote')}
      {disabled}
    >
      <DeleteIcon />
    </IconButton>

    <IconButton onClick={onMove} title="移動" ariaLabel="移動" {disabled}>
      <MoveIcon />
    </IconButton>

    {#if canHaveSubNote}
      <IconButton
        onClick={() => onCreateSubNote('')}
        title={$_('footer.newNote')}
        ariaLabel={$_('footer.newNote')}
        {disabled}
      >
        <FolderPlusIcon />
      </IconButton>
    {/if}

    <IconButton
      onClick={() => onCreateLeaf('')}
      title={$_('footer.newLeaf')}
      ariaLabel={$_('footer.newLeaf')}
      {disabled}
    >
      <FilePlusIcon />
    </IconButton>
  </svelte:fragment>
  <svelte:fragment slot="right">
    <SaveButton
      {onSave}
      {isDirty}
      disabled={saveDisabled}
      disabledReason={saveDisabledReason}
      onDisabledClick={onDisabledSaveClick}
    />
  </svelte:fragment>
</Footer>
