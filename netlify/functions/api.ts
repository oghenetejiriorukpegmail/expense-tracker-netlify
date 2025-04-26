// This file acts as the entry point for the Netlify Function.
// It imports the handler configured with serverless-http from our main server file.

// Import from the compiled JavaScript in dist-server instead of TypeScript source
// This avoids TypeScript compilation issues during Netlify build
import { handler } from '../../dist-server/server/index.js';

// Re-export the handler for Netlify to use.
export { handler };