import './App.css'
import App from './App.svelte'
import { registerSW } from 'virtual:pwa-register'

// PWA更新チェック完了を待つためのPromise
// App.svelteのonMountで初回Pullより先にこのPromiseをawaitする
export const waitForSwCheck: Promise<void> = new Promise((resolve) => {
  const updateSW = registerSW({
    immediate: true,
    onRegistered(swRegistration) {
      // SW登録完了 → 更新チェック
      swRegistration?.update()
      // 更新がなければここで完了
      resolve()
    },
    onNeedRefresh() {
      // 新しいSWが検知された場合、即座にリロード
      // リロード後は新しいコードで初回Pullが走る
      console.log('New version available, reloading...')
      updateSW(true) // true = immediate reload
      // resolveは呼ばない（リロードするので不要）
    },
  })

  // タイムアウト: SWがサポートされていない環境や登録に時間がかかる場合
  setTimeout(resolve, 500)
})

const app = new App({
  target: document.getElementById('app') as HTMLElement,
})

export default app
