"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = void 0;
var express_session_1 = require("express-session");
var memorystore_1 = require("memorystore");
var MemoryStore = (0, memorystore_1.default)(express_session_1.default);
// MemStorage class removed as it's no longer used.
// Import the new Supabase storage implementation
var supabase_storage_1 = require("./supabase-storage");
// Initialize and export the storage instance (as a promise)
var storagePromise = supabase_storage_1.SupabaseStorage.initialize();
// Export the promise. Modules importing this will need to await it.
exports.storage = storagePromise;
