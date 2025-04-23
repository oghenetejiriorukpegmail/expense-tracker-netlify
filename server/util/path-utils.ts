/**
 * Path utilities to ensure compatibility across different environments
 * This file provides a consistent interface for path operations that works in both
 * development and production (including Netlify Functions) environments.
 */

// Import the path module
import path from 'path';

/**
 * Join path segments together
 * This function ensures that path joining works consistently across environments
 */
export function joinPaths(...paths: string[]): string {
  // Use the native path.join function but handle potential undefined values
  return path.join(...paths.filter(Boolean));
}

/**
 * Resolve a path to an absolute path
 * This function ensures that path resolution works consistently across environments
 */
export function resolvePath(...paths: string[]): string {
  // Use the native path.resolve function but handle potential undefined values
  return path.resolve(...paths.filter(Boolean));
}

/**
 * Get the directory name of a path
 * This function ensures that dirname operations work consistently across environments
 */
export function getDirname(filePath: string): string {
  return path.dirname(filePath);
}

/**
 * Get the base name of a path
 * This function ensures that basename operations work consistently across environments
 */
export function getBasename(filePath: string, ext?: string): string {
  return path.basename(filePath, ext);
}

/**
 * Get the extension of a path
 * This function ensures that extname operations work consistently across environments
 */
export function getExtname(filePath: string): string {
  return path.extname(filePath);
}