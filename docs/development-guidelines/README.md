# Development Guidelines

This document outlines the development guidelines and best practices for the Expense Tracker application. Following these guidelines ensures consistency, maintainability, and quality across the codebase.

## Table of Contents

1. [Code Style Guide](#code-style-guide)
2. [Component Structure](#component-structure)
3. [State Management](#state-management)
4. [Testing Practices](#testing-practices)
5. [Git Workflow](#git-workflow)
6. [Release Process](#release-process)

## Code Style Guide

### TypeScript

- Use TypeScript for all new code
- Define explicit types for function parameters and return values
- Use interfaces for complex object types
- Avoid using `any` type when possible
- Use type assertions only when necessary

```typescript
// Good
function calculateTotal(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => total + Number(expense.cost), 0);
}

// Bad
function calculateTotal(expenses: any): any {
  return expenses.reduce((total, expense) => total + expense.cost, 0);
}
```

### Naming Conventions

- Use camelCase for variables, functions, and methods
- Use PascalCase for classes, interfaces, types, and components
- Use UPPER_CASE for constants
- Use descriptive names that convey meaning

```typescript
// Good
const userProfile = getUserProfile();
const MAX_RETRY_ATTEMPTS = 3;
interface UserPreferences {}
class ExpenseCalculator {}

// Bad
const up = getUserProfile();
const max = 3;
interface prefs {}
class calc {}
```

### Formatting

The project uses ESLint and Prettier for code formatting. The configuration is defined in `.eslintrc` and `.prettierrc` files.

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons at the end of statements
- Maximum line length is 100 characters
- Use trailing commas in multiline object and array literals

To format your code:

```bash
# Format all files
npm run format

# Lint all files
npm run lint
```

### Comments

- Use JSDoc comments for functions, classes, and interfaces
- Add comments for complex logic or non-obvious code
- Keep comments up-to-date with code changes

```typescript
/**
 * Calculates the total expenses for a trip
 * @param expenses - Array of expenses
 * @returns The total amount
 */
function calculateTripTotal(expenses: Expense[]): number {
  // Implementation
}
```

## Component Structure

The Expense Tracker application uses SvelteKit for the frontend. Components should follow these guidelines:

### Component Organization

Components are organized by feature and type:

```
src/
├── lib/
│   ├── components/
│   │   ├── ui/            # Reusable UI components
│   │   ├── charts/        # Chart components
│   │   ├── forms/         # Form components
│   │   └── layout/        # Layout components
│   ├── stores/            # Svelte stores
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript types
└── routes/                # SvelteKit routes
```

### Component Design Principles

1. **Single Responsibility**: Each component should have a single responsibility
2. **Reusability**: Create reusable components for common UI elements
3. **Composition**: Compose complex components from simpler ones
4. **Props**: Use props for component configuration
5. **Events**: Use events for component communication

### Component Template

```svelte
<script lang="ts">
  // Imports
  import { onMount } from 'svelte';
  
  // Props
  export let title: string;
  export let description: string = ''; // Default value
  
  // Local state
  let isLoading = false;
  
  // Lifecycle
  onMount(() => {
    // Initialization code
  });
  
  // Methods
  function handleClick() {
    // Event handler
  }
</script>

<!-- Markup -->
<div class="component">
  <h2>{title}</h2>
  {#if description}
    <p>{description}</p>
  {/if}
  <button on:click={handleClick}>Click me</button>
</div>

<!-- Styles -->
<style>
  .component {
    /* Component styles */
  }
</style>
```

### Component Best Practices

- Keep components small and focused
- Use TypeScript for props and event handlers
- Use slots for flexible content composition
- Use CSS variables for theming
- Avoid direct DOM manipulation
- Use reactive statements for derived values

## State Management

The Expense Tracker application uses Svelte stores for state management.

### Store Organization

Stores are organized by feature:

```
src/lib/stores/
├── auth.ts       # Authentication state
├── expenses.ts   # Expenses state
├── trips.ts      # Trips state
├── mileage.ts    # Mileage logs state
└── ui.ts         # UI state (modals, notifications, etc.)
```

### Store Implementation

Use the appropriate store type for your needs:

- **Writable**: For state that can be updated from anywhere
- **Readable**: For derived state that can only be updated by the store
- **Derived**: For state that depends on other stores

```typescript
// auth.ts
import { writable, derived } from 'svelte/store';
import type { User } from '$lib/types';

// Create a writable store for the user
export const user = writable<User | null>(null);

// Create a derived store for authentication status
export const isAuthenticated = derived(user, $user => $user !== null);

// Create actions to update the store
export function login(userData: User) {
  user.set(userData);
}

export function logout() {
  user.set(null);
}
```

### Using Stores in Components

```svelte
<script lang="ts">
  import { user, logout } from '$lib/stores/auth';
  
  function handleLogout() {
    logout();
  }
</script>

{#if $user}
  <p>Welcome, {$user.firstName}!</p>
  <button on:click={handleLogout}>Logout</button>
{:else}
  <p>Please log in</p>
{/if}
```

### Store Best Practices

- Keep store logic separate from components
- Use derived stores for computed values
- Use store actions for complex state updates
- Initialize stores with sensible default values
- Clean up subscriptions in onDestroy lifecycle hooks
- Use local component state for UI-specific state

## Testing Practices

The Expense Tracker application uses Vitest for unit tests and Playwright for end-to-end tests.

### Test Organization

Tests are organized by type and feature:

```
tests/
├── unit/              # Unit tests
│   ├── components/    # Component tests
│   ├── stores/        # Store tests
│   └── utils/         # Utility function tests
└── e2e/               # End-to-end tests
    ├── auth.e2e.ts    # Authentication tests
    ├── expenses.e2e.ts # Expenses tests
    └── setup.ts       # Test setup
```

### Unit Testing

Unit tests focus on testing individual functions, components, and stores in isolation.

```typescript
// Example component test
import { render, fireEvent } from '@testing-library/svelte';
import ExpenseCard from '$lib/components/ExpenseCard.svelte';

describe('ExpenseCard', () => {
  const expense = {
    id: 1,
    type: 'Food',
    date: '2025-01-01',
    vendor: 'Restaurant',
    location: 'New York',
    cost: '25.00',
    comments: 'Lunch',
    tripName: 'Business Trip'
  };

  test('renders expense details correctly', () => {
    const { getByText } = render(ExpenseCard, { props: { expense } });
    
    expect(getByText('Food')).toBeInTheDocument();
    expect(getByText('Restaurant')).toBeInTheDocument();
    expect(getByText('$25.00')).toBeInTheDocument();
  });

  test('emits delete event when delete button is clicked', async () => {
    const { component, getByText } = render(ExpenseCard, { props: { expense } });
    
    const mockDelete = vi.fn();
    component.$on('delete', mockDelete);
    
    await fireEvent.click(getByText('Delete'));
    
    expect(mockDelete).toHaveBeenCalled();
    expect(mockDelete.mock.calls[0][0].detail).toBe(1);
  });
});
```

### End-to-End Testing

End-to-end tests focus on testing the application as a whole, simulating user interactions.

```typescript
// Example e2e test
import { test, expect } from '@playwright/test';

test('user can add a new expense', async ({ page }) => {
  // Login
  await page.goto('/auth');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Navigate to expenses
  await page.click('a[href="/expenses"]');
  
  // Add new expense
  await page.click('button:has-text("Add Expense")');
  await page.fill('input[name="type"]', 'Food');
  await page.fill('input[name="date"]', '2025-01-01');
  await page.fill('input[name="vendor"]', 'Restaurant');
  await page.fill('input[name="location"]', 'New York');
  await page.fill('input[name="cost"]', '25.00');
  await page.fill('textarea[name="comments"]', 'Lunch');
  await page.fill('input[name="tripName"]', 'Business Trip');
  await page.click('button[type="submit"]');
  
  // Verify expense was added
  await expect(page.locator('text=Food')).toBeVisible();
  await expect(page.locator('text=Restaurant')).toBeVisible();
  await expect(page.locator('text=$25.00')).toBeVisible();
});
```

### Testing Best Practices

- Write tests for all new features and bug fixes
- Aim for high test coverage, especially for critical paths
- Use test-driven development (TDD) when appropriate
- Mock external dependencies
- Keep tests independent and isolated
- Use descriptive test names
- Test edge cases and error conditions
- Run tests before committing code

## Git Workflow

The Expense Tracker application uses a feature branch workflow.

### Branch Naming Convention

- `feature/feature-name`: For new features
- `bugfix/bug-description`: For bug fixes
- `hotfix/issue-description`: For urgent fixes to production
- `refactor/description`: For code refactoring
- `docs/description`: For documentation updates

### Commit Message Convention

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to the build process or auxiliary tools

Examples:
```
feat(expenses): add receipt upload functionality
fix(auth): resolve login error with special characters
docs(api): update endpoint documentation
```

### Pull Request Process

1. Create a feature branch from `main`
2. Implement your changes
3. Write tests for your changes
4. Ensure all tests pass
5. Update documentation if necessary
6. Create a pull request to `main`
7. Request code review from at least one team member
8. Address review feedback
9. Merge the pull request once approved

### Code Review Guidelines

- Review code for correctness, readability, and maintainability
- Check for adherence to coding standards
- Verify test coverage
- Look for potential security issues
- Provide constructive feedback
- Approve only when all issues are addressed

## Release Process

The Expense Tracker application follows a continuous delivery approach.

### Version Numbering

Follow [Semantic Versioning](https://semver.org/) (SemVer):

- **Major version** (X.0.0): Incompatible API changes
- **Minor version** (0.X.0): New features in a backward-compatible manner
- **Patch version** (0.0.X): Backward-compatible bug fixes

### Release Checklist

Before releasing a new version:

1. Ensure all tests pass
2. Update the version number in `package.json`
3. Update the changelog
4. Create a release branch (`release/vX.Y.Z`)
5. Deploy to staging environment
6. Perform manual testing
7. Fix any issues found during testing
8. Create a release tag
9. Deploy to production
10. Monitor for issues

### Deployment Process

The application is deployed to Netlify:

1. Merge changes to the `main` branch
2. Netlify automatically builds and deploys the application
3. Run database migrations if necessary
4. Verify the deployment

### Rollback Procedure

If issues are found after deployment:

1. Identify the issue
2. Decide whether to fix forward or roll back
3. If rolling back:
   - Revert the problematic changes
   - Deploy the previous stable version
   - Communicate the rollback to the team
4. If fixing forward:
   - Create a hotfix branch
   - Implement and test the fix
   - Deploy the fix
   - Communicate the fix to the team

### Post-Release Activities

After a successful release:

1. Monitor application performance and error rates
2. Collect user feedback
3. Document any issues or lessons learned
4. Plan for the next release