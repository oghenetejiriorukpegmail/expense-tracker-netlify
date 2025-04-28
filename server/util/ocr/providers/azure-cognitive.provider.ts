/**
 * Azure Cognitive Provider
 * 
 * This file implements the Azure Cognitive Services Computer Vision API provider.
 */

import axios from 'axios';
import { IOcrProvider, OcrResult } from '../types';

interface AzureCognitiveConfig {
  endpoint: string;
  apiKey: string;
  language?: string | undefined;
}

interface AzureCognitiveResponse {
  status: string;
  recognitionResult?: {
    lines: Array<{
      text: string;
      boundingBox: number[];
      words: Array<{
        text: string;
        boundingBox: number[];
        confidence: number;
      }>;
    }>;
  };
  analyzeResult?: {
    readResults: Array<{
      page: number;
      angle: number;
      width: number;
      height: number;
      unit: string;
      lines: Array<{
        text: string;
        boundingBox: number[];
        words: Array<{
          text: string;
          boundingBox: number[];
          confidence: number;
        }>;
      }>;
    }>;
    pageResults: Array<{
      page: number;
      keyValuePairs: Array<{
        key: {
          text: string;
          boundingBox: number[];
          confidence: number;
        };
        value: {
          text: string;
          boundingBox: number[];
          confidence: number;
        };
      }>;
      tables: any[];
    }>;
  };
  error?: {
    code: string;
    message: string;
  };
}

export class AzureCognitiveProvider implements IOcrProvider {
  private config: AzureCognitiveConfig;
  
  constructor(config: AzureCognitiveConfig) {
    this.config = config;
  }
  
  async process(
    imageBuffer: Buffer,
    options?: {
      language?: string | undefined;
      fields?: string[] | undefined;
    } | undefined
  ): Promise<OcrResult> {
    try {
      const startTime = Date.now();
      
      // Prepare request to Azure Cognitive Services
      const apiUrl = `${this.config.endpoint}/vision/v3.2/read/analyze`;
      
      // Send initial request to Azure
      const response = await axios.post(
        apiUrl,
        imageBuffer,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Ocp-Apim-Subscription-Key': this.config.apiKey
          },
          timeout: 30000 // 30 seconds timeout
        }
      );
      
      // Get operation location from headers
      const operationLocation = response.headers['operation-location'];
      
      if (!operationLocation) {
        throw new Error('Operation location not found in response headers');
      }
      
      // Poll for results
      const result = await this.pollForResults(operationLocation);
      
      // Extract text from response
      let fullText = '';
      let overallConfidence = 0;
      let wordCount = 0;
      
      if (result.analyzeResult?.readResults) {
        for (const readResult of result.analyzeResult.readResults) {
          for (const line of readResult.lines) {
            fullText += line.text + '\n';
            
            // Calculate average confidence
            for (const word of line.words) {
              overallConfidence += word.confidence;
              wordCount++;
            }
          }
        }
      }
      
      // Calculate average confidence
      const confidence = wordCount > 0 ? overallConfidence / wordCount : 0.5;
      
      // Extract fields if requested
      const fields: Record<string, { value: string; confidence: number }> = {};
      
