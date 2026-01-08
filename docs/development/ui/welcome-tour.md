## ウェルカムポップアップ

### 概要

初回訪問時に表示されるウェルカムポップアップ。アプリの使い方を簡潔に紹介し、ユーザーがスムーズに開始できるようサポートします。

### 機能

- **言語自動検出**: ブラウザ/OSの言語設定に基づいて日本語/英語で表示
- **レスポンシブ対応**: スマートフォンなど狭い画面ではボタンが縦並びに配置
- **初回のみ表示**: LocalStorageで表示済みフラグを管理

### レスポンシブ実装

狭い画面（480px以下）ではボタンを縦配置に自動切替。

### i18n対応

`welcome.*`キーで日本語/英語の翻訳を提供。

---

---

## オンボーディングツアー（2025-12）

初回ユーザー向けのインタラクティブな使い方ガイド。

### 使用ライブラリ

**driver.js** を採用:

- MITライセンス（商用無料）
- 軽量（~5KB）
- 依存なし
- Svelte/vanilla JS対応

### ツアーステップ

| #   | ステップ    | 要素ID              | 説明                                                     |
| --- | ----------- | ------------------- | -------------------------------------------------------- |
| 1   | Welcome     | なし（中央表示）    | Agasteerへようこそ！基本的な使い方を説明します。         |
| 2   | Create Note | `#tour-create-note` | ノートを作る。ノートはリーフをまとめるフォルダ。         |
| 3   | Create Leaf | `#tour-create-leaf` | リーフを作る。リーフは実際にメモを書くページ。           |
| 4   | Push        | `#tour-save`        | GitHubに保存。Ctrl+S / Cmd+S でもPush可能。              |
| 5   | Pull        | `#tour-pull`        | 起動時に自動Pull。別デバイスからの変更を取り込む。       |
| 6   | Settings    | `#tour-settings`    | テーマ・フォントのカスタマイズ、マニュアルリンク。       |
| 7   | Offline     | なし（中央表示）    | Offlineリーフはオフライン用、GitHub同期なし。            |
| 8   | Priority    | なし（中央表示）    | Priorityリーフは[1]〜[5]マーカー自動収集、読み取り専用。 |
| 9   | Finish      | なし（中央表示）    | 準備完了！困ったら設定画面のマニュアルリンクへ。         |

### トリガー条件

- **表示タイミング**: 初回Pull成功後（500ms遅延）
- **再表示防止**: LocalStorage (`agasteer.state.tourShown`) で管理
- **スキップ可能**: ×ボタンまたはオーバーレイクリックで閉じる

### ファイル構成

| ファイル                 | 説明                     |
| ------------------------ | ------------------------ |
| `src/lib/tour.ts`        | ツアーロジック           |
| `src/App.css`            | ポップオーバーのスタイル |
| `src/lib/i18n/locales/*` | 翻訳（tour.\*）          |

### 要素ID配置

| コンポーネント    | ID                | 説明             |
| ----------------- | ----------------- | ---------------- |
| Header.svelte     | #tour-pull        | Pullボタン       |
| Header.svelte     | #tour-settings    | 設定ボタン       |
| HomeFooter.svelte | #tour-create-note | ノート作成ボタン |
| HomeFooter.svelte | #tour-save        | Pushボタン       |
| NoteFooter.svelte | #tour-create-leaf | リーフ作成ボタン |

### カスタムCSS

App.cssでdriver.jsのデフォルトスタイルを上書きし、テーマのCSS変数に追従させています。

### デバッグ

開発者コンソールで以下を実行してリロードするとツアーをリセットできます:

```js
const data = JSON.parse(localStorage.getItem('agasteer'))
data.state.tourShown = false
localStorage.setItem('agasteer', JSON.stringify(data))
```
