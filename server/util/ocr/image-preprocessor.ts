/**
 * Image Preprocessor
 * 
 * This file contains utilities for preprocessing images before OCR processing.
 * Note: This is a simplified version that doesn't actually perform image processing.
 * In a real implementation, you would use a library like Sharp for image processing.
 */

import { createHash } from 'crypto';

export interface PreprocessingOptions {
  grayscale?: boolean | undefined;
  contrast?: number | undefined;
  brightness?: number | undefined;
  sharpen?: boolean | undefined;
  resize?: {
    width?: number | undefined;
    height?: number | undefined;
    fit?: ('cover' | 'contain' | 'fill' | 'inside' | 'outside') | undefined;
  } | undefined;
}

/**
 * Preprocess an image for better OCR results
 * @param imageBuffer Original image buffer
 * @param options Preprocessing options
 * @returns Preprocessed image buffer
 */
export async function preprocessImage(
  imageBuffer: Buffer,
  options: PreprocessingOptions = {}
): Promise<Buffer> {
  try {
    // In a real implementation, we would use a library like Sharp to preprocess the image
    // For example:
    // 
    // import sharp from 'sharp';
    // 
    // let sharpInstance = sharp(imageBuffer);
    // 
    // if (options.grayscale) {
    //   sharpInstance = sharpInstance.grayscale();
    // }
    // 
    // if (options.contrast !== undefined) {
    //   sharpInstance = sharpInstance.linear(
    //     options.contrast,
    //     -(128 * options.contrast) + 128
    //   );
    // }
    // 
    // if (options.brightness !== undefined) {
    //   sharpInstance = sharpInstance.modulate({
    //     brightness: 1 + options.brightness
    //   });
    // }
    // 
    // if (options.sharpen) {
    //   sharpInstance = sharpInstance.sharpen();
    // }
    // 
    // if (options.resize) {
    //   const { width, height, fit } = options.resize;
    //   if (width || height) {
    //     sharpInstance = sharpInstance.resize({
    //       width,
    //       height,
    //       fit: fit || 'inside'
    //     });
    //   }
    // }
    // 
    // return await sharpInstance.toBuffer();
    
    // For now, we'll just return the original buffer
    return imageBuffer;
  } catch (error) {
    console.error('Image preprocessing error:', error);
    // Return original buffer if preprocessing fails
    return imageBuffer;
  }
}

/**
 * Generate a hash for an image buffer
 * @param imageBuffer Image buffer
 * @returns Hash string
 */
export function generateImageHash(imageBuffer: Buffer): string {
  return createHash('sha256').update(imageBuffer).digest('hex');
}

/**
 * Extract line items from OCR text
 * @param text OCR text
 * @returns Array of line items
 */
export function extractLineItems(text: string): Array<{ description: string; amount: string }> {
  const lines = text.split('\n');
  const items: Array<{ description: string; amount: string }> = [];
  
  // Regular expression to match line items (description followed by amount)
  const lineItemRegex = /(.+?)\s+(\$?\d+\.\d{2})\s*$/;
  
  for (const line of lines) {
    const match = line.match(lineItemRegex);
    if (match && match[1] && match[2]) {
      items.push({
        description: match[1].trim(),
        amount: match[2].trim()
      });
    }
  }
  
  return items;
}