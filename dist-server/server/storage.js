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
            // Try different possible column names for the Clerk ID
            // First try 'auth_user_id' (snake_case, common in databases)
            let { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('auth_user_id', clerkId)
                .single();
            
            if (error) {
                console.log("[SupabaseStorage] No match with auth_user_id, trying clerk_id");
                // Try 'clerk_id' as an alternative
                const result = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('clerk_id', clerkId)
                    .single();
                
                data = result.data;
                error = result.error;
            }
            
            if (error) {
                console.log("[SupabaseStorage] No match with clerk_id, trying user_id");
                // Try 'user_id' as another alternative
                const result = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('user_id', clerkId)
                    .single();
                
                data = result.data;
                error = result.error;
            }
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("[SupabaseStorage] Error getting user by Clerk ID:", error);
            return null;
        }
    }

    // Expense methods
    async getExpensesByUserId(userId) {
        try {
            // Use snake_case for column names in the database
            const { data, error } = await this.supabase
                .from('expenses')
                .select('*')
                .eq('user_id', userId)
                .order('date', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("[SupabaseStorage] Error getting expenses by user ID:", error);
            return [];
        }
    }

    async getExpensesByTripName(tripName) {
        try {
            // Use snake_case for column names in the database
            const { data, error } = await this.supabase
                .from('expenses')
                .select('*')
                .eq('trip_name', tripName)
                .order('date', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("[SupabaseStorage] Error getting expenses by trip name:", error);
            return [];
        }
    }

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

    async createExpense(expenseData) {
        try {
            // Convert camelCase to snake_case for database columns
            const dbData = {};
            for (const [key, value] of Object.entries(expenseData)) {
                // Convert camelCase to snake_case
                const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                dbData[snakeKey] = value;
            }
            
            const { data, error } = await this.supabase
                .from('expenses')
                .insert(dbData)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("[SupabaseStorage] Error creating expense:", error);
            throw error;
        }
    }

    async updateExpense(id, expenseData) {
        try {
            // Convert camelCase to snake_case for database columns
            const dbData = {};
            for (const [key, value] of Object.entries(expenseData)) {
                // Convert camelCase to snake_case
                const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                dbData[snakeKey] = value;
            }
            
            const { data, error } = await this.supabase
                .from('expenses')
                .update(dbData)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("[SupabaseStorage] Error updating expense:", error);
            throw error;
        }
    }

    async deleteExpense(id) {
        try {
            const { error } = await this.supabase
                .from('expenses')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error("[SupabaseStorage] Error deleting expense:", error);
            throw error;
        }
    }

    // Trip methods
    async getTrips(userId) {
        try {
            // Use snake_case for column names in the database
            const { data, error } = await this.supabase
                .from('trips')
                .select('*')
                .eq('user_id', userId)
                .order('start_date', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("[SupabaseStorage] Error getting trips:", error);
            return [];
        }
    }

    async getTrip(id) {
        try {
            const { data, error } = await this.supabase
                .from('trips')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("[SupabaseStorage] Error getting trip:", error);
            return null;
        }
    }

    async createTrip(tripData) {
        try {
            // Convert camelCase to snake_case for database columns
            const dbData = {};
            for (const [key, value] of Object.entries(tripData)) {
                // Convert camelCase to snake_case
                const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                dbData[snakeKey] = value;
            }
            
            const { data, error } = await this.supabase
                .from('trips')
                .insert(dbData)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("[SupabaseStorage] Error creating trip:", error);
            throw error;
        }
    }

    async updateTrip(id, tripData) {
        try {
            // Convert camelCase to snake_case for database columns
            const dbData = {};
            for (const [key, value] of Object.entries(tripData)) {
                // Convert camelCase to snake_case
                const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                dbData[snakeKey] = value;
            }
            
            const { data, error } = await this.supabase
                .from('trips')
                .update(dbData)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("[SupabaseStorage] Error updating trip:", error);
            throw error;
        }
    }

    async deleteTrip(id) {
        try {
            const { error } = await this.supabase
                .from('trips')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error("[SupabaseStorage] Error deleting trip:", error);
            throw error;
        }
    }

    // File storage methods
    async uploadFile(filePath, fileBuffer, contentType, bucketName = 'expenses-receipts') {
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

    async downloadFile(path, bucketName = 'expenses-receipts') {
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

    async deleteFile(path, bucketName = 'expenses-receipts') {
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

    // Background task methods
    async getBackgroundTasksByUserId(userId) {
        try {
            // Use snake_case for column names in the database
            const { data, error } = await this.supabase
                .from('background_tasks')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("[SupabaseStorage] Error getting background tasks:", error);
            return [];
        }
    }

    async getBackgroundTask(id) {
        try {
            const { data, error } = await this.supabase
                .from('background_tasks')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("[SupabaseStorage] Error getting background task:", error);
            return null;
        }
    }

    async createBackgroundTask(taskData) {
        try {
            // Convert camelCase to snake_case for database columns
            const dbData = {};
            for (const [key, value] of Object.entries(taskData)) {
                // Convert camelCase to snake_case
                const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                dbData[snakeKey] = value;
            }
            
            const { data, error } = await this.supabase
                .from('background_tasks')
                .insert(dbData)
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
            // Use snake_case for database columns
            const updateData = {
                status,
                updated_at: new Date().toISOString()
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