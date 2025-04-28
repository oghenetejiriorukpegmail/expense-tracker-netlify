<script lang="ts">
  export let title: string = '';
  export let subtitle: string = '';
  export let padding: string = 'p-4';
</script>

<div class="card {padding}">
  {#if title}
    <div class="card-header">
      <h3>{title}</h3>
      {#if subtitle}
        <p class="subtitle">{subtitle}</p>
      {/if}
    </div>
  {/if}
  <div class="card-content">
    <slot />
  </div>
</div>

<style>
  .card {
    background-color: white;
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-md);
    margin-bottom: var(--spacing-4);
  }

  .card-header {
    margin-bottom: var(--spacing-4);
  }

  .card-header h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: var(--spacing-1);
  }

  .subtitle {
    color: #64748b;
    font-size: 0.875rem;
    margin: 0;
  }

  .card-content {
    position: relative;
  }
</style>