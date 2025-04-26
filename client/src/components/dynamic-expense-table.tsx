import { lazy, Suspense } from 'react';
import { Loader2 } from "lucide-react";
import type { ComponentType } from 'react';

// Dynamically import the ExpenseTable component
const ExpenseTable = lazy(() => import('./expense-table').then(module => ({
  default: module.default as ComponentType<ExpenseTableProps>
})));

// Define the props interface
interface Expense {
  id: number;
  date: string;
  type: string;
  vendor: string;
  location: string;
  tripName: string;
  cost: string;
  receiptPath?: string | null;
  status?: string | null;
  ocrError?: string | null;
}

interface ExpenseTableProps {
  expenses: Expense[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

// Loading fallback component
const TableLoadingFallback = () => (
  <div className="border rounded-md p-8">
    <div className="flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
      <span>Loading expense table...</span>
    </div>
  </div>
);

// Wrapper component that uses Suspense
export default function DynamicExpenseTable(props: ExpenseTableProps) {
  return (
    <Suspense fallback={<TableLoadingFallback />}>
      <ExpenseTable {...props} />
    </Suspense>
  );
}