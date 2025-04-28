/**
 * OCR.space Provider
 * 
 * This file implements the OCR.space API provider.
 */

import axios from 'axios';
import FormData from 'form-data';
import { IOcrProvider, OcrResult } from '../types';

interface OcrSpaceConfig {
  apiKey: string;
  apiEndpoint: string;
  language?: string | undefined;
  isOverlayRequired?: boolean | undefined;
}

interface OcrSpaceResponse {
  ParsedResults: Array<{
    ParsedText: string;
    ErrorMessage: string;
    TextOverlay: {
      Lines: Array<{
        LineText: string;
        Words: Array<{
          WordText: string;
          Left: number;
          Top: number;
          Height: number;
          Width: number;
        }>;
      }>;
      HasOverlay: boolean;
      Message: string;
    };
    TextOrientation: string;
    FileParseExitCode: number;
    ParsedTextFileName: string;
    ErrorDetails?: string;
  }>;
  OCRExitCode: number;
  IsErroredOnProcessing: boolean;
  ProcessingTimeInMilliseconds: string;
  SearchablePDFURL: string;
}

export class OcrSpaceProvider implements IOcrProvider {
  private config: OcrSpaceConfig;
  
  constructor(config: OcrSpaceConfig) {
    this.config = config;
  }
  
  async process(
    imageBuffer: Buffer,
    options?: {
      language?: string;
      fields?: string[];
    }
  ): Promise<OcrResult> {
    try {
      const startTime = Date.now();
      
      // Create form data
      const formData = new FormData();
      formData.append('apikey', this.config.apiKey);
      formData.append('language', options?.language || this.config.language || 'eng');
      formData.append('isOverlayRequired', String(this.config.isOverlayRequired || false));
      formData.append('file', imageBuffer, {
        filename: 'image.jpg',
        contentType: 'image/jpeg',
      });
      
      // Send request to OCR.space API
      const response = await axios.post<OcrSpaceResponse>(
        this.config.apiEndpoint,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 30000, // 30 seconds timeout
        }
      );
      
      // Check for errors
      if (response.data.IsErroredOnProcessing) {
        throw new Error(
          response.data.ParsedResults?.[0]?.ErrorMessage ||
          response.data.ParsedResults?.[0]?.ErrorDetails ||
          'OCR processing failed'
        );
      }
      
      // Extract text from response
      const parsedText = response.data.ParsedResults
        .map(result => result.ParsedText)
        .join('\n');
      
      // Calculate confidence (OCR.space doesn't provide confidence scores)
      // We'll use a simple heuristic based on the exit code
      const confidence = response.data.OCRExitCode === 1 ? 0.9 : 0.5;
      
      // Extract fields if requested
      const fields: Record<string, { value: string; confidence: number }> = {};
      
      if (options?.fields && options.fields.length > 0 && parsedText) {
        // Simple field extraction based on patterns
        // In a real implementation, this would be more sophisticated
        
        const lines = parsedText.split('\n');
        
        // Look for vendor (usually at the top of the receipt)
        if (options.fields.includes('vendor')) {
          fields.vendor = {
            value: lines[0] || '',
            confidence: 0.7,
          };
        }
        
        // Look for date (format: MM/DD/YYYY or similar)
        if (options.fields.includes('date')) {
          const dateMatch = parsedText.match(/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/);
          if (dateMatch) {
            fields.date = {
              value: dateMatch[0],
              confidence: 0.8,
            };
          }
        }
        
        // Look for total (usually preceded by "TOTAL" or similar)
        if (options.fields.includes('total')) {
          const totalMatch = parsedText.match(/total\s*[\$\£\€]?\s*(\d+\.\d{2})/i);
          if (totalMatch && totalMatch[1]) {
            fields.total = {
              value: totalMatch[1],
              confidence: 0.85,
            };
          }
        }
        
        // Look for tax (usually preceded by "TAX" or similar)
        if (options.fields.includes('tax')) {
          const taxMatch = parsedText.match(/tax\s*[\$\£\€]?\s*(\d+\.\d{2})/i);
          if (taxMatch && taxMatch[1]) {
            fields.tax = {
              value: taxMatch[1],
              confidence: 0.8,
            };
          }
        }
        
        // Look for receipt number
        if (options.fields.includes('receipt_number')) {
          const receiptMatch = parsedText.match(/receipt\s*#?\s*(\w+)/i) ||
                              parsedText.match(/order\s*#?\s*(\w+)/i);
          if (receiptMatch && receiptMatch[1]) {
            fields.receipt_number = {
              value: receiptMatch[1],
              confidence: 0.75,
            };
          }
        }
      }
      
      return {
        text: parsedText,
        confidence,
        provider: 'ocr-space',
        processingTimeMs: Date.now() - startTime,
        fields: Object.keys(fields).length > 0 ? fields : undefined,
      };
    } catch (error) {
      console.error('OCR.space processing error:', error);
      
      // Return error result
      return {
        text: '',
        confidence: 0,
        provider: 'ocr-space',
        processingTimeMs: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}