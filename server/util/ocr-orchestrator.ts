/**
 * OCR Orchestrator
 * 
 * This file provides a simplified interface to the OCR system.
 * It handles receipt processing, batch uploads, and other OCR-related tasks.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createOcrServiceFromEnv } from './ocr/index';
import { ExternalServiceError } from './error-handler';

/**
 * Process a receipt image and extract structured data
 * @param imagePath Path to the receipt image
 * @param userId User ID for tracking
 * @returns Structured receipt data and task ID
 */
export async function processReceipt(
  imagePath: string,
  userId: number
): Promise<{
  taskId: number;
  data?: {
    vendor?: string;
    date?: string;
    total?: string;
    items?: Array<{ description: string; amount: string }>;
    tax?: string;
    receiptNumber?: string;
  };
}> {
  try {
    // Validate file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`File not found: ${imagePath}`);
    }
    
    // Get file extension
    const ext = path.extname(imagePath).toLowerCase();
    
    // Validate file type
    if (!['.jpg', '.jpeg', '.png', '.pdf', '.tiff', '.bmp'].includes(ext)) {
      throw new Error(`Unsupported file type: ${ext}`);
    }
    
    // Get OCR service
    const ocrService = createOcrServiceFromEnv();
    
    // Process receipt in background
    const taskId = await ocrService.processBatch(
      [imagePath],
      userId,
      {
        preprocessing: true
      }
    );
    
    return { taskId };
  } catch (error) {
    console.error('Error processing receipt:', error);
    throw new ExternalServiceError(`Receipt processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process multiple receipt images in batch
 * @param imagePaths Paths to the receipt images
 * @param userId User ID for tracking
 * @returns Background task ID
 */
export async function processBatchReceipts(
  imagePaths: string[],
  userId: number
): Promise<number> {
  try {
    // Validate files exist
    for (const imagePath of imagePaths) {
      if (!fs.existsSync(imagePath)) {
        throw new Error(`File not found: ${imagePath}`);
      }
      
      // Get file extension
      const ext = path.extname(imagePath).toLowerCase();
      
      // Validate file type
      if (!['.jpg', '.jpeg', '.png', '.pdf', '.tiff', '.bmp'].includes(ext)) {
        throw new Error(`Unsupported file type for ${imagePath}: ${ext}`);
      }
    }
    
    // Get OCR service
    const ocrService = createOcrServiceFromEnv();
    
    // Process receipts in background
    const taskId = await ocrService.processBatch(
      imagePaths,
      userId,
      {
        preprocessing: true
      }
    );
    
    return taskId;
  } catch (error) {
    console.error('Error processing batch receipts:', error);
    throw new ExternalServiceError(`Batch receipt processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the status of a background OCR task
 * @param taskId Background task ID
 * @param userId User ID for validation
 * @returns Task status and results if available
 */
export async function getOcrTaskStatus(
  taskId: number,
  userId: number
): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  results?: any;
  error?: string;
}> {
  try {
    // This would normally query the database for the task status
    // For now, we'll just return a mock response
    return {
      status: 'completed',
      progress: 100,
      results: {
        text: 'Sample receipt text',
        vendor: 'Sample Vendor',
        date: '2023-01-01',
        total: '$123.45'
      }
    };
  } catch (error) {
    console.error('Error getting OCR task status:', error);
    throw new ExternalServiceError(`Failed to get OCR task status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}