/**
 * Storage Factory
 * 
 * This module provides a factory for creating storage service instances.
 * It centralizes the creation of storage services and ensures consistent
 * configuration across the application.
 */

import { IStorage } from './storage.interface';
import { SupabaseStorage } from '../supabase-storage';
import { DatabaseError } from '../util/error-handler';

// Storage provider types
export type StorageProvider = 'supabase';

// Storage configuration
export interface StorageConfig {
  provider: StorageProvider;
  databaseUrl?: string | undefined;
  supabaseUrl?: string | undefined;
  supabaseServiceKey?: string | undefined;
  bucketName?: string | undefined;
}

// Storage factory class
export class StorageFactory {
  private static instance: StorageFactory;
  private storageInstances: Map<string, IStorage> = new Map();
  
  // Private constructor for singleton pattern
  private constructor() {}
  
  // Get singleton instance
  public static getInstance(): StorageFactory {
    if (!StorageFactory.instance) {
      StorageFactory.instance = new StorageFactory();
    }
    return StorageFactory.instance;
  }
  
  /**
   * Create a storage service instance
   * @param config Storage configuration
   * @param instanceName Optional name for the instance (default: 'default')
   * @returns Storage service instance
   */
  public async createStorage(config: StorageConfig, instanceName: string = 'default'): Promise<IStorage> {
    // Check if instance already exists
    if (this.storageInstances.has(instanceName)) {
      return this.storageInstances.get(instanceName)!;
    }
    
    // Create new instance based on provider
    let storageInstance: IStorage;
    
    try {
      switch (config.provider) {
        case 'supabase':
          // Validate required configuration
          if (!config.databaseUrl) {
            throw new Error('Database URL is required for Supabase storage');
          }
          if (!config.supabaseUrl) {
            throw new Error('Supabase URL is required for Supabase storage');
          }
          if (!config.supabaseServiceKey) {
            throw new Error('Supabase service key is required for Supabase storage');
          }
          
          // Set environment variables for Supabase storage
          process.env.DATABASE_URL = config.databaseUrl;
          process.env.SUPABASE_URL = config.supabaseUrl;
          process.env.SUPABASE_SERVICE_KEY = config.supabaseServiceKey;
          
          if (config.bucketName) {
            process.env.SUPABASE_BUCKET_NAME = config.bucketName;
          }
          
          // Initialize Supabase storage
          storageInstance = await SupabaseStorage.initialize();
          break;
          
        default:
          throw new Error(`Unsupported storage provider: ${config.provider}`);
      }
      
      // Store instance for reuse
      this.storageInstances.set(instanceName, storageInstance);
      
      return storageInstance;
    } catch (error) {
      console.error(`Failed to create storage instance '${instanceName}':`, error);
      throw new DatabaseError(`Failed to initialize storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get an existing storage service instance
   * @param instanceName Name of the instance (default: 'default')
   * @returns Storage service instance or undefined if not found
   */
  public getStorage(instanceName: string = 'default'): IStorage | undefined {
    return this.storageInstances.get(instanceName);
  }
  
  /**
   * Get an existing storage service instance or throw an error if not found
   * @param instanceName Name of the instance (default: 'default')
   * @returns Storage service instance
   * @throws Error if instance not found
   */
  public getStorageOrThrow(instanceName: string = 'default'): IStorage {
    const instance = this.storageInstances.get(instanceName);
    if (!instance) {
      throw new Error(`Storage instance '${instanceName}' not found`);
    }
    return instance;
  }
  
  /**
   * Check if a storage service instance exists
   * @param instanceName Name of the instance (default: 'default')
   * @returns True if instance exists, false otherwise
   */
  public hasStorage(instanceName: string = 'default'): boolean {
    return this.storageInstances.has(instanceName);
  }
  
  /**
   * Remove a storage service instance
   * @param instanceName Name of the instance (default: 'default')
   * @returns True if instance was removed, false otherwise
   */
  public removeStorage(instanceName: string = 'default'): boolean {
    return this.storageInstances.delete(instanceName);
  }
  
  /**
   * Clear all storage service instances
   */
  public clearStorage(): void {
    this.storageInstances.clear();
  }
}

// Export factory instance
export const storageFactory = StorageFactory.getInstance();

// Helper function to get default storage
export async function getDefaultStorage(): Promise<IStorage> {
  // Check if default storage exists
  if (storageFactory.hasStorage()) {
    return storageFactory.getStorageOrThrow();
  }
  
  // Create default storage from environment variables
  const config: StorageConfig = {
    provider: 'supabase',
    databaseUrl: process.env.DATABASE_URL || undefined,
    supabaseUrl: process.env.SUPABASE_URL || undefined,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || undefined,
    bucketName: process.env.SUPABASE_BUCKET_NAME || undefined
  };
  
  // Validate required configuration
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  if (!config.supabaseUrl) {
    throw new Error('SUPABASE_URL environment variable is required');
  }
  if (!config.supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_KEY environment variable is required');
  }
  
  // Create and return default storage
  return await storageFactory.createStorage(config);
}