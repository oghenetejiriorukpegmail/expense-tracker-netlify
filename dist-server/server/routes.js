"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = void 0;
const express = require("express");
const auth_middleware_js_1 = require("./middleware/auth-middleware.js");
// Import route creators
const expenses_routes_js_1 = require("./routes/expenses.routes.js");
const ocr_routes_js_1 = require("./routes/ocr.routes.js");

// Register all routes
async function registerRoutes(app, storage) {
    console.log("[ROUTES] Starting route registration with storage instance...");
    
    // Validate storage
    if (!storage) {
        console.error("[ROUTES] ERROR: No storage instance provided");
        throw new Error("No storage instance provided to registerRoutes");
    }
    
    console.log("[ROUTES] Storage instance received: Valid IStorage instance");
    
    // Create auth middleware
    console.log("[ROUTES] Creating auth middleware...");
    const authMiddleware = (0, auth_middleware_js_1.createAuthMiddleware)(storage);
    console.log("[ROUTES] Auth middleware created successfully");
    
    // Mount API routes
    console.log("[ROUTES] Mounting API routes...");
    
    // Create and mount routes with storage
    app.use('/api/expenses', authMiddleware, (0, expenses_routes_js_1.createExpenseRouter)(storage));
    app.use('/api/ocr', authMiddleware, (0, ocr_routes_js_1.createOcrRouter)(storage));
    
    console.log("[ROUTES] All API routes mounted successfully");
    console.log("[ROUTES] HTTP server created");
    
    return app;
}
exports.registerRoutes = registerRoutes;