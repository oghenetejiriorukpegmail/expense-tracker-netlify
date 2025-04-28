import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { ExpenseSchema, ExpenseFilterSchema, CreateExpenseSchema, UpdateExpenseSchema } from './types/expense';
import { ExpenseService } from './services/expense.service';
import { pool } from './config/database';

const t = initTRPC.create();

// Base router and procedure helpers
const router = t.router;
const publicProcedure = t.procedure;

// Initialize services
const expenseService = new ExpenseService(pool);

// Middleware for error handling
const handleErrors = async (next: any) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      cause: error
    });
  }
};

// Add middleware to all procedures
const procedure = publicProcedure.use(handleErrors);

export const appRouter = router({
  expenses: router({
    list: procedure
      .input(ExpenseFilterSchema)
      .query(async ({ input }) => {
        return await expenseService.listExpenses(input);
      }),

    getById: procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        try {
          return await expenseService.getExpenseById(input.id);
        } catch (error) {
          if (error instanceof Error && error.message === 'Expense not found') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Expense not found'
            });
          }
          throw error;
        }
      }),

    create: procedure
      .input(CreateExpenseSchema)
      .mutation(async ({ input }) => {
        return await expenseService.createExpense(input);
      }),

    update: procedure
      .input(UpdateExpenseSchema)
      .mutation(async ({ input }) => {
        try {
          return await expenseService.updateExpense(input);
        } catch (error) {
          if (error instanceof Error && error.message === 'Expense not found') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Expense not found'
            });
          }
          throw error;
        }
      }),

    delete: procedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        try {
          await expenseService.deleteExpense(input.id);
          return { success: true };
        } catch (error) {
          if (error instanceof Error && error.message === 'Expense not found') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Expense not found'
            });
          }
          throw error;
        }
      })
  })
});

export type Router = typeof appRouter;