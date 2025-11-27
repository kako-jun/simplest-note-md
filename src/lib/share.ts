/**
 * シェア機能（URL、Markdown、画像のコピー・共有）
 */
import type { Leaf } from './types'
import type { Pane } from './navigation'
import { showPushToast } from './ui'

export interface ShareHandlers {
  translate: (key: string) => string
  getLeaf: (pane: Pane) => Leaf | null
  getView: (pane: Pane) => string
  getPreviewView: (pane: Pane) => any
}

/**
 * URLをクリップボードにコピー
 */
export function handleCopyUrl(pane: Pane, translate: (key: string) => string): void {
  const url = window.location.href
  navigator.clipboard
    .writeText(url)
    .then(() => {
      showPushToast(translate('share.urlCopied'), 'success')
    })
    .catch((err) => {
      console.error('URLのコピーに失敗しました:', err)
      showPushToast(translate('share.urlCopied'), 'error')
    })
}

/**
 * Markdownをクリップボードにコピー（プレビューモード時は画像をコピー）
 */
export async function handleCopyMarkdown(pane: Pane, handlers: ShareHandlers): Promise<void> {
  const { translate, getLeaf, getView, getPreviewView } = handlers
  const leaf = getLeaf(pane)
  const view = getView(pane)

  if (!leaf) return

  // プレビューモード時は画像をコピー
  if (view === 'preview') {
    await handleCopyImageToClipboard(pane, handlers)
    return
  }

  // 編集モード時はMarkdownをコピー
  navigator.clipboard
    .writeText(leaf.content)
    .then(() => {
      showPushToast(translate('share.markdownCopied'), 'success')
    })
    .catch((err) => {
      console.error('Markdownのコピーに失敗しました:', err)
      showPushToast(translate('share.markdownCopied'), 'error')
    })
}

/**
 * 画像をクリップボードにコピー
 */
export async function handleCopyImageToClipboard(
  pane: Pane,
  handlers: ShareHandlers
): Promise<void> {
  const { translate, getPreviewView } = handlers
  const previewView = getPreviewView(pane)

  if (!previewView || !previewView.copyImageToClipboard) return

  try {
    await previewView.copyImageToClipboard()
    showPushToast(translate('share.imageCopied'), 'success')
  } catch (error) {
    console.error('画像のコピーに失敗しました:', error)
    showPushToast(translate('share.imageCopyFailed'), 'error')
  }
}

/**
 * Web Share APIで画像を共有
 */
export async function handleShareImage(pane: Pane, handlers: ShareHandlers): Promise<void> {
  const { translate, getLeaf, getPreviewView } = handlers
  const leaf = getLeaf(pane)
  const previewView = getPreviewView(pane)

  if (!leaf || !previewView || !previewView.shareImage) return

  try {
    await previewView.shareImage(leaf.title)
    // 成功時はトーストを表示しない（共有ダイアログで完結するため）
  } catch (error: any) {
    // Web Share APIがサポートされていない場合はクリップボードにコピー
    if (error.message === 'Web Share API is not supported') {
      await handleCopyImageToClipboard(pane, handlers)
    } else if (error.name === 'AbortError') {
      // ユーザーが共有をキャンセルした場合は何もしない
    } else {
      console.error('共有に失敗しました:', error)
      showPushToast(translate('share.shareFailed'), 'error')
    }
  }
}
