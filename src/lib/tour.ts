/**
 * シンプルな初回ガイド
 * ノート/リーフ作成ボタンへの吹き出し表示を管理
 */

import { isTourShown as isTourShownFromStorage, setTourShown } from './data/storage'

/** ガイドが既に表示済み（dismissed）かどうか */
export const isTourShown = isTourShownFromStorage

/** ガイドを表示済みとしてマーク（二度と表示しない） */
export function dismissTour(): void {
  setTourShown(true)
}

/** ガイドを強制的にリセット（デバッグ用） */
export function resetTour(): void {
  setTourShown(false)
}
