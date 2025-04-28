/**
 * Error Handler
 * 
 * This file provides custom error classes and error handling utilities.
 */

/**
 * Base class for application errors
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  
  constructor(message: string, statusCode: number, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
    
    // Set prototype explicitly for better instanceof behavior
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Error for validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, true);
    
    // Set prototype explicitly for better instanceof behavior
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error for authentication failures
 */
export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 401, true);
    
    // Set prototype explicitly for better instanceof behavior
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Error for authorization failures
 */
export class AuthorizationError extends AppError {
  constructor(message: string) {
    super(message, 403, true);
    
    // Set prototype explicitly for better instanceof behavior
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Error for resource not found
 */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, true);
    
    // Set prototype explicitly for better instanceof behavior
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Error for external service failures
 */
export class ExternalServiceError extends AppError {
  constructor(message: string) {
    super(message, 502, true);
    
    // Set prototype explicitly for better instanceof behavior
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}

/**
 * Error for database failures
 */
export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 500, true);
    
    // Set prototype explicitly for better instanceof behavior
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Global error handler for Express
 */
export function globalErrorHandler(err: any, req: any, res: any, next: any) {
  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let isOperational = err.isOperational || false;
  
  // Log error
  console.error('Error:', {
    message,
    statusCode,
    isOperational,
    stack: err.stack
  });
  
  // Send response
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * Async error handler for Express routes
 */
export function catchAsync(fn: Function) {
  return (req: any, res: any, next: any) => {
    fn(req, res, next).catch(next);
  };
}