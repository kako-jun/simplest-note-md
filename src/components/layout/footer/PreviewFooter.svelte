<script lang="ts">
  import { _ } from '../../../lib/i18n'
  import type { WorldType } from '../../../lib/types'
  import Footer from '../Footer.svelte'
  import IconButton from '../../buttons/IconButton.svelte'
  import PushButton from '../../buttons/PushButton.svelte'
  import DownloadIcon from '../../icons/DownloadIcon.svelte'
  import FileEditIcon from '../../icons/FileEditIcon.svelte'
  import MoveIcon from '../../icons/MoveIcon.svelte'
  import ArchiveIcon from '../../icons/ArchiveIcon.svelte'
  import RestoreIcon from '../../icons/RestoreIcon.svelte'

  export let onMove: () => void
  export let onDownload: () => void
  export let onToggleEdit: () => void
  export let onPush: () => void
  export let disabled: boolean
  export let isDirty: boolean
  export let pushDisabled: boolean = false
  export let pushDisabledReason: string = ''
  export let onDisabledPushClick: ((reason: string) => void) | null = null
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

    <PushButton
      {onPush}
      {isDirty}
      disabled={pushDisabled}
      disabledReason={pushDisabledReason}
      onDisabledClick={onDisabledPushClick}
    />
  </svelte:fragment>
</Footer>
