/**
 * OCR.space Provider Implementation
 * 
 * This file contains the implementation of the OCR.space provider.
 */

import axios from 'axios';
import FormData from 'form-data';
import { IOcrProvider, OcrResult } from '../types';
import { ExternalServiceError } from '../../error-handler';

export interface OcrSpaceConfig {
  apiKey: string;
  apiEndpoint: string;
  language?: string;
  isOverlayRequired?: boolean;
}

export class OcrSpaceProvider implements IOcrProvider {
  private config: OcrSpaceConfig;
  
  constructor(config: OcrSpaceConfig) {
    if (!config.apiKey || !config.apiEndpoint) {
      throw new Error('OCR.space configuration is missing required fields');
    }
    
    this.config = config;
  }
  
  /**
   * Process an image with OCR.space
   * @param imageBuffer Image buffer
   * @param options Additional options
   * @returns OCR result
   */
  public async process(
    imageBuffer: Buffer, 
    options: { 
      language?: string;
      fields?: string[];
    } = {}
  ): Promise<OcrResult> {
    try {
      const formData = new FormData();
      formData.append('apikey', this.config.apiKey);
      formData.append('language', options.language || this.config.language || 'eng');
      formData.append('isOverlayRequired', String(this.config.isOverlayRequired || false));
      formData.append('file', imageBuffer, {
        filename: 'image.jpg',
        contentType: 'image/jpeg',
      });
      
      const response = await axios.post(this.config.apiEndpoint, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000, // 30 seconds timeout
      });
      
      if (response.data.ErrorMessage) {
        throw new Error(`OCR.space error: ${response.data.ErrorMessage}`);
      }
      
      const parsedResults = response.data.ParsedResults || [];
      if (parsedResults.length === 0) {
        throw new Error('OCR.space returned no results');
      }
      
      // Calculate confidence if available
      let confidence = 0;
      if (parsedResults[0].TextOverlay?.Lines) {
        let totalConfidence = 0;
        let wordCount = 0;
        
        for (const line of parsedResults[0].TextOverlay.Lines) {
          for (const word of line.Words) {
            totalConfidence += word.WordConf;
            wordCount++;
          }
        }
        
        confidence = wordCount > 0 ? totalConfidence / wordCount : 0;
      }
      
      // Extract fields if requested
      const extractedFields: Record<string, { value: string; confidence: number }> = {};
      
      if (options.fields && options.fields.length > 0) {
        const text = parsedResults[0].ParsedText || '';
        const lines = text.split('\n');
        
        for (const field of options.fields) {
          const fieldRegex = new RegExp(`(?:${field}|${field.replace(/_/g, ' ')})[:\\s]+(.*?)(?:\\s|$)`, 'i');
          
          for (const line of lines) {
            const match = line.match(fieldRegex);
            if (match && match[1]) {
              extractedFields[field] = {
                value: match[1].trim(),
                confidence: 0.7 // Default confidence for regex matches
              };
              break;
            }
          }
        }
      }
      
      return {
        text: parsedResults[0].ParsedText || '',
        confidence,
        fields: Object.keys(extractedFields).length > 0 ? extractedFields : undefined,
        raw: response.data,
        provider: 'ocr-space',
        processingTimeMs: 0 // Will be set by the caller
      };
    } catch (error) {
      console.error('OCR.space processing error:', error);
      throw new ExternalServiceError(`OCR.space processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}