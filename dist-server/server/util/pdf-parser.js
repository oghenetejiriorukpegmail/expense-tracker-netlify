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
import * as fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
// We'll use PDF.js for text extraction
var pdfjs = null;
// Helper function to load PDF.js only when needed
function loadPdfJs() {
    return __awaiter(this, void 0, void 0, function () {
        var pdfjsLib, nodeCanvasFactory, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!pdfjs) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, import('pdfjs-dist')];
                case 2:
                    pdfjsLib = _a.sent();
                    // In Node.js environment, we need to set the worker
                    if (typeof window === 'undefined') {
                        // For Node.js environment: disable worker
                        pdfjsLib.GlobalWorkerOptions.workerSrc = '';
                        nodeCanvasFactory = {
                            create: function (width, height) {
                                return {
                                    width: width,
                                    height: height,
                                    canvas: { width: width, height: height },
                                    context: {
                                        // Stub context for Node environment
                                        drawImage: function () { },
                                        fillRect: function () { },
                                        fillText: function () { },
                                        save: function () { },
                                        restore: function () { },
                                        scale: function () { },
                                        transform: function () { },
                                        beginPath: function () { },
                                        rect: function () { },
                                        fill: function () { },
                                        stroke: function () { },
                                        closePath: function () { },
                                    }
                                };
                            },
                            reset: function () { },
                            destroy: function () { }
                        };
                        // Use our minimal factory
                        pdfjsLib.CanvasFactory = nodeCanvasFactory;
                    }
                    pdfjs = pdfjsLib;
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("Failed to load PDF.js:", error_1);
                    pdfjs = null;
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, pdfjs];
            }
        });
    });
}
/**
 * Parse PDF using PDF.js
 */
function parsePdfWithPdfJs(dataBuffer) {
    return __awaiter(this, void 0, void 0, function () {
        var pdfjsLib, loadingTask, pdfDocument, fullText, i, page, textContent, lastY, text, _i, _a, item, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 8, , 9]);
                    return [4 /*yield*/, loadPdfJs()];
                case 1:
                    pdfjsLib = _b.sent();
                    if (!pdfjsLib) {
                        throw new Error("PDF.js library not available");
                    }
                    loadingTask = pdfjsLib.getDocument({ data: dataBuffer });
                    return [4 /*yield*/, loadingTask.promise];
                case 2:
                    pdfDocument = _b.sent();
                    fullText = '';
                    i = 1;
                    _b.label = 3;
                case 3:
                    if (!(i <= pdfDocument.numPages)) return [3 /*break*/, 7];
                    return [4 /*yield*/, pdfDocument.getPage(i)];
                case 4:
                    page = _b.sent();
                    return [4 /*yield*/, page.getTextContent()];
                case 5:
                    textContent = _b.sent();
                    lastY = void 0, text = "";
                    for (_i = 0, _a = textContent.items; _i < _a.length; _i++) {
                        item = _a[_i];
                        if (item.str) {
                            if (lastY == item.transform[5] || !lastY) {
                                text += item.str;
                            }
                            else {
                                text += "\n" + item.str;
                            }
                            lastY = item.transform[5];
                        }
                    }
                    fullText += text + '\n\n';
                    _b.label = 6;
                case 6:
                    i++;
                    return [3 /*break*/, 3];
                case 7: return [2 /*return*/, fullText];
                case 8:
                    error_2 = _b.sent();
                    console.error("PDF.js parsing error:", error_2);
                    return [2 /*return*/, ""];
                case 9: return [2 /*return*/];
            }
        });
    });
}
/**
 * Parse PDF with pdf-lib (fallback)
 */
