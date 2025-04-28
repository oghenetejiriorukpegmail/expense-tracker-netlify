/**
 * OCR Module Index
 * 
 * This file exports the OCR service and related utilities.
 */

import * as fs from 'fs';
import * as path from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../../shared/schema';
import { createClient } from '@supabase/supabase-js';
import { OcrConfig, OcrProvider, OcrResult } from './types';
import { OcrService } from './ocr-service';
import { defaultOcrConfig, getOcrConfig } from './config';

/**
 * Create an OCR service from environment variables
 * @param overrides Optional configuration overrides
 * @returns OCR service instance
 */
export function createOcrServiceFromEnv(overrides?: Partial<OcrConfig>): OcrService {
  const config = getOcrConfig(overrides);
  return OcrService.getInstance(config);
}

// Export types and classes
export * from './types';
export * from './providers';
export * from './image-preprocessor';
export * from './ocr-service';
export * from './config';