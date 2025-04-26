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
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
var http_1 = require("http");
var auth_middleware_1 = require("./middleware/auth-middleware"); // Import our custom auth middleware
// Import the new router creation functions
var profile_routes_1 = require("./routes/profile.routes");
var trips_routes_1 = require("./routes/trips.routes");
var expenses_routes_1 = require("./routes/expenses.routes");
var mileage_routes_1 = require("./routes/mileage.routes");
var settings_routes_1 = require("./routes/settings.routes");
var tasks_routes_1 = require("./routes/tasks.routes");
var export_routes_1 = require("./routes/export.routes");
// Removed old helper functions (generateExcelReport, generateZipArchive)
// Removed old route registration functions (registerProfileRoutes, etc.)
// Removed old middleware import (authenticateJWT)
// --- Main Route Registration ---
function registerRoutes(app, storage) {
    return __awaiter(this, void 0, void 0, function () {
        var authMiddleware, httpServer;
        return __generator(this, function (_a) {
            authMiddleware = (0, auth_middleware_1.createAuthMiddleware)(storage);
            // Mount the new resource-specific routers with auth middleware
            app.use('/api/profile', authMiddleware, (0, profile_routes_1.createProfileRouter)(storage));
            app.use('/api/trips', authMiddleware, (0, trips_routes_1.createTripRouter)(storage));
            app.use('/api/expenses', authMiddleware, (0, expenses_routes_1.createExpenseRouter)(storage));
            app.use('/api/mileage-logs', authMiddleware, (0, mileage_routes_1.createMileageLogRouter)(storage));
            app.use('/api/settings', authMiddleware, (0, settings_routes_1.createSettingsRouter)()); // Settings routes might not need storage
            app.use('/api/background-tasks', authMiddleware, (0, tasks_routes_1.createBackgroundTaskRouter)(storage));
            app.use('/api/export', authMiddleware, (0, export_routes_1.createExportRouter)(storage)); // Mount export routes under /api/export
            httpServer = (0, http_1.createServer)(app);
            return [2 /*return*/, httpServer];
        });
    });
}
