import { defineConfig, loadEnv } from "vite"; // Import loadEnv
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env file based on mode and define client-safe variables
export default defineConfig(async ({ mode }) => {
  // Load env variables from the project root directory
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      runtimeErrorOverlay(),
      themePlugin(),
      ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
        ? [
            await import("@replit/vite-plugin-cartographer").then((m) =>
              m.cartographer(),
            ),
          ]
        : []),
    ],
    // Define global constants for client-side code
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_BUCKET_NAME': JSON.stringify(env.VITE_SUPABASE_BUCKET_NAME),
      // Add other VITE_ prefixed variables here if needed
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    root: path.resolve(__dirname, "client"),
    build: {
      // Output directly to client/dist to align with netlify.toml publish setting
      outDir: path.resolve(__dirname, "client", "dist"),
      emptyOutDir: true,
      // Increase chunk size warning limit to avoid unnecessary warnings
      chunkSizeWarningLimit: 750,
      rollupOptions: {
        output: {
          manualChunks: {
            // UI components chunk
            'ui-components': [
              '@radix-ui/react-accordion',
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-aspect-ratio',
              '@radix-ui/react-avatar',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-collapsible',
              '@radix-ui/react-context-menu',
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-hover-card',
              '@radix-ui/react-label',
              '@radix-ui/react-menubar',
              '@radix-ui/react-navigation-menu',
              '@radix-ui/react-popover',
              '@radix-ui/react-progress',
              '@radix-ui/react-radio-group',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-select',
              '@radix-ui/react-separator',
              '@radix-ui/react-slider',
              '@radix-ui/react-slot',
              '@radix-ui/react-switch',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toast',
              '@radix-ui/react-toggle',
              '@radix-ui/react-toggle-group',
              '@radix-ui/react-tooltip',
              'class-variance-authority',
              'clsx',
              'tailwind-merge',
              'cmdk',
              'vaul',
              'embla-carousel-react',
              'input-otp',
              'react-resizable-panels',
            ],
            // Chart libraries chunk
            'chart-libs': [
              'chart.js',
              'recharts',
            ],
            // Form handling chunk
            'form-libs': [
              'react-hook-form',
              '@hookform/resolvers',
              'zod',
              'zod-validation-error',
            ],
            // Authentication chunk
            'auth': [
              '@clerk/clerk-react',
              '@clerk/clerk-sdk-node',
              '@clerk/express',
            ],
            // Data fetching chunk
            'data-fetching': [
              '@tanstack/react-query',
              '@supabase/supabase-js',
            ],
            // Date handling chunk
            'date-libs': [
              'date-fns',
              'react-day-picker',
            ],
            // PDF and document handling
            'document-libs': [
              'pdf-lib',
              '@pdf-lib/fontkit',
              'pdf-parse',
              'pdfjs-dist',
              'exceljs',
              'xlsx',
              'papaparse',
            ],
            // React core
            'react-vendor': [
              'react',
              'react-dom',
              'react-icons',
              'framer-motion',
              'wouter',
              'zustand',
            ],
          },
        },
      },
    },
  };
});
