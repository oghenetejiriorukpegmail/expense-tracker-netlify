/**
 * Drizzle ORM Type Utilities
 *
 * This file provides utility functions to safely use Drizzle ORM operators
 * with proper TypeScript type checking.
 */

import { eq, and, desc, lte, gte, lt, gt, ne, isNull, isNotNull, inArray, notInArray, between, notBetween, like, notLike, ilike, notIlike } from 'drizzle-orm';

/**
 * Type-safe wrapper functions for Drizzle ORM operators
 * These functions help TypeScript correctly infer types when using operators
 */

// Helper type for any column
type AnyColumn = { [key: string]: any };

// Safe equals operator
export function safeEq<T>(column: AnyColumn, value: T) {
  return eq(column as any, value);
}

// Safe not equals operator
export function safeNe<T>(column: AnyColumn, value: T) {
  return ne(column as any, value);
}

// Safe less than operator
export function safeLt<T>(column: AnyColumn, value: T) {
  return lt(column as any, value);
}

// Safe less than or equal operator
export function safeLte<T>(column: AnyColumn, value: T) {
  return lte(column as any, value);
}

// Safe greater than operator
export function safeGt<T>(column: AnyColumn, value: T) {
  return gt(column as any, value);
}

// Safe greater than or equal operator
export function safeGte<T>(column: AnyColumn, value: T) {
  return gte(column as any, value);
}

// Safe AND operator
export function safeAnd(...conditions: any[]) {
  return and(...conditions);
}

// Safe DESC operator for ordering
export function safeDesc(column: AnyColumn) {
  return desc(column as any);
}

// Export original operators for reference
export {
  eq, and, desc, lte, gte, lt, gt, ne, isNull, isNotNull,
  inArray, notInArray, between, notBetween, like, notLike, ilike, notIlike
};