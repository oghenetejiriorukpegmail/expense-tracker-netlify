<script lang="ts">
  import { format } from 'date-fns';
  import { Pencil, Trash2, Image as ImageIcon } from 'lucide-svelte';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Button } from '$lib/components/ui/button';
  import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '$lib/components/ui/alert-dialog';
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '$lib/components/ui/tooltip';
  import { createEventDispatcher } from 'svelte';
  import type { MileageLog } from '$lib/types';

  // Props
  export let logs: MileageLog[] = [];
  export let isLoading = false;

  // Event dispatcher
  const dispatch = createEventDispatcher<{
    edit: { log: MileageLog };
    delete: { logId: number };
  }>();

  // Handle edit
  function handleEdit(log: MileageLog) {
    dispatch('edit', { log });
  }

  // Handle delete
  function handleDelete(logId: number) {
    dispatch('delete', { logId });
  }
</script>

<TooltipProvider>
  {#if isLoading}
    <div>Loading mileage logs...</div>
  {:else if !logs || logs.length === 0}
    <p class="text-center text-gray-500 dark:text-gray-400 mt-4">No mileage logs found.</p>
  {:else}
    <div class="rounded-md border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead class="text-right">Start Odometer</TableHead>
            <TableHead class="text-center">Start Img</TableHead>
            <TableHead class="text-right">End Odometer</TableHead>
            <TableHead class="text-center">End Img</TableHead>
            <TableHead class="text-right">Distance</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead class="text-center">Entry</TableHead>
            <TableHead class="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each logs as log}
            <TableRow>
              <TableCell>{format(new Date(log.tripDate), 'MMM d, yyyy')}</TableCell>
              <TableCell class="text-right">{log.startOdometer}</TableCell>
              <TableCell class="text-center">
                {#if log.startImageUrl}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a href={log.startImageUrl} target="_blank" rel="noopener noreferrer" class="inline-block">
                        <img src={log.startImageUrl} alt="Start Odometer" class="h-8 w-auto object-cover rounded hover:opacity-80 transition-opacity" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View Start Image</p>
                    </TooltipContent>
                  </Tooltip>
                {:else}
                  <ImageIcon class="h-5 w-5 text-gray-400 mx-auto" />
                {/if}
              </TableCell>
              <TableCell class="text-right">{log.endOdometer}</TableCell>
              <TableCell class="text-center">
                {#if log.endImageUrl}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a href={log.endImageUrl} target="_blank" rel="noopener noreferrer" class="inline-block">
                        <img src={log.endImageUrl} alt="End Odometer" class="h-8 w-auto object-cover rounded hover:opacity-80 transition-opacity" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View End Image</p>
                    </TooltipContent>
                  </Tooltip>
                {:else}
                  <ImageIcon class="h-5 w-5 text-gray-400 mx-auto" />
                {/if}
              </TableCell>
              <TableCell class="text-right">{log.calculatedDistance}</TableCell>
              <TableCell>{log.purpose || '-'}</TableCell>
              <TableCell class="text-center capitalize">{log.entryMethod}</TableCell>
              <TableCell class="text-center">
                <Button
                  variant="ghost"
                  size="icon"
                  class="mr-2"
                  on:click={() => handleEdit(log)}
                >
                  <Pencil class="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" class="text-red-500 hover:text-red-700">
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Mileage Log</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this mileage log? This action cannot be undone. Associated images will also be deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        class="bg-red-500 hover:bg-red-600"
                        on:click={() => handleDelete(log.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </div>
  {/if}
</TooltipProvider>