// This file acts as the entry point for the Netlify Function.
// It imports the handler configured with serverless-http from our main server file.

// Adjust the relative path if your server/index.ts is located differently
// relative to this netlify/functions/api.ts file.
import { handler } from '../../server/index';

// Re-export the handler for Netlify to use.
export { handler };