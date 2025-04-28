# OCR Module

This module provides a robust, optimized OCR (Optical Character Recognition) system for processing receipts and other documents. It's designed to address performance bottlenecks and provide a more reliable OCR experience.

## Features

- **Multiple OCR Providers**: Support for various OCR providers (Tesseract, OCR.space, Google Vision, Azure Cognitive Services)
- **Fallback Mechanism**: Automatically tries alternative providers if the primary one fails
- **Parallel Processing**: Process multiple images concurrently for faster batch processing
- **Image Preprocessing**: Enhance image quality before OCR processing
- **Result Caching**: Cache OCR results to avoid redundant processing
- **Structured Data Extraction**: Extract structured data from receipts (vendor, date, total, items, etc.)
- **Background Processing**: Process OCR tasks in the background with progress tracking

## Architecture

The OCR module is designed with a modular architecture:

```
server/util/ocr/
├── index.ts                # Main entry point
├── config.ts               # Configuration
├── ocr-service.ts          # OCR service
├── image-preprocessor.ts   # Image preprocessing utilities
├── types.ts                # Type definitions
├── providers/              # OCR providers
│   ├── index.ts            # Providers entry point
│   ├── ocr-space.provider.ts    # OCR.space provider
│   ├── tesseract.provider.ts    # Tesseract provider
│   ├── google-vision.provider.ts # Google Vision provider
│   └── azure-cognitive.provider.ts # Azure Cognitive Services provider
└── test-ocr.ts             # Test script
```

## Usage

### Basic Usage

```typescript
import { createOcrServiceFromEnv } from './server/util/ocr';

// Create OCR service with default configuration
const ocrService = createOcrServiceFromEnv();

// Process a single receipt
const result = await ocrService.processReceipt('path/to/receipt.jpg', userId);

console.log('Vendor:', result.vendor);
console.log('Date:', result.date);
console.log('Total:', result.total);
console.log('Items:', result.items);
```

### Custom Configuration

```typescript
import { createOcrServiceFromEnv } from './server/util/ocr';

// Create OCR service with custom configuration
const ocrService = createOcrServiceFromEnv({
  defaultProvider: 'google-vision',
  preprocessing: {
    enabled: true,
    grayscale: true,
    contrast: 1.5
  },
  parallelProcessing: {
    enabled: true,
    maxConcurrent: 5
  }
});

// Process multiple receipts in batch
const taskId = await ocrService.processBatch(
  ['receipt1.jpg', 'receipt2.jpg', 'receipt3.jpg'],
  userId
);

// Get task status
const taskStatus = await getOcrTaskStatus(taskId, userId);
```

## Configuration

The OCR module can be configured through environment variables:

| Environment Variable | Description | Default |
|----------------------|-------------|---------|
| OCR_DEFAULT_PROVIDER | Default OCR provider | tesseract |
| OCR_SPACE_API_KEY | OCR.space API key | |
| OCR_SPACE_API_ENDPOINT | OCR.space API endpoint | https://api.ocr.space/parse/image |
| TESSERACT_EXEC_PATH | Path to Tesseract executable | tesseract |
| TESSERACT_DATA_PATH | Path to Tesseract data | |
| GOOGLE_VISION_API_KEY | Google Vision API key | |
| GOOGLE_VISION_PROJECT_ID | Google Vision project ID | |
| AZURE_COGNITIVE_API_KEY | Azure Cognitive Services API key | |
| AZURE_COGNITIVE_ENDPOINT | Azure Cognitive Services endpoint | |
| OCR_PREPROCESSING_ENABLED | Enable image preprocessing | true |
| OCR_CACHING_ENABLED | Enable result caching | true |
| OCR_CACHING_TTL | Cache TTL in seconds | 3600 |
| OCR_FALLBACK_ENABLED | Enable fallback to other providers | true |
| OCR_FALLBACK_PROVIDER_ORDER | Comma-separated list of fallback providers | tesseract,ocr-space,google-vision,azure-cognitive |
| OCR_PARALLEL_PROCESSING_ENABLED | Enable parallel processing | true |
| OCR_PARALLEL_PROCESSING_MAX_CONCURRENT | Maximum concurrent processes | 3 |

## Testing

A test script is provided to demonstrate the OCR system:

```bash
# Process a receipt with Tesseract
ts-node server/util/ocr/test-ocr.ts path/to/receipt.jpg tesseract

# Process a receipt with OCR.space
ts-node server/util/ocr/test-ocr.ts path/to/receipt.jpg ocr-space
```

## Error Handling

The OCR module includes robust error handling:

- Validation errors for invalid inputs
- External service errors for provider failures
- Fallback mechanism for provider failures
- Detailed error messages and logging

## Performance Considerations

- Use parallel processing for batch uploads
- Enable caching to avoid redundant processing
- Use image preprocessing to improve OCR accuracy
- Configure fallback providers for reliability