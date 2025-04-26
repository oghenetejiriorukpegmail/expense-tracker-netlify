import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function OCRProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Function to trigger the background processor
  const processNextTask = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/background-processor/process-next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to process task: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.message === "No pending tasks found") {
        toast({
          title: "No pending tasks",
          description: "There are no pending OCR tasks to process.",
        });
      } else if (result.error) {
        toast({
          title: "OCR processing failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "OCR processing complete",
          description: `Successfully processed receipt for expense ${result.expenseId}`,
        });
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
        queryClient.invalidateQueries({ queryKey: ["/api/background-tasks"] });
      }
    } catch (error) {
      toast({
        title: "Error processing OCR task",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Receipt OCR Processing</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Process receipts with OCR (Optical Character Recognition) to automatically extract information.
        This will analyze any pending receipts and update the corresponding expenses with the extracted data.
      </p>
      <Button 
        onClick={processNextTask} 
        disabled={isProcessing}
        className="w-full md:w-auto"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Process Next Receipt"
        )}
      </Button>
    </div>
  );
}