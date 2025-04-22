import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "./supabaseClient"; // Import Supabase client

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorText = res.statusText;
    try {
        // Try to parse error message from JSON response body
        const errorBody = await res.json();
        errorText = errorBody.message || errorBody.error || JSON.stringify(errorBody);
    } catch (e) {
        // Fallback to text if JSON parsing fails
        try {
            errorText = await res.text();
        } catch (textErr) {
            // Keep original statusText if text() also fails
        }
    }
    throw new Error(`${res.status}: ${errorText}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Check if data is FormData
  const isFormData = data instanceof FormData;

  // Get the current session and token from Supabase
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Error getting Supabase session:", sessionError);
    // Decide how to handle this - maybe throw an error or proceed without auth?
    // Throwing an error might be safer to prevent unauthenticated requests.
    throw new Error(`Failed to get authentication session: ${sessionError.message}`);
  }

  const token = session?.access_token;

  // Prepare headers
  const headers: HeadersInit = {};
  if (!isFormData && data) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    console.warn(`No Supabase token found for API request to ${url}`);
    // Depending on the API endpoint, you might want to throw an error here
    // if the request absolutely requires authentication.
  }

  const res = await fetch(url, {
    method,
    headers,
    // Send FormData directly, otherwise stringify JSON
    body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    // Remove credentials: "include" as we use Authorization header
  });

  await throwIfResNotOk(res);
  return res;
}

// getQueryFn might need adjustment if it's used for authenticated routes
// It currently doesn't use apiRequest and lacks the Authorization header
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options?: { // Make options optional
  on401?: UnauthorizedBehavior; // Make on401 optional
}) => QueryFunction<T> =
  (options) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const unauthorizedBehavior = options?.on401 ?? 'throw'; // Default to throw

    // Get token for GET requests too
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        console.error("Error getting Supabase session for GET request:", sessionError);
        throw new Error(`Failed to get authentication session: ${sessionError.message}`);
    }
    const token = session?.access_token;
    const headers: HeadersInit = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    } else {
        console.warn(`No Supabase token found for GET request to ${url}`);
        // If unauthorizedBehavior is 'throw', we should probably throw here
        // if the endpoint requires auth, but we don't know that generically.
        // If it's 'returnNull', maybe we proceed and let the 401 happen?
        // For now, proceed and let the server handle 401 if needed.
    }

    const res = await fetch(url, { headers }); // Add headers

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log(`Returning null for 401 on ${url}`);
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default queryFn now includes Authorization header logic
      queryFn: getQueryFn(), // Use default options
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity, // Keep staleTime Infinity for now
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
