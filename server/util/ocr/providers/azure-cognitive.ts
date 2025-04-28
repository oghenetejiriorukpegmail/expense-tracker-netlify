/**
 * Azure Cognitive Services Provider Implementation
 * 
 * This file contains the implementation of the Azure Cognitive Services provider.
 */

import axios from 'axios';
import { IOcrProvider, OcrResult } from '../types';
import { ExternalServiceError } from '../../error-handler';

export interface AzureCognitiveConfig {
  endpoint: string;
  apiKey: string;
  language?: string;
}

export class AzureCognitiveProvider implements IOcrProvider {
  private config: AzureCognitiveConfig;
  
  constructor(config: AzureCognitiveConfig) {
    if (!config.endpoint || !config.apiKey) {
      throw new Error('Azure Cognitive Services configuration is missing required fields');
    }
    
    this.config = config;
  }
  
  /**
   * Process an image with Azure Cognitive Services
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
      // Call Azure Read API (asynchronous)
      const submitResponse = await axios.post(
        `${this.config.endpoint}/vision/v3.2/read/analyze`,
        imageBuffer,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Ocp-Apim-Subscription-Key': this.config.apiKey
          },
          params: {
            language: options.language || this.config.language || 'en'
          }
        }
      );
      
      // Get operation location for polling
      const operationLocation = submitResponse.headers['operation-location'];
      if (!operationLocation) {
        throw new Error('Azure Cognitive Services did not return an operation location');
      }
      
      // Poll for results
      let result;
      let attempts = 0;
      const maxAttempts = 10;
      const pollingInterval = 1000; // 1 second
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
        
        const resultResponse = await axios.get(operationLocation, {
          headers: {
            'Ocp-Apim-Subscription-Key': this.config.apiKey
          }
        });
        
        if (resultResponse.data.status === 'succeeded') {
          result = resultResponse.data;
          break;
        } else if (resultResponse.data.status === 'failed') {
          throw new Error(`Azure Cognitive Services analysis failed: ${resultResponse.data.error?.message || 'Unknown error'}`);
        }
        
        attempts++;
      }
      
      if (!result) {
        throw new Error('Azure Cognitive Services analysis timed out');
      }
      
      // Extract text and confidence
      let text = '';
      let totalConfidence = 0;
      let wordCount = 0;
      
      if (result.analyzeResult && result.analyzeResult.readResults) {
        for (const page of result.analyzeResult.readResults) {
          for (const line of page.lines || []) {
            text += line.text + '\n';
            
            for (const word of line.words || []) {
              if (word.confidence) {
                totalConfidence += word.confidence;
                wordCount++;
              }
            }
          }
        }
      }
      
      const confidence = wordCount > 0 ? totalConfidence / wordCount : 0;
      
      // Extract fields if requested
      const extractedFields: Record<string, { value: string; confidence: number }> = {};
      
      if (options.fields && options.fields.length > 0) {
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
        text: text.trim(),
        confidence,
        fields: Object.keys(extractedFields).length > 0 ? extractedFields : undefined,
        raw: result,
        provider: 'azure-cognitive',
        processingTimeMs: 0 // Will be set by the caller
      };
    } catch (error) {
      console.error('Azure Cognitive Services processing error:', error);
      throw new ExternalServiceError(`Azure Cognitive Services processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}