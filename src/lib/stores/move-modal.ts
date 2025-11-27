/**
 * 移動モーダル状態管理ストア
 */

import { writable, get } from 'svelte/store'
import type { Note, Leaf } from '../types'
import type { Pane } from '../navigation'

export interface MoveModalState {
  isOpen: boolean
  targetNote: Note | null
  targetLeaf: Leaf | null
  targetPane: Pane
}

function createMoveModalStore() {
  const { subscribe, set, update } = writable<MoveModalState>({
    isOpen: false,
    targetNote: null,
    targetLeaf: null,
    targetPane: 'left',
  })

  return {
    subscribe,

    /**
     * ノート移動モーダルを開く
     */
    openForNote(note: Note, pane: Pane) {
      set({
        isOpen: true,
        targetNote: note,
        targetLeaf: null,
        targetPane: pane,
      })
    },

    /**
     * リーフ移動モーダルを開く
     */
    openForLeaf(leaf: Leaf, pane: Pane) {
      set({
        isOpen: true,
        targetNote: null,
        targetLeaf: leaf,
        targetPane: pane,
      })
    },

    /**
     * モーダルを閉じる
     */
    close() {
      set({
        isOpen: false,
        targetNote: null,
        targetLeaf: null,
        targetPane: 'left',
      })
    },

    /**
     * 現在の状態を取得（リアクティブでない）
     */
    getState(): MoveModalState {
      return get({ subscribe })
    },
  }
}

export const moveModalStore = createMoveModalStore()
