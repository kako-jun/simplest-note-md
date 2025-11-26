<script lang="ts">
  import BaseIcon from './BaseIcon.svelte'
  export let color = 'currentColor'
</script>

<BaseIcon {color}>
  <path d="M20.8 12.6A8.8 8.8 0 1 1 11 3.4a7.8 7.8 0 0 0 9.8 9.2Z" fill={color} />
</BaseIcon>
