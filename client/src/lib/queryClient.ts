import { QueryClient, QueryFunction } from "@tanstack/react-query";
// Removed Supabase client import

// Helper to check response status and throw error
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorText = res.statusText;
    try {
        const errorBody = await res.json();
        errorText = errorBody.message || errorBody.error || JSON.stringify(errorBody);
    } catch (e) {
        try {
            errorText = await res.text();
        } catch (textErr) {
            // Keep original statusText
        }
    }
    throw new Error(`${res.status}: ${errorText}`);
  }
}

// Simplified apiRequest - expects Authorization header to be set by the caller
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  headers: HeadersInit = {} // Allow passing custom headers
): Promise<Response> {
  const isFormData = data instanceof FormData;

  // Prepare headers - Initialize as a plain object for type safety
  const finalHeaders: Record<string, string> = {}; 

  // Merge passed headers (handle different HeadersInit types if necessary, simple merge for object type)
  if (typeof headers === 'object' && !(headers instanceof Headers) && !Array.isArray(headers)) {
    Object.assign(finalHeaders, headers);
  } else if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      finalHeaders[key] = value;
    });
  } // Note: Array of tuples case not handled here for simplicity

  // Set Content-Type only if not FormData and data exists
  if (!isFormData && data) {
    finalHeaders["Content-Type"] = "application/json";
  }
  // ** IMPORTANT: Authorization header with Clerk token must be added in the calling code **
  // Example in useQuery/useMutation:
  // const { getToken } = useAuth();
  // const token = await getToken();
  // finalHeaders['Authorization'] = `Bearer ${token}`; // Add token here
  // await apiRequest('GET', '/api/some-endpoint', undefined, finalHeaders);

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
  });

  await throwIfResNotOk(res);
  return res;
}

// Removed getQueryFn as default queryFn with auth is not recommended with Clerk hooks

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Removed default queryFn - define queryFn in individual useQuery calls
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
