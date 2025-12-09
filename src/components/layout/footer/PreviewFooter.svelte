<script lang="ts">
  import { _ } from '../../../lib/i18n'
  import type { WorldType } from '../../../lib/types'
  import Footer from '../Footer.svelte'
  import IconButton from '../../buttons/IconButton.svelte'
  import SaveButton from '../../buttons/SaveButton.svelte'
  import DownloadIcon from '../../icons/DownloadIcon.svelte'
  import FileEditIcon from '../../icons/FileEditIcon.svelte'
  import MoveIcon from '../../icons/MoveIcon.svelte'
  import ArchiveIcon from '../../icons/ArchiveIcon.svelte'
  import RestoreIcon from '../../icons/RestoreIcon.svelte'

  export let onMove: () => void
  export let onDownload: () => void
  export let onToggleEdit: () => void
  export let onSave: () => void
  export let disabled: boolean
  export let isDirty: boolean
  export let saveDisabled: boolean = false
  export let saveDisabledReason: string = ''
  export let onDisabledSaveClick: ((reason: string) => void) | null = null
  export let hideEditButton: boolean = false
  export let hideMoveButton: boolean = false
  /** 現在のワールド */
  export let currentWorld: WorldType = 'home'
  /** アーカイブ/リストアのコールバック */
  export let onArchive: (() => void) | null = null
  export let onRestore: (() => void) | null = null
</script>

<Footer>
  <svelte:fragment slot="left">
    {#if !hideMoveButton}
      <IconButton
        onClick={onMove}
        title={$_('footer.move')}
        ariaLabel={$_('footer.move')}
        {disabled}
      >
        <MoveIcon />
      </IconButton>

      <!-- アーカイブ/リストアボタン -->
      {#if currentWorld === 'home' && onArchive}
        <IconButton
          onClick={onArchive}
          title={$_('footer.archive')}
          ariaLabel={$_('footer.archive')}
          {disabled}
        >
          <ArchiveIcon />
        </IconButton>
      {:else if currentWorld === 'archive' && onRestore}
        <IconButton
          onClick={onRestore}
          title={$_('footer.restore')}
          ariaLabel={$_('footer.restore')}
          {disabled}
        >
          <RestoreIcon />
        </IconButton>
      {/if}
    {/if}

    <IconButton
      onClick={onDownload}
      title={$_('footer.downloadImage')}
      ariaLabel={$_('footer.downloadImage')}
      {disabled}
    >
      <DownloadIcon />
    </IconButton>
  </svelte:fragment>
  <svelte:fragment slot="right">
    {#if !hideEditButton}
      <IconButton onClick={onToggleEdit} title={$_('footer.edit')} ariaLabel={$_('footer.edit')}>
        <FileEditIcon />
      </IconButton>
    {/if}

    <SaveButton
      {onSave}
      {isDirty}
      disabled={saveDisabled}
      disabledReason={saveDisabledReason}
      onDisabledClick={onDisabledSaveClick}
    />
  </svelte:fragment>
</Footer>
