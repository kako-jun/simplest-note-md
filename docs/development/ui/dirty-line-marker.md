# 行単位ダーティマーカー機能

## 概要

エディタ内で変更された行（ダーティ行）に視覚的なマーカーを表示する機能。VSCodeやPHPStormのように、最後に保存した状態から変更された行を識別できるようにする。

## 既存のダーティチェック機能との関係

### 現状の仕組み

Agasteerには既にリーフ単位のダーティチェック機能がある：

| ストア/関数        | 役割                                 | 場所                              |
| ------------------ | ------------------------------------ | --------------------------------- |
| `dirtyLeafIds`     | ダーティなリーフIDのSet              | `src/lib/stores/stores.ts:57`     |
| `lastPushedLeaves` | 最後にPushした時点のリーフ状態       | `src/lib/stores/stores.ts:63`     |
| `detectDirtyIds()` | スナップショット比較でダーティを検出 | `src/lib/stores/stores.ts:75-175` |

### コンテンツ比較のロジック

```typescript
// src/lib/stores/stores.ts:168-170
if (leaf.content !== lastLeaf.content) {
  dirtyLeafIds.add(leaf.id)
}
```

### 再利用可能な部分

1. **基準コンテンツの取得**: `lastPushedLeaves` から「最後にPushした時点のコンテンツ」を取得可能
2. **リーフIDとの紐付け**: 編集中のリーフIDがわかれば、対応する基準コンテンツを取得できる

### 新規実装が必要な部分

1. **行単位の差分計算**: 基準コンテンツと現在のコンテンツを行単位で比較
2. **CodeMirrorガターマーカー**: 変更行にマーカーを表示
3. **リアルタイム更新**: 編集のたびにマーカーを更新

## 設計方針

### 基準コンテンツの管理

```
┌─────────────────────────────────────────────────────┐
│ エディタ初期化時                                    │
├─────────────────────────────────────────────────────┤
│ 1. leafId から lastPushedLeaves を検索             │
│ 2. 見つかれば → その content を基準として保持      │
│ 3. 見つからなければ → 新規リーフ、全行がダーティ   │
└─────────────────────────────────────────────────────┘
```

### 行単位差分の計算

```
基準コンテンツ:        現在のコンテンツ:      結果:
┌──────────────┐      ┌──────────────┐      ┌─────────────────┐
│ 1: # Title   │      │ 1: # Title   │      │ 1: (変更なし)   │
│ 2:           │  vs  │ 2:           │  →   │ 2: (変更なし)   │
│ 3: Hello     │      │ 3: Hello!    │      │ 3: ダーティ     │
│ 4: World     │      │ 4: World     │      │ 4: (変更なし)   │
│              │      │ 5: New line  │      │ 5: 新規行       │
└──────────────┘      └──────────────┘      └─────────────────┘
```

**差分検出アルゴリズムの選択肢:**

1. **単純な行比較**: 行番号ベースで比較（高速だが、行の挿入/削除に弱い）
2. **LCS（最長共通部分列）**: 行の挿入/削除を正確に検出（計算コストが高い）
3. **ハイブリッド**: 短いドキュメントはLCS、長いドキュメントは単純比較

**推奨**: 単純な行比較から始め、必要に応じて改善

### CodeMirrorガターマーカーの実装

```typescript
import { GutterMarker, gutter } from '@codemirror/view'
import { StateField, StateEffect } from '@codemirror/state'

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

// ガター定義
const dirtyLineGutter = gutter({
  class: 'cm-dirty-gutter',
  lineMarker(view, line) {
    const lineNo = view.state.doc.lineAt(line.from).number
    const dirtyLines = view.state.field(dirtyLinesField)
    return dirtyLines.has(lineNo) ? new DirtyLineMarker() : null
  },
})
```

## UI/UX

### 表示方法の検討

| 方式                   | 説明                     | メリット               | デメリット             |
| ---------------------- | ------------------------ | ---------------------- | ---------------------- |
| **ガター縦線**         | 行番号の左に縦線         | VSCode風で馴染みやすい | 罫線モードとの干渉     |
| **行番号の色変更**     | 変更行の行番号を色付け   | 実装が簡単             | 目立たない             |
| **行背景のハイライト** | 変更行の背景を薄く着色   | 明確で分かりやすい     | 長文で煩雑になる可能性 |
| **ガターにドット**     | 行番号の横に小さなドット | 控えめで上品           | 見落としやすい         |

