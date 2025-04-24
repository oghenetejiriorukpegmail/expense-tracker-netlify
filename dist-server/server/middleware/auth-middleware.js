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
import { getAuth } from "@clerk/express";
import { clerkClient } from "@clerk/clerk-sdk-node";
// Create a middleware function that verifies authentication and attaches user data
export function createAuthMiddleware(storage) {
    var _this = this;
    console.log("[AUTH] Creating auth middleware with storage");
    return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var clerkUserId, user, dbError_1, email, firstName, lastName, clerkUser_1, primaryEmail, clerkError_1, createError_1, retryError_1, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 19, , 20]);
                    console.log("[AUTH] Processing request:", req.method, req.path);
                    // Verify storage is valid
                    if (!storage) {
                        console.error("[AUTH] CRITICAL ERROR: Storage is undefined in auth middleware");
                        return [2 /*return*/, res.status(500).json({ message: "Server configuration error: Storage not initialized" })];
                    }
                    clerkUserId = getAuth(req).userId;
                    // Debug: Log the entire auth object to see its structure
                    console.log("[AUTH] Clerk auth object:", JSON.stringify(req.auth, null, 2));
                    // If no Clerk user ID, return unauthorized
                    if (!clerkUserId) {
                        console.log("[AUTH] No Authorization header found or not Bearer.");
                        return [2 /*return*/, res.status(401).json({ message: "Unauthorized: Authorization header missing or invalid" })];
                    }
                    console.log("[AUTH] Authenticated with Clerk user ID:", clerkUserId);
                    // Fetch the user from the database using the Clerk user ID
                    console.log("[AUTH] Fetching user from database with Clerk ID:", clerkUserId);
                    user = void 0;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, storage.getUserByClerkId(clerkUserId)];
                case 2:
                    user = _b.sent();
                    console.log("[AUTH] User lookup result:", user ? "Found user with ID ".concat(user.id) : "User not found");
                    return [3 /*break*/, 4];
                case 3:
                    dbError_1 = _b.sent();
                    console.error("[AUTH] Database error during user lookup:", dbError_1);
                    return [2 /*return*/, res.status(500).json({ message: "Database error during authentication" })];
                case 4:
                    if (!!user) return [3 /*break*/, 18];
                    console.log("[AUTH] User with Clerk ID ".concat(clerkUserId, " not found in database. Creating new user."));
                    // Log headers to see what information is available
                    console.log("[AUTH] Request headers:", JSON.stringify(req.headers, null, 2));
                    // Fetch user details from Clerk
                    console.log("[AUTH] Fetching user details from Clerk for ID ".concat(clerkUserId));
                    email = '';
                    firstName = '';
                    lastName = '';
                    _b.label = 5;
                case 5:
                    _b.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, clerkClient.users.getUser(clerkUserId)];
                case 6:
                    clerkUser_1 = _b.sent();
                    // Extract user information from Clerk
                    if (clerkUser_1) {
                        // Get primary email if available
                        if (clerkUser_1.emailAddresses && clerkUser_1.emailAddresses.length > 0) {
                            primaryEmail = clerkUser_1.emailAddresses.find(function (email) { return email.id === clerkUser_1.primaryEmailAddressId; });
                            email = primaryEmail ? primaryEmail.emailAddress : clerkUser_1.emailAddresses[0].emailAddress;
                        }
                        firstName = clerkUser_1.firstName || '';
                        lastName = clerkUser_1.lastName || '';
                        console.log("[AUTH] Successfully fetched user details from Clerk - Email: ".concat(email, ", First Name: ").concat(firstName, ", Last Name: ").concat(lastName));
                    }
                    return [3 /*break*/, 8];
                case 7:
                    clerkError_1 = _b.sent();
                    console.error("[AUTH] Error fetching user details from Clerk:", clerkError_1);
                    return [3 /*break*/, 8];
                case 8:
                    // Create a new user with the Clerk ID
                    console.log("[AUTH] About to create user with Clerk ID ".concat(clerkUserId));
                    _b.label = 9;
                case 9:
                    _b.trys.push([9, 11, , 18]);
                    return [4 /*yield*/, storage.createUserWithClerkId(clerkUserId, email, firstName, lastName)];
                case 10:
                    user = _b.sent();
                    console.log("[AUTH] Created new user with ID ".concat(user.id, " for Clerk ID ").concat(clerkUserId));
                    return [3 /*break*/, 18];
                case 11:
                    createError_1 = _b.sent();
                    // Enhanced error logging
                    console.error("[AUTH] Failed to create user for Clerk ID ".concat(clerkUserId, ":"), createError_1);
                    console.error("[AUTH] Error details:", {
                        message: (createError_1 === null || createError_1 === void 0 ? void 0 : createError_1.message) || 'Unknown error',
                        name: createError_1 === null || createError_1 === void 0 ? void 0 : createError_1.name,
                        stack: createError_1 === null || createError_1 === void 0 ? void 0 : createError_1.stack,
                        code: createError_1 === null || createError_1 === void 0 ? void 0 : createError_1.code
                    });
                    if (!(((_a = createError_1 === null || createError_1 === void 0 ? void 0 : createError_1.message) === null || _a === void 0 ? void 0 : _a.includes('duplicate key')) || (createError_1 === null || createError_1 === void 0 ? void 0 : createError_1.code) === '23505')) return [3 /*break*/, 16];
                    console.log("[AUTH] Possible race condition detected. Trying to fetch user again.");
                    _b.label = 12;
                case 12:
                    _b.trys.push([12, 14, , 15]);
                    return [4 /*yield*/, storage.getUserByClerkId(clerkUserId)];
                case 13:
                    // Try to fetch the user again in case it was created in another request
                    user = _b.sent();
                    if (user) {
                        console.log("[AUTH] Successfully retrieved user after race condition: ".concat(user.id));
                    }
                    else {
                        return [2 /*return*/, res.status(500).json({ message: "Failed to create or retrieve user account" })];
                    }
                    return [3 /*break*/, 15];
                case 14:
                    retryError_1 = _b.sent();
                    console.error("[AUTH] Failed to retrieve user after race condition:", retryError_1);
                    return [2 /*return*/, res.status(500).json({ message: "Failed to create user account (duplicate key)" })];
                case 15: return [3 /*break*/, 17];
                case 16: return [2 /*return*/, res.status(500).json({ message: "Failed to create user account" })];
                case 17: return [3 /*break*/, 18];
                case 18:
                    // Attach the user to the request object for use in route handlers
                    if (!user) {
                        console.error("[AUTH] CRITICAL ERROR: User is still undefined after all attempts");
                        return [2 /*return*/, res.status(500).json({ message: "Failed to authenticate user" })];
                    }
                    console.log("[AUTH] Successfully authenticated user ".concat(user.id, " (Clerk ID: ").concat(clerkUserId, ")"));
                    req.user = user;
                    // Continue to the next middleware or route handler
                    next();
                    return [3 /*break*/, 20];
                case 19:
                    error_1 = _b.sent();
                    console.error("[AUTH] Unhandled error in auth middleware:", error_1);
                    console.error("[AUTH] Error details:", {
                        message: error_1 instanceof Error ? error_1.message : "Unknown error",
                        name: error_1 instanceof Error ? error_1.name : "Unknown",
                        stack: error_1 instanceof Error ? error_1.stack : "No stack trace"
                    });
                    return [2 /*return*/, res.status(500).json({ message: "Internal Server Error during authentication" })];
                case 20: return [2 /*return*/];
            }
        });
    }); };
}
