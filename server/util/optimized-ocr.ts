/**
 * Optimized OCR Service
 * 
 * This service provides optimized OCR processing for receipts and other documents.
 * It includes:
 * - Parallel processing for batch uploads
 * - Image preprocessing for better OCR results
 * - Caching of OCR results
 * - Fallback mechanisms for different OCR providers
 * - Background processing with task tracking
 */

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { createBackgroundTask, updateBackgroundTaskStatus } from '../storage/task.storage';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../shared/schema';
import { createClient } from '@supabase/supabase-js';
import { ExternalServiceError, ValidationError } from './error-handler';
import sharp from 'sharp';
import { createHash } from 'crypto';
import NodeCache from 'node-cache';
import { promisify } from 'util';
import { exec } from 'child_process';
import { fileTypeFromBuffer } from 'file-type';

// OCR provider types
export type OcrProvider = 'ocr-space' | 'tesseract' | 'google-vision' | 'azure-cognitive';

// OCR result interface
export interface OcrResult {
  text: string;
  confidence: number;
  fields?: {
    [key: string]: {
      value: string;
      confidence: number;
    };
  };
  raw?: any;
  provider: OcrProvider;
  processingTimeMs: number;
  imageHash?: string;
}

// OCR configuration
export interface OcrConfig {
  defaultProvider: OcrProvider;
  providers: {
    'ocr-space'?: {
      apiKey: string;
      apiEndpoint: string;
      language?: string;
      isOverlayRequired?: boolean;
    };
    'tesseract'?: {
      execPath?: string;
      dataPath?: string;
      language?: string;
    };
    'google-vision'?: {
      apiKey: string;
      projectId: string;
    };
    'azure-cognitive'?: {
      endpoint: string;
      apiKey: string;
      language?: string;
    };
  };
  preprocessing: {
    enabled: boolean;
    grayscale?: boolean;
    contrast?: number;
    brightness?: number;
    sharpen?: boolean;
    resize?: {
      width?: number;
      height?: number;
      fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    };
  };
  caching: {
    enabled: boolean;
    ttl: number; // Time to live in seconds
  };
  fallback: {
// OCR service class
export class OcrService {
  private static instance: OcrService;
  private config: OcrConfig;
  private cache: NodeCache;
  private db: ReturnType<typeof drizzle>;
  private supabase: ReturnType<typeof createClient>;
  private execPromise = promisify(exec);
  
  // Private constructor for singleton pattern
  private constructor(config: OcrConfig) {
    this.config = config;
    
    // Initialize cache
    this.cache = new NodeCache({
      stdTTL: config.caching.ttl,
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false
    });
    
    // Initialize database
    const pgClient = postgres(process.env.DATABASE_URL || '');
    this.db = drizzle(pgClient, { schema });
    
    // Initialize Supabase client
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || ''
    );
    
    console.log('OCR service initialized');
  }
  
  // Get singleton instance
  public static getInstance(config?: OcrConfig): OcrService {
    if (!OcrService.instance) {
      if (!config) {
        throw new Error('OCR configuration is required for initialization');
      }
      OcrService.instance = new OcrService(config);
    }
    return OcrService.instance;
  }
  
  /**
   * Process a single image with OCR
   * @param imagePath Path to the image file
   * @param userId User ID for tracking
   * @param options Additional options
   * @returns OCR result
   */
  public async processImage(
    imagePath: string,
    userId: number,
    options: {
      provider?: OcrProvider;
      preprocessing?: boolean;
      language?: string;
      fields?: string[];
    } = {}
  ): Promise<OcrResult> {
    try {
      const startTime = Date.now();
      
      // Read image file
      let imageBuffer = await fs.promises.readFile(imagePath);
      
      // Generate hash for caching
      const imageHash = this.generateImageHash(imageBuffer);
      
      // Check cache if enabled
      if (this.config.caching.enabled) {
        const cachedResult = this.cache.get<OcrResult>(imageHash);
        if (cachedResult) {
          console.log(`Using cached OCR result for ${imagePath}`);
          return cachedResult;
        }
      }
      
      // Preprocess image if enabled
      if (options.preprocessing !== false && this.config.preprocessing.enabled) {
        imageBuffer = await this.preprocessImage(imageBuffer);
      }
      
      // Determine provider
      const provider = options.provider || this.config.defaultProvider;
      
      // Process with primary provider
      let result: OcrResult;
      try {
        result = await this.processWithProvider(imageBuffer, provider, options.language, options.fields);
      } catch (error) {
        console.error(`Error processing with ${provider}:`, error);
        
        // Try fallback providers if enabled
        if (this.config.fallback.enabled) {
          result = await this.processWithFallbackProviders(imageBuffer, provider, options.language, options.fields);
        } else {
          throw error;
        }
      }
      
      // Add processing time and image hash
      result.processingTimeMs = Date.now() - startTime;
      result.imageHash = imageHash;
      
      // Cache result if enabled
      if (this.config.caching.enabled) {
        this.cache.set(imageHash, result);
      }
      
      return result;
    } catch (error) {
      console.error('Error processing image:', error);
      throw new ExternalServiceError(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
    enabled: boolean;
    maxAttempts: number;
    providerOrder: OcrProvider[];
  };
  parallelProcessing: {
    enabled: boolean;
    maxConcurrent: number;
  };
/**
   * Process multiple images with OCR in parallel
   * @param imagePaths Paths to the image files
   * @param userId User ID for tracking
   * @param options Additional options
   * @returns Background task ID
   */
  public async processBatch(
    imagePaths: string[],
    userId: number,
    options: {
      provider?: OcrProvider;
      preprocessing?: boolean;
      language?: string;
      fields?: string[];
      taskId?: number;
    } = {}
  ): Promise<number> {
    try {
      // Create or use existing background task
      const taskId = options.taskId || (await createBackgroundTask(this.db, {
        userId,
        type: 'batch_upload',
        status: 'processing'
      })).id;
      
      // Process in parallel or sequentially based on configuration
      if (this.config.parallelProcessing.enabled) {
        // Process in parallel with concurrency limit
        const batchSize = this.config.parallelProcessing.maxConcurrent;
        const results: OcrResult[] = [];
        
        for (let i = 0; i < imagePaths.length; i += batchSize) {
          const batch = imagePaths.slice(i, i + batchSize);
          const batchPromises = batch.map(imagePath => 
            this.processImage(imagePath, userId, options)
              .catch(error => {
                console.error(`Error processing ${imagePath}:`, error);
                return {
                  text: '',
                  confidence: 0,
                  provider: options.provider || this.config.defaultProvider,
                  processingTimeMs: 0,
                  error: error instanceof Error ? error.message : 'Unknown error'
                } as OcrResult;
              })
          );
          
          const batchResults = await Promise.all(batchPromises);
          results.push(...batchResults);
          
          // Update task progress
          await updateBackgroundTaskStatus(
            this.db,
            taskId,
            'processing',
            {
              progress: Math.min(100, Math.round((i + batch.length) / imagePaths.length * 100)),
              processed: i + batch.length,
              total: imagePaths.length
            }
          );
        }
        
        // Update task with final results
        await updateBackgroundTaskStatus(
          this.db,
          taskId,
          'completed',
          { results }
        );
        
        return taskId;
      } else {
        // Process sequentially
        const results: OcrResult[] = [];
        
        for (let i = 0; i < imagePaths.length; i++) {
          try {
            const result = await this.processImage(imagePaths[i], userId, options);
            results.push(result);
          } catch (error) {
            console.error(`Error processing ${imagePaths[i]}:`, error);
            results.push({
              text: '',
              confidence: 0,
              provider: options.provider || this.config.defaultProvider,
              processingTimeMs: 0,
              error: error instanceof Error ? error.message : 'Unknown error'
            } as OcrResult);
          }
          
          // Update task progress
          await updateBackgroundTaskStatus(
            this.db,
            taskId,
            'processing',
            {
              progress: Math.min(100, Math.round((i + 1) / imagePaths.length * 100)),
              processed: i + 1,
              total: imagePaths.length
            }
          );
        }
        
        // Update task with final results
        await updateBackgroundTaskStatus(
          this.db,
          taskId,
          'completed',
          { results }
        );
        
        return taskId;
      }
    } catch (error) {
      console.error('Error processing batch:', error);
      throw new ExternalServiceError(`Batch OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}