import { useState } from "react";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EyeIcon, EditIcon, Trash2Icon, ArrowUpDown } from "lucide-react";
import { useModalStore } from "@/lib/store";

import { Loader2, AlertCircle } from "lucide-react"; // Import icons
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Import Tooltip

// Update Expense interface to include status and error
interface Expense {
  id: number;
  date: string; // Assuming YYYY-MM-DD string from DB
  type: string;
  vendor: string;
  location: string;
  tripName: string;
  cost: string; // Schema uses numeric, often mapped to string
  receiptPath?: string | null;
  status?: string | null; // e.g., 'processing_ocr', 'ocr_failed', 'complete'
  ocrError?: string | null;
}

interface ExpenseTableProps {
  expenses: Expense[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function ExpenseTable({ expenses, onEdit, onDelete }: ExpenseTableProps) {
  const { openReceiptViewer } = useModalStore();
  const [sortField, setSortField] = useState<keyof Expense>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  const handleSort = (field: keyof Expense) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  const sortedExpenses = [...expenses].sort((a, b) => {
    // Handle potential null status for sorting robustness
    const statusA = a.status || 'complete';
    const statusB = b.status || 'complete';

    // Prioritize processing/failed items? Or sort normally?
    // For now, sort normally based on selected field.

    if (sortField === "cost") {
      // Convert cost string to number for comparison
      const costA = parseFloat(a.cost || '0');
      const costB = parseFloat(b.cost || '0');
      return sortDirection === "asc" ? costA - costB : costB - costA;
    } else if (sortField === "date") {
      // Date is string 'YYYY-MM-DD', compare directly or parse
      // Direct string comparison works for YYYY-MM-DD
      return sortDirection === "asc"
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date);
      // Or parse dates:
      // return sortDirection === "asc"
        ? new Date(a.date).getTime() - new Date(b.date).getTime() 
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    } else {
      const aValue = a[sortField as keyof Expense];
      const bValue = b[sortField as keyof Expense];
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      return 0;
    }
  });

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("date")}
            >
              <div className="flex items-center">
                Date
                {sortField === "date" && (
                  <ArrowUpDown className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "transform rotate-180" : ""}`} />
                )}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("type")}
            >
              <div className="flex items-center">
                Type
                {sortField === "type" && (
                  <ArrowUpDown className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "transform rotate-180" : ""}`} />
                )}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("vendor")}
            >
              <div className="flex items-center">
                Vendor
                {sortField === "vendor" && (
                  <ArrowUpDown className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "transform rotate-180" : ""}`} />
                )}
              </div>
            </TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Trip</TableHead>
            <TableHead 
              className="text-right cursor-pointer"
              onClick={() => handleSort("cost")}
            >
              <div className="flex items-center justify-end">
                Amount
                {sortField === "cost" && (
                  <ArrowUpDown className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "transform rotate-180" : ""}`} />
                )}
              </div>
            </TableHead>
            <TableHead className="text-center">Receipt</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedExpenses.length > 0 ? (
            sortedExpenses.map((expense) => (
              <TableRow key={expense.id} className={expense.status === 'processing_ocr' ? 'opacity-60' : ''}>
                {/* Format date string */}
                <TableCell>{format(new Date(expense.date.replace(/-/g, '/')), "MMM d, yyyy")}</TableCell>
                {/* Modify Type cell to show status */}
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {expense.status === 'processing_ocr' && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                    {expense.status === 'ocr_failed' && (
                      <TooltipProvider>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger>
                             <AlertCircle className="h-4 w-4 text-red-500" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs break-words">
                            <p>OCR Failed: {expense.ocrError || 'Unknown error'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <span>{expense.type}</span>
                  </div>
                </TableCell>
                <TableCell>{expense.vendor}</TableCell>
                <TableCell>{expense.location}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-primary text-xs rounded-full">
                    {expense.tripName}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${parseFloat(expense.cost).toFixed(2)}
                </TableCell>
                <TableCell className="text-center">
                  {/* Disable view button if processing */}
                  {expense.receiptPath ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-500 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={expense.status === 'processing_ocr'}
                      onClick={() => {
                        // TODO: Use signed URLs instead of public URLs for security
                        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                        const bucketName = import.meta.env.VITE_SUPABASE_BUCKET_NAME;
                        if (supabaseUrl && bucketName && expense.receiptPath) {
                          // Constructing public URL - consider switching to signed URLs via an API endpoint
                          const imageUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${expense.receiptPath}`;
                          openReceiptViewer(imageUrl);
                        } else {
                          console.error("Supabase URL or Bucket Name not configured, or receipt path missing.");
                        }
                      }}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                  ) : (
                    <span className="text-gray-400 text-sm">None</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center space-x-2">
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={expense.status === 'processing_ocr'} // Disable edit while processing
                      onClick={() => onEdit(expense.id)}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={expense.status === 'processing_ocr'} // Disable delete while processing
                      onClick={() => onDelete(expense.id)}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-6 text-gray-500 dark:text-gray-400">
                No expenses found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
