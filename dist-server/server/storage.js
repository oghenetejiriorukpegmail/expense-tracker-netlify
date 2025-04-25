"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeStorage = void 0;
const { createClient } = require('@supabase/supabase-js');

// Supabase storage implementation
class SupabaseStorage {
    constructor(supabaseUrl, supabaseKey) {
        console.log("[SupabaseStorage] Initializing storage...");
        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log("[SupabaseStorage] Testing database connection...");
    }

    // User methods
    async getUserByClerkId(clerkId) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('authUserId', clerkId)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("[SupabaseStorage] Error getting user by Clerk ID:", error);
            return null;
        }
    }

    // File storage methods
    async uploadFile(filePath, fileBuffer, contentType, bucketName = 'receipts') {
        try {
            const { data, error } = await this.supabase.storage
                .from(bucketName)
                .upload(filePath, fileBuffer, {
                    contentType,
                    upsert: true
                });
            
            if (error) throw error;
            
            return {
                path: filePath,
                url: data?.path ? `${this.supabase.storage.from(bucketName).getPublicUrl(data.path).data.publicUrl}` : null
            };
        } catch (error) {
            console.error("[SupabaseStorage] Error uploading file:", error);
            throw error;
        }
    }

    async downloadFile(path, bucketName = 'receipts') {
        try {
            const { data, error } = await this.supabase.storage
                .from(bucketName)
                .download(path);
            
            if (error) throw error;
            
            return {
                buffer: await data.arrayBuffer(),
                contentType: data.type
            };
        } catch (error) {
            console.error("[SupabaseStorage] Error downloading file:", error);
            throw error;
        }
    }

    async deleteFile(path, bucketName = 'receipts') {
        try {
            const { error } = await this.supabase.storage
                .from(bucketName)
                .remove([path]);
            
            if (error) throw error;
            
            return true;
        } catch (error) {
            console.error("[SupabaseStorage] Error deleting file:", error);
            throw error;
        }
    }

    // Expense methods
    async getExpense(id) {
        try {
            const { data, error } = await this.supabase
                .from('expenses')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("[SupabaseStorage] Error getting expense:", error);
            return null;
        }
    }

    async updateExpense(id, data) {
        try {
            const { data: updatedData, error } = await this.supabase
                .from('expenses')
                .update(data)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return updatedData;
        } catch (error) {
            console.error("[SupabaseStorage] Error updating expense:", error);
            throw error;
        }
    }

    // Background task methods
    async createBackgroundTask(taskData) {
        try {
            const { data, error } = await this.supabase
                .from('background_tasks')
                .insert(taskData)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("[SupabaseStorage] Error creating background task:", error);
            throw error;
        }
    }

    async updateBackgroundTaskStatus(id, status, result = null, error = null) {
        try {
            const updateData = {
                status,
                updatedAt: new Date().toISOString()
            };
            
            if (result !== null) {
                updateData.result = typeof result === 'string' ? result : JSON.stringify(result);
            }
            
            if (error !== null) {
                updateData.error = error;
            }
            
            const { data, error: dbError } = await this.supabase
                .from('background_tasks')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();
            
            if (dbError) throw dbError;
            return data;
        } catch (error) {
            console.error("[SupabaseStorage] Error updating background task status:", error);
            throw error;
        }
    }

    async getBackgroundTasksByUserId(userId) {
        try {
            const { data, error } = await this.supabase
                .from('background_tasks')
                .select('*')
                .eq('userId', userId)
                .order('createdAt', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("[SupabaseStorage] Error getting background tasks:", error);
            return [];
        }
    }
}

// Initialize storage
async function initializeStorage() {
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Supabase URL or key not configured in environment variables.");
        }
        
        const storage = new SupabaseStorage(supabaseUrl, supabaseKey);
        
        // Test database connection - using a simple query instead of count()
        try {
            // Just fetch a single user to test the connection
            const { data, error } = await storage.supabase.from('users').select('id').limit(1);
            if (error) throw error;
            console.log("[SupabaseStorage] Successfully connected to Supabase database.");
        } catch (error) {
            console.error("[SupabaseStorage] FATAL ERROR: Failed to connect to Supabase database during startup.");
            console.error("[SupabaseStorage] Error details:", error);
            throw error;
        }
        
        console.log("[SupabaseStorage] PostgreSQL session store initialized.");
        console.log("[SupabaseStorage] Storage initialized successfully.");
        
        return storage;
    } catch (error) {
        console.error("[SupabaseStorage] Error initializing storage:", error);
        throw error;
    }
}
exports.initializeStorage = initializeStorage;