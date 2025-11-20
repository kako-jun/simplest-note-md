# SimplestNote.md

ブラウザだけで動く軽量なMarkdownノートアプリです。GitHub API への直接同期を行い、外部サービスを使わずに複数ノートを管理できます。

## 特長

- Svelte + Vite による軽量構成
- CodeMirror を使った Markdown エディタ
- GitHub Personal Access Token をローカルに保存して同期
- フォルダ階層は最大2階層。GitHub 上の `notes/` ディレクトリに `.md` ファイルとして保存
- ライト/ダークテーマ切り替え対応
- シンプルなUI

## セットアップ

1. 依存パッケージのインストール
   ```bash
   npm install
   ```
2. 開発サーバーの起動
   ```bash
   npm run dev
   ```
   ブラウザで `http://localhost:5173` を開きます。
3. ビルド
   ```bash
   npm run build
   ```
4. ビルド結果の確認
   ```bash
   npm run preview
   ```

## 品質チェックとコミット前フック

- フォーマット: `npm run format`（Prettier）
- フォーマットチェック: `npm run format:check`
- 型・Lintチェック: `npm run check`（svelte-check）
- まとめて実行: `npm run lint`

Husky の pre-commit フックで `npm run lint` が自動実行されます。初回セットアップ後に `npm run prepare` を一度実行すると `.husky` が有効になります。

## CI

GitHub Actions（`.github/workflows/ci.yml`）で push 時に `npm install` → `npm run lint` → `npm run build` を実行します。

## 使い方

1. ヘッダーの「設定」アイコンから設定画面を開きます。
2. GitHub トークン、コミットユーザー名、メールアドレス、リポジトリ名（`owner/repo`）を入力し、ダークモードの切り替えスイッチで好みのテーマを選択して「設定を保存」を押します。これらは LocalStorage に保存されます。
3. ホーム画面で「新規フォルダ」を作成します。フォルダ階層は2階層までです（親フォルダとサブフォルダ）。
4. フォルダを選択し、「新規ノート」でノートを作成します。
5. パンくずリストのノート名やフォルダ名の横にある鉛筆アイコンをクリックすると名前を編集できます。
6. エディタで内容を編集し、「Save」を押すと `notes/` ディレクトリ以下に `.md` として同期します。コミットメッセージは固定で `auto-sync` です。
7. ローカルに保存したい場合は「Download」を押します。
8. ヘッダーの「SimplestNote.md」をクリックすると常にホーム画面に戻ります。

## 実装メモ

- GitHub 同期は `PUT /repos/{owner}/{repo}/contents/{path}` を使用し、最新 SHA を取得して強制上書きします。
- 保存先は `notes/` ディレクトリ固定です（例：`notes/work/meeting.md`）。
- 同期時の committer 情報には設定したユーザー名・メールを使います。
- フォルダ、ノート、設定は LocalStorage に保存されます。
- フォルダ階層は最大2階層（親フォルダとサブフォルダ）で、UUID で管理しています。
- ダークテーマは CSS 変数で実装し、設定画面のスイッチから即座に切り替え可能です。
- パンくずリストで現在位置を表示し、フォルダ名・ノート名は鉛筆アイコンから編集できます。
- ヘッダーは常に「SimplestNote.md」のみを表示し、クリックでホームに戻ります。
- CSS は `src/app.css` に最小限のみ定義しています。

## 注意事項

- GitHub トークンはブラウザの LocalStorage に保存されます。安全な端末で利用してください。
- 本リポジトリにはビルド済みの出力を含みません。必要に応じて `npm run build` を実行してください。
