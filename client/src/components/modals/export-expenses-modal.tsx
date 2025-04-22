import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useModalStore } from "@/lib/store"; // Assuming export modal state is added here
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

// TODO: Add export modal state (isOpen, toggle) to useModalStore in lib/store.ts
// Example addition to store:
// export const useModalStore = create<ModalState & Action>((set) => ({
//   // ... other states
//   exportExpensesOpen: false,
//   toggleExportExpenses: () => set((state) => ({ exportExpensesOpen: !state.exportExpensesOpen })),
// }));

export default function ExportExpensesModal() {
  // Use the correct state and toggle function from your store
  const { exportExpensesOpen: open, toggleExportExpenses } = useModalStore();
  const { toast } = useToast();
  const [format, setFormat] = useState<'csv' | 'xlsx'>('xlsx');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // TODO: Add state/props for filters if needed (startDate, endDate, tripName, type)

  const handleExport = async () => {
    setIsSubmitting(true);
    try {
      // TODO: Gather filter values if implemented
      const filters = {
        // startDate: ...,
        // endDate: ...,
        // tripName: ...,
        // type: ...
      };

      const payload = {
        format: format,
        filters: filters, // Pass filters if implemented, otherwise {} or undefined
      };

      const response = await apiRequest('POST', '/api/export-expenses', payload);

      if (response.status === 202) {
        const result = await response.json();
        toast({
          title: "Export Started",
          description: "Your expense export is being generated. You'll be notified when it's ready.",
        });
        console.log("Background Task Info:", result.task);
        toggleExportExpenses(); // Close modal
      } else {
        const errorData = await response.json().catch(() => ({ message: "Unknown error starting export." }));
        throw new Error(errorData.message || `Failed to start export (Status: ${response.status})`);
      }

    } catch (error) {
      toast({
        title: "Export Error",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset state if needed when closing
    setFormat('xlsx');
    setIsSubmitting(false);
    toggleExportExpenses();
  };

  // Ensure the component only renders if the store hook is available
  if (!toggleExportExpenses) {
     console.warn("Export modal store not configured correctly.");
     return null;
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Expenses</DialogTitle>
          <DialogDescription>
            Select the format for your expense export. Filters can be applied on the main page.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="format-select">Export Format</Label>
            <Select value={format} onValueChange={(value: 'csv' | 'xlsx') => setFormat(value)}>
              <SelectTrigger id="format-select">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* TODO: Add filter inputs here if needed */}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleExport} disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting Export...</> : "Start Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}