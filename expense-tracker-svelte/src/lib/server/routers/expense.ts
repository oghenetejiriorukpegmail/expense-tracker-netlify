import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// Validation schemas
const expenseSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
  date: z.string().datetime(),
  category: z.string().min(1),
  receiptUrl: z.string().url().optional(),
});

const expenseIdSchema = z.object({
  id: z.string().min(1),
});

// Create the expense router
export const expenseRouter = router({
  // Create a new expense
  create: protectedProcedure
    .input(expenseSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Here you would typically save to your database
        // For now, we'll just return the input
        return {
          id: 'temp-id',
          userId: ctx.user.id,
          ...input,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create expense',
          cause: error,
        });
      }
    }),

  // Get all expenses for the current user
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional(),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Here you would typically fetch from your database
        return {
          items: [],
          nextCursor: null,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch expenses',
          cause: error,
        });
      }
    }),

  // Get a single expense by ID
  byId: protectedProcedure
    .input(expenseIdSchema)
    .query(async ({ ctx, input }) => {
      try {
        // Here you would typically fetch from your database
        return null;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch expense',
          cause: error,
        });
      }
    }),

  // Update an expense
  update: protectedProcedure
    .input(z.object({
      id: z.string().min(1),
      data: expenseSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Here you would typically update in your database
        return {
          id: input.id,
          ...input.data,
          updatedAt: new Date().toISOString(),
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update expense',
          cause: error,
        });
      }
    }),

  // Delete an expense
  delete: protectedProcedure
    .input(expenseIdSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Here you would typically delete from your database
        return { id: input.id };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete expense',
          cause: error,
        });
      }
    }),
});