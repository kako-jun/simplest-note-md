/**
 * スクロール同期機能
 * 左右ペインで同じリーフを編集/プレビューで開いている場合のスクロール同期
 */
import type { Leaf, View } from '../types'
import type { Pane } from '../navigation'

export interface ScrollSyncState {
  isDualPane: boolean
  leftLeaf: Leaf | null
  rightLeaf: Leaf | null
  leftView: View
  rightView: View
}

export interface ScrollSyncViews {
  leftEditorView: any
  leftPreviewView: any
  rightEditorView: any
  rightPreviewView: any
}

/**
 * ペインスクロール時の同期処理（統一版）
 */
export function handlePaneScroll(
  pane: Pane,
  scrollTop: number,
  scrollHeight: number,
  state: ScrollSyncState,
  views: ScrollSyncViews
): void {
  const { isDualPane, leftLeaf, rightLeaf, leftView, rightView } = state
  const { leftEditorView, leftPreviewView, rightEditorView, rightPreviewView } = views

  // 同じリーフで、edit/previewが逆の場合のみ同期
  if (!isDualPane || !leftLeaf || !rightLeaf || leftLeaf.id !== rightLeaf.id) return

  const ownView = pane === 'left' ? leftView : rightView
  const otherView = pane === 'left' ? rightView : leftView
  const shouldSync =
    (ownView === 'edit' && otherView === 'preview') ||
    (ownView === 'preview' && otherView === 'edit')

  if (shouldSync) {
    const targetEditor = pane === 'left' ? rightEditorView : leftEditorView
    const targetPreview = pane === 'left' ? rightPreviewView : leftPreviewView
    const target = otherView === 'edit' ? targetEditor : targetPreview
    if (target && target.scrollTo) {
      target.scrollTo(scrollTop)
    }
  }
}

/**
 * 左ペインスクロールハンドラー（後方互換性）
 */
export function createLeftScrollHandler(
  getState: () => ScrollSyncState,
  getViews: () => ScrollSyncViews
) {
  return (scrollTop: number, scrollHeight: number) => {
    handlePaneScroll('left', scrollTop, scrollHeight, getState(), getViews())
  }
}

/**
 * 右ペインスクロールハンドラー（後方互換性）
 */
export function createRightScrollHandler(
  getState: () => ScrollSyncState,
  getViews: () => ScrollSyncViews
) {
  return (scrollTop: number, scrollHeight: number) => {
    handlePaneScroll('right', scrollTop, scrollHeight, getState(), getViews())
  }
}
