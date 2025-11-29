/**
 * オフラインリーフ（Offline Leaf）ユーティリティ
 *
 * ローカル専用のメモ機能。GitHubとの同期対象外で、
 * IndexedDBにのみ保存される。オフライン時でも即座にメモを取れる。
 */

import type { Leaf } from '../types'

/**
 * オフラインリーフの固定名
 */
export const OFFLINE_LEAF_NAME = 'Offline'

/**
 * オフラインリーフの固定ID（Gitには保存しない）
 */
export const OFFLINE_LEAF_ID = '__offline__'

/**
 * オフラインリーフの初期コンテンツ
 */
export function getOfflineLeafInitialContent(): string {
  return `# ${OFFLINE_LEAF_NAME}\n\n`
}

/**
 * オフラインリーフを生成する（ホーム直下なのでnoteIdは空）
 * @param content 現在のコンテンツ（なければ初期コンテンツ）
 * @param badgeIcon バッジアイコン（metadataから復元）
 * @param badgeColor バッジカラー（metadataから復元）
 */
export function createOfflineLeaf(content?: string, badgeIcon?: string, badgeColor?: string): Leaf {
  return {
    id: OFFLINE_LEAF_ID,
    title: OFFLINE_LEAF_NAME,
    noteId: '',
    content: content || getOfflineLeafInitialContent(),
    updatedAt: Date.now(),
    order: -1, // Priorityより前に表示
    badgeIcon,
    badgeColor,
  }
}

/**
 * リーフIDがオフラインリーフかどうかを判定
 */
export function isOfflineLeaf(leafId: string): boolean {
  return leafId === OFFLINE_LEAF_ID
}
