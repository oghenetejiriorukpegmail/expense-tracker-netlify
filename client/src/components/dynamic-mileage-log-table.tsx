import { lazy, Suspense } from 'react';
import { Loader2 } from "lucide-react";
import type { ComponentType } from 'react';
import type { MileageLog } from '@shared/schema';

// Dynamically import the MileageLogTable component
const MileageLogTable = lazy(() => import('./mileage-log-table').then(module => ({ 
  default: module.default as ComponentType<MileageLogTableProps> 
})));

// Define the props interface
interface MileageLogTableProps {
  logs: MileageLog[];
  isLoading: boolean;
}

// Loading fallback component
const TableLoadingFallback = () => (
  <div className="rounded-md border mt-4 p-8">
    <div className="flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
      <span>Loading mileage logs...</span>
    </div>
  </div>
);

// Wrapper component that uses Suspense
export default function DynamicMileageLogTable(props: MileageLogTableProps) {
  return (
    <Suspense fallback={<TableLoadingFallback />}>
      <MileageLogTable {...props} />
    </Suspense>
  );
}