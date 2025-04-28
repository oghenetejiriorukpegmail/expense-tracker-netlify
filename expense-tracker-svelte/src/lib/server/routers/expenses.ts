import { router } from '../trpc';
import { protectedProcedure } from '../middleware/auth';
import { z } from 'zod';

// Define the expense schema
const expenseSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
  date: z.string().datetime(),
  category: z.string(),
  receiptUrl: z.string().optional()
});

export const expensesRouter = router({
  // Get all expenses for the authenticated user
  list: protectedProcedure
    .query(async ({ ctx }) => {
      // TODO: Implement database query
      return [];
    }),

  // Get a single expense by ID
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      // TODO: Implement database query
      return null;
    }),

  // Create a new expense
  create: protectedProcedure
    .input(expenseSchema)
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement database mutation
      return {
        id: 'temp-id',
        userId: ctx.user.id,
        ...input,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }),

  // Update an existing expense
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: expenseSchema.partial()
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement database mutation
      return {
        id: input.id,
        userId: ctx.user.id,
        ...input.data,
        updatedAt: new Date().toISOString()
      };
    }),

  // Delete an expense
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement database mutation
      return { id: input };
    })
});