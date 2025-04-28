import { router } from '../router';
import { expenseRouter } from './expense';

export const appRouter = router({
  expense: expenseRouter,
  // Add other routers here as we create them
});

export type AppRouter = typeof appRouter;

// Export individual routers for direct imports
export { expenseRouter };