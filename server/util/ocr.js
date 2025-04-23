"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processReceiptWithOCR = processReceiptWithOCR;
exports.processOdometerImageWithAI = processOdometerImageWithAI;
exports.testOCR = testOCR;
var node_fetch_1 = require("node-fetch"); // Using node-fetch
// --- Prompts ---
// Prompts instruct the AI to return ONLY JSON for easier parsing.
var PROMPTS = {
    odometer: "This is an image of a car's odometer. Extract ONLY the numerical reading displayed. Ignore any other text or symbols (like 'km', 'miles', 'trip'). Return ONLY a valid JSON object with a single key 'reading' containing the number as a string (e.g., {\"reading\": \"123456.7\"}).",
    travel: "You are an AI specialized in extracting data from travel expense receipts (image or PDF). Extract the following REQUIRED fields: Transaction Date (date as string 'YYYY-MM-DD' if possible, otherwise original format), Cost/Amount (cost as a number), Currency Code (currency as a 3-letter string like 'USD', 'EUR', 'CAD'), a concise Description/Purpose (description as string), Expense Type (type as string, e.g., Food, Transportation), Vendor Name (vendor as string), and Location (location as string). Return ONLY a valid JSON object containing ALL these fields: date, cost, currency, description, type, vendor, location. Example: {\"date\": \"2024-03-15\", \"cost\": 45.50, \"currency\": \"USD\", \"description\": \"Taxi fare\", \"type\": \"Transportation\", \"vendor\": \"City Cabs\", \"location\": \"New York, NY\"}",
    general: "You are an AI specialized in reading and extracting data from general receipts (image or PDF). Analyze to identify: date, vendor/business name (vendor), location, individual items purchased with prices (items array with name and price), subtotal, tax, total amount (total), and payment method (paymentMethod). Return ONLY a structured JSON object with these fields."
};
// --- API Call Logic ---
// Helper to get API key from environment variables
function getApiKey(provider) {
    var envVarName = "".concat(provider.toUpperCase(), "_API_KEY");
    var apiKey = process.env[envVarName];
    if (!apiKey)
        throw new Error("".concat(provider, " API key not configured in environment variables."));
    console.log("Using ".concat(provider, " API key."));
    return apiKey;
}
// Helper to get MIME type from file path
// function getMimeType(filePath: string): string { ... } // No longer needed here
// Central function to call different Vision APIs using buffer and mimeType
function callVisionAPI(provider, fileBuffer, mimeType, template) {
    return __awaiter(this, void 0, void 0, function () {
        var apiKey, base64Data, prompt, requestBody, apiUrl, headers, model, response, errorText, data, content;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        return __generator(this, function (_p) {
            switch (_p.label) {
                case 0:
                    apiKey = getApiKey(provider);
                    base64Data = fileBuffer.toString("base64");
                    prompt = PROMPTS[template];
                    headers = { "Content-Type": "application/json" };
                    console.log("Calling ".concat(provider, " API for ").concat(template, " template."));
                    switch (provider) {
                        case "gemini":
                            apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=".concat(apiKey);
                            model = "gemini-1.5-flash"; // Model used
                            requestBody = {
                                contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64Data } }] }],
                                generationConfig: { temperature: 0.1, maxOutputTokens: 2048, response_mime_type: "application/json" }
                            };
                            break;
                        case "openai":
                            apiUrl = "https://api.openai.com/v1/chat/completions";
                            model = "gpt-4o"; // Model used
                            headers["Authorization"] = "Bearer ".concat(apiKey);
                            requestBody = {
                                model: model,
                                messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: "data:".concat(mimeType, ";base64,").concat(base64Data) } }] }],
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
                            headers = { "Content-Type": "application/json", "Authorization": "Bearer ".concat(apiKey), "HTTP-Referer": "https://expense-tracker-app.com" }; // Add Referer if needed
                            requestBody = {
                                model: model,
                                messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: "data:".concat(mimeType, ";base64,").concat(base64Data) } }] }],
                                response_format: { type: "json_object" } // Request JSON
                            };
                            break;
                        default:
                            throw new Error("Unsupported OCR provider: ".concat(provider));
                    }
                    return [4 /*yield*/, (0, node_fetch_1.default)(apiUrl, { method: "POST", headers: headers, body: JSON.stringify(requestBody) })];
                case 1:
                    response = _p.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.text()];
                case 2:
                    errorText = _p.sent();
                    console.error("".concat(provider, " API Error Response (").concat(response.status, "):"), errorText);
                    throw new Error("".concat(provider, " API error (").concat(response.status, ")")); // Avoid leaking full error text potentially
                case 3: return [4 /*yield*/, response.json()];
                case 4:
                    data = _p.sent();
                    switch (provider) {
                        case "gemini":
                            content = (_e = (_d = (_c = (_b = (_a = data === null || data === void 0 ? void 0 : data.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text;
                            break;
                        case "openai":
                            content = (_h = (_g = (_f = data === null || data === void 0 ? void 0 : data.choices) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.message) === null || _h === void 0 ? void 0 : _h.content;
                            break;
                        case "claude":
                            content = (_k = (_j = data === null || data === void 0 ? void 0 : data.content) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.text;
                            break;
                        case "openrouter":
                            content = (_o = (_m = (_l = data === null || data === void 0 ? void 0 : data.choices) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.message) === null || _o === void 0 ? void 0 : _o.content;
                            break;
                    }
                    if (typeof content !== 'string')
                        throw new Error("Unexpected or missing content in response from ".concat(provider, " API"));
                    console.log("".concat(provider, " API raw response content received."));
                    return [2 /*return*/, content];
            }
        });
    });
}
// --- Data Extraction Logic ---
// Simplified extraction, assuming AI returns valid JSON as requested by prompts
function extractStructuredData(apiResponseText) {
    try {
        // Remove potential markdown fences and trim
        var jsonText = apiResponseText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();
        // Attempt to parse the cleaned text as JSON
        var parsedData = JSON.parse(jsonText);
        console.log("Successfully parsed JSON data from API response.");
        // Basic validation: ensure it's an object
        if (typeof parsedData === 'object' && parsedData !== null) {
            return parsedData;
        }
        console.warn("Parsed data is not a valid object:", parsedData);
        return null;
    }
    catch (error) {
        console.error("Failed to parse JSON from API response:", error);
        console.log("Raw API Response Text (first 500 chars):", apiResponseText.substring(0, 500)); // Log raw text for debugging
        return null; // Return null if parsing fails
    }
}
// --- Main Processing Functions ---
function processReceiptWithOCR(fileBuffer_1, mimeType_1) {
    return __awaiter(this, arguments, void 0, function (fileBuffer, mimeType, method, template) {
        var rawResultText, extractedData, error_1;
        if (method === void 0) { method = "gemini"; }
        if (template === void 0) { template = "general"; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    // if (!fs.existsSync(filePath)) return { success: false, error: "Receipt file not found" }; // Check buffer validity if needed
                    console.log("Processing receipt buffer (".concat(mimeType, ") with ").concat(method, " using template: ").concat(template));
                    return [4 /*yield*/, callVisionAPI(method, fileBuffer, mimeType, template)];
                case 1:
                    rawResultText = _a.sent();
                    extractedData = extractStructuredData(rawResultText);
                    if (extractedData) {
                        return [2 /*return*/, { success: true, text: rawResultText, extractedData: extractedData }];
                    }
                    else {
                        // If JSON parsing failed, return success=false but include raw text for debugging
                        return [2 /*return*/, { success: false, text: rawResultText, error: "Failed to extract structured JSON data from the API response." }];
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error("OCR processing error (".concat(method, "):"), error_1);
                    return [2 /*return*/, { success: false, error: error_1 instanceof Error ? error_1.message : "Unknown OCR processing error" }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function processOdometerImageWithAI(fileBuffer_1, mimeType_1) {
    return __awaiter(this, arguments, void 0, function (fileBuffer, mimeType, method) {
        var rawResultText, jsonData, readingStr, numberMatch, cleanedText, parts, finalCleanedText, reading, error_2;
        if (method === void 0) { method = "gemini"; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    // if (!fs.existsSync(filePath)) return { success: false, error: "Odometer image file not found" };
                    console.log("Processing odometer image buffer (".concat(mimeType, ") with ").concat(method));
                    return [4 /*yield*/, callVisionAPI(method, fileBuffer, mimeType, "odometer")];
                case 1:
                    rawResultText = _a.sent();
                    console.log("AI raw output for odometer: ".concat(rawResultText));
                    jsonData = extractStructuredData(rawResultText);
                    readingStr = jsonData === null || jsonData === void 0 ? void 0 : jsonData.reading;
                    // If JSON parsing failed or didn't yield reading, try extracting number from raw text as fallback
                    if (readingStr === undefined || readingStr === null) {
                        console.log("No JSON reading found or parsing failed, attempting regex on raw text:", rawResultText);
                        numberMatch = rawResultText.match(/[0-9]+(?:[.,][0-9]+)?/);
                        readingStr = numberMatch ? numberMatch[0].replace(',', '.') : null; // Use first match, replace comma decimal separator
                    }
                    if (readingStr === null || readingStr === undefined) {
                        console.warn("Could not find any numerical reading in the response.");
                        return [2 /*return*/, { success: false, error: "Could not extract any numerical reading." }];
                    }
                    cleanedText = String(readingStr).replace(/[^0-9.]/g, '');
                    parts = cleanedText.split('.');
                    finalCleanedText = parts.length > 1 ? "".concat(parts[0], ".").concat(parts.slice(1).join('')) : parts[0];
                    reading = parseFloat(finalCleanedText);
                    if (isNaN(reading)) {
                        console.warn("Could not parse a valid number from extracted text:", finalCleanedText);
                        return [2 /*return*/, { success: false, error: "Could not parse a valid odometer reading from extracted text." }];
                    }
                    console.log("Extracted odometer reading via AI: ".concat(reading));
                    return [2 /*return*/, { success: true, reading: reading }];
                case 2:
                    error_2 = _a.sent();
                    console.error("Odometer AI processing error (".concat(method, "):"), error_2);
                    return [2 /*return*/, { success: false, error: error_2 instanceof Error ? error_2.message : "AI OCR (".concat(method, ") failed") }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// --- OCR Testing ---
// Helper to test a specific provider's API key
function testProviderAPI(provider, apiKey) {
    return __awaiter(this, void 0, void 0, function () {
        var testUrl, headers, _a, Anthropic, anthropic, response, errorText, error_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("Testing ".concat(provider, " API key..."));
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 12, , 13]);
                    testUrl = void 0;
                    headers = {};
                    _a = provider;
                    switch (_a) {
                        case "openai": return [3 /*break*/, 2];
                        case "gemini": return [3 /*break*/, 3];
                        case "claude": return [3 /*break*/, 4];
                        case "openrouter": return [3 /*break*/, 6];
                    }
                    return [3 /*break*/, 7];
                case 2:
                    testUrl = "https://api.openai.com/v1/models";
                    headers["Authorization"] = "Bearer ".concat(apiKey);
                    return [3 /*break*/, 8];
                case 3:
                    testUrl = "https://generativelanguage.googleapis.com/v1beta/models?key=".concat(apiKey);
                    return [3 /*break*/, 8];
                case 4:
                    Anthropic = require('@anthropic-ai/sdk');
                    anthropic = new Anthropic({ apiKey: apiKey });
                    return [4 /*yield*/, anthropic.messages.create({ model: "claude-3-haiku-20240307", max_tokens: 1, messages: [{ role: "user", content: "test" }] })];
                case 5:
                    _b.sent();
                    console.log("Claude API test successful (minimal message sent).");
                    return [2 /*return*/]; // Exit early as the test was successful
                case 6:
                    testUrl = "https://openrouter.ai/api/v1/models";
                    headers = { "Authorization": "Bearer ".concat(apiKey), "HTTP-Referer": "https://expense-tracker-app.com" };
                    return [3 /*break*/, 8];
                case 7: throw new Error("Unsupported OCR provider for testing: ".concat(provider));
                case 8: return [4 /*yield*/, (0, node_fetch_1.default)(testUrl, { headers: headers })];
                case 9:
                    response = _b.sent();
                    if (!!response.ok) return [3 /*break*/, 11];
                    return [4 /*yield*/, response.text()];
                case 10:
                    errorText = _b.sent();
                    console.error("".concat(provider, " API Test Error (").concat(response.status, "):"), errorText);
                    throw new Error("".concat(provider, " API key seems invalid or API error (").concat(response.status, ")"));
                case 11:
                    console.log("".concat(provider, " API key test successful."));
                    return [3 /*break*/, 13];
                case 12:
                    error_3 = _b.sent();
                    console.error("Error testing ".concat(provider, " API:"), error_3);
                    // Re-throw a more user-friendly error
                    throw new Error("Invalid ".concat(provider, " API key or API error during test."));
                case 13: return [2 /*return*/];
            }
        });
    });
}
// Main function to test OCR configuration
function testOCR(method, apiKey) {
    return __awaiter(this, void 0, void 0, function () {
        var error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    if (!apiKey)
                        throw new Error("API key is required for testing ".concat(method));
                    return [4 /*yield*/, testProviderAPI(method, apiKey)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { success: true, message: "".concat(method, " API key appears valid.") }];
                case 2:
                    error_4 = _a.sent();
                    console.error("OCR test error:", error_4);
                    // Provide the specific error message from testProviderAPI
                    return [2 /*return*/, { success: false, message: error_4 instanceof Error ? error_4.message : "Unknown error occurred during OCR test." }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
