/**
 * Google Vision API Provider Implementation
 * 
 * This file contains the implementation of the Google Vision API provider.
 */

import axios from 'axios';
import { IOcrProvider, OcrResult } from '../types';
import { ExternalServiceError } from '../../error-handler';

export interface GoogleVisionConfig {
  apiKey: string;
  projectId: string;
}

export class GoogleVisionProvider implements IOcrProvider {
  private config: GoogleVisionConfig;
  
  constructor(config: GoogleVisionConfig) {
    if (!config.apiKey) {
      throw new Error('Google Vision API configuration is missing required fields');
    }
    
    this.config = config;
  }
  
  /**
   * Process an image with Google Vision API
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
      // Encode image as base64
      const base64Image = imageBuffer.toString('base64');
      
      // Prepare request
      const requestData = {
        requests: [
          {
            image: {
              content: base64Image
            },
            features: [
              {
                type: 'TEXT_DETECTION'
              },
              {
                type: 'DOCUMENT_TEXT_DETECTION'
              }
            ],
            imageContext: options.language ? {
              languageHints: [options.language]
            } : undefined
          }
        ]
      };
      
      // Call Google Vision API
      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.config.apiKey}`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds timeout
        }
      );
      
      if (!response.data.responses || response.data.responses.length === 0) {
        throw new Error('Google Vision returned no results');
      }
      
      const result = response.data.responses[0];
      
      // Extract text and confidence
      const text = result.fullTextAnnotation?.text || '';
      
      // Calculate average confidence
      let totalConfidence = 0;
      let wordCount = 0;
      
      if (result.textAnnotations && result.textAnnotations.length > 1) {
        // Skip the first annotation which is the entire text
        for (let i = 1; i < result.textAnnotations.length; i++) {
          if (result.textAnnotations[i].confidence) {
            totalConfidence += result.textAnnotations[i].confidence;
            wordCount++;
          }
        }
      }
      
      const confidence = wordCount > 0 ? totalConfidence / wordCount : 0;
      
      // Extract fields if requested
      const extractedFields: Record<string, { value: string; confidence: number }> = {};
      
      if (options.fields && options.fields.length > 0 && result.fullTextAnnotation) {
        // Simple field extraction based on keywords
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
        text,
        confidence,
        fields: Object.keys(extractedFields).length > 0 ? extractedFields : undefined,
        raw: result,
        provider: 'google-vision',
        processingTimeMs: 0 // Will be set by the caller
      };
    } catch (error) {
      console.error('Google Vision processing error:', error);
      throw new ExternalServiceError(`Google Vision processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}