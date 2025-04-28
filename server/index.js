"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
require("dotenv/config"); // Load environment variables FIRST
var express_1 = require("express");
var helmet_1 = require("helmet"); // Import helmet
var serverless_http_1 = require("serverless-http"); // Import serverless-http
var routes_1 = require("./routes");
// import { setupVite, serveStatic, log } from "./vite"; // Vite/Static serving not needed for serverless
var storage_1 = require("./storage"); // Import the promise
var config_1 = require("./config"); // Import config initialization
// Initialize environment variables from config file first
(0, config_1.initializeEnvFromConfig)();
// Define an async function to initialize the app
function initializeApp() {
    return __awaiter(this, void 0, void 0, function () {
        var app, storage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    app = (0, express_1.default)();
                    // Add helmet middleware for security headers
                    // Use default helmet settings for production/serverless
                    app.use((0, helmet_1.default)());
                    app.use(express_1.default.json());
                    app.use(express_1.default.urlencoded({ extended: false }));
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
                    // Firebase authentication is now handled by the auth middleware
                    console.log("Using Firebase authentication");
                    return [4 /*yield*/, storage_1.storage];
                case 1:
                    storage = _a.sent();
                    console.log("Storage initialized successfully.");
                    // Register routes, passing the initialized storage
                    return [4 /*yield*/, (0, routes_1.registerRoutes)(app, storage)];
                case 2:
                    // Register routes, passing the initialized storage
                    _a.sent(); // Pass storage instance
                    console.log("Routes registered.");
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
var handler = function (event, context) { return __awaiter(void 0, void 0, void 0, function () {
    var app, serverlessHandler;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, appPromise];
            case 1:
                app = _a.sent();
                serverlessHandler = (0, serverless_http_1.default)(app);
                // Call the actual serverless handler
                return [2 /*return*/, serverlessHandler(event, context)];
        }
    });
}); };
exports.handler = handler;
