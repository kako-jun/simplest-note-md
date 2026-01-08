# オンボーディングツアー

初回Pull成功後に自動で表示される、使い方ガイドです。

---

## いつ表示される？

- **初回Pull成功後**に自動で開始
- 一度見たら再表示されません
- スキップ可能（×ボタンまたは背景クリック）

---

## ツアーの内容

9ステップで基本操作を説明します。

| #   | 内容               |
| --- | ------------------ |
| 1   | Agasteerへようこそ |
| 2   | ノートの作成       |
| 3   | リーフの作成       |
| 4   | GitHubに保存       |
| 5   | Pull（取得）       |
| 6   | 設定画面           |
| 7   | Offlineリーフ      |
| 8   | Priorityリーフ     |
| 9   | 準備完了！         |

---

## ツアーをリセットするには

開発者コンソールで以下を実行してリロードします:

```js
const data = JSON.parse(localStorage.getItem('agasteer'))
data.state.tourShown = false
localStorage.setItem('agasteer', JSON.stringify(data))
```
