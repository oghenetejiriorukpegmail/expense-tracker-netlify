import { useEffect, lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { supabase } from "./lib/supabaseClient";
import { RealtimeChannel, RealtimePostgresChangesPayload, REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import { useToast } from "./hooks/use-toast";
import { ProtectedRoute } from "@/lib/protected-route";
import { useModalStore } from "./lib/store";
import type { BackgroundTask } from "../../shared/schema";
import { AuthProvider } from "@/lib/authContext"; // Import our new AuthProvider

// Dynamically import page components
const NotFound = lazy(() => import("@/pages/not-found"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const VerifyEmailPage = lazy(() => import("@/pages/verify-email-page"));
const AuthCallbackHandler = lazy(() => import("@/pages/auth-callback-handler"));
const DashboardPage = lazy(() => import("@/pages/dashboard-page"));
const TripsPage = lazy(() => import("@/pages/trips-page"));
const ExpensesPage = lazy(() => import("@/pages/expenses-page"));
const SettingsPage = lazy(() => import("@/pages/settings-page"));
const ProfilePage = lazy(() => import("@/pages/profile-page"));
const MileageLogsPage = lazy(() => import("@/pages/mileage-logs-page"));

// Dynamically import modal components
const EditTripModal = lazy(() => import("@/components/modals/edit-trip-modal"));
const EditExpenseModal = lazy(() => import("@/components/modals/edit-expense-modal"));
const BatchUploadModal = lazy(() => import("@/components/modals/batch-upload-modal"));
const AddEditMileageLogModal = lazy(() => import("@/components/modals/add-edit-mileage-log-modal"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        <ProtectedRoute path="/" component={DashboardPage} />
        <ProtectedRoute path="/trips" component={TripsPage} />
        <ProtectedRoute path="/expenses" component={ExpensesPage} />
        <ProtectedRoute path="/settings" component={SettingsPage} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <ProtectedRoute path="/mileage-logs" component={MileageLogsPage} />
        {/* Auth routes */}
        <Route path="/auth/callback" component={AuthCallbackHandler} />
        <Route path="/auth/reset-password" component={AuthPage} />
        <Route path="/auth/verify-email" component={VerifyEmailPage} />
        <Route path="/auth/sign-in" component={AuthPage} />
        <Route path="/auth/sign-up" component={AuthPage} />
        <Route path="/auth" component={AuthPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
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
      {/* Wrap the app with our Firebase AuthProvider */}
      <AuthProvider>
        <Router />
        <Toaster />
        {/* Wrap modals in Suspense */}
        <Suspense fallback={null}>
          <EditTripModal />
          <EditExpenseModal />
          <BatchUploadModal />
          {/* Render Mileage Log Modal conditionally */}
          <AddEditMileageLogModal
            isOpen={addEditMileageLogOpen}
            onClose={() => toggleAddEditMileageLog()}
            mileageLog={editingMileageLog}
            tripId={mileageLogTripId}
          />
        </Suspense>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
