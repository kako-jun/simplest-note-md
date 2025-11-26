<script lang="ts">
  import BaseIcon from './BaseIcon.svelte'
  export let color = 'currentColor'
</script>

<BaseIcon {color}>
  <path d="M12 5 19 12 12 19 5 12Z" fill={color} />
</BaseIcon>
