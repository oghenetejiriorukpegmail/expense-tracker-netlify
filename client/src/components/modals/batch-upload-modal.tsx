import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/lib/store";
import { useLocation } from "wouter"; // Import useLocation for navigation
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import { useDropzone } from 'react-dropzone';
import { apiRequest, queryClient } from "@/lib/queryClient"; // Import queryClient

// Removed UploadResult interface

export default function BatchUploadModal() {
  const { batchUploadOpen: open, toggleBatchUpload } = useModalStore();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null); // State for single file
  const [isUploading, setIsUploading] = useState(false);
  // Removed uploadResults state

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      // Accept only the first file for single file upload
      const selectedFile = acceptedFiles[0];
      // Basic validation (can add more specific checks if needed)
      if (selectedFile.type === 'text/csv' || selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
         setFile(selectedFile);
      } else {
         toast({ title: "Invalid File Type", description: "Please upload a CSV or XLSX file.", variant: "destructive" });
      }
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false // Ensure only one file is accepted
  });

  const removeFile = () => {
    setFile(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append('batchFile', file); // Use 'batchFile' as the field name

    try {
      // Call the new endpoint to trigger background processing
      const response = await apiRequest("POST", `/api/expenses/batch-upload-trigger`, formData);

      if (response.status === 202) {
         const result = await response.json();
         toast({
           title: "Batch Upload Started",
           description: "Your file is being processed in the background. You'll be notified on completion.",
         });
         // Optionally store task ID if needed for monitoring in this session
         // console.log("Background Task Info:", result.task);
         handleClose(); // Close modal immediately
      } else {
         // Handle unexpected success status or error from trigger endpoint
         const errorData = await response.json().catch(() => ({ message: "Unknown error starting batch upload." }));
         throw new Error(errorData.message || `Failed to start batch upload (Status: ${response.status})`);
      }

    } catch (error) {
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "An unknown error occurred during upload.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null); // Clear file when closing
    toggleBatchUpload();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Batch Upload Expenses</DialogTitle>
          <DialogDescription>
            Upload a CSV or XLSX file containing expense data. Ensure the file has headers like: date, type, vendor, location, cost, tripName, comments (optional).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 dark:border-gray-600 hover:border-primary'
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
            {isDragActive ? (
              <p className="mt-2 text-sm text-primary">Drop the file here ...</p>
            ) : (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Drag 'n' drop a CSV/XLSX file here, or click to select</p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Supports: CSV, XLSX</p>
          </div>

          {/* Display selected file */}
          {file && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Selected File:</h4>
              <div className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                 <div className="flex items-center space-x-2 truncate">
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate" title={file.name}>{file.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                 </div>
                 <Button variant="ghost" size="icon" className="h-6 w-6" onClick={removeFile}>
                   <X className="h-4 w-4" />
                 </Button>
              </div>
            </div>
          )}

          {/* Removed upload results display */}

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting Upload...</> : `Upload File`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}