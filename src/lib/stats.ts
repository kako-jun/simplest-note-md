/**
 * リーフ統計の計算と管理
 */
import type { Leaf, Note } from './types'
import { isLeafSaveable } from './priority'

export interface LeafStats {
  leafCharCounts: Map<string, number>
  totalLeafCount: number
  totalLeafChars: number
}

/**
 * リーフのコンテンツから空白を除いた文字数を計算
 */
export function computeLeafCharCount(content: string): number {
  return content.replace(/\s+/g, '').length
}

/**
 * 全リーフの統計を再構築
 */
export function rebuildLeafStats(allLeaves: Leaf[], allNotes: Note[]): LeafStats {
  const leafCharCounts = new Map<string, number>()
  let totalLeafCount = 0
  let totalLeafChars = 0

  for (const leaf of allLeaves) {
    // ホーム直下のリーフ（仮想リーフ）は統計から除外
    if (!isLeafSaveable(leaf, allNotes)) continue

    const chars = computeLeafCharCount(leaf.content)
    leafCharCounts.set(leaf.id, chars)
    totalLeafCount += 1
    totalLeafChars += chars
  }

  return { leafCharCounts, totalLeafCount, totalLeafChars }
}

/**
 * リーフ作成時の統計更新
 */
export function addLeafToStats(stats: LeafStats, leafId: string, content: string): LeafStats {
  const chars = computeLeafCharCount(content)
  const newCharCounts = new Map(stats.leafCharCounts)
  newCharCounts.set(leafId, chars)

  return {
    leafCharCounts: newCharCounts,
    totalLeafCount: stats.totalLeafCount + 1,
    totalLeafChars: stats.totalLeafChars + chars,
  }
}

/**
 * リーフ削除時の統計更新
 */
export function removeLeafFromStats(
  stats: LeafStats,
  leafId: string,
  previousContent: string
): LeafStats {
  const prevChars = stats.leafCharCounts.get(leafId) ?? computeLeafCharCount(previousContent)
  const newCharCounts = new Map(stats.leafCharCounts)
  newCharCounts.delete(leafId)

  return {
    leafCharCounts: newCharCounts,
    totalLeafCount: Math.max(0, stats.totalLeafCount - 1),
    totalLeafChars: Math.max(0, stats.totalLeafChars - prevChars),
  }
}

/**
 * リーフコンテンツ更新時の統計更新
 */
export function updateLeafStats(
  stats: LeafStats,
  leafId: string,
  previousContent: string,
  newContent: string
): LeafStats {
  const previousChars = stats.leafCharCounts.get(leafId) ?? computeLeafCharCount(previousContent)
  const nextChars = computeLeafCharCount(newContent)
  const newCharCounts = new Map(stats.leafCharCounts)
  newCharCounts.set(leafId, nextChars)

  return {
    leafCharCounts: newCharCounts,
    totalLeafCount: stats.totalLeafCount,
    totalLeafChars: stats.totalLeafChars + (nextChars - previousChars),
  }
}
