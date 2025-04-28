<script lang="ts">
  import { page } from '$app/stores';
</script>

<div class="error-page">
  <div class="error-container">
    <div class="error-content">
      <h1 class="error-code">{$page.status || 404}</h1>
      <h2 class="error-title">
        {#if $page.status === 404}
          Page Not Found
        {:else if $page.status === 500}
          Server Error
        {:else}
          Something Went Wrong
        {/if}
      </h2>
      <p class="error-message">
        {$page.error?.message || 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.'}
      </p>
      <div class="error-actions">
        <a href="/" class="btn btn-primary">Go to Home</a>
        <button 
          class="btn btn-secondary" 
          on:click={() => history.back()}
        >
          Go Back
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .error-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(100vh - 64px);
    padding: 2rem 1rem;
  }
  
  .error-container {
    max-width: 600px;
    width: 100%;
  }
  
  .error-content {
    text-align: center;
  }
  
  .error-code {
    font-size: 6rem;
    font-weight: 700;
    margin: 0;
    line-height: 1;
    color: var(--primary-color);
  }
  
  .error-title {
    font-size: 2rem;
    font-weight: 600;
    margin: 1rem 0;
  }
  
  .error-message {
    font-size: 1.125rem;
    color: var(--text-muted);
    margin-bottom: 2rem;
  }
  
  .error-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }
  
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius);
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s;
    cursor: pointer;
  }
  
  .btn-primary {
    background-color: var(--primary-color);
    color: white;
    border: none;
  }
  
  .btn-primary:hover {
    background-color: var(--primary-hover);
  }
  
  .btn-secondary {
    background-color: transparent;
    color: var(--text-color);
    border: 1px solid var(--border-color);
  }
  
  .btn-secondary:hover {
    background-color: var(--surface-color);
  }
  
  @media (max-width: 768px) {
    .error-code {
      font-size: 4rem;
    }
    
    .error-title {
      font-size: 1.5rem;
    }
    
    .error-actions {
      flex-direction: column;
    }
  }
</style>