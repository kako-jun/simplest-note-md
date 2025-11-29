<script lang="ts">
  import { _ } from '../../../lib/i18n'
  import Footer from '../Footer.svelte'
  import IconButton from '../../buttons/IconButton.svelte'
  import SaveButton from '../../buttons/SaveButton.svelte'
  import DeleteIcon from '../../icons/DeleteIcon.svelte'
  import DownloadIcon from '../../icons/DownloadIcon.svelte'
  import EyeIcon from '../../icons/EyeIcon.svelte'
  import MoveIcon from '../../icons/MoveIcon.svelte'

  export let onDelete: () => void
  export let onMove: () => void
  export let onDownload: () => void
  export let onTogglePreview: () => void
  export let onSave: () => void
  export let disabled: boolean
  export let isDirty: boolean
  export let saveDisabled: boolean = false
  export let saveDisabledReason: string = ''
  export let onDisabledSaveClick: ((reason: string) => void) | null = null
  export let hideDeleteMove: boolean = false
  export let getHasSelection: (() => boolean) | null = null

  let downloadTitle = $_('footer.download')

  // マウスエンター時に選択状態をチェックしてtitleを更新
  function updateDownloadTitle() {
    downloadTitle =
      getHasSelection && getHasSelection() ? $_('footer.downloadSelection') : $_('footer.download')
  }

  // ダウンロードボタンクリック時
  function handleDownload() {
    onDownload()
  }
</script>

<Footer>
  <svelte:fragment slot="left">
    {#if !hideDeleteMove}
      <IconButton
        onClick={onDelete}
        title={$_('footer.deleteLeaf')}
        ariaLabel={$_('footer.deleteLeaf')}
        {disabled}
      >
        <DeleteIcon />
      </IconButton>

      <IconButton onClick={onMove} title="移動" ariaLabel="移動" {disabled}>
        <MoveIcon />
      </IconButton>
    {/if}

    <IconButton
      onClick={handleDownload}
      onMouseEnter={updateDownloadTitle}
      title={downloadTitle}
      ariaLabel={downloadTitle}
      {disabled}
    >
      <DownloadIcon />
    </IconButton>
  </svelte:fragment>
  <svelte:fragment slot="right">
    <IconButton
      onClick={onTogglePreview}
      title={$_('footer.preview')}
      ariaLabel={$_('footer.preview')}
    >
      <EyeIcon />
    </IconButton>

    <SaveButton
      {onSave}
      {isDirty}
      disabled={saveDisabled}
      disabledReason={saveDisabledReason}
      onDisabledClick={onDisabledSaveClick}
    />
  </svelte:fragment>
</Footer>
