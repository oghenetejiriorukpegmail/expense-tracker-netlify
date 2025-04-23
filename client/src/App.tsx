import { useEffect } from "react"; // Import useEffect
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { supabase } from "./lib/supabaseClient"; // Import supabase client
import { RealtimeChannel, RealtimePostgresChangesPayload, REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import { useToast } from "./hooks/use-toast"; // Import useToast
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "@/lib/protected-route";
import AuthPage from "@/pages/auth-page";
import VerifyEmailPage from "@/pages/verify-email-page"; // Import VerifyEmailPage
import AuthCallbackHandler from "@/pages/auth-callback-handler"; // Import AuthCallbackHandler
import DashboardPage from "@/pages/dashboard-page";
import TripsPage from "@/pages/trips-page";
import ExpensesPage from "@/pages/expenses-page";
import SettingsPage from "@/pages/settings-page";
import ProfilePage from "@/pages/profile-page"; // Import ProfilePage
import MileageLogsPage from "@/pages/mileage-logs-page"; // Import MileageLogsPage
import EditTripModal from "@/components/modals/edit-trip-modal"; // Import EditTripModal
import EditExpenseModal from "@/components/modals/edit-expense-modal"; // Import EditExpenseModal
import BatchUploadModal from "@/components/modals/batch-upload-modal"; // Import BatchUploadModal
import AddEditMileageLogModal from "@/components/modals/add-edit-mileage-log-modal"; // Import Mileage Log Modal
import { useModalStore } from "./lib/store"; // Import modal store
import type { BackgroundTask } from "../../shared/schema"; // Corrected relative path
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react"; // Import Clerk callback component

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/trips" component={TripsPage} />
      <ProtectedRoute path="/expenses" component={ExpensesPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} /> {/* Add Profile route */}
      <ProtectedRoute path="/mileage-logs" component={MileageLogsPage} /> {/* Add Mileage Logs route */}
      {/* Handle all Clerk authentication paths using the callback handler */}
      <Route path="/auth/:rest*" component={AuthCallbackHandler} />
      {/* Explicit route for the base auth page if needed, though the wildcard might cover it */}
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Get modal state and toggle function from store
  const {
    addEditMileageLogOpen,
    editingMileageLog,
    mileageLogTripId,
    toggleAddEditMileageLog,
  } = useModalStore();


  const { toast } = useToast(); // Get toast function

  // Global subscription for background task updates
  useEffect(() => {
    if (!supabase) return;

    let channel: RealtimeChannel | null = null;

    const setupSubscription = () => {
      channel = supabase
        .channel('background-task-updates')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'background_tasks' },
          // Use the specific BackgroundTask type for the payload
          (payload: RealtimePostgresChangesPayload<BackgroundTask>) => {
            console.log('Background task update received:', payload);

            // Use a more specific type guard for payload.new
            if (!payload.new || !('id' in payload.new)) {
              console.log('Received update payload without new data or required fields, skipping.');
              return;
            }

            // Use a type guard for payload.old before accessing properties
            const oldStatus = (payload.old && 'status' in payload.old) ? payload.old.status : undefined;
            const newStatus = payload.new.status;
            const taskType = payload.new.type;
            const taskId = payload.new.id;

            if (oldStatus !== newStatus && (newStatus === 'completed' || newStatus === 'failed')) {
              console.log(`Task ${taskId} (${taskType}) finished with status: ${newStatus}`);

              let resultData: any = null;
              // Check if result exists and is a string before parsing
              if (payload.new.result && typeof payload.new.result === 'string') {
                  try {
                      resultData = JSON.parse(payload.new.result);
                  } catch (e) {
                      console.error(`Task ${taskId}: Failed to parse result JSON:`, payload.new.result, e);
                  }
              }
              const errorMsg = payload.new.error; // error is already string | null

              if (newStatus === 'completed') {
                let description: React.ReactNode = resultData?.message || `${taskType} task completed successfully.`; // Type description as ReactNode
                // Special handling for export to provide download link
                if (taskType === 'expense_export' && resultData?.downloadUrl) {
                    description = (
                        <span>
                            Expense export ready!{' '}
                            <a href={resultData.downloadUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800">
                                Download here
                            </a>
                            {' '}(Link valid for 10 minutes)
                        </span>
                    );
                }
                toast({ title: `Task Complete: ${taskType}`, description });
              } else { // status === 'failed'
                toast({
                  title: `Task Failed: ${taskType}`,
                  description: `Task ${taskId} failed: ${errorMsg || 'Unknown error'}`,
                  variant: "destructive",
                  duration: 10000, // Show error longer
                });
              }

              // Optionally invalidate queries related to tasks if needed
              // queryClient.invalidateQueries({ queryKey: ['/api/background-tasks'] });
            }
          }
        )
        .subscribe((status: `${REALTIME_SUBSCRIBE_STATES}`, err?: Error) => {
          if (status === 'SUBSCRIBED') {
            console.log('Subscribed to background task updates!');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('Background task subscription error:', status, err?.message);
          }
        });
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
          .then(() => console.log('Unsubscribed from background task updates.'))
          .catch((err: Error) => console.error('Error unsubscribing from background task updates:', err.message));
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Removed AuthProvider wrapper */}
      <Router />
      <Toaster />
      {/* Add EditTripModal alongside other modals */}
      <EditTripModal />
      <EditExpenseModal />
      <BatchUploadModal /> {/* Render BatchUploadModal */}
      {/* Render Mileage Log Modal conditionally */}
      <AddEditMileageLogModal
        isOpen={addEditMileageLogOpen}
        onClose={() => toggleAddEditMileageLog()} // Close modal using toggle function
        mileageLog={editingMileageLog}
        tripId={mileageLogTripId}
      />
    </QueryClientProvider>
  );
}

export default App;
