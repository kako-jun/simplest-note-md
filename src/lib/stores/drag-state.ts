/**
 * ドラッグ&ドロップ状態管理ストア
 */

import { writable, get } from 'svelte/store'
import type { Note, Leaf } from '../types'

export interface DragState {
  draggedNote: Note | null
  draggedLeaf: Leaf | null
  dragOverNoteId: string | null
  dragOverLeafId: string | null
}

function createDragStore() {
  const { subscribe, set, update } = writable<DragState>({
    draggedNote: null,
    draggedLeaf: null,
    dragOverNoteId: null,
    dragOverLeafId: null,
  })

  return {
    subscribe,

    // ノートのドラッグ開始
    startDragNote(note: Note) {
      update((state) => ({
        ...state,
        draggedNote: note,
        dragOverNoteId: null,
      }))
    },

    // ノートのドラッグ終了
    endDragNote() {
      update((state) => ({
        ...state,
        draggedNote: null,
        dragOverNoteId: null,
      }))
    },

    // ノートのドラッグオーバー
    setDragOverNote(noteId: string | null) {
      update((state) => ({
        ...state,
        dragOverNoteId: noteId,
      }))
    },

    // リーフのドラッグ開始
    startDragLeaf(leaf: Leaf) {
      update((state) => ({
        ...state,
        draggedLeaf: leaf,
        dragOverLeafId: null,
      }))
    },

    // リーフのドラッグ終了
    endDragLeaf() {
      update((state) => ({
        ...state,
        draggedLeaf: null,
        dragOverLeafId: null,
      }))
    },

    // リーフのドラッグオーバー
    setDragOverLeaf(leafId: string | null) {
      update((state) => ({
        ...state,
        dragOverLeafId: leafId,
      }))
    },

    // 全状態をリセット
    reset() {
      set({
        draggedNote: null,
        draggedLeaf: null,
        dragOverNoteId: null,
        dragOverLeafId: null,
      })
    },

    // 現在の状態を取得（リアクティブでない）
    getState(): DragState {
      return get({ subscribe })
    },
  }
}

export const dragStore = createDragStore()
