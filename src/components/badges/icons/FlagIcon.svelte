<script lang="ts">
  import BaseIcon from './BaseIcon.svelte'
  export let color = 'currentColor'
</script>

<BaseIcon {color}>
  <path d="M6 4h2v15H6Z" transform="translate(0 1)" fill={color} />
  <path d="M8 4h10l-2 4 2 4H8Z" transform="translate(0 1)" fill={color} />
</BaseIcon>
