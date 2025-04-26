import { useEffect, useState, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, UseFormReturn, ControllerRenderProps } from "react-hook-form";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useModalStore, useSettingsStore } from "@/lib/store";
import { apiRequest, queryClient } from "@/lib/queryClient"; // Assuming apiRequest can handle FormData
import { useToast } from "@/hooks/use-toast";
import ReceiptUpload from "@/components/upload/receipt-upload";
import { Loader2 } from "lucide-react";
import { format } from 'date-fns';

// --- Schema Definition ---
const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d{2}$/;

const createExpenseSchema = (template: string) => {
  const baseSchema = {
    date: z.string()
      .min(1, { message: "Date is required" })
      .regex(dateRegex, { message: "Date must be in MM/DD/YYYY format" }),
    cost: z.string().min(1, { message: "Amount is required" })
      .refine((val) => !isNaN(parseFloat(val)), { message: "Amount must be a number" })
      .refine((val) => parseFloat(val) > 0, { message: "Amount must be greater than 0" }),
    tripName: z.string().min(1, { message: "Trip is required" }),
    comments: z.string().optional(),
  };

  if (template === 'travel') {
    return z.object({
      ...baseSchema,
      type: z.string().min(1, { message: "Expense type is required" }),
      description: z.string().min(1, { message: "Description/Purpose is required" }),
      vendor: z.string().min(1, { message: "Vendor name is required" }),
      location: z.string().min(1, { message: "Location is required" }),
    });
  } else { // General template
    return z.object({
      ...baseSchema,
      type: z.string().min(1, { message: "Expense type is required" }),
      vendor: z.string().min(1, { message: "Vendor name is required" }),
      location: z.string().min(1, { message: "Location is required" }),
      // description is not part of the general schema
    });
  }
};

