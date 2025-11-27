/**
 * ドラッグ&ドロップユーティリティ
 * ノートとリーフの並び替えロジックを統一
 */

/**
 * ドラッグ&ドロップの汎用ヘルパー関数
 */

export function handleDragStart<T extends { id: string }>(
  item: T,
  setDragged: (item: T | null) => void,
  setDragOver: (id: string | null) => void
) {
  setDragged(item)
  setDragOver(null)
}

export function handleDragEnd(
  setDragged: (item: null) => void,
  setDragOver: (id: string | null) => void
) {
  setDragged(null)
  setDragOver(null)
}

export function handleDragOver<T extends { id: string }>(
  e: DragEvent,
  targetItem: T,
  draggedItem: T | null,
  isSameGroup: (dragged: T, target: T) => boolean,
  setDragOver: (id: string | null) => void
) {
  e.preventDefault()
  if (!draggedItem || draggedItem.id === targetItem.id) {
    setDragOver(null)
    return
  }
  if (!isSameGroup(draggedItem, targetItem)) {
    setDragOver(null)
    return
  }
  setDragOver(targetItem.id)
}

/**
 * ドロップ時の並び替えロジック
 * @param draggedItem ドラッグ中のアイテム
 * @param targetItem ドロップ先のアイテム
 * @param allItems 全アイテムリスト
 * @param filterSameGroup 同じグループのアイテムをフィルタリングする関数
 * @returns 並び替え後のアイテムリスト
 */
export function reorderItems<T extends { id: string; order: number }>(
  draggedItem: T,
  targetItem: T,
  allItems: T[],
  filterSameGroup: (item: T) => boolean
): T[] {
  const targetList = allItems.filter(filterSameGroup).sort((a, b) => a.order - b.order)

  const fromIndex = targetList.findIndex((item) => item.id === draggedItem.id)
  const toIndex = targetList.findIndex((item) => item.id === targetItem.id)

  const reordered = [...targetList]
  const [movedItem] = reordered.splice(fromIndex, 1)
  reordered.splice(toIndex, 0, movedItem)

  // order を更新
  const updatedItems = allItems.map((item) => {
    const newOrderIndex = reordered.findIndex((r) => r.id === item.id)
    if (newOrderIndex !== -1) {
      return { ...item, order: newOrderIndex }
    }
    return item
  })

  return updatedItems
}
