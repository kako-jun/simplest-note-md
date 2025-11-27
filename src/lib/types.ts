/**
 * 型定義
 * アプリケーション全体で使用される型を定義
 */

export type UUID = string

export type ThemeType = 'yomi' | 'campus' | 'greenboard' | 'whiteboard' | 'dotsD' | 'dotsF'

export type Locale = 'ja' | 'en'

export type View = 'home' | 'settings' | 'edit' | 'note' | 'preview'

export interface Settings {
  token: string
  repoName: string
  theme: ThemeType
  toolName: string
  locale: Locale
  vimMode?: boolean
  linedMode?: boolean
  hasCustomFont?: boolean
  hasCustomBackgroundLeft?: boolean
  hasCustomBackgroundRight?: boolean
  backgroundOpacityLeft?: number
  backgroundOpacityRight?: number
}

export interface CustomFont {
  name: string
  data: ArrayBuffer
  type: string
}

export interface CustomBackground {
  name: string
  data: ArrayBuffer
  type: string
}

export interface Metadata {
  version: number
  notes: Record<string, { id: string; order: number; badgeIcon?: string; badgeColor?: string }>
  leaves: Record<
    string,
    { id: string; updatedAt: number; order: number; badgeIcon?: string; badgeColor?: string }
  >
  pushCount: number
}

export interface Note {
  id: UUID
  name: string
  parentId?: UUID
  order: number
  badgeIcon?: string
  badgeColor?: string
}

export interface Leaf {
  id: UUID
  title: string
  noteId: UUID
  content: string
  updatedAt: number
  order: number
  badgeIcon?: string
  badgeColor?: string
}

export interface Breadcrumb {
  label: string
  action: () => void
  id: UUID
  type: 'home' | 'note' | 'leaf' | 'settings'
}

export type ModalType = 'confirm' | 'alert'

export interface ModalState {
  show: boolean
  message: string
  type: ModalType
  callback: (() => void) | null
}

// 検索結果の型
export interface SearchMatch {
  leafId: UUID
  leafTitle: string
  noteName: string
  noteId: UUID
  line: number // マッチ行番号
  snippet: string // マッチ箇所のスニペット（前後N文字含む）
  matchStart: number // スニペット内のマッチ開始位置
  matchEnd: number // スニペット内のマッチ終了位置
}
