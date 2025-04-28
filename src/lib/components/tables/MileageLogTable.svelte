<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { format, parseISO } from 'date-fns';
  import type { MileageLog } from '../../../shared/schema'; // Adjust path

  // Assuming shadcn-svelte components
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Button } from '$lib/components/ui/button';
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '$lib/components/ui/tooltip';
  // AlertDialog will be handled by the parent page via events

  // Assuming lucide-svelte icons
  import { Pencil, Trash2, Image as ImageIcon } from 'lucide-svelte';

  // Props
  export let logs: MileageLog[] = [];

  // Event dispatcher
  const dispatch = createEventDispatcher<{
    edit: number; // Dispatch log ID
    delete: number; // Dispatch log ID
    viewImage: string; // Dispatch image URL
  }>();

  function formatDate(dateString: string | Date | undefined): string {
      if (!dateString) return 'N/A';
      try {
          const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
          return format(date, "MMM d, yyyy");
      } catch (e) {
          return "Invalid Date";
      }
   }

   function formatOdometer(value: string | number | null | undefined): string {
       const numValue = typeof value === 'string' ? parseFloat(value) : value;
       if (numValue === null || numValue === undefined || isNaN(numValue)) return '-';
       // Format with one decimal place
       return numValue.toFixed(1);
   }

   function handleViewImage(imageUrl: string | null | undefined) {
       if (imageUrl) {
           // Instead of opening directly, dispatch an event for the parent to handle (e.g., open in modal)
           dispatch('viewImage', imageUrl);
           // Or open directly: window.open(imageUrl, '_blank');
       }
   }

</script>

<TooltipProvider>
  <div class="border rounded-md overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead class="whitespace-nowrap">Date</TableHead>
          <TableHead class="text-right whitespace-nowrap">Start Odo.</TableHead>
          <TableHead class="text-center whitespace-nowrap">Start Img</TableHead>
          <TableHead class="text-right whitespace-nowrap">End Odo.</TableHead>
          <TableHead class="text-center whitespace-nowrap">End Img</TableHead>
          <TableHead class="text-right whitespace-nowrap">Distance</TableHead>
          <TableHead class="whitespace-nowrap">Purpose</TableHead>
          <TableHead class="text-center whitespace-nowrap">Entry</TableHead>
          <TableHead class="text-center whitespace-nowrap">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {#if logs && logs.length > 0}
          {#each logs as log (log.id)}
            <TableRow>
              <TableCell class="whitespace-nowrap">{formatDate(log.tripDate)}</TableCell>
              <TableCell class="text-right whitespace-nowrap">{formatOdometer(log.startOdometer)}</TableCell>
              <TableCell class="text-center">
                {#if log.startImageUrl}
                  <Tooltip>
                    <TooltipTrigger>
                      <Button variant="ghost" size="icon" class="h-8 w-8" on:click={() => handleViewImage(log.startImageUrl)}>
                         <ImageIcon class="h-5 w-5 text-blue-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>View Start Image</p></TooltipContent>
                  </Tooltip>
                {:else}
                  <ImageIcon class="h-5 w-5 text-gray-400 mx-auto" />
                {/if}
              </TableCell>
              <TableCell class="text-right whitespace-nowrap">{formatOdometer(log.endOdometer)}</TableCell>
              <TableCell class="text-center">
                {#if log.endImageUrl}
                   <Tooltip>
                    <TooltipTrigger>
                       <Button variant="ghost" size="icon" class="h-8 w-8" on:click={() => handleViewImage(log.endImageUrl)}>
                          <ImageIcon class="h-5 w-5 text-blue-600" />
                       </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>View End Image</p></TooltipContent>
                  </Tooltip>
                {:else}
                   <ImageIcon class="h-5 w-5 text-gray-400 mx-auto" />
                {/if}
              </TableCell>
              <TableCell class="text-right font-medium whitespace-nowrap">{formatOdometer(log.calculatedDistance)}</TableCell>
              <TableCell class="whitespace-nowrap">{log.purpose || '-'}</TableCell>
              <TableCell class="text-center capitalize whitespace-nowrap">{log.entryMethod}</TableCell>
              <TableCell class="text-center">
                <div class="flex justify-center space-x-1 whitespace-nowrap">
                  <Tooltip>
                     <TooltipTrigger>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="h-8 w-8 text-gray-500 hover:text-primary"
                          on:click={() => dispatch('edit', log.id)}
                          aria-label="Edit Mileage Log"
                        >
                          <Pencil class="h-4 w-4" />
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent><p>Edit Log</p></TooltipContent>
                  </Tooltip>
                   <Tooltip>
                     <TooltipTrigger>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="h-8 w-8 text-gray-500 hover:text-red-500"
                          on:click={() => dispatch('delete', log.id)}
                          aria-label="Delete Mileage Log"
                        >
                          <Trash2 class="h-4 w-4" />
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent><p>Delete Log</p></TooltipContent>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          {/each}
        {:else}
          <TableRow>
            <TableCell colspan={9} class="text-center py-6 text-gray-500 dark:text-gray-400">
              No mileage logs found
            </TableCell>
          </TableRow>
        {/if}
      </TableBody>
    </Table>
  </div>
</TooltipProvider>