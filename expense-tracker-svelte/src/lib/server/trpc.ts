import { initTRPC } from '@trpc/server';
import type { Context } from '$lib/types';

// Initialize tRPC with context type
const t = initTRPC.context<Context>().create();

// Export reusable router and procedure helpers
export const router = t.router;
export const procedure = t.procedure;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

// Create a middleware for checking authentication
export const authMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error('Not authenticated');
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Create an authenticated procedure
export const protectedProcedure = procedure.use(authMiddleware);

// Export the router type
export type Router = typeof router;

// Export the base router creator
export const createRouter = router;