function parsePdfWithPdfLib(dataBuffer) {
    return __awaiter(this, void 0, void 0, function () {
        var pdfDoc, form, fields, text, _i, fields_1, field, name_1, value, textField, checkBox, dropdown, radioGroup, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, PDFDocument.load(dataBuffer)];
                case 1:
                    pdfDoc = _a.sent();
                    pdfDoc.registerFontkit(fontkit);
                    form = pdfDoc.getForm();
                    fields = form.getFields();
                    text = "";
                    // Extract field data
                    if (fields.length > 0) {
                        for (_i = 0, fields_1 = fields; _i < fields_1.length; _i++) {
                            field = fields_1[_i];
                            name_1 = field.getName();
                            value = "";
                            // Try to get field value based on type
                            if (field.constructor.name === 'PDFTextField') {
                                textField = field;
                                value = textField.getText() || "";
                            }
                            else if (field.constructor.name === 'PDFCheckBox') {
                                checkBox = field;
                                value = checkBox.isChecked() ? "☑" : "☐";
                            }
                            else if (field.constructor.name === 'PDFDropdown') {
                                dropdown = field;
                                value = dropdown.getSelected().join(", ") || "";
                            }
                            else if (field.constructor.name === 'PDFRadioGroup') {
                                radioGroup = field;
                                value = radioGroup.getSelected() || "";
                            }
                            if (value) {
                                text += "".concat(name_1, ": ").concat(value, "\n");
                            }
                        }
                    }
                    // If we have at least some text, return it
                    if (text.trim()) {
                        return [2 /*return*/, text];
                    }
                    else {
                        // No form fields found or extracted
                        return [2 /*return*/, "No text content could be extracted from this PDF."];
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error("pdf-lib parsing error:", error_3);
                    return [2 /*return*/, ""];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Main function to parse PDF buffer
 */
export function parsePDF(dataBuffer) {
    return __awaiter(this, void 0, void 0, function () {
        var text, pdfDoc, numPages, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    console.log("Attempting to parse PDF...");
                    return [4 /*yield*/, parsePdfWithPdfJs(dataBuffer)];
                case 1:
                    text = _a.sent();
                    if (!(!text || text.trim() === '')) return [3 /*break*/, 3];
                    console.log("PDF.js extraction failed, trying pdf-lib fallback");
                    return [4 /*yield*/, parsePdfWithPdfLib(dataBuffer)];
                case 2:
                    text = _a.sent();
                    _a.label = 3;
                case 3:
                    // If we still don't have text, return an error message
                    if (!text || text.trim() === '') {
                        text = "Could not extract text from this PDF. Try using an image of the receipt instead.";
                    }
                    return [4 /*yield*/, PDFDocument.load(dataBuffer)];
                case 4:
                    pdfDoc = _a.sent();
                    numPages = pdfDoc.getPageCount();
                    // Log a sample of the extracted text
                    console.log("Extracted ".concat(text.length, " chars from PDF. Sample: ").concat(text.substring(0, 200), "..."));
                    return [2 /*return*/, {
                            text: text,
                            numpages: numPages,
                            numrender: numPages,
                            info: {
                                PDFFormatVersion: '1.7',
                                IsAcroFormPresent: false,
                                IsXFAPresent: false,
                            },
                            metadata: null,
                            version: "1.0.0"
                        }];
                case 5:
                    error_4 = _a.sent();
                    console.error("Error parsing PDF:", error_4);
                    // Return a default response with error message
                    return [2 /*return*/, {
                            text: "PDF text extraction failed. Try using an image of the receipt instead.",
                            numpages: 0,
                            numrender: 0,
                            info: {
                                PDFFormatVersion: '1.7',
                                IsAcroFormPresent: false,
                                IsXFAPresent: false
                            },
                            metadata: null,
                            version: "1.0.0"
                        }];
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * Parse PDF file from a file path
 */
export function parsePDFFile(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var dataBuffer;
        return __generator(this, function (_a) {
            try {
                console.log("Reading PDF file: ".concat(filePath));
                dataBuffer = fs.readFileSync(filePath);
                return [2 /*return*/, parsePDF(dataBuffer)];
            }
            catch (error) {
                console.error("Error reading PDF file:", error);
                return [2 /*return*/, {
                        text: "Failed to read PDF file. The file may be corrupted or inaccessible.",
                        numpages: 0,
                        numrender: 0,
                        info: {
                            PDFFormatVersion: '1.7',
                            IsAcroFormPresent: false,
                            IsXFAPresent: false
                        },
                        metadata: null,
                        version: "1.0.0"
                    }];
            }
            return [2 /*return*/];
        });
    });
}
