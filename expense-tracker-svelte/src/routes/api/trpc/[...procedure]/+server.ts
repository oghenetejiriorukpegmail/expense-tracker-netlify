import { createContext } from '$lib/server/context';
import { appRouter } from '$lib/server/router';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (event) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: event.request,
    router: appRouter,
    createContext: () => createContext(event),
    onError: ({ error, path }) => {
      console.error(`[tRPC] Error in ${path ?? '<no-path>'}:`, error);
    },
  });
};

export const POST: RequestHandler = async (event) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: event.request,
    router: appRouter,
    createContext: () => createContext(event),
    onError: ({ error, path }) => {
      console.error(`[tRPC] Error in ${path ?? '<no-path>'}:`, error);
    },
  });
};