import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig(({ command }) => ({
  plugins: [svelte()],
  // 開発時は '/'、本番ビルド時は '/simplest-note-md/'
  base: command === 'serve' ? '/' : '/simplest-note-md/',
}))
