import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { insertTripSchema, type Trip, TripStatus } from '$lib/types/schema';
import { TRPCError } from '@trpc/server';

export const tripRouter = router({
  // List all trips for the current user
  list: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const trips = await ctx.storage.getTripsByUserId(ctx.user.id);
        return trips;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch trips',
          cause: error,
        });
      }
    }),

  // Get a single trip by ID
  getById: protectedProcedure
    .input(z.number())
    .query(async ({ ctx, input: id }) => {
      try {
        const trip = await ctx.storage.getTrip(id);
        if (!trip) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Trip not found',
          });
        }
        if (trip.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Access denied',
          });
        }
        return trip;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch trip',
          cause: error,
        });
      }
    }),

  // Create a new trip
  create: protectedProcedure
    .input(insertTripSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const trip = await ctx.storage.createTrip({
          ...input,
          userId: ctx.user.id,
        });
        return trip;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create trip',
          cause: error,
        });
      }
    }),

  // Update an existing trip
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: TripStatus.optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      budget: z.number().min(0).optional(),
      currency: z.string().optional(),
      location: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...data } = input;
        const existingTrip = await ctx.storage.getTrip(id);
        
        if (!existingTrip) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Trip not found',
          });
        }
        
        if (existingTrip.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Access denied',
          });
        }

        const updatedTrip = await ctx.storage.updateTrip(id, data);
        return updatedTrip;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update trip',
          cause: error,
        });
      }
    }),

  // Delete a trip
  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ ctx, input: id }) => {
      try {
        const existingTrip = await ctx.storage.getTrip(id);
        
        if (!existingTrip) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Trip not found',
          });
        }
        
        if (existingTrip.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Access denied',
          });
        }

        await ctx.storage.deleteTrip(id);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete trip',
          cause: error,
        });
      }
    }),

  // Get trip summary with expense statistics
  getSummary: protectedProcedure
    .input(z.number())
    .query(async ({ ctx, input: id }) => {
      try {
        const trip = await ctx.storage.getTrip(id);
        
        if (!trip) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Trip not found',
          });
        }
        
        if (trip.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Access denied',
          });
        }

        const expenses = await ctx.storage.getExpensesByTripId(id);
        
        const expensesByCategory = expenses.reduce((acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
          return acc;
        }, {} as Record<string, number>);

        const dailyExpenses = expenses.reduce((acc, expense) => {
          const date = expense.date.toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + Number(expense.amount);
          return acc;
        }, {} as Record<string, number>);

        return {
          totalExpenses: trip.totalExpenses,
          expensesByCategory,
          dailyExpenses: Object.entries(dailyExpenses).map(([date, amount]) => ({
            date,
            amount,
          })),
          budgetUtilization: trip.budget ? (trip.totalExpenses / trip.budget) * 100 : undefined,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get trip summary',
          cause: error,
        });
      }
    }),
});