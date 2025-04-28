/**
 * OCR Service
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
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../../shared/schema';
import { createClient } from '@supabase/supabase-js';
import { ExternalServiceError, ValidationError } from '../error-handler';
import { createBackgroundTask, updateBackgroundTaskStatus } from '../../storage/task.storage';
import { safeEq } from '../../../shared/drizzle-types';

import { 
  OcrProvider, 
  OcrResult, 
  OcrConfig, 
  SimpleCache,
  IOcrProvider
} from './types';

import {
  OcrSpaceProvider,
  TesseractProvider,
  GoogleVisionProvider,
  AzureCognitiveProvider
} from './providers';

import {
  preprocessImage,
  generateImageHash,
  extractLineItems
} from './image-preprocessor';

// OCR service class
export class OcrService {
  private static instance: OcrService;
  private config: OcrConfig;
  private cache: SimpleCache;
  private db!: ReturnType<typeof drizzle>;
  private supabase!: ReturnType<typeof createClient>;
  private providers: Map<OcrProvider, IOcrProvider> = new Map();
  
  // Private constructor for singleton pattern
  private constructor(config: OcrConfig) {
    this.config = config;
    
    // Initialize cache
    this.cache = new SimpleCache(config.caching.ttl);
    
    // Initialize database
    const pgClient = postgres(process.env.DATABASE_URL || '');
    this.db = drizzle(pgClient);
    
    // Initialize Supabase client
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || ''
    );
    
    // Initialize providers
    this.initializeProviders();
    
    console.log('OCR service initialized');
  }
  
  // Initialize OCR providers
  private initializeProviders(): void {
    // Initialize OCR.space provider
    if (this.config.providers['ocr-space']) {
      this.providers.set('ocr-space', new OcrSpaceProvider(this.config.providers['ocr-space']));
    }
    
    // Initialize Tesseract provider
    if (this.config.providers['tesseract']) {
      this.providers.set('tesseract', new TesseractProvider(this.config.providers['tesseract']));
    }
    
    // Initialize Google Vision provider
    if (this.config.providers['google-vision']) {
      this.providers.set('google-vision', new GoogleVisionProvider(this.config.providers['google-vision']));
    }
    
    // Initialize Azure Cognitive provider
    if (this.config.providers['azure-cognitive']) {
      this.providers.set('azure-cognitive', new AzureCognitiveProvider(this.config.providers['azure-cognitive']));
    }
    
    // Ensure default provider is available
    if (!this.providers.has(this.config.defaultProvider)) {
      throw new Error(`Default OCR provider '${this.config.defaultProvider}' is not configured`);
    }
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
      language?: string | undefined;
      fields?: string[] | undefined;
    } = {}
  ): Promise<OcrResult> {
    try {
      const startTime = Date.now();
      
      // Read image file
      let imageBuffer = await fs.promises.readFile(imagePath);
      
      // Generate hash for caching
      const imageHash = generateImageHash(imageBuffer);
      
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
        imageBuffer = await preprocessImage(imageBuffer, this.config.preprocessing);
      }
      
      // Determine provider
      const providerName = options.provider || this.config.defaultProvider;
      const provider = this.providers.get(providerName);
      
      if (!provider) {
        throw new ValidationError(`OCR provider '${providerName}' is not available`);
      }
      
      // Process with primary provider
      let result: OcrResult;
      try {
        result = await provider.process(imageBuffer, {
          language: options.language,
          fields: options.fields
        });
      } catch (error) {
        console.error(`Error processing with ${providerName}:`, error);
        
        // Try fallback providers if enabled
        if (this.config.fallback.enabled) {
          result = await this.processWithFallbackProviders(imageBuffer, providerName, options);
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
  
  /**
   * Process with fallback providers
   * @param imageBuffer Image buffer
   * @param excludeProvider Provider to exclude
   * @param options Additional options
   * @returns OCR result
   */
  private async processWithFallbackProviders(
    imageBuffer: Buffer,
    excludeProvider: OcrProvider,
    options: {
      language?: string | undefined;
      fields?: string[] | undefined;
    } = {}
  ): Promise<OcrResult> {
    // Get fallback providers excluding the one that failed
    const fallbackProviders = this.config.fallback.providerOrder.filter(p => p !== excludeProvider);
    
    // Try each fallback provider
    let lastError: Error | null = null;
    
    for (const providerName of fallbackProviders) {
      const provider = this.providers.get(providerName);
      
      if (!provider) {
        console.warn(`Fallback provider '${providerName}' is not available, skipping`);
        continue;
      }
      
      try {
        return await provider.process(imageBuffer, {
          language: options.language,
          fields: options.fields
        });
      } catch (error) {
        console.error(`Fallback to ${providerName} failed:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }
    
    // If all fallbacks fail, throw the last error
    throw lastError || new Error('All OCR providers failed');
  }
  
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
      language?: string | undefined;
      fields?: string[] | undefined;
      taskId?: number;
    } = {}
  ): Promise<number> {
    let taskId = 0;
    try {
      // Create or use existing background task
      taskId = options.taskId || (await createBackgroundTask(this.db as any, {
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
            this.db as any,
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
          this.db as any,
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
            const imagePath = imagePaths[i];
            if (imagePath) {
              const result = await this.processImage(imagePath, userId, options);
              results.push(result);
            }
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
            this.db as any,
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
          this.db as any,
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
  
  /**
   * Process a receipt image and extract structured data
   * @param imagePath Path to the receipt image
   * @param userId User ID for tracking
   * @param options Additional options
   * @returns Structured receipt data
   */
  public async processReceipt(
    imagePath: string,
    userId: number,
    options: {
      provider?: OcrProvider;
      preprocessing?: boolean;
      language?: string | undefined;
    } = {}
  ): Promise<{
    vendor?: string | undefined;
    date?: string | undefined;
    total?: string | undefined;
    items?: Array<{ description: string; amount: string }> | undefined;
    tax?: string | undefined;
    receiptNumber?: string | undefined;
    raw: OcrResult;
  }> {
    try {
      // Process image with OCR
      const ocrResult = await this.processImage(
        imagePath,
        userId,
        {
          ...options,
          fields: ['vendor', 'date', 'total', 'items', 'tax', 'receipt_number']
        }
      );
      
      // Extract structured data from OCR result
      const structuredData = {
        vendor: ocrResult.fields?.vendor?.value,
        date: ocrResult.fields?.date?.value,
        total: ocrResult.fields?.total?.value,
        items: extractLineItems(ocrResult.text),
        tax: ocrResult.fields?.tax?.value,
        receiptNumber: ocrResult.fields?.receipt_number?.value,
        raw: ocrResult
      };
      
      return structuredData;
    } catch (error) {
      console.error('Error processing receipt:', error);
      throw new ExternalServiceError(`Receipt OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}