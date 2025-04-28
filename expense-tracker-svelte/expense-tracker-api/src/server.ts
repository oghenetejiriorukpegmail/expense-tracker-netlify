import { createHTTPServer } from '@trpc/server/adapters/standalone';
import cors from 'cors';
import { z } from 'zod';
import { initTRPC, TRPCError, inferAsyncReturnType } from '@trpc/server';
import { ExpenseService } from './services/expense.service';
import { initializeServices, testConnection, type Services } from './config/database';
import {
  ExpenseSchema,
  CreateExpenseSchema,
  UpdateExpenseSchema,
  ExpenseFilterSchema,
  type Expense,
  type CreateExpense,
  type UpdateExpense
} from './types/expense';

// Define context type
interface CreateContextOptions {
  services: Services;
  userId: string | null;
}

// Context creator function
function createContext({ req }: { req: any }): CreateContextOptions {
  // Get user ID from auth header
  // This is a placeholder - implement your actual auth logic here
  const authHeader = req.headers.authorization;
  const userId = authHeader ? authHeader.split(' ')[1] : null;

  return {
    services: initializeServices(),
    userId
  };
}

type Context = inferAsyncReturnType<typeof createContext>;

// Initialize tRPC
const t = initTRPC.context<Context>().create();

// Create router and procedure helpers
const router = t.router;
const publicProcedure = t.procedure;

// Middleware to check authentication
const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be authenticated to access this resource'
    });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId
    }
  });
});

// Protected procedure
const protectedProcedure = t.procedure.use(isAuthenticated);

// Create the router
const appRouter = router({
  expenses: router({
    list: protectedProcedure
      .input(ExpenseFilterSchema)
      .query(async ({ ctx, input }) => {
        try {
          return await ctx.services.expenseService.listExpenses({
            ...input,
            userId: ctx.userId!
          });
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch expenses',
            cause: error
          });
        }
      }),

    create: protectedProcedure
      .input(CreateExpenseSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await ctx.services.expenseService.createExpense({
            ...input,
            userId: ctx.userId!
          });
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create expense',
            cause: error
          });
        }
      }),

    update: protectedProcedure
      .input(UpdateExpenseSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          // Verify ownership
          const expense = await ctx.services.expenseService.getExpenseById(input.id!);
          if (expense.userId !== ctx.userId) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'You do not have permission to update this expense'
            });
          }
          return await ctx.services.expenseService.updateExpense(input);
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update expense',
            cause: error
          });
        }
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Verify ownership
          const expense = await ctx.services.expenseService.getExpenseById(input.id);
          if (expense.userId !== ctx.userId) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'You do not have permission to delete this expense'
            });
          }
          await ctx.services.expenseService.deleteExpense(input.id);
          return { success: true };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to delete expense',
            cause: error
          });
        }
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        try {
          const expense = await ctx.services.expenseService.getExpenseById(input.id);
          if (expense.userId !== ctx.userId) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'You do not have permission to view this expense'
            });
          }
          return expense;
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch expense',
            cause: error
          });
        }
      })
  })
});

// Export type router type
export type AppRouter = typeof appRouter;

// Initialize server
async function main() {
  try {
    // Test database connection
    await testConnection();

    // Create HTTP server
    const server = createHTTPServer({
      router: appRouter,
      createContext,
      middleware: cors()
    });

    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    server.listen(port);
    console.log(`Server listening on port ${port}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server
if (require.main === module) {
  main();
}

export { appRouter };