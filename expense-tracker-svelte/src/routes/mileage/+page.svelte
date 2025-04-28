<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { user } from '$lib/stores/auth';
  import MileageLogTable from '$lib/components/mileage/MileageLogTable.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Plus, RefreshCw } from 'lucide-svelte';
  import { toast } from '$lib/components/ui/toast';
  import type { MileageLog } from '$lib/types';
  
  let logs: MileageLog[] = [];
  let isLoading = true;
  let error: Error | null = null;
  let isRefreshing = false;
  
  // Fetch mileage logs with retry mechanism
  async function fetchMileageLogs(retryCount = 0, maxRetries = 2) {
    isLoading = true;
    error = null;
    
    try {
      const token = $user?.token;
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch('/api/mileage-logs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch mileage logs: ${errorText}`);
      }
      
      logs = await response.json();
    } catch (err) {
      console.error('Error fetching mileage logs:', err);
      
      // Implement retry logic with exponential backoff
      if (retryCount < maxRetries) {
        const delay = Math.min(1000 * 2 ** retryCount, 10000);
        console.log(`Retrying mileage logs fetch in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        setTimeout(() => {
          fetchMileageLogs(retryCount + 1, maxRetries);
        }, delay);
        return;
      }
      
      error = err instanceof Error ? err : new Error('An unknown error occurred');
    } finally {
      isLoading = false;
      isRefreshing = false;
    }
  }
  
  // Refresh logs
  function refreshLogs() {
    if (isRefreshing) return;
    
    isRefreshing = true;
    fetchMileageLogs();
  }
  
  // Handle edit log
  function handleEdit(event: CustomEvent<{ log: MileageLog }>) {
    const { log } = event.detail;
    goto(`/mileage/${log.id}/edit`);
  }
  
  // Handle delete log
  async function handleDelete(event: CustomEvent<{ logId: number }>) {
    const { logId } = event.detail;
    
    try {
      const token = $user?.token;
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`/api/mileage-logs/${logId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete mileage log');
      }
      
      // Remove the deleted log from the list
      logs = logs.filter(log => log.id !== logId);
      
      toast({
        title: 'Mileage Log Deleted',
        description: 'The mileage log has been successfully deleted.'
      });
    } catch (err) {
      console.error('Error deleting mileage log:', err);
      error = err instanceof Error ? err : new Error('An unknown error occurred');
      
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  }
  
  // Check authentication and fetch logs on mount
  onMount(() => {
    if (!$user) {
      goto('/auth');
      return;
    }
    
    fetchMileageLogs();
  });
</script>

<svelte:head>
  <title>Mileage Logs | Expense Tracker</title>
</svelte:head>

<svelte:head>
  <title>Mileage Logs | Expense Tracker</title>
</svelte:head>

<div class="container mx-auto p-4 md:p-6">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-semibold">Mileage Logs</h1>
    
    <div class="flex gap-2">
      <Button variant="outline" on:click={refreshLogs} disabled={isLoading || isRefreshing}>
        <RefreshCw class="h-4 w-4 mr-2" class:animate-spin={isRefreshing} />
        Refresh
      </Button>
      
      <Button on:click={() => goto('/mileage/new')}>
        <Plus class="h-4 w-4 mr-2" />
        New Log
      </Button>
    </div>
  </div>
  
  {#if error}
    <div class="text-red-500 bg-red-100 border border-red-400 rounded p-3 mb-4">
      Error: {error.message}
      <Button variant="outline" size="sm" class="ml-2" on:click={() => fetchMileageLogs()}>
        Try Again
      </Button>
    </div>
  {/if}
  
  <MileageLogTable
    {logs}
    {isLoading}
    on:edit={handleEdit}
    on:delete={handleDelete}
  />
</div>