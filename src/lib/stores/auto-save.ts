/**
 * 自動保存機構
 * ユーザー操作を検知し、無操作が一定時間続いたら自動保存を実行
 */

import { get } from 'svelte/store'
import { leaves, notes, offlineLeafStore } from './stores'
import { saveLeaves, saveNotes, saveOfflineLeaf } from '../data/storage'
import { createOfflineLeaf } from '../utils/offline'

// デバウンス間隔（ミリ秒）
const AUTO_SAVE_DELAY = 1000

// 保存が必要かどうかのフラグ
let pendingLeavesSave = false
let pendingNotesSave = false
let pendingOfflineSave = false

// タイマーID
let activityTimerId: ReturnType<typeof setTimeout> | null = null

// 初期化済みフラグ
let initialized = false

/**
 * リーフ保存をスケジュール
 */
export function scheduleLeavesSave(): void {
  pendingLeavesSave = true
  resetActivityTimer()
}

/**
 * ノート保存をスケジュール
 */
export function scheduleNotesSave(): void {
  pendingNotesSave = true
  resetActivityTimer()
}

/**
 * オフラインリーフ保存をスケジュール
 */
export function scheduleOfflineSave(): void {
  pendingOfflineSave = true
  resetActivityTimer()
}

/**
 * 保留中の保存を即座に実行
 */
export async function flushPendingSaves(): Promise<void> {
  if (activityTimerId) {
    clearTimeout(activityTimerId)
    activityTimerId = null
  }
  await executePendingSaves()
}

/**
 * 保留中の保存を実行（内部用）
 */
async function executePendingSaves(): Promise<void> {
  const promises: Promise<void>[] = []

  if (pendingLeavesSave) {
    pendingLeavesSave = false
    const currentLeaves = get(leaves)
    promises.push(
      saveLeaves(currentLeaves).catch((err) => console.error('Failed to persist leaves:', err))
    )
  }

  if (pendingNotesSave) {
    pendingNotesSave = false
    const currentNotes = get(notes)
    promises.push(
      saveNotes(currentNotes).catch((err) => console.error('Failed to persist notes:', err))
    )
  }

  if (pendingOfflineSave) {
    pendingOfflineSave = false
    const current = get(offlineLeafStore)
    const leaf = createOfflineLeaf(current.content, current.badgeIcon, current.badgeColor)
    leaf.updatedAt = current.updatedAt
    promises.push(
      saveOfflineLeaf(leaf).catch((err) => console.error('Failed to persist offline leaf:', err))
    )
  }

  await Promise.all(promises)
}

/**
 * アクティビティタイマーをリセット
 * 最後の操作から AUTO_SAVE_DELAY ミリ秒後に保存を実行
 */
function resetActivityTimer(): void {
  if (activityTimerId) {
    clearTimeout(activityTimerId)
  }
  activityTimerId = setTimeout(() => {
    activityTimerId = null
    executePendingSaves()
  }, AUTO_SAVE_DELAY)
}

/**
 * ユーザーアクティビティを検知するイベントハンドラ
 */
function handleUserActivity(): void {
  // 保留中の保存がある場合のみタイマーをリセット
  if (pendingLeavesSave || pendingNotesSave || pendingOfflineSave) {
    resetActivityTimer()
  }
}

/**
 * アクティビティ検知を初期化
 * App.svelte の onMount で呼び出す
 */
export function initActivityDetection(): () => void {
  if (initialized) {
    return () => {}
  }
  initialized = true

  // 検知するイベント
  const events = ['keydown', 'keyup', 'click', 'touchstart', 'scroll', 'mousemove']

  // passive: true でパフォーマンス向上
  const options: AddEventListenerOptions = { passive: true, capture: true }

  events.forEach((event) => {
    document.addEventListener(event, handleUserActivity, options)
  })

  // クリーンアップ関数を返す
  return () => {
    events.forEach((event) => {
      document.removeEventListener(event, handleUserActivity, options)
    })
    if (activityTimerId) {
      clearTimeout(activityTimerId)
      activityTimerId = null
    }
    initialized = false
  }
}

/**
 * ページ離脱時に保留中の保存を実行
 */
export function setupBeforeUnloadSave(): () => void {
  const handler = () => {
    // beforeunload では非同期処理が完了する保証がないため、
    // 同期的に実行できる範囲で保存をトリガー
    if (pendingLeavesSave || pendingNotesSave || pendingOfflineSave) {
      executePendingSaves()
    }
  }

  window.addEventListener('beforeunload', handler)
  return () => window.removeEventListener('beforeunload', handler)
}
