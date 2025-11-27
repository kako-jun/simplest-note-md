/**
 * GitHub同期のヘルパー関数
 * App.svelteから分離したユーティリティ
 */

import type { RateLimitInfo } from './github'

/**
 * GitHub APIのメッセージキーを翻訳してトースト用テキストに変換
 * rateLimitInfoがある場合は残り時間を含める
 */
export function translateGitHubMessage(
  messageKey: string,
  translate: (key: string, options?: { values?: Record<string, unknown> }) => string,
  rateLimitInfo?: RateLimitInfo
): string {
  // i18nキーでなければそのまま返す（後方互換性のため）
  if (!messageKey.startsWith('github.') && !messageKey.startsWith('toast.')) {
    return messageKey
  }

  // レート制限メッセージの場合、残り時間を含める
  if (messageKey === 'github.rateLimited' && rateLimitInfo?.remainingSeconds !== undefined) {
    const minutes = Math.floor(rateLimitInfo.remainingSeconds / 60)
    const seconds = rateLimitInfo.remainingSeconds % 60
    return translate('github.rateLimited', { values: { minutes, seconds } })
  } else if (messageKey === 'github.rateLimited') {
    return translate('github.rateLimitedNoTime')
  }

  // 通常のi18n翻訳
  return translate(messageKey)
}

/**
 * 交通整理: Pull/Pushが実行可能かどうか
 */
export function canSync(
  isPulling: boolean,
  isPushing: boolean
): { canPull: boolean; canPush: boolean } {
  // Pull中またはPush中は両方とも不可
  if (isPulling || isPushing) {
    return { canPull: false, canPush: false }
  }
  return { canPull: true, canPush: true }
}
