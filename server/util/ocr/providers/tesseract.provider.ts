/**
 * Tesseract Provider
 * 
 * This file implements the Tesseract OCR provider.
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { IOcrProvider, OcrResult } from '../types';

interface TesseractConfig {
  execPath?: string | undefined;
  dataPath?: string | undefined;
  language?: string | undefined;
}

export class TesseractProvider implements IOcrProvider {
  private config: TesseractConfig;
  
  constructor(config: TesseractConfig) {
    this.config = {
      execPath: config.execPath || 'tesseract',
      dataPath: config.dataPath,
      language: config.language || 'eng',
    };
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
      
      // Create temporary file for the image
      const tempDir = os.tmpdir();
      const tempImagePath = path.join(tempDir, `ocr-image-${Date.now()}.jpg`);
      const tempOutputPath = path.join(tempDir, `ocr-output-${Date.now()}`);
      
      // Write image buffer to temporary file
      await fs.promises.writeFile(tempImagePath, imageBuffer);
      
      // Prepare Tesseract command
      const language = options?.language || this.config.language || 'eng';
      const tesseractArgs = [
        tempImagePath,
        tempOutputPath,
        '-l', language,
      ];
      
      // Add data path if provided
      if (this.config.dataPath) {
        tesseractArgs.push('--tessdata-dir', this.config.dataPath);
      }
      
      // Add output format (text)
      tesseractArgs.push('txt');
      
      // Execute Tesseract
      const result = await this.executeTesseract(
        this.config.execPath || 'tesseract',
        tesseractArgs
      );
      
      // Read output file
      const outputFilePath = `${tempOutputPath}.txt`;
      const text = await fs.promises.readFile(outputFilePath, 'utf8');
      
      // Clean up temporary files
      try {
        await fs.promises.unlink(tempImagePath);
        await fs.promises.unlink(outputFilePath);
      } catch (error) {
        console.warn('Error cleaning up temporary files:', error);
      }
      
      // Extract fields if requested
      const fields: Record<string, { value: string; confidence: number }> = {};
      
      if (options?.fields && options.fields.length > 0 && text) {
        // Simple field extraction based on patterns
        const lines = text.split('\n');
        
        // Look for vendor (usually at the top of the receipt)
        if (options.fields.includes('vendor')) {
          fields.vendor = {
            value: lines[0] || '',
            confidence: 0.6,
          };
        }
        
        // Look for date (format: MM/DD/YYYY or similar)
        if (options.fields.includes('date')) {
          const dateMatch = text.match(/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/);
          if (dateMatch && dateMatch[0]) {
            fields.date = {
              value: dateMatch[0],
              confidence: 0.7,
            };
          }
        }
        
        // Look for total (usually preceded by "TOTAL" or similar)
        if (options.fields.includes('total')) {
          const totalMatch = text.match(/total\s*[\$\£\€]?\s*(\d+\.\d{2})/i);
          if (totalMatch && totalMatch[1]) {
            fields.total = {
              value: totalMatch[1],
              confidence: 0.75,
            };
          }
        }
        
        // Look for tax (usually preceded by "TAX" or similar)
        if (options.fields.includes('tax')) {
          const taxMatch = text.match(/tax\s*[\$\£\€]?\s*(\d+\.\d{2})/i);
          if (taxMatch && taxMatch[1]) {
            fields.tax = {
              value: taxMatch[1],
              confidence: 0.7,
            };
          }
        }
        
        // Look for receipt number
        if (options.fields.includes('receipt_number')) {
          const receiptMatch = text.match(/receipt\s*#?\s*(\w+)/i) || 
                              text.match(/order\s*#?\s*(\w+)/i);
          if (receiptMatch && receiptMatch[1]) {
            fields.receipt_number = {
              value: receiptMatch[1],
              confidence: 0.65,
            };
          }
        }
      }
      
      return {
        text,
        confidence: 0.8, // Tesseract doesn't provide confidence scores per result
        provider: 'tesseract',
        processingTimeMs: Date.now() - startTime,
        fields: Object.keys(fields).length > 0 ? fields : undefined,
      };
    } catch (error) {
      console.error('Tesseract processing error:', error);
      
      // Return error result
      return {
        text: '',
        confidence: 0,
        provider: 'tesseract',
        processingTimeMs: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  private executeTesseract(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args);
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Tesseract exited with code ${code}: ${stderr}`));
        } else {
          resolve(stdout);
        }
      });
      
      process.on('error', (error) => {
        reject(error);
      });
    });
  }
}