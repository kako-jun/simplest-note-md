import { writable } from 'svelte/store'

/**
 * トースト通知の状態
 */
export interface ToastState {
  message: string
  variant: 'success' | 'error' | ''
}

/**
 * モーダルの位置
 */
export type ModalPosition = 'center' | 'bottom-left' | 'bottom-right'

/**
 * モーダルの状態
 */
export interface ModalState {
  show: boolean
  message: string
  type: 'confirm' | 'alert' | 'prompt'
  callback: (() => void) | null
  promptCallback?: ((value: string) => void) | null
  placeholder?: string
  position: ModalPosition
}

/**
 * Pushトーストの状態
 */
export const pushToastState = writable<ToastState>({
  message: '',
  variant: '',
})

/**
 * Pullトーストの状態
 */
export const pullToastState = writable<ToastState>({
  message: '',
  variant: '',
})

/**
 * モーダルの状態
 */
export const modalState = writable<ModalState>({
  show: false,
  message: '',
  type: 'confirm',
  callback: null,
  position: 'center',
})

/**
 * Pushトーストを表示
 */
export function showPushToast(message: string, variant: 'success' | 'error' | '' = '') {
  pushToastState.set({ message, variant })
  setTimeout(() => {
    pushToastState.set({ message: '', variant: '' })
  }, 2000)
}

/**
 * Pullトーストを表示
 */
export function showPullToast(message: string, variant: 'success' | 'error' | '' = '') {
  pullToastState.set({ message, variant })
  setTimeout(() => {
    pullToastState.set({ message: '', variant: '' })
  }, 2000)
}

/**
 * 確認ダイアログを表示
 */
export function showConfirm(
  message: string,
  onConfirm: () => void,
  position: ModalPosition = 'center'
) {
  modalState.set({
    show: true,
    message,
    type: 'confirm',
    callback: onConfirm,
    position,
  })
}

/**
 * アラートダイアログを表示
 */
export function showAlert(message: string, position: ModalPosition = 'center') {
  modalState.set({
    show: true,
    message,
    type: 'alert',
    callback: null,
    position,
  })
}

/**
 * 入力ダイアログを表示
 */
export function showPrompt(
  message: string,
  onSubmit: (value: string) => void,
  placeholder: string = '',
  position: ModalPosition = 'center'
) {
  modalState.set({
    show: true,
    message,
    type: 'prompt',
    callback: null,
    promptCallback: onSubmit,
    placeholder,
    position,
  })
}

/**
 * モーダルを閉じる
 */
export function closeModal() {
  modalState.set({
    show: false,
    message: '',
    type: 'confirm',
    callback: null,
    promptCallback: null,
    placeholder: '',
    position: 'center',
  })
}
