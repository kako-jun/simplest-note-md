<script lang="ts">
  import QRCode from 'qrcode'
  import { onMount } from 'svelte'

  export let getContent: () => string

  // QRコードの最大容量（誤り訂正レベルL、バイナリモード）
  const QR_MAX_BYTES = 2953

  let qrDataUrl: string | null = null

  function getByteLength(str: string): number {
    return new TextEncoder().encode(str).length
  }

  // 同期的にバイト数をチェック
  $: content = getContent()
  $: byteLength = getByteLength(content)
  $: qrExceeded = byteLength > QR_MAX_BYTES

  async function generateQRCode() {
    if (qrExceeded) return

    try {
      qrDataUrl = await QRCode.toDataURL(content, {
        errorCorrectionLevel: 'L',
        margin: 1,
        width: 200,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
    } catch (err) {
      console.error('QRコード生成エラー:', err)
      qrDataUrl = null
    }
  }

  onMount(() => {
    if (!qrExceeded) {
      generateQRCode()
    }
  })
</script>

{#if !qrExceeded && qrDataUrl}
  <div class="qr-divider" />
  <div class="qr-section">
    <img src={qrDataUrl} alt="QR Code" class="qr-image" />
  </div>
{/if}

<style>
  .qr-divider {
    height: 1px;
    background: var(--text-muted);
    opacity: 0.3;
    margin: 0.5rem 0;
  }

  .qr-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.75rem;
    gap: 0.5rem;
  }

  .qr-image {
    width: 200px;
    height: 200px;
    border-radius: 4px;
  }
</style>
