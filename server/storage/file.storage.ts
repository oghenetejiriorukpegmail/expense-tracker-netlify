import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Buffer } from 'buffer';

// Get Supabase connection string and storage details from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const defaultBucketName = process.env.SUPABASE_BUCKET_NAME || 'receipts';

if (!supabaseUrl) {
  console.error("FATAL ERROR: SUPABASE_URL environment variable is not set.");
  process.exit(1);
}
if (!supabaseServiceKey) {
  console.error("FATAL ERROR: SUPABASE_SERVICE_KEY environment variable is not set.");
  process.exit(1);
}
// Initialize Supabase client specifically for storage operations
console.log("[FILE_STORAGE] Initializing Supabase client with URL:", supabaseUrl);
console.log("[FILE_STORAGE] Service key provided:", !!supabaseServiceKey);
console.log("[FILE_STORAGE] Module type:", typeof module !== 'undefined' ? 'CommonJS' : 'ESM');
console.log("[FILE_STORAGE] Module path:", __filename);

let supabase: SupabaseClient;
try {
  console.log("[FILE_STORAGE] Creating Supabase client...");
  supabase = createClient(supabaseUrl!, supabaseServiceKey!);
  console.log("[FILE_STORAGE] Supabase client initialized successfully");
  console.log("[FILE_STORAGE] Supabase client type:", typeof supabase);
  console.log("[FILE_STORAGE] Supabase client properties:", Object.keys(supabase));
  console.log("[FILE_STORAGE] Supabase client has storage:", !!supabase.storage);
  
  // Test if storage is accessible
  if (supabase.storage) {
    console.log("[FILE_STORAGE] Storage buckets available:", typeof supabase.storage.from === 'function');
    console.log("[FILE_STORAGE] Storage methods:", Object.keys(supabase.storage));
  }
} catch (error) {
  console.error("[FILE_STORAGE] CRITICAL ERROR: Failed to initialize Supabase client:", error);
  if (error instanceof Error) {
    console.error("[FILE_STORAGE] Error stack:", error.stack);
  }
  // Re-throw to ensure the application knows there's a critical issue
  throw error;
}



// File Storage methods extracted from SupabaseStorage
export async function uploadFile(filePath: string, fileBuffer: Buffer, contentType: string, bucketName: string = defaultBucketName): Promise<{ path: string }> {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, fileBuffer, {
      contentType: contentType,
      upsert: true,
    });

  if (error) {
    console.error(`Supabase upload error for ${filePath} in bucket ${bucketName}:`, error);
    throw new Error(`Failed to upload file to Supabase Storage: ${error.message}`);
  }
  if (!data) {
      throw new Error(`Supabase upload failed for ${filePath}, no data returned.`);
  }
  console.log(`Successfully uploaded ${filePath} to Supabase bucket ${bucketName}. Path: ${data.path}`);
  return { path: data.path };
}

export async function deleteFile(filePath: string, bucketName: string = defaultBucketName): Promise<void> {
  const { error } = await supabase.storage
    .from(bucketName)
    .remove([filePath]);

  if (error) {
    console.warn(`Supabase delete error for ${filePath} in bucket ${bucketName}:`, error);
  } else {
      console.log(`Successfully deleted ${filePath} from Supabase bucket ${bucketName}.`);
  }
}

export async function getSignedUrl(filePath: string, expiresIn: number = 60 * 5, bucketName: string = defaultBucketName): Promise<{ signedUrl: string }> {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    console.error(`Supabase getSignedUrl error for ${filePath} in bucket ${bucketName}:`, error);
    throw new Error(`Failed to get signed URL from Supabase Storage: ${error.message}`);
  }
  if (!data?.signedUrl) {
      throw new Error(`Supabase getSignedUrl failed for ${filePath}, no signedUrl returned.`);
  }
  console.log(`Generated signed URL for ${filePath} in bucket ${bucketName}.`);
  return { signedUrl: data.signedUrl };
}

export async function downloadFile(filePath: string, bucketName: string = defaultBucketName): Promise<Buffer> {
    const { data, error } = await supabase.storage
        .from(bucketName)
        .download(filePath);

    if (error) {
        console.error(`Supabase download error for ${filePath} in bucket ${bucketName}:`, error);
        throw new Error(`Failed to download file from Supabase Storage: ${error.message}`);
    }
    if (!data) {
        throw new Error(`Supabase download failed for ${filePath}, no data returned.`);
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
}