import path from "path";
import fs from "fs";
import fetch from "node-fetch"; // Using node-fetch

// --- Constants and Types ---
export type OcrProvider = "gemini" | "openai" | "claude" | "openrouter"; // Export type
export type OcrTemplate = "general" | "travel" | "odometer"; // Export type

interface OcrResult {
  success: boolean;
  text?: string; // Raw text response from API
  extractedData?: Record<string, any>; // Parsed JSON data
  error?: string;
  pdfMessage?: string; // Specific message for PDF handling issues
}

interface OdometerResult {
    success: boolean;
    reading?: number;
    error?: string;
}

// --- API Response Interfaces ---
interface GeminiResponse { candidates?: Array<{ content?: { parts?: Array<{ text?: string; }>; }; }>; }
interface OpenAIResponse { choices?: Array<{ message?: { content?: string; }; }>; }
interface ClaudeResponse { content?: Array<{ text?: string; }>; } // Simplified Claude response
interface OpenRouterResponse { choices?: Array<{ message?: { content?: string; }; }>; }


// --- Prompts ---
// Prompts instruct the AI to return ONLY JSON for easier parsing.
const PROMPTS: Record<OcrTemplate, string> = {
    odometer: "This is an image of a car's odometer. Extract ONLY the numerical reading displayed. Ignore any other text or symbols (like 'km', 'miles', 'trip'). Return ONLY a valid JSON object with a single key 'reading' containing the number as a string (e.g., {\"reading\": \"123456.7\"}).",
    travel: "You are an AI specialized in extracting data from travel expense receipts (image or PDF). Extract the following REQUIRED fields: Transaction Date (date as string 'YYYY-MM-DD' if possible, otherwise original format), Cost/Amount (cost as a number), Currency Code (currency as a 3-letter string like 'USD', 'EUR', 'CAD'), a concise Description/Purpose (description as string), Expense Type (type as string, e.g., Food, Transportation), Vendor Name (vendor as string), and Location (location as string). Return ONLY a valid JSON object containing ALL these fields: date, cost, currency, description, type, vendor, location. Example: {\"date\": \"2024-03-15\", \"cost\": 45.50, \"currency\": \"USD\", \"description\": \"Taxi fare\", \"type\": \"Transportation\", \"vendor\": \"City Cabs\", \"location\": \"New York, NY\"}",
    general: "You are an AI specialized in reading and extracting data from general receipts (image or PDF). Analyze to identify: date, vendor/business name (vendor), location, individual items purchased with prices (items array with name and price), subtotal, tax, total amount (total), and payment method (paymentMethod). Return ONLY a structured JSON object with these fields."
};

// --- API Call Logic ---

// Helper to get API key from environment variables
function getApiKey(provider: OcrProvider): string {
    const envVarName = `${provider.toUpperCase()}_API_KEY`;
    const apiKey = process.env[envVarName];
    if (!apiKey) throw new Error(`${provider} API key not configured in environment variables.`);
    console.log(`Using ${provider} API key.`);
    return apiKey;
}

// Helper to get MIME type from file path
// function getMimeType(filePath: string): string { ... } // No longer needed here

