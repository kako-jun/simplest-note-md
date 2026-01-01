/**
 * Stale定期チェッカー
 *
 * リモートに新しい変更があるかを定期的にチェックし、
 * stale状態を検出したらisStaleストアをtrueにする。
 *
 * - 前回のチェックから5分経過後にチェック
 * - アクティブタブ（visible）のときのみ
 * - Pull/Push中はスキップ
 * - サイレント実行（UIブロックなし、通知なし）
 */

import { get, writable } from 'svelte/store'
import type { Settings } from '../types'
import type { StaleCheckResult } from '../api/sync'
import {
  settings,
  isPulling,
  isPushing,
  isStale,
  lastStaleCheckTime,
  lastPulledPushCount,
  githubConfigured,
} from './stores'
import { checkStaleStatus as checkStaleStatusRaw } from '../api/sync'

/**
 * staleチェックを実行し、時刻を更新する共通関数
 * 全ての呼び元（定期チェック、Pull/Push前）でこの関数を使用する
 */
export async function executeStaleCheck(
  settingsValue: Settings,
  lastPulledCount: number
): Promise<StaleCheckResult> {
  const result = await checkStaleStatusRaw(settingsValue, lastPulledCount)
  // チェック時刻を更新（成功・失敗に関わらず）
  lastStaleCheckTime.set(Date.now())
  return result
}

/** チェック間隔（ミリ秒） */
const CHECK_INTERVAL_MS = 5 * 60 * 1000 // 5分

/**
 * staleチェック進捗（0〜1）
 * 前回チェックからの経過時間を表示
 * 0 = チェック直後、1 = 次のチェック直前
 */
export const staleCheckProgress = writable<number>(0)

let progressIntervalId: ReturnType<typeof setInterval> | null = null

/**
 * 定期チェックを実行
 * - 条件を満たさない場合は何もしない
 * - stale検出時はisStaleをtrueにするだけ
 */
async function checkIfNeeded(): Promise<void> {
  // 条件チェック（canPerformCheckで既にチェック済みだが、念のため）
  if (!canPerformCheck()) {
    return
  }

  // サイレントにstaleチェック（共通関数を使用）
  try {
    const result = await executeStaleCheck(get(settings), get(lastPulledPushCount))
    if (result.status === 'stale') {
      isStale.set(true)
    }
    // up_to_date や check_failed の場合は何もしない（エラー通知もしない）
  } catch {
    // ネットワークエラー等は無視（executeStaleCheck内で時刻は更新済み）
  }
}

/**
 * チェック実行の条件を満たしているか
 */
function canPerformCheck(): boolean {
  // GitHub未設定
  if (!get(githubConfigured)) {
    return false
  }

  // タブが非アクティブ
  if (document.visibilityState !== 'visible') {
    return false
  }

  // Pull/Push中
  if (get(isPulling) || get(isPushing)) {
    return false
  }

  // まだ一度もチェックしていない（初回Pull前）
  if (get(lastStaleCheckTime) === 0) {
    return false
  }

  return true
}

/**
 * 進捗バーを更新し、必要ならチェックを実行
 */
async function updateProgressAndCheck(): Promise<void> {
  // 条件が整っていなければバーを表示しない
  if (!canPerformCheck()) {
    staleCheckProgress.set(0)
    return
  }

  const lastCheck = get(lastStaleCheckTime)
  const elapsed = Date.now() - lastCheck
  const progress = Math.min(elapsed / CHECK_INTERVAL_MS, 1)
  staleCheckProgress.set(progress)

  // 5分経過したらチェックを実行
  if (progress >= 1) {
    await checkIfNeeded()
  }
}

/**
 * 定期チェッカーを開始
 */
export function startStaleChecker(): void {
  if (progressIntervalId !== null) {
    return // 既に開始済み
  }

  // 進捗更新タイマー（1秒ごと）- チェックもここでトリガー
  progressIntervalId = setInterval(updateProgressAndCheck, 1000)
}

/**
 * 定期チェッカーを停止
 */
export function stopStaleChecker(): void {
  if (progressIntervalId !== null) {
    clearInterval(progressIntervalId)
    progressIntervalId = null
  }
  staleCheckProgress.set(0)
}
