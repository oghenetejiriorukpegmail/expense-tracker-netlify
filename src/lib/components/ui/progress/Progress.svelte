<script lang="ts">
  export let value: number = 0;
  export let max: number = 100;
  export let className: string = "";
</script>

<div class="relative w-full h-2 overflow-hidden rounded-full bg-secondary {className}">
  <div
    class="h-full transition-all"
    style="width: {Math.min(Math.max(0, value), max)}%"
  />
</div>