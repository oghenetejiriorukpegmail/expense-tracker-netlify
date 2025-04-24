var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { createServer } from "http";
import { createAuthMiddleware } from "./middleware/auth-middleware.js"; // Import our custom auth middleware
// Import the new router creation functions
import { createProfileRouter } from "./routes/profile.routes.js";
import { createTripRouter } from "./routes/trips.routes.js";
import { createExpenseRouter } from "./routes/expenses.routes.js";
import { createMileageLogRouter } from "./routes/mileage.routes.js";
import { createSettingsRouter } from "./routes/settings.routes.js";
import { createBackgroundTaskRouter } from "./routes/tasks.routes.js";
import { createExportRouter } from "./routes/export.routes.js";
// Removed old helper functions (generateExcelReport, generateZipArchive)
// Removed old route registration functions (registerProfileRoutes, etc.)
// Removed old middleware import (authenticateJWT)
// --- Main Route Registration ---
export function registerRoutes(app, storage) {
    return __awaiter(this, void 0, void 0, function () {
        var authMiddleware, httpServer, httpServer;
        return __generator(this, function (_a) {
            console.log("[ROUTES] Starting route registration with storage instance...");
            try {
                // Verify storage is properly initialized
                if (!storage) {
                    throw new Error("Storage instance is undefined or null");
                }
                // Log storage instance details to verify it's properly initialized
                // Log storage instance details to verify it's properly initialized
                // Check if it has a specific method from the interface to be more certain
                console.log("[ROUTES] Storage instance received:", storage && typeof storage.getUserByClerkId === 'function' ? "Valid IStorage instance" : "INVALID or UNDEFINED");
                // Clerk middleware is applied in server/index.ts
                // Create our custom auth middleware
                console.log("[ROUTES] Creating auth middleware...");
                authMiddleware = createAuthMiddleware(storage);
                console.log("[ROUTES] Auth middleware created successfully");
                // Mount the new resource-specific routers with auth middleware
                console.log("[ROUTES] Mounting API routes...");
                // Use type assertion to work around TypeScript errors with middleware
                app.use('/api/profile', authMiddleware, createProfileRouter(storage));
                app.use('/api/trips', authMiddleware, createTripRouter(storage));
                app.use('/api/expenses', authMiddleware, createExpenseRouter(storage));
                app.use('/api/mileage-logs', authMiddleware, createMileageLogRouter(storage));
                app.use('/api/settings', authMiddleware, createSettingsRouter()); // Settings routes might not need storage
                app.use('/api/background-tasks', authMiddleware, createBackgroundTaskRouter(storage));
                app.use('/api/export', authMiddleware, createExportRouter(storage)); // Mount export routes under /api/export
                console.log("[ROUTES] All API routes mounted successfully");
                httpServer = createServer(app);
                console.log("[ROUTES] HTTP server created");
                return [2 /*return*/, httpServer];
            }
            catch (error) {
                console.error("[ROUTES] ERROR during route registration:", error);
                httpServer = createServer(app);
                // Add a fallback error route that will catch all API requests if routes failed to register
                app.use('/api/*', function (req, res) {
                    res.status(500).json({
                        message: "Server initialization error. Please check server logs.",
                        error: error instanceof Error ? error.message : "Unknown error"
                    });
                });
                return [2 /*return*/, httpServer];
            }
            return [2 /*return*/];
        });
    });
}
