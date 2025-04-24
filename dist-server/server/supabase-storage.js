var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema.js';
import session from "express-session";
import connectPgSimple from 'connect-pg-simple';
// Import storage functions from separate files
import * as userStorage from './storage/user.storage.js';
import * as tripStorage from './storage/trip.storage.js';
import * as expenseStorage from './storage/expense.storage.js';
import * as mileageStorage from './storage/mileage.storage.js';
import * as taskStorage from './storage/task.storage.js';
import * as fileStorage from './storage/file.storage.js';
// Get Supabase connection string and storage details from environment variables
var databaseUrl = process.env.DATABASE_URL;
var supabaseUrl = process.env.SUPABASE_URL;
var supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
// Removed defaultBucketName as it's handled in file.storage.ts
if (!databaseUrl) {
    console.error("FATAL ERROR: DATABASE_URL environment variable is not set.");
    process.exit(1);
}
if (!supabaseUrl) {
    console.error("FATAL ERROR: SUPABASE_URL environment variable is not set.");
    process.exit(1);
}
if (!supabaseServiceKey) {
    console.error("FATAL ERROR: SUPABASE_SERVICE_KEY environment variable is not set.");
    process.exit(1);
}
var SupabaseStorage = /** @class */ (function () {
    function SupabaseStorage() {
        this.client = postgres(databaseUrl, { max: 1 });
        this.db = drizzle(this.client, { schema: schema, logger: false });
        // Removed Supabase client initialization here
    }
    // Revert to static initialize method
    SupabaseStorage.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var instance, error_1, PgStore;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("[SupabaseStorage] Initializing storage...");
                        instance = new SupabaseStorage();
                        console.log("[SupabaseStorage] Testing database connection...");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, instance.client(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT 1"], ["SELECT 1"])))];
                    case 2:
                        _a.sent(); // Use instance client
                        console.log("[SupabaseStorage] Successfully connected to Supabase database.");
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error("[SupabaseStorage] FATAL ERROR: Failed to connect to Supabase database during startup.");
                        console.error("[SupabaseStorage] Error details:", error_1);
                        throw error_1; // Re-throw
                    case 4:
                        PgStore = connectPgSimple(session);
                        instance.sessionStore = new PgStore({
                            conString: databaseUrl,
                            createTableIfMissing: false,
                        });
                        console.log("[SupabaseStorage] PostgreSQL session store initialized.");
                        console.log("[SupabaseStorage] Storage initialized successfully.");
                        return [2 /*return*/, instance]; // Return the initialized instance
                }
            });
        });
    };
    // --- User methods ---
    SupabaseStorage.prototype.getUserById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, userStorage.getUserById(this.db, id)];
            });
        });
    };
    SupabaseStorage.prototype.getUserByUsername = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, userStorage.getUserByUsername(this.db, username)];
            });
        });
    };
    SupabaseStorage.prototype.getUserByClerkId = function (clerkUserId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, userStorage.getUserByClerkId(this.db, clerkUserId)];
            });
        });
    };
    SupabaseStorage.prototype.getUserByEmail = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, userStorage.getUserByEmail(this.db, email)];
            });
        });
    };
    SupabaseStorage.prototype.updateUserProfile = function (userId, profileData) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, userStorage.updateUserProfile(this.db, userId, profileData)];
            });
        });
    };
    SupabaseStorage.prototype.createUserWithClerkId = function (clerkUserId_1) {
        return __awaiter(this, arguments, void 0, function (clerkUserId, email, firstName, lastName) {
            if (email === void 0) { email = ''; }
            if (firstName === void 0) { firstName = ''; }
            if (lastName === void 0) { lastName = ''; }
            return __generator(this, function (_a) {
                return [2 /*return*/, userStorage.createUserWithClerkId(this.db, clerkUserId, email, firstName, lastName)];
            });
        });
    };
    // --- Trip methods ---
    SupabaseStorage.prototype.getTrip = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, tripStorage.getTrip(this.db, id)];
            });
        });
    };
    SupabaseStorage.prototype.getTripsByUserId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, tripStorage.getTripsByUserId(this.db, userId)];
            });
        });
    };
    SupabaseStorage.prototype.createTrip = function (tripData) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, tripStorage.createTrip(this.db, tripData)];
            });
        });
    };
    SupabaseStorage.prototype.updateTrip = function (id, tripData) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, tripStorage.updateTrip(this.db, id, tripData)];
            });
        });
    };
    SupabaseStorage.prototype.deleteTrip = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, tripStorage.deleteTrip(this.db, id)];
            });
        });
    };
    // --- Expense methods ---
    SupabaseStorage.prototype.getExpense = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, expenseStorage.getExpense(this.db, id)];
            });
        });
    };
    SupabaseStorage.prototype.getExpensesByUserId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, expenseStorage.getExpensesByUserId(this.db, userId)];
            });
        });
    };
    SupabaseStorage.prototype.getExpensesByTripName = function (userId, tripName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, expenseStorage.getExpensesByTripName(this.db, userId, tripName)];
            });
        });
    };
    SupabaseStorage.prototype.createExpense = function (expenseData) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, expenseStorage.createExpense(this.db, expenseData)];
            });
        });
    };
    SupabaseStorage.prototype.updateExpense = function (id, expenseData) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, expenseStorage.updateExpense(this.db, id, expenseData)];
            });
        });
    };
    SupabaseStorage.prototype.deleteExpense = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, expenseStorage.deleteExpense(this.db, id)];
            });
        });
    };
    SupabaseStorage.prototype.updateExpenseStatus = function (id, status, error) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, expenseStorage.updateExpenseStatus(this.db, id, status, error)];
            });
        });
    };
    SupabaseStorage.prototype.createExpensesBatch = function (expensesData) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, expenseStorage.createExpensesBatch(this.db, expensesData)];
            });
        });
    };
    // --- Mileage Log methods ---
    SupabaseStorage.prototype.getMileageLogById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, mileageStorage.getMileageLogById(this.db, id)];
            });
        });
    };
    SupabaseStorage.prototype.getMileageLogsByUserId = function (userId, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, mileageStorage.getMileageLogsByUserId(this.db, userId, options)];
            });
        });
    };
    SupabaseStorage.prototype.createMileageLog = function (logData) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, mileageStorage.createMileageLog(this.db, logData)];
            });
        });
    };
    SupabaseStorage.prototype.updateMileageLog = function (id, logData) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, mileageStorage.updateMileageLog(this.db, id, logData)];
            });
        });
    };
    SupabaseStorage.prototype.deleteMileageLog = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, mileageStorage.deleteMileageLog(this.db, id)];
            });
        });
    };
    // --- Background Task methods ---
    SupabaseStorage.prototype.createBackgroundTask = function (taskData) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, taskStorage.createBackgroundTask(this.db, taskData)];
            });
        });
    };
    SupabaseStorage.prototype.updateBackgroundTaskStatus = function (id, status, result, error) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, taskStorage.updateBackgroundTaskStatus(this.db, id, status, result, error)];
            });
        });
    };
    SupabaseStorage.prototype.getBackgroundTaskById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, taskStorage.getBackgroundTaskById(this.db, id)];
            });
        });
    };
    SupabaseStorage.prototype.getBackgroundTasksByUserId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, taskStorage.getBackgroundTasksByUserId(this.db, userId)];
            });
        });
    };
    // --- File Storage methods (delegated) ---
    // Add named export for backward compatibility
    // export { SupabaseStorage }; // Moved outside class
    SupabaseStorage.prototype.uploadFile = function (filePath, fileBuffer, contentType, bucketName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, fileStorage.uploadFile(filePath, fileBuffer, contentType, bucketName)];
            });
        });
    };
    SupabaseStorage.prototype.deleteFile = function (filePath, bucketName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, fileStorage.deleteFile(filePath, bucketName)];
            });
        });
    };
    SupabaseStorage.prototype.getSignedUrl = function (filePath, expiresIn, bucketName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, fileStorage.getSignedUrl(filePath, expiresIn, bucketName)];
            });
        });
    };
    SupabaseStorage.prototype.downloadFile = function (filePath, bucketName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, fileStorage.downloadFile(filePath, bucketName)];
            });
        });
    };
    return SupabaseStorage;
}());
export { SupabaseStorage };
var templateObject_1;
// --- Initialize and Export Instance Promise ---
// Remove IIAFE
