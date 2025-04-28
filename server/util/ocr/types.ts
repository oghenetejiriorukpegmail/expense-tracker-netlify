/**
 * OCR Types
 * 
 * This file defines the types used by the OCR system.
 */

// OCR provider types
export type OcrProvider = 'ocr-space' | 'tesseract' | 'google-vision' | 'azure-cognitive';

// OCR result interface
export interface OcrResult {
  text: string;
  confidence: number;
  provider: OcrProvider;
  processingTimeMs: number;
  imageHash?: string | undefined;
  fields?: {
    [key: string]: {
      value: string;
      confidence: number;
    };
  } | undefined;
  error?: string | undefined;
}

// OCR configuration interface
export interface OcrConfig {
  defaultProvider: OcrProvider;
  providers: {
    'ocr-space'?: {
      apiKey: string;
      apiEndpoint: string;
      language?: string | undefined;
      isOverlayRequired?: boolean | undefined;
    } | undefined;
    'tesseract'?: {
      execPath?: string | undefined;
      dataPath?: string | undefined;
      language?: string | undefined;
    } | undefined;
    'google-vision'?: {
      apiKey: string;
      projectId: string;
    } | undefined;
    'azure-cognitive'?: {
      endpoint: string;
      apiKey: string;
      language?: string | undefined;
    } | undefined;
  };
  preprocessing: {
    enabled: boolean;
    grayscale?: boolean | undefined;
    contrast?: number | undefined;
    brightness?: number | undefined;
    sharpen?: boolean | undefined;
    resize?: {
      width?: number | undefined;
      height?: number | undefined;
      fit?: ('cover' | 'contain' | 'fill' | 'inside' | 'outside') | undefined;
    } | undefined;
  };
  caching: {
    enabled: boolean;
    ttl: number; // Time to live in seconds
  };
  fallback: {
    enabled: boolean;
    maxAttempts: number;
    providerOrder: OcrProvider[];
  };
  parallelProcessing: {
    enabled: boolean;
    maxConcurrent: number;
  };
}

// OCR provider interface
export interface IOcrProvider {
  process(
    imageBuffer: Buffer, 
    options?: { 
      language?: string | undefined;
      fields?: string[] | undefined;
    } | undefined
  ): Promise<OcrResult>;
}

// Simple cache class
export class SimpleCache {
  private cache: Map<string, { value: any; expires: number }> = new Map();
  private ttl: number;
  
  constructor(ttl: number = 3600) {
    this.ttl = ttl * 1000; // Convert to milliseconds
  }
  
  set(key: string, value: any, ttl?: number): void {
    const expires = Date.now() + (ttl ? ttl * 1000 : this.ttl);
    this.cache.set(key, { value, expires });
  }
  
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value as T;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  // Clean expired items
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}