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
    
    // Add trips routes
    app.use('/api/trips', authMiddleware, createTripsRouter(storage));
    
    // Add profile routes
    app.use('/api/profile', authMiddleware, createProfileRouter(storage));
    
    console.log("[ROUTES] All API routes mounted successfully");
    console.log("[ROUTES] HTTP server created");
    
    return app;
}
exports.registerRoutes = registerRoutes;

// Create trips router
function createTripsRouter(storage) {
    const router = express.Router();
    
    // GET /api/trips - Get all trips for a user
    router.get('/', async (req, res) => {
        try {
            const userId = req.user.id;
            const trips = await storage.getTrips(userId);
            res.json(trips);
        } catch (error) {
            console.error('Error getting trips:', error);
            res.status(500).json({ message: 'Failed to get trips' });
        }
    });
    
    // GET /api/trips/:id - Get a specific trip
    router.get('/:id', async (req, res) => {
        try {
            const tripId = req.params.id;
            const trip = await storage.getTrip(tripId);
            
            if (!trip) {
                return res.status(404).json({ message: 'Trip not found' });
            }
            
            res.json(trip);
        } catch (error) {
            console.error('Error getting trip:', error);
            res.status(500).json({ message: 'Failed to get trip' });
        }
    });
    
    // POST /api/trips - Create a new trip
    router.post('/', async (req, res) => {
        try {
            const userId = req.user.id;
            const tripData = {
                ...req.body,
                userId
            };
            
            const newTrip = await storage.createTrip(tripData);
            res.status(201).json(newTrip);
        } catch (error) {
            console.error('Error creating trip:', error);
            res.status(500).json({ message: 'Failed to create trip' });
        }
    });
    
    // PUT /api/trips/:id - Update a trip
    router.put('/:id', async (req, res) => {
        try {
            const tripId = req.params.id;
            const tripData = req.body;
            
            const updatedTrip = await storage.updateTrip(tripId, tripData);
            res.json(updatedTrip);
        } catch (error) {
            console.error('Error updating trip:', error);
            res.status(500).json({ message: 'Failed to update trip' });
        }
    });
    
    // DELETE /api/trips/:id - Delete a trip
    router.delete('/:id', async (req, res) => {
        try {
            const tripId = req.params.id;
            await storage.deleteTrip(tripId);
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting trip:', error);
            res.status(500).json({ message: 'Failed to delete trip' });
        }
    });
    
    return router;
}

// Create profile router
function createProfileRouter(storage) {
    const router = express.Router();
    
    // GET /api/profile - Get user profile
    router.get('/', async (req, res) => {
        try {
            // User is already attached to the request by the auth middleware
            res.json(req.user);
        } catch (error) {
            console.error('Error getting profile:', error);
            res.status(500).json({ message: 'Failed to get profile' });
        }
    });
    
    return router;
}