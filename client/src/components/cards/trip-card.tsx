import { useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react"; // Import Clerk useAuth
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/lib/store";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, Car } from "lucide-react";

import type { Trip, Expense } from "@shared/schema"; // Import Expense type as well

interface TripCardProps {
  trip: Trip;
}

export default function TripCard({ trip }: TripCardProps) {
  const { toggleAddExpense, toggleEditTrip, toggleBatchUpload, toggleAddEditMileageLog } = useModalStore();
  const { toast } = useToast();
  const { getToken } = useAuth(); // Get getToken from Clerk
  const [isDeleting, setIsDeleting] = useState(false);
  // Removed isEditing state as it wasn't used

  // Fetch expenses specifically for this trip
  const { data: tripExpenses } = useQuery<Expense[]>({ // Add type annotation for data
    queryKey: ["/api/expenses", trip.name],
    queryFn: async () => {
      const token = await getToken(); // Get Clerk token
      if (!token) throw new Error("Not authenticated");
      const headers = { Authorization: `Bearer ${token}` };
      const url = `/api/expenses?tripName=${encodeURIComponent(trip.name)}`;
      const res = await apiRequest("GET", url, undefined, headers); // Use apiRequest and pass headers
      // Removed redundant !res.ok check as apiRequest handles it
      return res.json();
    },
    enabled: !!getToken, // Only run query if getToken is available
  });

  const expenseCount = tripExpenses?.length || 0;
  const totalSpent = tripExpenses
    ? tripExpenses.reduce((sum: number, expense: Expense) => sum + parseFloat(expense.cost || '0'), 0).toFixed(2) // Use Expense type
    : "0.00";

  // Removed handleExportTrip function

  const handleDeleteTrip = async () => {
    setIsDeleting(true);
    try {
      const token = await getToken(); // Get Clerk token
      if (!token) throw new Error("Not authenticated");
      const headers = { Authorization: `Bearer ${token}` };
      await apiRequest("DELETE", `/api/trips/${trip.id}`, undefined, headers); // Use apiRequest and pass headers

      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });

      toast({
        title: "Trip deleted",
        description: "The trip has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddExpense = () => {
    toggleAddExpense(trip.name);
  };

  const formattedDate = trip.createdAt
    ? format(new Date(trip.createdAt), "MMM d, yyyy")
    : "Date unknown";

  return (
    <div className="p-4 border dark:border-gray-700 rounded-lg hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-base">{trip.name}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{trip.description || ''}</p>
          <div className="mt-2 flex items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formattedDate}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center ml-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {expenseCount} expense{expenseCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="flex">
          <Button variant="ghost" size="icon" asChild>
            <a href={`/expenses?trip=${encodeURIComponent(trip.name)}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </a>
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleEditTrip(trip)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Trip</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this trip? This will also delete all associated expenses and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-red-500 hover:bg-red-600"
                  onClick={handleDeleteTrip}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Trip"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t dark:border-gray-700 flex justify-between items-center">
        <div>
          <span className="font-medium">${totalSpent}</span>
          <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">total</span>
        </div>
        <div className="space-x-2">
          <Button 
            size="sm" 
            className="px-2.5 py-1 text-xs bg-primary text-white rounded hover:bg-blue-600" 
            onClick={handleAddExpense}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Expense
          </Button>
          {/* Add Mileage Button */}
          <Button
            size="sm"
            className="px-2.5 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
            onClick={() => toggleAddEditMileageLog({ tripId: trip.id })}
          >
            <Car className="h-3.5 w-3.5 mr-1" />
            + Mileage
          </Button>

          {/* Change Button to an <a> tag styled as a button */}
          <Button
            size="sm"
            variant="outline"
            className={`px-2.5 py-1 text-xs ${expenseCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            asChild
            disabled={expenseCount === 0}
          >
            <a
              href={expenseCount > 0 ? `/api/export-expenses?tripName=${encodeURIComponent(trip.name)}` : undefined}
              download
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => { if (expenseCount === 0) e.preventDefault(); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </a>
          </Button>
          {/* Add Batch Upload Button */}
          <Button
            size="sm"
            variant="outline"
            className="px-2.5 py-1 text-xs"
            onClick={() => toggleBatchUpload({ id: trip.id, name: trip.name })}
          >
             <UploadCloud className="h-3.5 w-3.5 mr-1" />
             Batch Upload
          </Button>
        </div>
      </div>
    </div>
  );
}
