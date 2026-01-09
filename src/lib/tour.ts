/**
 * シンプルな初回ガイド
 * ノート/リーフ作成ボタン、保存ボタンへの吹き出し表示を管理
 */

import {
  isTourShown as isTourShownFromStorage,
  setTourShown,
  isSaveGuideShown as isSaveGuideShownFromStorage,
  setSaveGuideShown,
} from './data/storage'

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

/** 保存ガイドが既に表示済み（dismissed）かどうか */
export const isSaveGuideShown = isSaveGuideShownFromStorage

/** 保存ガイドを表示済みとしてマーク（二度と表示しない） */
export function dismissSaveGuide(): void {
  setSaveGuideShown(true)
}

/** 保存ガイドを強制的にリセット（デバッグ用） */
export function resetSaveGuide(): void {
  setSaveGuideShown(false)
}
