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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import 'dotenv/config'; // Load environment variables FIRST
import express from "express";
import helmet from "helmet"; // Import helmet
import serverless from 'serverless-http'; // Import serverless-http
import { clerkMiddleware } from '@clerk/express'; // Import Clerk middleware
import { registerRoutes } from "./routes.js";
// import { setupVite, serveStatic, log } from "./vite.js"; // Vite/Static serving not needed for serverless
import { initializeStorage } from "./storage.js"; // Import the initialization function
import { initializeEnvFromConfig } from "./config.js"; // Import config initialization
// Initialize environment variables from config file first
initializeEnvFromConfig();
// Define an async function to initialize the app
function initializeApp() {
    return __awaiter(this, void 0, void 0, function () {
        var app, clerkPublishableKey, storage, error_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    app = express();
                    // Add helmet middleware for security headers
                    // Use default helmet settings for production/serverless
                    app.use(helmet());
                    app.use(express.json());
                    app.use(express.urlencoded({ extended: false }));
                    // Logging middleware (simplified for serverless)
                    app.use(function (req, res, next) {
                        var start = Date.now();
                        var path = req.path;
                        var capturedJsonResponse = undefined;
                        var originalResJson = res.json;
                        res.json = function (bodyJson) {
                            var args = [];
                            for (var _i = 1; _i < arguments.length; _i++) {
                                args[_i - 1] = arguments[_i];
                            }
                            capturedJsonResponse = bodyJson;
                            return originalResJson.apply(res, __spreadArray([bodyJson], args, true));
                        };
                        res.on("finish", function () {
                            var duration = Date.now() - start;
                            // Only log API requests for brevity in serverless logs
                            if (path.startsWith("/api")) {
                                var logLine = "".concat(req.method, " ").concat(path, " ").concat(res.statusCode, " in ").concat(duration, "ms");
                                if (capturedJsonResponse) {
                                    var responseString = JSON.stringify(capturedJsonResponse);
                                    // Truncate long responses
                                    logLine += " :: ".concat(responseString.length > 50 ? responseString.slice(0, 49) + "…" : responseString);
                                }
                                console.log(logLine); // Use console.log for serverless environments
                            }
                        });
                        next();
                    });
                    clerkPublishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY || process.env.VITE_PUBLIC_CLERK_PUBLISHABLE_KEY;
                    if (!clerkPublishableKey) {
                        console.warn("Warning: Clerk publishable key is missing. Authentication may not work properly.");
                    }
                    else {
                        console.log("Using Clerk publishable key:", clerkPublishableKey.substring(0, 10) + "...");
                    }
                    app.use(clerkMiddleware({
                        publishableKey: clerkPublishableKey
                    }));
                    console.log("Clerk middleware registered.");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    console.log("[SERVER] Awaiting storage initialization...");
                    return [4 /*yield*/, initializeStorage()];
                case 2:
                    storage = _a.sent(); // Call the initialization function
                    console.log("[SERVER] Storage initialized successfully.");
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("[SERVER] CRITICAL ERROR: Failed to initialize storage:", error_1);
                    if (error_1 instanceof Error) {
                        console.error("[SERVER] Error stack:", error_1.stack);
                    }
                    // Add a fallback route to handle API requests when storage fails
                    app.use('/api/*', function (req, res) {
                        res.status(500).json({
                            message: "Server initialization error: Storage failed to initialize",
                            error: error_1 instanceof Error ? error_1.message : "Unknown error"
                        });
                    });
                    // Continue with app initialization but with limited functionality
                    console.warn("[SERVER] Continuing with limited functionality due to storage initialization failure");
                    return [3 /*break*/, 4];
                case 4:
                    if (!storage) return [3 /*break*/, 9];
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    console.log("[SERVER] Registering routes with initialized storage...");
                    return [4 /*yield*/, registerRoutes(app, storage)];
                case 6:
                    _a.sent(); // Pass storage instance
                    console.log("[SERVER] Routes registered successfully.");
                    return [3 /*break*/, 8];
                case 7:
                    error_2 = _a.sent();
                    console.error("[SERVER] ERROR: Failed to register routes:", error_2);
                    // Add a fallback route to handle API requests when route registration fails
                    app.use('/api/*', function (req, res) {
                        res.status(500).json({
                            message: "Server initialization error: Route registration failed",
                            error: error_2 instanceof Error ? error_2.message : "Unknown error"
                        });
                    });
                    return [3 /*break*/, 8];
                case 8: return [3 /*break*/, 10];
                case 9:
                    console.error("[SERVER] ERROR: Cannot register routes - storage is undefined");
                    _a.label = 10;
                case 10:
                    // Centralized error handler
                    app.use(function (err, _req, res, _next) {
                        var status = err.status || err.statusCode || 500;
                        var message = err.message || "Internal Server Error";
                        console.error("Server error:", err); // Log the full error for debugging
                        res.status(status).json({ message: message });
                    });
                    // Vite/Static serving is handled by Netlify build/deployment
                    return [2 /*return*/, app]; // Return the configured app instance
            }
        });
    });
}
// Create a promise for the initialized app
var appPromise = initializeApp();
// Export an async handler function that awaits the app initialization
export var handler = function (event, context) { return __awaiter(void 0, void 0, void 0, function () {
    var app, serverlessHandler;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, appPromise];
            case 1:
                app = _a.sent();
                serverlessHandler = serverless(app);
                // Call the actual serverless handler
                return [2 /*return*/, serverlessHandler(event, context)];
        }
    });
}); };
