/**
 * OCR Test Script
 * 
 * This script demonstrates the OCR system by processing a sample receipt.
 * 
 * Usage:
 * ```
 * ts-node server/util/ocr/test-ocr.ts <path-to-receipt-image>
 * ```
 */

import * as path from 'path';
import * as fs from 'fs';
import { createOcrServiceFromEnv } from './index';
import { OcrProvider } from './types';

// Get command line arguments
const args = process.argv.slice(2);
const imagePath = args[0] || path.join(process.cwd(), 'Receipt sample.jpg');
const provider = (args[1] || 'tesseract') as OcrProvider;

// Validate image path
if (!fs.existsSync(imagePath)) {
  console.error(`Error: Image file not found at ${imagePath}`);
  process.exit(1);
}

// Process receipt
async function processReceipt() {
  try {
    console.log(`Processing receipt: ${imagePath}`);
    console.log(`Using provider: ${provider}`);
    
    // Create OCR service
    const ocrService = createOcrServiceFromEnv({
      defaultProvider: provider
    });
    
    // Process receipt
    const result = await ocrService.processReceipt(imagePath, 1, {
      preprocessing: true
    });
    
    // Print results
    console.log('\nOCR Results:');
    console.log('------------');
    console.log(`Provider: ${result.raw.provider}`);
    console.log(`Processing time: ${result.raw.processingTimeMs}ms`);
    console.log(`Confidence: ${result.raw.confidence}`);
    
    if (result.vendor) {
      console.log(`Vendor: ${result.vendor}`);
    }
    
    if (result.date) {
      console.log(`Date: ${result.date}`);
    }
    
    if (result.total) {
      console.log(`Total: ${result.total}`);
    }
    
    if (result.tax) {
      console.log(`Tax: ${result.tax}`);
    }
    
    if (result.receiptNumber) {
      console.log(`Receipt Number: ${result.receiptNumber}`);
    }
    
    if (result.items && result.items.length > 0) {
      console.log('\nItems:');
      console.log('------');
      
      for (const item of result.items) {
        console.log(`${item.description}: ${item.amount}`);
      }
    }
    
    console.log('\nRaw Text:');
    console.log('---------');
    console.log(result.raw.text);
    
  } catch (error) {
    console.error('Error processing receipt:', error);
  }
}

// Run the test
processReceipt().catch(console.error);