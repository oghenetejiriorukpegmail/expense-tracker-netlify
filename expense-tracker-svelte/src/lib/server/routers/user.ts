import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import type { User, UserProfile } from '../../types/user';
import type { Trip } from '../../types/trip';
import type { Expense } from '../../types/expense';
import { TRPCError } from '@trpc/server';

export const userRouter = router({
  me: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const profile = await ctx.storage.getUserProfile(ctx.user.id);
        if (!profile) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User profile not found',
          });
        }
        return profile;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user profile',
          cause: error,
        });
      }
    }),

  updateProfile: protectedProcedure
    .input(z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phoneNumber: z.string().optional(),
      bio: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const updatedUser = await ctx.storage.updateUser(ctx.user.id, input);
        return updatedUser;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update user profile',
          cause: error,
        });
      }
    }),

  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const [expenses, trips] = await Promise.all([
          ctx.storage.getExpensesByUserId(ctx.user.id),
          ctx.storage.getTripsByUserId(ctx.user.id),
        ]);

        return {
          totalExpenses: expenses.reduce((sum: number, exp: Expense) => 
            sum + Number(exp.amount), 0
          ),
          expenseCount: expenses.length,
          expensesByCategory: expenses.reduce((acc: Record<string, number>, exp: Expense) => {
            acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
            return acc;
          }, {}),
          tripCount: trips.length,
          activeTrips: trips.filter((trip: Trip) => trip.status === 'InProgress').length,
          upcomingTrips: trips.filter((trip: Trip) => 
            trip.status === 'Planned' && new Date(trip.startDate) > new Date()
          ).length,
          recentExpenses: expenses.slice(0, 5),
          recentTrips: trips.slice(0, 5),
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user statistics',
          cause: error,
        });
      }
    }),
});