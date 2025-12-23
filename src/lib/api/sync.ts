import type { Note, Leaf, Settings, Metadata, StaleCheckResult } from '../types'
import { pushAllWithTreeAPI, pullFromGitHub, fetchRemotePushCount } from './github'
import type { PullOptions, RateLimitInfo } from './github'

export type { PullOptions, PullPriority, LeafSkeleton, RateLimitInfo } from './github'
export type { StaleCheckResult } from '../types'

/**
 * Push操作の結果
 */
export interface PushResult {
  success: boolean
  message: string
  variant: 'success' | 'error'
  rateLimitInfo?: RateLimitInfo
  /** 変更されたリーフの数（コンテンツ変更のみカウント） */
  changedLeafCount?: number
  /** メタデータのみ変更されたか（リーフ変更なしでメタデータ変更あり） */
  metadataOnlyChanged?: boolean
}

/**
 * Pull操作の結果
 */
export interface PullResult {
  success: boolean
  message: string
  variant: 'success' | 'error'
  notes: Note[]
  leaves: Leaf[]
  metadata: Metadata
  rateLimitInfo?: RateLimitInfo
}

/**
 * Push操作のオプション
 */
export interface ExecutePushOptions {
  leaves: Leaf[]
  notes: Note[]
  settings: Settings
  isOperationsLocked: boolean
  localMetadata?: Metadata
  /** アーカイブのリーフ（ロード済みの場合のみ） */
  archiveLeaves?: Leaf[]
  /** アーカイブのノート（ロード済みの場合のみ） */
  archiveNotes?: Note[]
  /** アーカイブのメタデータ（ロード済みの場合のみ） */
  archiveMetadata?: Metadata
  /** アーカイブがロード済みかどうか */
  isArchiveLoaded?: boolean
}

/**
 * 全リーフをGitHubにPush（Git Tree APIを使用）
 *
 * Git Tree APIにより、1コミットで全変更を反映：
 * - リネーム・削除されたファイルも正しく処理
 * - APIリクエスト数を最小化（約6回）
 * - IndexedDBには一切触らない（メモリ上のみで処理）
 *
 * @param options - Push操作のオプション
 * @returns Push結果
 */
export async function executePush(options: ExecutePushOptions): Promise<PushResult> {
  const {
    leaves,
    notes,
    settings,
    isOperationsLocked,
    localMetadata,
    archiveLeaves,
    archiveNotes,
    archiveMetadata,
    isArchiveLoaded,
  } = options

  // 操作ロック中はエラー
  if (isOperationsLocked) {
    return {
      success: false,
      message: 'toast.pushFailed',
      variant: 'error',
    }
  }

  // リーフが空の場合はエラー
  if (leaves.length === 0) {
    return {
      success: false,
      message: 'toast.noLeaves',
      variant: 'error',
    }
  }

  // Git Tree APIで一括Push（アーカイブデータも含む）
  const result = await pushAllWithTreeAPI({
    leaves,
    notes,
    settings,
    localMetadata,
    archiveLeaves,
    archiveNotes,
    archiveMetadata,
    isArchiveLoaded,
  })

  return {
    success: result.success,
    message: result.message,
    variant: result.success ? 'success' : 'error',
    rateLimitInfo: result.rateLimitInfo,
    changedLeafCount: result.changedLeafCount,
    metadataOnlyChanged: result.metadataOnlyChanged,
  }
}

/**
 * GitHubから全データをPull
 *
 * 重要: GitHubが唯一の真実の情報源（Single Source of Truth）
 * IndexedDBは単なるキャッシュであり、Pull成功時に全削除→全作成される
 *
 * @param settings - GitHub設定
 * @param options - Pull時のオプション（優先度、コールバック）
 * @returns Pull結果
 */
export async function executePull(settings: Settings, options?: PullOptions): Promise<PullResult> {
  const result = await pullFromGitHub(settings, options)

  if (result.success) {
    return {
      success: true,
      message: result.message,
      variant: 'success',
      notes: result.notes,
      leaves: result.leaves,
      metadata: result.metadata,
    }
  } else {
    return {
      success: false,
      message: result.message,
      variant: 'error',
      notes: [],
      leaves: [],
      metadata: result.metadata,
      rateLimitInfo: result.rateLimitInfo,
    }
  }
}

/**
 * Stale編集かどうかを判定
 *
 * ## Stale（ステイル）とは
 * 「Stale = 古くなった」状態を指す。
 * 例: PCでPull→スマホで編集してPush→PCで編集を続行
 * この時、PCのローカルデータはリモートより古い（Stale）状態。
 *
 * ## 処理フェーズ
 *   Phase 1: リモートのpushCount取得
 *   Phase 2: 結果に応じた状態判定
 *
 * ## 戻り値の状態
 * - stale: リモートに新しい変更あり（Push前にPullが必要）
 * - up_to_date: 最新状態（Pushして良い）
 * - check_failed: チェック失敗（設定不正、認証エラー、ネットワークエラー等）
 *
 * @param settings - GitHub設定
 * @param lastPulledPushCount - 最後にPullしたときのpushCount
 * @returns StaleCheckResult - 明確な状態を持つ結果オブジェクト
 */
export async function checkStaleStatus(
  settings: Settings,
  lastPulledPushCount: number
): Promise<StaleCheckResult> {
  // Phase 1: リモートのpushCount取得
  const result = await fetchRemotePushCount(settings)

  // Phase 2: 結果に応じた状態判定
  switch (result.status) {
    case 'success': {
      const remotePushCount = result.pushCount
      if (remotePushCount > lastPulledPushCount) {
        return {
          status: 'stale',
          remotePushCount,
          localPushCount: lastPulledPushCount,
        }
      }
      return { status: 'up_to_date' }
    }

    case 'empty_repository':
      // 空リポジトリ = まだ誰もPushしていない → 最新状態として扱う
      return { status: 'up_to_date' }

    case 'settings_invalid':
    case 'auth_error':
    case 'network_error':
      // チェック失敗 - 理由を添えて返す
      return { status: 'check_failed', reason: result }
  }
}
