# セルフホスト

Agasteerは静的サイトなので、自分でホストできます。

---

## Cloudflare Pages

1. GitHubリポジトリをフォーク
2. Cloudflare Pages → Create a project → GitHubを接続
3. ビルド設定:
   - Framework preset: Vite
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Save and Deploy

---

## その他

GitHub Pages、Netlify、Vercelなど、静的サイトをホストできるサービスならどこでも動作します。