// --- Main Component ---
// Removed useOcrProcessing hook as OCR is now asynchronous
export default function AddExpenseModal() {
  const { ocrMethod, ocrTemplate } = useSettingsStore();
  const { addExpenseOpen: open, toggleAddExpense, defaultTripName } = useModalStore();
  const { toast } = useToast();

  const expenseSchema = createExpenseSchema(ocrTemplate);
  type ExpenseFormData = z.infer<typeof expenseSchema>;

  const form = useForm<any>({ // Use any for dynamic fields
    resolver: zodResolver(expenseSchema),
    defaultValues: { // Set initial defaults based on schema structure
      date: format(new Date(), 'MM/dd/yyyy'),
      cost: "",
      tripName: defaultTripName || "",
      comments: "",
      type: "",
      vendor: "",
      location: "",
      ...(ocrTemplate === 'travel' && { description: "" }), // Add description only for travel
    },
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens or template changes
  useEffect(() => {
    if (open) {
      const defaultValues = {
        date: format(new Date(), 'MM/dd/yyyy'), cost: "",
        tripName: defaultTripName || "", comments: "", type: "",
        vendor: "", location: "",
        ...(ocrTemplate === 'travel' && { description: "" }),
      };
      form.reset(defaultValues);
      setReceiptFile(null); // Also clear the selected receipt file
    }
  }, [open, form, ocrTemplate, defaultTripName]);

  const onSubmit = async (values: ExpenseFormData) => {
    setIsSubmitting(true);
    try {
      const submitFormData = new FormData();

      if (receiptFile) {
        // --- Handle OCR Submission ---
        console.log("Submitting receipt for OCR processing...");
        submitFormData.append('receipt', receiptFile);
        // Pass tripName if available, otherwise backend uses default
        if (values.tripName) {
            submitFormData.append('tripName', values.tripName);
        }

        // Call the new endpoint to trigger background OCR
        const response = await apiRequest('POST', '/api/expenses/process-ocr', submitFormData);

        if (response.status === 202) {
            // Background task accepted
            const result = await response.json();
            toast({
                title: "Receipt Processing Started",
                description: "Your receipt is being processed in the background.",
            });
            // Invalidate query to show placeholder if desired
            queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
            toggleAddExpense(); // Close modal
        } else {
             // Handle unexpected success status or error from trigger endpoint
             const errorData = await response.json().catch(() => ({ message: "Unknown error triggering OCR." }));
             throw new Error(errorData.message || `Failed to start OCR processing (Status: ${response.status})`);
        }

      } else {
        // --- Handle Manual Submission ---
        console.log("Submitting expense manually...");
        // Append all form values correctly
        Object.entries(values).forEach(([key, value]) => {
          if (value !== undefined && value !== null) { // Ensure value exists
             submitFormData.append(key, String(value)); // Convert all to string for FormData
          }
        });
         // Ensure cost is appended correctly as a number string if needed by backend
         submitFormData.set('cost', String(parseFloat(values.cost)));

        // Call the original endpoint for direct creation
        await apiRequest('POST', '/api/expenses', submitFormData);

        toggleAddExpense(); // Close modal
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
        toast({ title: "Expense added", description: "Expense added successfully" });
      }
      // Form reset is handled by useEffect on open state change
    } catch (error) {
      console.error("Error submitting expense:", error);
      toast({
        title: "Error Saving Expense",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Field Rendering Helpers ---
  const renderCommonFields = () => (
    <>
      {/* Date */}
      <FormField control={form.control} name="date" render={({ field }) => (
          <FormItem>
            <FormLabel className="font-medium">Date <span className="text-red-500">*</span></FormLabel>
            <FormControl><Input placeholder="MM/DD/YYYY" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* Cost */}
      <FormField control={form.control} name="cost" render={({ field }) => (
          <FormItem>
            <FormLabel className="font-medium">Amount <span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400">$</span>
                <Input type="number" step="0.01" className="pl-7" placeholder="0.00" {...field} />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* Trip Name */}
      <FormField control={form.control} name="tripName" render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel className="font-medium">Trip <span className="text-red-500">*</span></FormLabel>
            <FormControl><Input placeholder="Enter trip name" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  const renderTravelFields = () => (
    <>
      {renderCommonFields()}
      {/* Description */}
      <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel className="font-medium">Description/Purpose <span className="text-red-500">*</span></FormLabel>
            <FormControl><Textarea placeholder="Describe the purpose..." className="min-h-[80px]" {...field} /></FormControl>
            <FormDescription>Provide a clear business purpose</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* Type */}
      <FormField control={form.control} name="type" render={({ field }) => (
          <FormItem>
            <FormLabel className="font-medium">Expense Type <span className="text-red-500">*</span></FormLabel>
            <FormControl><Input placeholder="e.g., Food, Transport" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* Vendor */}
      <FormField control={form.control} name="vendor" render={({ field }) => (
          <FormItem>
            <FormLabel className="font-medium">Vendor <span className="text-red-500">*</span></FormLabel>
            <FormControl><Input placeholder="Vendor name" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* Location */}
      <FormField control={form.control} name="location" render={({ field }) => (
          <FormItem>
            <FormLabel className="font-medium">Location <span className="text-red-500">*</span></FormLabel>
            <FormControl><Input placeholder="City, Country" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  const renderGeneralFields = () => (
    <>
      {renderCommonFields()}
      {/* Type */}
      <FormField control={form.control} name="type" render={({ field }) => (
          <FormItem>
            <FormLabel>Expense Type <span className="text-red-500">*</span></FormLabel>
            <FormControl><Input placeholder="e.g., Office Supplies" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* Vendor */}
      <FormField control={form.control} name="vendor" render={({ field }) => (
          <FormItem>
            <FormLabel>Vendor <span className="text-red-500">*</span></FormLabel>
            <FormControl><Input placeholder="Vendor name" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* Location */}
      <FormField control={form.control} name="location" render={({ field }) => (
          <FormItem>
            <FormLabel>Location <span className="text-red-500">*</span></FormLabel>
            <FormControl><Input placeholder="Store Address" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* Comments */}
      <FormField control={form.control} name="comments" render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Comments</FormLabel>
            <FormControl><Textarea placeholder="Additional details or items..." className="min-h-[80px]" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  return (
    <Dialog open={open} onOpenChange={(newOpenState) => { if (!newOpenState && open) { toggleAddExpense(); } }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>Fill in the details below or upload a receipt.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          {/* Added max height and scroll */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[75vh] overflow-y-auto pr-4 pl-1">
            {/* Template indicator */}
            <div className={`p-3 rounded-md border text-sm font-medium ${ocrTemplate === 'travel' ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'}`}>
              Template: {ocrTemplate === 'travel' ? 'Travel Expense' : 'General Receipt'}
            </div>

            {/* Render fields based on template */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ocrTemplate === 'travel' ? renderTravelFields() : renderGeneralFields()}
            </div>

            {/* Receipt Upload Section */}
            <div>
              <FormLabel>Receipt (Optional)</FormLabel>
              {/* Removed OCR processing overlay and result message */}
              <ReceiptUpload
                onFileSelect={setReceiptFile}
                selectedFile={receiptFile}
              />
            </div>

            <DialogFooter className="pt-4 sticky bottom-0 bg-background pb-2"> {/* Make footer sticky */}
              <Button type="button" variant="outline" onClick={() => toggleAddExpense()}>Cancel</Button>
              {/* Disable button only during submission, not OCR processing */}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : "Save Expense"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
