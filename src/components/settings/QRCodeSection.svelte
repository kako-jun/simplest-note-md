<script lang="ts">
  import { _ } from '../../lib/i18n'
</script>

<div class="qr-code-container">
  <div class="qr-code-wrapper">
    <img src="/assets/qr.webp" alt="QR Code" class="qr-code-image" />
    <p class="qr-code-description">{$_('settings.qrCodeDescription')}</p>
  </div>
</div>

<style>
  .qr-code-container {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .qr-code-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .qr-code-image {
    width: 120px;
    height: 120px;
    object-fit: contain;
    filter: var(--qr-filter);
  }

  .qr-code-description {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.85rem;
  }
</style>
