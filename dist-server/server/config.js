"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = exports.initializeEnvFromConfig = void 0;
const fs = require("fs");
const path = require("path");

// Default configuration
const DEFAULT_CONFIG = {
    // Database configuration
    databaseUrl: process.env.DATABASE_URL || "",
    // Supabase configuration
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || "",
    // Storage configuration
    storageBucket: "receipts",
    // OCR configuration
    ocrProvider: process.env.OCR_PROVIDER || "gemini",
    ocrTemplate: "general",
    // Session configuration
    sessionSecret: process.env.SESSION_SECRET || "your-secret-key",
    // Clerk configuration
    clerkSecretKey: process.env.CLERK_SECRET_KEY || "",
    clerkWebhookSecret: process.env.CLERK_WEBHOOK_SIGNING_SECRET || "",
};

// Path to the configuration file
const CONFIG_PATH = process.env.CONFIG_PATH || path.join(process.cwd(), "app-config.json");

// Function to initialize environment variables from config file
function initializeEnvFromConfig() {
    console.log("Current working directory:", process.cwd());
    console.log("Config path:", CONFIG_PATH);
    
    try {
        // Check if config file exists
        if (fs.existsSync(CONFIG_PATH)) {
            // Read and parse config file
            const configData = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
            
            // Set environment variables from config
            for (const [key, value] of Object.entries(configData)) {
                if (typeof value === "string" && !process.env[key]) {
                    process.env[key] = value;
                }
            }
            
            console.log("Environment variables initialized from config file.");
        } else {
            console.log("Config file not found, using default environment variables.");
        }
    } catch (error) {
        console.error("Error initializing environment variables from config:", error);
    }
}
exports.initializeEnvFromConfig = initializeEnvFromConfig;

// Function to load configuration
function loadConfig() {
    try {
        // Check if config file exists
        if (fs.existsSync(CONFIG_PATH)) {
            // Read and parse config file
            const configData = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
            
            // Merge with default config
            return { ...DEFAULT_CONFIG, ...configData };
        }
    } catch (error) {
        console.error("Error loading config:", error);
    }
    
    // Return default config if config file doesn't exist or there's an error
    return DEFAULT_CONFIG;
}
exports.loadConfig = loadConfig;