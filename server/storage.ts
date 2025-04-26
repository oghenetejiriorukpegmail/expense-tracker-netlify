// Use ES module imports
// Removed unused imports of schema and session
import { IStorage } from './storage/storage.interface.js'; // Import IStorage from the new interface file

// MemStorage class removed as it's no longer used.
// Removed the duplicate IStorage class definition

// Use ES module import
import { SupabaseStorage } from './supabase-storage.js'; // Use .js extension

// Export an async function to initialize the storage
async function initializeStorage(): Promise<IStorage> { // Add return type hint
  console.log("[STORAGE] initializeStorage function called.");
  console.log("[STORAGE] Module type: ESM"); // Updated log
  console.log("[STORAGE] SupabaseStorage import:", typeof SupabaseStorage);
  
  // Check if SupabaseStorage is properly imported
  if (!SupabaseStorage) {
    console.error("[STORAGE] CRITICAL ERROR: SupabaseStorage is undefined in initializeStorage");
    throw new Error("SupabaseStorage class is undefined. Check import paths and circular dependencies.");
  }

  // Add detailed diagnostic logs
  console.log("[STORAGE] SupabaseStorage class exists:", typeof SupabaseStorage === 'function');
  console.log("[STORAGE] SupabaseStorage properties:", Object.keys(SupabaseStorage));
  console.log("[STORAGE] SupabaseStorage.initialize exists:", typeof (SupabaseStorage as any).initialize === 'function'); // Cast to any for property access

  // Ensure SupabaseStorage.initialize exists before calling it
  if (typeof (SupabaseStorage as any).initialize !== 'function') { // Cast to any for property access
    console.error("[STORAGE] CRITICAL ERROR: SupabaseStorage.initialize is not a function");
    throw new Error("SupabaseStorage.initialize is not a function. Check class implementation.");
  }

  try {
    // Call the static initialize method
    // console.log("[STORAGE] Calling SupabaseStorage.initialize()..."); // Remove diagnostic log
    const storageInstance = await (SupabaseStorage as any).initialize(); // Cast to any for method call
    // console.log("[STORAGE] SupabaseStorage initialization successful"); // Remove diagnostic log
    // console.log("[STORAGE] Storage instance methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(storageInstance))); // Optional: Keep if needed
    return storageInstance as IStorage; // Cast return type
  } catch (error: any) {
    console.error("[STORAGE] FATAL ERROR: SupabaseStorage initialization failed in initializeStorage:", error);
    console.error("[STORAGE] Error stack:", error.stack);
    throw error; // Re-throw the error
  }
}

// Export for ES module compatibility
export {
  initializeStorage,
  IStorage // Export IStorage from here for convenience
};
