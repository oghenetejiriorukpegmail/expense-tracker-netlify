/// <reference types="vitest" />
/// <reference types="@vitest/browser/matchers" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Global test setup
    setupFiles: ['./tests/setup.ts'],
    
    // Enable browser testing with Playwright
    browser: {
      enabled: true,
      provider: 'playwright',
      name: 'chromium',
      headless: true,
      // Browser instances for different types of tests
      instances: [
        {
          name: 'unit-tests',
          browser: 'chromium',
          setupFiles: ['./tests/unit/setup.ts']
        },
        {
          name: 'e2e-tests',
          browser: 'chromium',
          setupFiles: ['./tests/e2e/setup.ts']
        }
      ]
    },
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        'packages/*/test{,s}/**',
        '**/*.d.ts',
        'cypress/**',
        'test{,s}/**',
        'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}',
        '**/__tests__/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc}.config.*',
        '**/.{eslint,mocha,prettier}rc.{js,cjs,yml}'
      ]
    },

    // Test environment configuration
    environment: 'jsdom',
    globals: true,
    include: ['./tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    
    // Pool configuration for better performance
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false
      }
    },

    // Use custom tsconfig for tests
    typecheck: {
      tsconfig: './tsconfig.test.json'
    },

    // Alias configuration matching tsconfig paths
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, './shared'),
      '@client': resolve(__dirname, './client/src'),
      '@server': resolve(__dirname, './server')
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, './shared'),
      '@client': resolve(__dirname, './client/src'),
      '@server': resolve(__dirname, './server')
    }
  }
})