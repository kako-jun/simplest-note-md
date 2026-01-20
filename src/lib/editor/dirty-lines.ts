/**
 * 行単位ダーティマーカー機能
 * 最後にPushした状態から変更された行にマーカーを表示する
 */

import type { Extension } from '@codemirror/state'

/**
 * 行単位の差分を計算
 * @param baseContent 基準コンテンツ（最後にPushした状態）
 * @param currentContent 現在のコンテンツ
 * @returns ダーティな行番号のSet（1-indexed）
 */
export function computeDirtyLines(baseContent: string | null, currentContent: string): Set<number> {
  const dirtyLines = new Set<number>()

  // 基準がnull = 新規リーフ → 全行がダーティ
  if (baseContent === null) {
    const lines = currentContent.split('\n')
    for (let i = 1; i <= lines.length; i++) {
      dirtyLines.add(i)
    }
    return dirtyLines
  }

  const baseLines = baseContent.split('\n')
  const currentLines = currentContent.split('\n')

  // 単純な行比較（行番号ベース）
  const maxLines = Math.max(baseLines.length, currentLines.length)
  for (let i = 0; i < maxLines; i++) {
    const baseLine = baseLines[i] ?? ''
    const currentLine = currentLines[i] ?? ''
    if (baseLine !== currentLine) {
      // 行番号は1-indexed
      dirtyLines.add(i + 1)
    }
  }

  return dirtyLines
}

/**
 * CodeMirrorのダーティライン拡張機能を作成するファクトリ
 * 動的インポート後に呼び出す
 *
 * @param modules CodeMirrorモジュール
 * @param baseContent 基準コンテンツ（初期化時に1回だけ取得して渡す）
 * @param isLeafDirty リーフがダーティかどうかを返す関数（ダーティでなければ計算スキップ）
 * @param debounceMs デバウンス時間（ミリ秒）
 */
export function createDirtyLineExtension(
  modules: {
    StateEffect: typeof import('@codemirror/state').StateEffect
    StateField: typeof import('@codemirror/state').StateField
    GutterMarker: typeof import('@codemirror/view').GutterMarker
    gutter: typeof import('@codemirror/view').gutter
    EditorView: typeof import('@codemirror/view').EditorView
  },
  baseContent: string | null,
  isLeafDirty: () => boolean,
  debounceMs: number = 200
): {
  extension: Extension
  updateDirtyLines: (view: InstanceType<typeof modules.EditorView>) => void
  cleanup: () => void
} {
  const { StateEffect, StateField, GutterMarker, gutter, EditorView } = modules

  // ダーティ行を更新するEffect
  const setDirtyLines = StateEffect.define<Set<number>>()

  // ダーティ行の状態を管理するStateField
  const dirtyLinesField = StateField.define<Set<number>>({
    create: () => new Set(),
    update(value, tr) {
      for (const effect of tr.effects) {
        if (effect.is(setDirtyLines)) {
          return effect.value
        }
      }
      return value
    },
  })

  // ガターマーカークラス
  class DirtyLineMarker extends GutterMarker {
    toDOM() {
      const marker = document.createElement('div')
      marker.className = 'cm-dirty-line-marker'
      return marker
    }
  }

  const marker = new DirtyLineMarker()

  // ガター定義
  const dirtyLineGutter = gutter({
    class: 'cm-dirty-gutter',
    lineMarker(view, line) {
      const lineNo = view.state.doc.lineAt(line.from).number
      const dirtyLines = view.state.field(dirtyLinesField)
      return dirtyLines.has(lineNo) ? marker : null
    },
  })

  // デバウンス用タイマー
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  // ダーティ行を更新する関数
  function updateDirtyLines(view: InstanceType<typeof EditorView>) {
    // リーフがダーティでなければ空のSetを設定（計算スキップ）
    if (!isLeafDirty()) {
      view.dispatch({
        effects: setDirtyLines.of(new Set()),
      })
      return
    }

    const currentContent = view.state.doc.toString()
    const dirtyLines = computeDirtyLines(baseContent, currentContent)

    view.dispatch({
      effects: setDirtyLines.of(dirtyLines),
    })
  }

  // デバウンス付き更新
  function debouncedUpdate(view: InstanceType<typeof EditorView>) {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => {
      updateDirtyLines(view)
      debounceTimer = null
    }, debounceMs)
  }

  // クリーンアップ関数
  function cleanup() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  // 拡張機能を返す
  const extension: Extension = [
    dirtyLinesField,
    dirtyLineGutter,
    // ドキュメント変更時にデバウンス付きで更新
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        debouncedUpdate(update.view)
      }
    }),
  ]

  return { extension, updateDirtyLines, cleanup }
}
