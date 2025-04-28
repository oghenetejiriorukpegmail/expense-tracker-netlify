/**
 * Tesseract OCR Provider Implementation
 * 
 * This file contains the implementation of the Tesseract OCR provider.
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { IOcrProvider, OcrResult } from '../types';
import { ExternalServiceError } from '../../error-handler';

export interface TesseractConfig {
  execPath?: string;
  dataPath?: string;
  language?: string;
}

export class TesseractProvider implements IOcrProvider {
  private config: TesseractConfig;
  private execPromise = promisify(exec);
  
  constructor(config: TesseractConfig) {
    this.config = config;
  }
  
  /**
   * Process an image with Tesseract OCR
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
      // Save image to temporary file
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempImagePath = path.join(tempDir, `temp_${Date.now()}.jpg`);
      await fs.promises.writeFile(tempImagePath, imageBuffer);
      
      // Prepare Tesseract command
      const tesseractPath = this.config.execPath || 'tesseract';
      const dataPath = this.config.dataPath ? `--tessdata-dir ${this.config.dataPath}` : '';
      const lang = options.language || this.config.language || 'eng';
      const outputPath = path.join(tempDir, `output_${Date.now()}`);
      
      // Run Tesseract command
      const command = `${tesseractPath} ${tempImagePath} ${outputPath} -l ${lang} ${dataPath} --oem 1 --psm 3 -c tessedit_create_hocr=1`;
      await this.execPromise(command);
      
      // Read output files
      const textOutput = await fs.promises.readFile(`${outputPath}.txt`, 'utf8');
      const hocrOutput = await fs.promises.readFile(`${outputPath}.hocr`, 'utf8');
      
      // Clean up temporary files
      await fs.promises.unlink(tempImagePath);
      await fs.promises.unlink(`${outputPath}.txt`);
      await fs.promises.unlink(`${outputPath}.hocr`);
      
      // Parse confidence from hOCR
      const confidenceMatches = hocrOutput.match(/x_wconf (\d+)/g) || [];
      const confidenceValues = confidenceMatches.map(match => parseInt(match.replace('x_wconf ', ''), 10));
      const averageConfidence = confidenceValues.length > 0
        ? confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length
        : 0;
      
      // Extract fields if requested
      const extractedFields: Record<string, { value: string; confidence: number }> = {};
      
      if (options.fields && options.fields.length > 0) {
        const lines = textOutput.split('\n');
        
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
        text: textOutput.trim(),
        confidence: averageConfidence / 100, // Convert to 0-1 range
        fields: Object.keys(extractedFields).length > 0 ? extractedFields : undefined,
        raw: { hocr: hocrOutput },
        provider: 'tesseract',
        processingTimeMs: 0 // Will be set by the caller
      };
    } catch (error) {
      console.error('Tesseract processing error:', error);
      throw new ExternalServiceError(`Tesseract processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}