// Central function to call different Vision APIs using buffer and mimeType
async function callVisionAPI(provider: OcrProvider, fileBuffer: Buffer, mimeType: string, template: OcrTemplate): Promise<string> {
    const apiKey = getApiKey(provider);
    // const fileData = fs.readFileSync(filePath); // Read from buffer instead
    const base64Data = fileBuffer.toString("base64");
    // const mimeType = getMimeType(filePath); // Passed as argument
    const prompt = PROMPTS[template];

    let requestBody: any;
    let apiUrl: string;
    let headers: any = { "Content-Type": "application/json" };
    let model: string;

    console.log(`Calling ${provider} API for ${template} template.`);

    switch (provider) {
        case "gemini":
            apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            model = "gemini-1.5-flash"; // Model used
            requestBody = {
                contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64Data } }] }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 2048, response_mime_type: "application/json" }
            };
            break;
        case "openai":
            apiUrl = "https://api.openai.com/v1/chat/completions";
            model = "gpt-4o"; // Model used
            headers["Authorization"] = `Bearer ${apiKey}`;
            requestBody = {
                model: model,
                messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }] }],
                max_tokens: 2000,
                response_format: { type: "json_object" }
            };
            break;
        case "claude":
            apiUrl = "https://api.anthropic.com/v1/messages";
            model = "claude-3-haiku-20240307"; // Model used
            headers = { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" };
            requestBody = {
                model: model,
                max_tokens: 2000,
                system: "You are an AI assistant specialized in extracting and structuring data from receipts. Return ONLY a valid JSON object.",
                messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image", source: { type: "base64", media_type: mimeType, data: base64Data } }] }]
            };
            break;
        case "openrouter":
             apiUrl = "https://openrouter.ai/api/v1/chat/completions";
             model = "anthropic/claude-3-haiku"; // Model used via OpenRouter
             headers = { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}`, "HTTP-Referer": "https://expense-tracker-app.com" }; // Add Referer if needed
             requestBody = {
                 model: model,
                 messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }] }],
                 response_format: { type: "json_object" } // Request JSON
             };
             break;
        default:
            throw new Error(`Unsupported OCR provider: ${provider}`);
    }

    const response = await fetch(apiUrl, { method: "POST", headers, body: JSON.stringify(requestBody) });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`${provider} API Error Response (${response.status}):`, errorText);
        throw new Error(`${provider} API error (${response.status})`); // Avoid leaking full error text potentially
    }

    const data: any = await response.json(); // Keep as any initially

    // Extract content based on provider's response structure
    let content: string | undefined;
    switch (provider) {
        case "gemini":
            content = (data as GeminiResponse)?.candidates?.[0]?.content?.parts?.[0]?.text;
            break;
        case "openai":
            content = (data as OpenAIResponse)?.choices?.[0]?.message?.content;
            break;
        case "claude":
            content = (data as ClaudeResponse)?.content?.[0]?.text;
            break;
        case "openrouter":
            content = (data as OpenRouterResponse)?.choices?.[0]?.message?.content;
            break;
    }

    if (typeof content !== 'string') throw new Error(`Unexpected or missing content in response from ${provider} API`);
    console.log(`${provider} API raw response content received.`);
    return content;
}

// --- Data Extraction Logic ---

// Simplified extraction, assuming AI returns valid JSON as requested by prompts
function extractStructuredData(apiResponseText: string): Record<string, any> | null {
    try {
        // Remove potential markdown fences and trim
        const jsonText = apiResponseText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();
        // Attempt to parse the cleaned text as JSON
        const parsedData = JSON.parse(jsonText);
        console.log("Successfully parsed JSON data from API response.");
        // Basic validation: ensure it's an object
        if (typeof parsedData === 'object' && parsedData !== null) {
            return parsedData;
        }
        console.warn("Parsed data is not a valid object:", parsedData);
        return null;
    } catch (error) {
        console.error("Failed to parse JSON from API response:", error);
        console.log("Raw API Response Text (first 500 chars):", apiResponseText.substring(0, 500)); // Log raw text for debugging
        return null; // Return null if parsing fails
    }
}

// --- Main Processing Functions ---

export async function processReceiptWithOCR(fileBuffer: Buffer, mimeType: string, method: OcrProvider = "gemini", template: OcrTemplate = "general"): Promise<OcrResult> {
    try {
        // if (!fs.existsSync(filePath)) return { success: false, error: "Receipt file not found" }; // Check buffer validity if needed
        console.log(`Processing receipt buffer (${mimeType}) with ${method} using template: ${template}`);

        const rawResultText = await callVisionAPI(method, fileBuffer, mimeType, template);
        const extractedData = extractStructuredData(rawResultText);

        if (extractedData) {
            return { success: true, text: rawResultText, extractedData };
        } else {
            // If JSON parsing failed, return success=false but include raw text for debugging
            return { success: false, text: rawResultText, error: "Failed to extract structured JSON data from the API response." };
        }
    } catch (error) {
        console.error(`OCR processing error (${method}):`, error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown OCR processing error" };
    }
}

export async function processOdometerImageWithAI(fileBuffer: Buffer, mimeType: string, method: OcrProvider = "gemini"): Promise<OdometerResult> {
    try {
        // if (!fs.existsSync(filePath)) return { success: false, error: "Odometer image file not found" };
        console.log(`Processing odometer image buffer (${mimeType}) with ${method}`);

        const rawResultText = await callVisionAPI(method, fileBuffer, mimeType, "odometer");
        console.log(`AI raw output for odometer: ${rawResultText}`);

        // Attempt to parse JSON first (as requested in the prompt)
        const jsonData = extractStructuredData(rawResultText);
        let readingStr = jsonData?.reading; // Directly access the 'reading' key

        // If JSON parsing failed or didn't yield reading, try extracting number from raw text as fallback
        if (readingStr === undefined || readingStr === null) {
            console.log("No JSON reading found or parsing failed, attempting regex on raw text:", rawResultText);
            // Regex to find numbers (potentially with decimals) in the raw text
            const numberMatch = rawResultText.match(/[0-9]+(?:[.,][0-9]+)?/);
            readingStr = numberMatch ? numberMatch[0].replace(',', '.') : null; // Use first match, replace comma decimal separator
        }

        if (readingStr === null || readingStr === undefined) {
             console.warn("Could not find any numerical reading in the response.");
             return { success: false, error: "Could not extract any numerical reading." };
        }

        // Clean and parse the reading string
        const cleanedText = String(readingStr).replace(/[^0-9.]/g, ''); // Keep only digits and dot
        const parts = cleanedText.split('.');
        const finalCleanedText = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('')}` : parts[0]; // Handle multiple dots if any
        const reading = parseFloat(finalCleanedText);

        if (isNaN(reading)) {
            console.warn("Could not parse a valid number from extracted text:", finalCleanedText);
            return { success: false, error: "Could not parse a valid odometer reading from extracted text." };
        }

        console.log(`Extracted odometer reading via AI: ${reading}`);
        return { success: true, reading };

    } catch (error) {
        console.error(`Odometer AI processing error (${method}):`, error);
        return { success: false, error: error instanceof Error ? error.message : `AI OCR (${method}) failed` };
    }
}