      if (options?.fields && options.fields.length > 0 && fullText) {
        // Check if Azure extracted key-value pairs
        if (result.analyzeResult?.pageResults) {
          for (const pageResult of result.analyzeResult.pageResults) {
            for (const kvp of pageResult.keyValuePairs) {
              const key = kvp.key.text.toLowerCase();
              
              // Map Azure's key-value pairs to our fields
              if (options.fields.includes('vendor') && 
                  (key.includes('vendor') || key.includes('store') || key.includes('merchant'))) {
                fields.vendor = {
                  value: kvp.value.text,
                  confidence: kvp.value.confidence
                };
              }
              
              if (options.fields.includes('date') && 
                  (key.includes('date') || key.includes('time'))) {
                fields.date = {
                  value: kvp.value.text,
                  confidence: kvp.value.confidence
                };
              }
              
              if (options.fields.includes('total') && 
                  (key.includes('total') || key.includes('amount') || key.includes('sum'))) {
                fields.total = {
                  value: kvp.value.text,
                  confidence: kvp.value.confidence
                };
              }
              
              if (options.fields.includes('tax') && 
                  (key.includes('tax') || key.includes('vat') || key.includes('gst'))) {
                fields.tax = {
                  value: kvp.value.text,
                  confidence: kvp.value.confidence
                };
              }
              
              if (options.fields.includes('receipt_number') && 
                  (key.includes('receipt') || key.includes('order') || key.includes('invoice'))) {
                fields.receipt_number = {
                  value: kvp.value.text,
                  confidence: kvp.value.confidence
                };
              }
            }
          }
        }
        
        // If Azure didn't extract the fields, use regex patterns
        const lines = fullText.split('\n');
        
        // Look for vendor (usually at the top of the receipt)
        if (options.fields.includes('vendor') && !fields.vendor) {
          fields.vendor = {
            value: lines[0] || '',
            confidence: 0.7,
          };
        }
        
        // Look for date (format: MM/DD/YYYY or similar)
        if (options.fields.includes('date') && !fields.date) {
          const dateMatch = fullText.match(/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/);
          if (dateMatch && dateMatch[0]) {
            fields.date = {
              value: dateMatch[0],
              confidence: 0.8,
            };
          }
        }
        
        // Look for total (usually preceded by "TOTAL" or similar)
        if (options.fields.includes('total') && !fields.total) {
          const totalMatch = fullText.match(/total\s*[\$\£\€]?\s*(\d+\.\d{2})/i);
          if (totalMatch && totalMatch[1]) {
            fields.total = {
              value: totalMatch[1],
              confidence: 0.85,
            };
          }
        }
        
        // Look for tax (usually preceded by "TAX" or similar)
        if (options.fields.includes('tax') && !fields.tax) {
          const taxMatch = fullText.match(/tax\s*[\$\£\€]?\s*(\d+\.\d{2})/i);
          if (taxMatch && taxMatch[1]) {
            fields.tax = {
              value: taxMatch[1],
              confidence: 0.8,
            };
          }
        }
        
        // Look for receipt number
        if (options.fields.includes('receipt_number') && !fields.receipt_number) {
          const receiptMatch = fullText.match(/receipt\s*#?\s*(\w+)/i) || 
                              fullText.match(/order\s*#?\s*(\w+)/i);
          if (receiptMatch && receiptMatch[1]) {
            fields.receipt_number = {
              value: receiptMatch[1],
              confidence: 0.75,
            };
          }
        }
      }
      
      return {
        text: fullText,
        confidence,
        provider: 'azure-cognitive',
        processingTimeMs: Date.now() - startTime,
        fields: Object.keys(fields).length > 0 ? fields : undefined,
      };
    } catch (error) {
      console.error('Azure Cognitive processing error:', error);
      
      // Return error result
      return {
        text: '',
        confidence: 0,
        provider: 'azure-cognitive',
        processingTimeMs: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  private async pollForResults(operationLocation: string): Promise<AzureCognitiveResponse> {
    const maxRetries = 10;
    const retryInterval = 1000; // 1 second
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await axios.get<AzureCognitiveResponse>(
          operationLocation,
          {
            headers: {
              'Ocp-Apim-Subscription-Key': this.config.apiKey
            }
          }
        );
        
        // Check for errors
        if (response.data.error) {
          throw new Error(
            `Azure Cognitive Services error: ${response.data.error.message}`
          );
        }
        
        // Check if operation is complete
        if (response.data.status === 'succeeded') {
          return response.data;
        }
        
        // Check if operation failed
        if (response.data.status === 'failed') {
          throw new Error('Azure Cognitive Services operation failed');
        }
        
        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      } catch (error) {
        if (i === maxRetries - 1) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      }
    }
    
    throw new Error('Azure Cognitive Services operation timed out');
  }
}