"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = void 0;
// MemStorage class removed as it's no longer used.
// Import the new Supabase storage implementation
var supabase_storage_1 = require("./supabase-storage");
// Initialize and export the storage instance (as a promise)
var storagePromise = supabase_storage_1.SupabaseStorage.initialize();
// Export the promise. Modules importing this will need to await it.
exports.storage = storagePromise;
