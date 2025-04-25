"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processReceiptWithOcr = void 0;

// Import Google Cloud Vision API
const vision = require('@google-cloud/vision');

// Create a client for Google Cloud Vision API
const createVisionClient = () => {
    // Check if credentials are provided as environment variables
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
        // Create credentials from JSON string
        const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
        return new vision.ImageAnnotatorClient({ credentials });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Use credentials file path
        return new vision.ImageAnnotatorClient();
    } else {
        throw new Error('Google Cloud Vision API credentials not configured');
    }
};

/**
 * Process receipt with OCR using Google Cloud Vision API
 * @param {Buffer} fileBuffer - The file buffer of the receipt image
 * @param {string} mimeType - The MIME type of the file
 * @returns {Promise<Object>} - The extracted receipt data
 */
async function processReceiptWithOcr(fileBuffer, mimeType) {
    try {
        console.log("[OCR] Processing receipt with Google Cloud Vision API");
        
        // Create a client
        const client = createVisionClient();
        
        // Perform text detection on the image
        const [result] = await client.textDetection(fileBuffer);
        const detections = result.textAnnotations;
        
        if (!detections || detections.length === 0) {
            console.log("[OCR] No text detected in the image");
            return {
                success: false,
                error: "No text detected in the image"
            };
        }
        
        // The first annotation contains the entire text
        const fullText = detections[0].description;
        console.log("[OCR] Full text detected:", fullText);
        
        // Extract relevant information from the text
        const extractedData = extractReceiptData(fullText);
        
        return {
            success: true,
            text: fullText,
            ...extractedData
        };
    } catch (error) {
        console.error("[OCR] Error processing receipt with OCR:", error);
        return {
            success: false,
            error: error.message || "Failed to process receipt with OCR"
        };
    }
}
exports.processReceiptWithOcr = processReceiptWithOcr;

/**
 * Extract structured data from receipt text
 * @param {string} text - The full text from the receipt
 * @returns {Object} - The extracted data
 */
function extractReceiptData(text) {
    // Split text into lines
    const lines = text.split('\n');
    
    // Initialize extracted data
    const data = {
        vendor: "",
        date: "",
        total: "",
        items: [],
        tax: "",
        currency: "USD" // Default currency
    };
    
    // Extract vendor (usually the first line or two)
    data.vendor = lines[0].trim();
    
    // Extract date
    const dateRegex = /(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})|(\d{2,4}[\/\.-]\d{1,2}[\/\.-]\d{1,2})/;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
        data.date = dateMatch[0];
        
        // Try to convert to YYYY-MM-DD format
        try {
            const dateParts = dateMatch[0].split(/[\/\.-]/);
            if (dateParts.length === 3) {
                // Determine date format
                let year, month, day;
                
                // If the first part is 4 digits, assume YYYY-MM-DD
                if (dateParts[0].length === 4) {
                    year = dateParts[0];
                    month = dateParts[1].padStart(2, '0');
                    day = dateParts[2].padStart(2, '0');
                } 
                // If the last part is 4 digits, assume MM-DD-YYYY
                else if (dateParts[2].length === 4) {
                    year = dateParts[2];
                    month = dateParts[0].padStart(2, '0');
                    day = dateParts[1].padStart(2, '0');
                }
                // Otherwise, assume MM-DD-YY and convert to YYYY
                else {
                    year = dateParts[2].length === 2 ? `20${dateParts[2]}` : dateParts[2];
                    month = dateParts[0].padStart(2, '0');
                    day = dateParts[1].padStart(2, '0');
                }
                
                data.date = `${year}-${month}-${day}`;
            }
        } catch (error) {
            console.error("[OCR] Error formatting date:", error);
            // Keep the original date format if conversion fails
        }
    } else {
        // Default to today's date if no date found
        const today = new Date();
        data.date = today.toISOString().split('T')[0];
    }
    
    // Extract total amount
    const totalRegex = /total[:\s]*[$€£]?(\d+[.,]\d+)/i;
    const totalMatch = text.match(totalRegex);
    if (totalMatch) {
        data.total = totalMatch[1].replace(',', '.');
    } else {
        // Try alternative patterns
        const altTotalRegex = /[$€£]?(\d+[.,]\d+)[\s]*total/i;
        const altTotalMatch = text.match(altTotalRegex);
        if (altTotalMatch) {
            data.total = altTotalMatch[1].replace(',', '.');
        } else {
            // Look for any currency amount that might be the total
            const currencyRegex = /[$€£](\d+[.,]\d+)/g;
            const currencyMatches = [...text.matchAll(currencyRegex)];
            if (currencyMatches.length > 0) {
                // Assume the largest amount is the total
                let largestAmount = 0;
                currencyMatches.forEach(match => {
                    const amount = parseFloat(match[1].replace(',', '.'));
                    if (amount > largestAmount) {
                        largestAmount = amount;
                        data.total = match[1].replace(',', '.');
                    }
                });
            }
        }
    }
    
    // Extract tax
    const taxRegex = /tax[:\s]*[$€£]?(\d+[.,]\d+)/i;
    const taxMatch = text.match(taxRegex);
    if (taxMatch) {
        data.tax = taxMatch[1].replace(',', '.');
    }
    
    // Determine currency
    if (text.includes('$')) {
        data.currency = 'USD';
    } else if (text.includes('€')) {
        data.currency = 'EUR';
    } else if (text.includes('£')) {
        data.currency = 'GBP';
    }
    
    // Extract items (this is more complex and may require more sophisticated parsing)
    // For now, we'll just look for lines that might be items
    const itemRegex = /(\d+)\s+x\s+(.*?)\s+[$€£]?(\d+[.,]\d+)/g;
    const itemMatches = [...text.matchAll(itemRegex)];
    if (itemMatches.length > 0) {
        itemMatches.forEach(match => {
            data.items.push({
                quantity: match[1],
                description: match[2].trim(),
                amount: match[3].replace(',', '.')
            });
        });
    } else {
        // Try a simpler approach - look for lines with amounts
        const simpleItemRegex = /(.*?)\s+[$€£]?(\d+[.,]\d+)/g;
        const simpleItemMatches = [...text.matchAll(simpleItemRegex)];
        if (simpleItemMatches.length > 0) {
            simpleItemMatches.forEach(match => {
                const description = match[1].trim();
                // Skip if this looks like a total or tax line
                if (!description.toLowerCase().includes('total') && 
                    !description.toLowerCase().includes('tax') &&
                    !description.toLowerCase().includes('subtotal')) {
                    data.items.push({
                        description: description,
                        amount: match[2].replace(',', '.')
                    });
                }
            });
        }
    }
    
    return data;
}