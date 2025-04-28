import { router } from '../trpc';
import { z } from 'zod';
import { publicProcedure } from '../trpc';

export const rootRouter = router({
  healthcheck: publicProcedure
    .query(() => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString()
      };
    }),
    
  echo: publicProcedure
    .input(z.object({
      message: z.string()
    }))
    .query(({ input }) => {
      return {
        message: input.message,
        timestamp: new Date().toISOString()
      };
    })
});

export type RootRouter = typeof rootRouter;