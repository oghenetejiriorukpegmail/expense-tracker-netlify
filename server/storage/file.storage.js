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
exports.uploadFile = uploadFile;
exports.deleteFile = deleteFile;
exports.getSignedUrl = getSignedUrl;
exports.downloadFile = downloadFile;
var supabase_js_1 = require("@supabase/supabase-js");
var buffer_1 = require("buffer");
// Get Supabase connection string and storage details from environment variables
var supabaseUrl = process.env.SUPABASE_URL;
var supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
var defaultBucketName = process.env.SUPABASE_BUCKET_NAME || 'receipts';
if (!supabaseUrl) {
    console.error("FATAL ERROR: SUPABASE_URL environment variable is not set.");
    process.exit(1);
}
if (!supabaseServiceKey) {
    console.error("FATAL ERROR: SUPABASE_SERVICE_KEY environment variable is not set.");
    process.exit(1);
}
// Initialize Supabase client specifically for storage operations
var supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
console.log("Supabase client initialized for Storage operations: ".concat(supabaseUrl));
// File Storage methods extracted from SupabaseStorage
function uploadFile(filePath_1, fileBuffer_1, contentType_1) {
    return __awaiter(this, arguments, void 0, function (filePath, fileBuffer, contentType, bucketName) {
        var _a, data, error;
        if (bucketName === void 0) { bucketName = defaultBucketName; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, supabase.storage
                        .from(bucketName)
                        .upload(filePath, fileBuffer, {
                        contentType: contentType,
                        upsert: true,
                    })];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error("Supabase upload error for ".concat(filePath, " in bucket ").concat(bucketName, ":"), error);
                        throw new Error("Failed to upload file to Supabase Storage: ".concat(error.message));
                    }
                    if (!data) {
                        throw new Error("Supabase upload failed for ".concat(filePath, ", no data returned."));
                    }
                    console.log("Successfully uploaded ".concat(filePath, " to Supabase bucket ").concat(bucketName, ". Path: ").concat(data.path));
                    return [2 /*return*/, { path: data.path }];
            }
        });
    });
}
function deleteFile(filePath_1) {
    return __awaiter(this, arguments, void 0, function (filePath, bucketName) {
        var error;
        if (bucketName === void 0) { bucketName = defaultBucketName; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, supabase.storage
                        .from(bucketName)
                        .remove([filePath])];
                case 1:
                    error = (_a.sent()).error;
                    if (error) {
                        console.warn("Supabase delete error for ".concat(filePath, " in bucket ").concat(bucketName, ":"), error);
                    }
                    else {
                        console.log("Successfully deleted ".concat(filePath, " from Supabase bucket ").concat(bucketName, "."));
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function getSignedUrl(filePath_1) {
    return __awaiter(this, arguments, void 0, function (filePath, expiresIn, bucketName) {
        var _a, data, error;
        if (expiresIn === void 0) { expiresIn = 60 * 5; }
        if (bucketName === void 0) { bucketName = defaultBucketName; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, supabase.storage
                        .from(bucketName)
                        .createSignedUrl(filePath, expiresIn)];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error("Supabase getSignedUrl error for ".concat(filePath, " in bucket ").concat(bucketName, ":"), error);
                        throw new Error("Failed to get signed URL from Supabase Storage: ".concat(error.message));
                    }
                    if (!(data === null || data === void 0 ? void 0 : data.signedUrl)) {
                        throw new Error("Supabase getSignedUrl failed for ".concat(filePath, ", no signedUrl returned."));
                    }
                    console.log("Generated signed URL for ".concat(filePath, " in bucket ").concat(bucketName, "."));
                    return [2 /*return*/, { signedUrl: data.signedUrl }];
            }
        });
    });
}
function downloadFile(filePath_1) {
    return __awaiter(this, arguments, void 0, function (filePath, bucketName) {
        var _a, data, error, arrayBuffer;
        if (bucketName === void 0) { bucketName = defaultBucketName; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, supabase.storage
                        .from(bucketName)
                        .download(filePath)];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error("Supabase download error for ".concat(filePath, " in bucket ").concat(bucketName, ":"), error);
                        throw new Error("Failed to download file from Supabase Storage: ".concat(error.message));
                    }
                    if (!data) {
                        throw new Error("Supabase download failed for ".concat(filePath, ", no data returned."));
                    }
                    return [4 /*yield*/, data.arrayBuffer()];
                case 2:
                    arrayBuffer = _b.sent();
                    return [2 /*return*/, buffer_1.Buffer.from(arrayBuffer)];
            }
        });
    });
}
