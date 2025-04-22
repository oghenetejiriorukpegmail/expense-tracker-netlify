import { useState, useEffect, useCallback } from "react";
// Corrected import path and removed duplicates
import { supabase } from "../lib/supabaseClient";
import { RealtimeChannel, RealtimePostgresChangesPayload, REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
// Corrected store import
import { useModalStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import type { Trip, Expense } from "@shared/schema";
import { useLocation } from "wouter";
import AnimatedPage from "@/components/animated-page";
import {
  PlusIcon,
  Loader2,
  ArrowUpDown,
  Search,
  FileSpreadsheet,
  EyeIcon,
  EditIcon,
  Trash2Icon
} from "lucide-react";
import { format } from "date-fns";
import AddExpenseModal from "@/components/modals/add-expense-modal";
import AddTripModal from "@/components/modals/add-trip-modal";
import ReceiptViewerModal from "@/components/modals/receipt-viewer-modal";
import ExportExpensesModal from "@/components/modals/export-expenses-modal"; // Import ExportExpensesModal
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// --- Filter Controls Component ---
interface FilterControlsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  tripFilter: string;
  setTripFilter: (filter: string) => void;
  sortField: string;
  setSortField: (field: string) => void;
  trips: Trip[] | undefined;
}

const FilterControls = ({
  searchQuery,
  setSearchQuery,
  tripFilter,
  setTripFilter,
  sortField,
  setSortField,
  trips,
}: FilterControlsProps) => {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Search expenses..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={tripFilter} onValueChange={setTripFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by trip" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trips</SelectItem>
              {trips?.map((trip) => (
                <SelectItem key={trip.id} value={trip.name}>
                  {trip.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortField} onValueChange={setSortField}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="cost">Amount</SelectItem>
              <SelectItem value="vendor">Vendor</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Expense Table Component ---
interface ExpenseTableProps {
  expenses: Expense[];
  sortField: string;
  sortDirection: "asc" | "desc";
  handleSort: (field: keyof Expense | 'date' | 'cost') => void; // Adjusted type
  handleDelete: (id: number) => void;
  viewReceipt: (path: string) => void;
  editExpense: (expense: Expense) => void;
}

const ExpenseTable = ({
  expenses,
  sortField,
  sortDirection,
  handleSort,
  handleDelete,
  viewReceipt,
  editExpense,
}: ExpenseTableProps) => {

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return <ArrowUpDown className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "transform rotate-180" : ""}`} />;
  };

  const renderTableHeader = (field: keyof Expense | 'date' | 'cost', label: string, align: 'left' | 'right' | 'center' = 'left') => (
    <th
      className={`text-${align} py-3 px-4 font-medium text-xs uppercase text-gray-500 dark:text-gray-400 cursor-pointer`}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center ${align === 'right' ? 'justify-end' : ''}`}>
        {label}
        {renderSortIcon(field)}
      </div>
    </th>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
              {renderTableHeader('date', 'Date')}
              {renderTableHeader('type', 'Type')}
              {renderTableHeader('vendor', 'Vendor')}
              <th className="text-left py-3 px-4 font-medium text-xs uppercase text-gray-500 dark:text-gray-400">Location</th>
              <th className="text-left py-3 px-4 font-medium text-xs uppercase text-gray-500 dark:text-gray-400">Comments/Desc.</th>
              <th className="text-left py-3 px-4 font-medium text-xs uppercase text-gray-500 dark:text-gray-400">Trip</th>
              {renderTableHeader('cost', 'Amount', 'right')}
              <th className="text-center py-3 px-4 font-medium text-xs uppercase text-gray-500 dark:text-gray-400">Receipt</th>
              <th className="text-center py-3 px-4 font-medium text-xs uppercase text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length > 0 ? (
              expenses.map((expense) => (
                <tr key={expense.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="py-3 px-4">{format(new Date(expense.date), "MMM d, yyyy")}</td>
                  <td className="py-3 px-4">{expense.type}</td>
                  <td className="py-3 px-4">{expense.vendor}</td>
                  <td className="py-3 px-4">{expense.location}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate" title={expense.comments || ''}>
                    {expense.comments || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-primary text-xs rounded-full">
                      {expense.tripName}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium">
                    ${(typeof expense.cost === 'number' ? expense.cost : parseFloat(expense.cost)).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {expense.receiptPath ? (
                      <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-700" onClick={() => viewReceipt(`/uploads/${expense.receiptPath}`)}>
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="text-gray-400 text-sm">None</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center space-x-2">
                      <Button variant="ghost" size="sm" className="text-gray-500 hover:text-primary" onClick={() => editExpense(expense)}>
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-500">
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                            <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => handleDelete(expense.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="py-6 text-center text-gray-500 dark:text-gray-400">
                  No expenses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};


// --- Main Expenses Page Component ---
export default function ExpensesPage() {
  // Use toggleExportExpenses from the store
  const { toggleAddExpense, openReceiptViewer, toggleEditExpense, toggleExportExpenses } = useModalStore();
  const { toast } = useToast();
  const [tripFilter, setTripFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortField, setSortField] = useState<keyof Expense | 'date' | 'cost'>("date"); // Use specific keys
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [location] = useLocation();

  // Fetch expenses
  const { data: expenses, isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    queryFn: () => apiRequest('GET', '/api/expenses').then(res => res.json()), // Parse JSON
  });

  // Fetch trips
  const { data: trips, isLoading: tripsLoading } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
    queryFn: () => apiRequest('GET', '/api/trips').then(res => res.json()), // Parse JSON
  });

  // Effect to read trip filter from URL on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tripNameFromUrl = params.get("trip");
    if (tripNameFromUrl) {
      setTripFilter(decodeURIComponent(tripNameFromUrl));
    }
  }, []); // Run only once on mount

  // Realtime subscription for expense updates (e.g., OCR status)
  useEffect(() => {
    // Ensure supabase client is available
    if (!supabase) return;

    let channel: RealtimeChannel | null = null;

    const setupSubscription = () => {
      channel = supabase
        .channel('expense-updates') // Unique channel name
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'expenses' },
          // Add explicit type for payload
          (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
            console.log('Expense update received:', payload);
            // Check if the status changed (or any relevant field)
            // Use type assertion for new/old records
            const oldRecord = payload.old as Expense;
            const newRecord = payload.new as Expense;
            const oldStatus = oldRecord?.status;
            const newStatus = newRecord?.status;

            if (oldStatus !== newStatus) {
                console.log(`Expense ${newRecord.id} status changed from ${oldStatus} to ${newStatus}. Invalidating query.`);
                // Invalidate the expenses query to refetch data and update the table
                queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });

                // Optional: Show a toast notification
                if (newStatus === 'complete') {
                    toast({ title: "OCR Complete", description: `Receipt for expense ${newRecord.id} processed.` });
                } else if (newStatus === 'ocr_failed') {
                    toast({ title: "OCR Failed", description: `Processing failed for expense ${newRecord.id}: ${newRecord.ocrError || 'Unknown error'}`, variant: "destructive" });
                }
            }
          }
        )
        // Add explicit types for status and err
        .subscribe((status: `${REALTIME_SUBSCRIBE_STATES}`, err?: Error) => {
           if (status === 'SUBSCRIBED') {
             console.log('Subscribed to expense updates!');
           } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
             console.error('Expense subscription error:', status, err?.message);
             // Optional: Attempt to resubscribe after a delay
           }
        });
    };

    setupSubscription();

    // Cleanup function to remove the channel subscription when the component unmounts
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
          .then(() => console.log('Unsubscribed from expense updates.'))
          // Add explicit type for err
          .catch((err: Error) => console.error('Error unsubscribing from expense updates:', err.message));
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]); // Add toast to dependency array


  const handleExportExpenses = async () => {
    // This function is now just a placeholder, the real logic is in the modal
    // Trigger the modal using the store function
    toggleExportExpenses();
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/expenses/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Expense deleted" });
    } catch (error) {
      toast({ title: "Delete failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    }
  };

  // Memoized sorting and filtering logic
  const filteredAndSortedExpenses = useCallback(() => {
    if (!expenses) return [];

    return expenses
      .filter((expense) => {
        const matchesTrip = tripFilter === "all" || expense.tripName === tripFilter;
        const lowerSearch = searchQuery.toLowerCase();
        const matchesSearch = searchQuery === "" ||
          expense.vendor?.toLowerCase().includes(lowerSearch) ||
          expense.location?.toLowerCase().includes(lowerSearch) ||
          expense.type?.toLowerCase().includes(lowerSearch) ||
          expense.comments?.toLowerCase().includes(lowerSearch);
        return matchesTrip && matchesSearch;
      })
      .sort((a, b) => {
        let comparison = 0;
        const valA = a[sortField];
        const valB = b[sortField];

        if (sortField === 'date') {
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        } else if (sortField === 'cost') {
          comparison = (typeof valA === 'number' ? valA : parseFloat(valA as string)) - (typeof valB === 'number' ? valB : parseFloat(valB as string));
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB);
        }
        // Handle cases where fields might be null/undefined if necessary

        return sortDirection === "asc" ? comparison : -comparison;
      });
  }, [expenses, tripFilter, searchQuery, sortField, sortDirection]);

  const handleSort = useCallback((field: keyof Expense | 'date' | 'cost') => {
    setSortDirection((prevDirection) =>
      sortField === field && prevDirection === "asc" ? "desc" : "asc"
    );
    setSortField(field);
  }, [sortField]);


  const isLoading = expensesLoading || tripsLoading;
  const finalExpenses = filteredAndSortedExpenses(); // Calculate once

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <Sidebar />
      <AnimatedPage className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold mb-2 md:mb-0">Expenses</h1>
          <div className="flex flex-wrap gap-2">
            {/* Wire button to toggleExportExpenses from store */}
            <Button variant="outline" onClick={toggleExportExpenses}>
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Export Expenses
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => toggleAddExpense(tripFilter !== 'all' ? tripFilter : undefined)}
            >
              <PlusIcon className="h-4 w-4 mr-2" /> Add Expense
            </Button>
            {/* Removed duplicate export button */}
          </div>
        </div>

        <FilterControls
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          tripFilter={tripFilter}
          setTripFilter={setTripFilter}
          sortField={sortField}
          setSortField={setSortField as (field: string) => void} // Cast for Select compatibility
          trips={trips}
        />

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ExpenseTable
            expenses={finalExpenses}
            sortField={sortField}
            sortDirection={sortDirection}
            handleSort={handleSort}
            handleDelete={handleDeleteExpense}
            viewReceipt={openReceiptViewer}
            editExpense={toggleEditExpense}
          />
        )}

        {/* Render empty state within the table component if no expenses */}
        {!isLoading && finalExpenses.length === 0 && (
           <div className="text-center py-10 text-gray-500 dark:text-gray-400">
             {searchQuery || tripFilter !== "all" ? (
               "No expenses match your search criteria."
             ) : (
               <div className="flex flex-col items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 10c0 5-3.5 8.5-7 11.5-3.5-3-7-6.5-7-11.5a7 7 0 1114 0z" />
                 </svg>
                 <p className="mb-4">No expenses have been added yet.</p>
                 <Button
                   className="bg-primary text-primary-foreground hover:bg-primary/90"
                   onClick={() => toggleAddExpense(tripFilter !== 'all' ? tripFilter : undefined)}
                 >
                   <PlusIcon className="h-4 w-4 mr-2" /> Add Your First Expense
                 </Button>
               </div>
             )}
           </div>
        )}

      {/* Render the ExportExpensesModal */}
      </AnimatedPage>

      {/* Modals */}
      <AddExpenseModal />
      <AddTripModal />
      <ReceiptViewerModal />
      <ExportExpensesModal />
    </div>
  );
}
