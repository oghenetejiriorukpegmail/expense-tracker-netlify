import { router } from './trpc';
import { tripRouter } from './routers/trip';
import { expenseRouter } from './routers/expense';
import { userRouter } from './routers/user';

export const appRouter = router({
  trip: tripRouter,
  expense: expenseRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;