### 推奨: ガター縦線方式

VSCodeやJetBrains IDEで採用されている方式。変更行の左端に縦線を表示。

```
┌──┬────────────────────────┐
│1 │ # Title                │
│2 │                        │
│3▌│ Hello World (変更)     │  ← 左端に縦線
│4 │ Foo                    │
│5▌│ New line (追加)        │  ← 左端に縦線
└──┴────────────────────────┘
```

### 色の選択

CSS変数を使用し、テーマごとに適切な色を設定する。

**App.cssに追加するCSS変数:**

```css
:root {
  /* 既存の変数 */
  --accent: #c7a443;

  /* 新規: ダーティラインマーカー用 */
  --dirty-line: color-mix(in srgb, var(--accent) 80%, var(--text) 20%);
}

:root[data-theme='campus'] {
  --dirty-line: #2f56c6; /* accentと同じ青 */
}

:root[data-theme='greenboard'] {
  --dirty-line: #96d46a; /* accentと同じ緑 */
}

:root[data-theme='whiteboard'] {
  --dirty-line: #3b82f6; /* accentと同じ青 */
}

:root[data-theme='dotsD'] {
  --dirty-line: #888888; /* 少し明るいグレー */
}

:root[data-theme='dotsF'] {
  --dirty-line: #5ca8ff; /* accentと同じ青 */
}
```

**テーマ別の色一覧:**

| テーマ             | 背景色               | 線色               | 備考               |
| ------------------ | -------------------- | ------------------ | ------------------ |
| yomi（デフォルト） | `#fdfdfc` (白)       | `--accent` ベース  | 落ち着いた金色系   |
| campus             | `#fdf8ec` (クリーム) | `#2f56c6` (青)     | キャンパスノート風 |
| greenboard         | `#102117` (濃緑)     | `#96d46a` (黄緑)   | 黒板風             |
| whiteboard         | `#ffffff` (白)       | `#3b82f6` (青)     | ホワイトボード風   |
| dotsD              | `#05080f` (黒)       | `#888888` (グレー) | ドットダーク       |
| dotsF              | `#0000aa` (青)       | `#5ca8ff` (水色)   | ドットファミコン   |

**注**:

- 赤は `--error` で使用されているため避ける
- 各テーマの `--accent` と調和する色を選択
- ダークテーマでは視認性を確保するため明るめの色を使用

### 設定オプション

- **デフォルト**: オフ（既存ユーザーへの影響を避ける）
- **設定場所**: 設定画面 → エディタセクション
- **トグル名**: 「変更行マーカーを表示」

## 実装タスク

### Phase 1: 基本実装

- [ ] 基準コンテンツ管理の仕組みを作成
  - `lastPushedLeaves` から基準コンテンツを取得する関数
  - エディタ初期化時に基準コンテンツを設定
- [ ] 行単位差分計算ロジックの実装
  - 単純な行比較アルゴリズム
  - 差分結果を `Set<number>` で返す
- [ ] CodeMirrorガターマーカーの実装
  - `StateField` でダーティ行を管理
  - `gutter` でマーカーを表示
- [ ] スタイリング
  - ライト/ダークテーマ対応
  - 縦線の色とサイズ

### Phase 2: 統合とUX

- [ ] MarkdownEditor.svelteへの統合
  - 拡張機能として追加
  - 設定によるオン/オフ
- [ ] 設定画面への追加
  - トグルスイッチの追加
  - LocalStorage永続化
- [ ] リアルタイム更新
  - `EditorView.updateListener` でドキュメント変更を検知
  - 差分を再計算してマーカーを更新

### Phase 3: 最適化（必要に応じて）

- [ ] パフォーマンス最適化
  - 大きなドキュメントでの差分計算の最適化
  - デバウンス処理
- [ ] 追加機能
  - 「変更を破棄」機能（行単位でのリバート）
  - 変更行へのジャンプ機能

## 参考リンク

- [CodeMirror Gutter Example](https://codemirror.net/examples/gutter/)
- [Adding a marker to the gutter if text changes - CodeMirror Discussion](https://discuss.codemirror.net/t/adding-a-marker-to-the-gutter-if-text-changes/4228)
