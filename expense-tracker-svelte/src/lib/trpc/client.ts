import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { Router } from '../../../expense-tracker-api/src/router';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return '';
  }
  return `http://localhost:${process.env.PORT ?? 3000}`;
};

export const trpc = createTRPCClient<Router>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
    }),
  ],
});