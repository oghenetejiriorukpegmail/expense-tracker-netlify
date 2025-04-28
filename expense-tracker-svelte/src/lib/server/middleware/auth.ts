import { TRPCError } from '@trpc/server';
import { middleware, publicProcedure } from '../trpc';

export const isAuthenticated = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      // Add the authenticated user to the context
      user: ctx.user,
    },
  });
});

// Create a protected procedure that uses the isAuthenticated middleware
export const protectedProcedure = publicProcedure.use(isAuthenticated);