/**
 * OCR Configuration
 * 
 * This file provides default configuration for the OCR system.
 */

import { OcrConfig } from './types';

/**
 * Default OCR configuration
 */
export const defaultOcrConfig: OcrConfig = {
  defaultProvider: 'tesseract',
  providers: {
    'ocr-space': process.env.OCR_SPACE_API_KEY ? {
      apiKey: process.env.OCR_SPACE_API_KEY,
      apiEndpoint: process.env.OCR_SPACE_API_ENDPOINT || 'https://api.ocr.space/parse/image',
      language: process.env.OCR_SPACE_LANGUAGE || 'eng',
      isOverlayRequired: process.env.OCR_SPACE_OVERLAY_REQUIRED === 'true'
    } : undefined,
    'tesseract': {
      execPath: process.env.TESSERACT_EXEC_PATH,
      dataPath: process.env.TESSERACT_DATA_PATH,
      language: process.env.TESSERACT_LANGUAGE || 'eng'
    },
    'google-vision': process.env.GOOGLE_VISION_API_KEY ? {
      apiKey: process.env.GOOGLE_VISION_API_KEY,
      projectId: process.env.GOOGLE_VISION_PROJECT_ID || ''
    } : undefined,
    'azure-cognitive': process.env.AZURE_COGNITIVE_API_KEY ? {
      endpoint: process.env.AZURE_COGNITIVE_ENDPOINT || '',
      apiKey: process.env.AZURE_COGNITIVE_API_KEY
    } : undefined
  },
  preprocessing: {
    enabled: process.env.OCR_PREPROCESSING_ENABLED !== 'false',
    grayscale: process.env.OCR_PREPROCESSING_GRAYSCALE === 'true',
    contrast: process.env.OCR_PREPROCESSING_CONTRAST ? parseFloat(process.env.OCR_PREPROCESSING_CONTRAST) : undefined,
    brightness: process.env.OCR_PREPROCESSING_BRIGHTNESS ? parseFloat(process.env.OCR_PREPROCESSING_BRIGHTNESS) : undefined,
    sharpen: process.env.OCR_PREPROCESSING_SHARPEN === 'true',
    resize: {
      width: process.env.OCR_PREPROCESSING_RESIZE_WIDTH ? parseInt(process.env.OCR_PREPROCESSING_RESIZE_WIDTH) : undefined,
      height: process.env.OCR_PREPROCESSING_RESIZE_HEIGHT ? parseInt(process.env.OCR_PREPROCESSING_RESIZE_HEIGHT) : undefined,
      fit: (process.env.OCR_PREPROCESSING_RESIZE_FIT as 'cover' | 'contain' | 'fill' | 'inside' | 'outside') || undefined
    }
  },
  caching: {
    enabled: process.env.OCR_CACHING_ENABLED !== 'false',
    ttl: process.env.OCR_CACHING_TTL ? parseInt(process.env.OCR_CACHING_TTL) : 3600
  },
  fallback: {
    enabled: process.env.OCR_FALLBACK_ENABLED !== 'false',
    maxAttempts: process.env.OCR_FALLBACK_MAX_ATTEMPTS ? parseInt(process.env.OCR_FALLBACK_MAX_ATTEMPTS) : 3,
    providerOrder: (process.env.OCR_FALLBACK_PROVIDER_ORDER || 'tesseract,ocr-space,google-vision,azure-cognitive')
      .split(',')
      .filter(p => p.trim() !== '')
      .map(p => p.trim() as any)
  },
  parallelProcessing: {
    enabled: process.env.OCR_PARALLEL_PROCESSING_ENABLED !== 'false',
    maxConcurrent: process.env.OCR_PARALLEL_PROCESSING_MAX_CONCURRENT ? 
      parseInt(process.env.OCR_PARALLEL_PROCESSING_MAX_CONCURRENT) : 3
  }
};

/**
 * Get OCR configuration
 * @param overrides Configuration overrides
 * @returns OCR configuration
 */
export function getOcrConfig(overrides?: Partial<OcrConfig>): OcrConfig {
  if (!overrides) {
    return defaultOcrConfig;
  }
  
  return {
    ...defaultOcrConfig,
    ...overrides,
    providers: {
      ...defaultOcrConfig.providers,
      ...overrides.providers
    },
    preprocessing: {
      ...defaultOcrConfig.preprocessing,
      ...overrides.preprocessing,
      resize: {
        ...defaultOcrConfig.preprocessing.resize,
        ...overrides.preprocessing?.resize
      }
    },
    caching: {
      ...defaultOcrConfig.caching,
      ...overrides.caching
    },
    fallback: {
      ...defaultOcrConfig.fallback,
      ...overrides.fallback
    },
    parallelProcessing: {
      ...defaultOcrConfig.parallelProcessing,
      ...overrides.parallelProcessing
    }
  };
}