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
export function joinPaths() {
    var paths = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        paths[_i] = arguments[_i];
    }
    // Use the native path.join function but handle potential undefined values
    return path.join.apply(path, paths.filter(Boolean));
}
/**
 * Resolve a path to an absolute path
 * This function ensures that path resolution works consistently across environments
 */
export function resolvePath() {
    var paths = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        paths[_i] = arguments[_i];
    }
    // Use the native path.resolve function but handle potential undefined values
    return path.resolve.apply(path, paths.filter(Boolean));
}
/**
 * Get the directory name of a path
 * This function ensures that dirname operations work consistently across environments
 */
export function getDirname(filePath) {
    return path.dirname(filePath);
}
/**
 * Get the base name of a path
 * This function ensures that basename operations work consistently across environments
 */
export function getBasename(filePath, ext) {
    return path.basename(filePath, ext);
}
/**
 * Get the extension of a path
 * This function ensures that extname operations work consistently across environments
 */
export function getExtname(filePath) {
    return path.extname(filePath);
}
