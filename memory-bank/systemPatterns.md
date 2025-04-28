# System Patterns

## Architecture Patterns
- [2025-04-28 12:35:40] - Frontend Migration Pattern: The project is transitioning from React/TypeScript to Svelte while maintaining the same backend (Supabase).

## Design Patterns
- [2025-04-28 12:35:40] - Component-Based Architecture: Both the React and Svelte implementations use a component-based architecture for UI elements.
- [2025-04-28 12:35:40] - Route-Based Page Structure: The application uses a route-based structure for page organization in both implementations.

## Data Flow Patterns
- [2025-04-28 12:35:40] - Backend-Driven Data: Data is primarily sourced from Supabase and passed to frontend components.

## Integration Patterns
- [2025-04-28 12:35:40] - API Integration: The application integrates with Supabase for data storage and retrieval.
- [2025-04-28 13:53:29] - Firebase Authentication Pattern: The application now uses Firebase Authentication for user sign-up, sign-in, and session management. The frontend uses the Firebase JS SDK, and the backend verifies ID tokens using the Firebase Admin SDK.