// --- OCR Testing ---

// Helper to test a specific provider's API key
async function testProviderAPI(provider: OcrProvider, apiKey: string): Promise<void> {
    console.log(`Testing ${provider} API key...`);
    try {
        let testUrl: string;
        let headers: any = {};

        switch (provider) {
            case "openai":
                testUrl = "https://api.openai.com/v1/models";
                headers["Authorization"] = `Bearer ${apiKey}`;
                break;
            case "gemini":
                testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
                break;
            case "claude":
                // Claude doesn't have a simple list models endpoint easily usable like others.
                // We'll attempt a minimal message creation instead.
                const Anthropic = require('@anthropic-ai/sdk');
                const anthropic = new Anthropic({ apiKey: apiKey });
                await anthropic.messages.create({ model: "claude-3-haiku-20240307", max_tokens: 1, messages: [{ role: "user", content: "test" }] });
                console.log("Claude API test successful (minimal message sent).");
                return; // Exit early as the test was successful
            case "openrouter":
                 testUrl = "https://openrouter.ai/api/v1/models";
                 headers = { "Authorization": `Bearer ${apiKey}`, "HTTP-Referer": "https://expense-tracker-app.com" };
                 break;
            default:
                throw new Error(`Unsupported OCR provider for testing: ${provider}`);
        }

        // For non-Claude providers, make the test request
        const response = await fetch(testUrl, { headers });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`${provider} API Test Error (${response.status}):`, errorText);
            throw new Error(`${provider} API key seems invalid or API error (${response.status})`);
        }
        console.log(`${provider} API key test successful.`);

    } catch (error) {
        console.error(`Error testing ${provider} API:`, error);
        // Re-throw a more user-friendly error
        throw new Error(`Invalid ${provider} API key or API error during test.`);
    }
}

// Main function to test OCR configuration
export async function testOCR(method: OcrProvider, apiKey?: string): Promise<{ success: boolean, message: string }> {
    try {
        if (!apiKey) throw new Error(`API key is required for testing ${method}`);
        await testProviderAPI(method, apiKey);
        return { success: true, message: `${method} API key appears valid.` };
    } catch (error) {
        console.error("OCR test error:", error);
        // Provide the specific error message from testProviderAPI
        return { success: false, message: error instanceof Error ? error.message : "Unknown error occurred during OCR test." };
    }
}
