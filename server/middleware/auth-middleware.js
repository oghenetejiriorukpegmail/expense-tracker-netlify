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
exports.createAuthMiddleware = createAuthMiddleware;
var firebase_admin_1 = require("firebase-admin");
var app_1 = require("firebase-admin/app");
// Initialize Firebase Admin if not already initialized
if (!(0, app_1.getApps)().length) {
    // Initialize the Firebase Admin SDK
    var serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
    if (!serviceAccount.project_id) {
        console.error("[AUTH] CRITICAL ERROR: Firebase service account not properly configured");
    }
    else {
        (0, app_1.initializeApp)({
            credential: (0, app_1.cert)(serviceAccount),
        });
    }
}
// Create a middleware function that verifies authentication and attaches user data
function createAuthMiddleware(storage) {
    var _this = this;
    return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var authHeader, token, decodedToken, tokenError_1, firebaseUserId, user, dbError_1, email, name, firstName, lastName, createError_1, retryError_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 9, , 10]);
                    console.log("[AUTH] Processing request:", req.method, req.path);
                    // Verify storage is valid
                    if (!storage) {
                        console.error("[AUTH] CRITICAL ERROR: Storage is undefined in auth middleware");
                        return [2 /*return*/, res.status(500).json({ message: "Server configuration error: Storage not initialized" })];
                    }
                    authHeader = req.headers.authorization;
                    // If no auth header, return unauthorized
                    if (!authHeader || !authHeader.startsWith('Bearer ')) {
                        console.log("[AUTH] No Authorization header found or not Bearer.");
                        return [2 /*return*/, res.status(401).json({ message: "Unauthorized: Authorization header missing or invalid" })];
                    }
                    token = authHeader.split('Bearer ')[1];
                    decodedToken = void 0;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, firebase_admin_1.auth().verifyIdToken(token)];
                case 2:
                    decodedToken = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    tokenError_1 = _a.sent();
                    console.error("[AUTH] Invalid Firebase token:", tokenError_1);
                    return [2 /*return*/, res.status(401).json({ message: "Unauthorized: Invalid token" })];
                case 4:
                    firebaseUserId = decodedToken.uid;
                    console.log("[AUTH] Authenticated with Firebase user ID:", firebaseUserId);
                    console.log("[AUTH] Fetching user from database with Firebase ID:", firebaseUserId);
                    user = void 0;
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, storage.getUserByFirebaseId(firebaseUserId)];
                case 6:
                    user = _a.sent();
                    console.log("[AUTH] User lookup result:", user ? "Found user with ID ".concat(user.id) : "User not found");
                    return [3 /*break*/, 8];
                case 7:
                    dbError_1 = _a.sent();
                    console.error("[AUTH] Database error during user lookup:", dbError_1);
                    return [2 /*return*/, res.status(500).json({ message: "Database error during authentication" })];
                case 8:
                    // If user not found in our database, create a new user
                    if (!user) {
                        console.log("[AUTH] User with Firebase ID ".concat(firebaseUserId, " not found in database. Creating new user."));
                        // Extract user information from the decoded token
                        email = decodedToken.email || '';
                        name = decodedToken.name || '';
                        // Split name into first and last name if available
                        firstName = '';
                        lastName = '';
                        if (name) {
                            var nameParts = name.split(' ');
                            firstName = nameParts[0] || '';
                            lastName = nameParts.slice(1).join(' ') || '';
                        }
                        // Create a new user with the Firebase ID
                        console.log("[AUTH] About to create user with Firebase ID ".concat(firebaseUserId));
                        try {
                            user = storage.createUserWithFirebaseId(firebaseUserId, email, firstName, lastName);
                            console.log("[AUTH] Created new user with ID ".concat(user.id, " for Firebase ID ").concat(firebaseUserId));
                        }
                        catch (createError_1) {
                            // Enhanced error logging
                            console.error("[AUTH] Failed to create user for Firebase ID ".concat(firebaseUserId, ":"), createError_1);
                            console.error("[AUTH] Error details:", {
                                message: createError_1 === null || createError_1 === void 0 ? void 0 : createError_1.message || 'Unknown error',
                                name: createError_1 === null || createError_1 === void 0 ? void 0 : createError_1.name,
                                stack: createError_1 === null || createError_1 === void 0 ? void 0 : createError_1.stack,
                                code: createError_1 === null || createError_1 === void 0 ? void 0 : createError_1.code
                            });
                            // Check if it's a duplicate key error (user might have been created in a race condition)
                            if ((createError_1 === null || createError_1 === void 0 ? void 0 : createError_1.message.includes('duplicate key')) || (createError_1 === null || createError_1 === void 0 ? void 0 : createError_1.code) === '23505') {
                                console.log("[AUTH] Possible race condition detected. Trying to fetch user again.");
                                try {
                                    // Try to fetch the user again in case it was created in another request
                                    user = storage.getUserByFirebaseId(firebaseUserId);
                                    if (user) {
                                        console.log("[AUTH] Successfully retrieved user after race condition: ".concat(user.id));
                                    }
                                    else {
                                        return [2 /*return*/, res.status(500).json({ message: "Failed to create or retrieve user account" })];
                                    }
                                }
                                catch (retryError_1) {
                                    console.error("[AUTH] Failed to retrieve user after race condition:", retryError_1);
                                    return [2 /*return*/, res.status(500).json({ message: "Failed to create user account (duplicate key)" })];
                                }
                            }
                            else {
                                return [2 /*return*/, res.status(500).json({ message: "Failed to create user account" })];
                            }
                        }
                    }
                    // Attach the user to the request object for use in route handlers
                    if (!user) {
                        console.error("[AUTH] CRITICAL ERROR: User is still undefined after all attempts");
                        return [2 /*return*/, res.status(500).json({ message: "Failed to authenticate user" })];
                    }
                    console.log("[AUTH] Successfully authenticated user ".concat(user.id, " (Firebase ID: ").concat(firebaseUserId, ")"));
                    // Attach the user to the request object for use in route handlers
                    req.user = user;
                    // Continue to the next middleware or route handler
                    next();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error("Auth Middleware Catch Error:", error_1);
                    return [2 /*return*/, res.status(500).json({ message: "Internal Server Error during authentication" })];
                case 3: return [2 /*return*/];
            }
        });
    }); };
}
