import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './server/router';
import { browser } from '$app/environment';

let browserClient: ReturnType<typeof createTRPCProxyClient<AppRouter>>;

export function createTrpcClient() {
  if (browser && browserClient) return browserClient;
  
  const client = createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: browser ? '/api/trpc' : 'http://localhost:3000/api/trpc',
      }),
    ],
  });
  
  if (browser) browserClient = client;
  return client;
}

export const trpc = createTrpcClient();