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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = getUserById;
exports.getUserByUsername = getUserByUsername;
exports.getUserByClerkId = getUserByClerkId;
exports.getUserByEmail = getUserByEmail;
exports.updateUserProfile = updateUserProfile;
exports.createUserWithClerkId = createUserWithClerkId;
var schema = require("@shared/schema");
var drizzle_orm_1 = require("drizzle-orm");
var uuid_1 = require("uuid");
// User methods extracted from SupabaseStorage
function getUserById(db, id) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db.select().from(schema.users).where((0, drizzle_orm_1.eq)(schema.users.id, id)).limit(1)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result[0]];
            }
        });
    });
}
function getUserByUsername(db, username) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db.select().from(schema.users).where((0, drizzle_orm_1.eq)(schema.users.username, username)).limit(1)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result[0]];
            }
        });
    });
}
function getUserByClerkId(db, clerkUserId) {
    return __awaiter(this, void 0, void 0, function () {
        var result, userFromDb, user;
        var _a, _b, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0: return [4 /*yield*/, db.select({
                        id: schema.users.id,
                        authUserId: schema.users.authUserId,
                        username: schema.users.username,
                        email: schema.users.email,
                        firstName: schema.users.firstName,
                        lastName: schema.users.lastName,
                        phoneNumber: schema.users.phoneNumber,
                        bio: schema.users.bio,
                        createdAt: schema.users.createdAt,
                    }).from(schema.users).where((0, drizzle_orm_1.eq)(schema.users.authUserId, clerkUserId)).limit(1)];
                case 1:
                    result = _g.sent();
                    userFromDb = result[0];
                    if (!userFromDb) {
                        return [2 /*return*/, undefined];
                    }
                    user = {
                        id: userFromDb.id,
                        authUserId: userFromDb.authUserId,
                        username: (_a = userFromDb.username) !== null && _a !== void 0 ? _a : null,
                        email: (_b = userFromDb.email) !== null && _b !== void 0 ? _b : null,
                        firstName: (_c = userFromDb.firstName) !== null && _c !== void 0 ? _c : null,
                        lastName: (_d = userFromDb.lastName) !== null && _d !== void 0 ? _d : null,
                        phoneNumber: (_e = userFromDb.phoneNumber) !== null && _e !== void 0 ? _e : null,
                        bio: (_f = userFromDb.bio) !== null && _f !== void 0 ? _f : null,
                        createdAt: userFromDb.createdAt,
                    };
                    return [2 /*return*/, user];
            }
        });
    });
}
function getUserByEmail(db, email) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db.select().from(schema.users).where((0, drizzle_orm_1.eq)(schema.users.email, email)).limit(1)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result[0]];
            }
        });
    });
}
function updateUserProfile(db, userId, profileData) {
    return __awaiter(this, void 0, void 0, function () {
        var updateData, result;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    updateData = {};
                    if (profileData.firstName !== undefined)
                        updateData.firstName = profileData.firstName;
                    if (profileData.lastName !== undefined)
                        updateData.lastName = (_a = profileData.lastName) !== null && _a !== void 0 ? _a : '';
                    if (profileData.phoneNumber !== undefined)
                        updateData.phoneNumber = (_b = profileData.phoneNumber) !== null && _b !== void 0 ? _b : '';
                    if (profileData.email !== undefined)
                        updateData.email = profileData.email;
                    if (profileData.bio !== undefined)
                        updateData.bio = (_c = profileData.bio) !== null && _c !== void 0 ? _c : null;
                    return [4 /*yield*/, db.update(schema.users)
                            .set(updateData)
                            .where((0, drizzle_orm_1.eq)(schema.users.id, userId))
                            .returning()];
                case 1:
                    result = _d.sent();
                    if (result.length === 0) {
                        return [2 /*return*/, undefined];
                    }
                    return [2 /*return*/, result[0]];
            }
        });
    });
}
// Create a new user with Clerk ID
function createUserWithClerkId(db_1, clerkUserId_1) {
    return __awaiter(this, arguments, void 0, function (db, clerkUserId, email, firstName, lastName) {
        var username, password, userData, result, user, _, publicUser, error_1;
        var _a;
        if (email === void 0) { email = ''; }
        if (firstName === void 0) { firstName = ''; }
        if (lastName === void 0) { lastName = ''; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    username = email ? email.split('@')[0] + '-' + Math.floor(Math.random() * 10000) : 'user-' + (0, uuid_1.v4)().substring(0, 8);
                    password = (0, uuid_1.v4)();
                    userData = {
                        username: username,
                        password: password,
                        email: email || "".concat(username, "@example.com"), // Fallback email if none provided
                        firstName: firstName || '',
                        lastName: lastName || '',
                        phoneNumber: '',
                        authUserId: clerkUserId,
                    };
                    // DIAGNOSTIC LOG: Log the user data being inserted
                    console.log("DIAGNOSTIC - User creation data:", {
                        attemptedColumns: Object.keys(userData),
                        passwordIncluded: userData.hasOwnProperty('password'),
                        clerkUserId: clerkUserId,
                        username: username,
                        email: userData.email
                    });
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, db.insert(schema.users)
                            .values(userData)
                            .returning()];
                case 2:
                    result = _b.sent();
                    if (!result.length) {
                        throw new Error('Failed to create user');
                    }
                    user = result[0];
                    _ = user.password, publicUser = __rest(user, ["password"]);
                    return [2 /*return*/, publicUser];
                case 3:
                    error_1 = _b.sent();
                    // DIAGNOSTIC LOG: Enhanced error logging
                    console.error("DIAGNOSTIC - User creation error details:", {
                        error: ((_a = error_1 === null || error_1 === void 0 ? void 0 : error_1.toString) === null || _a === void 0 ? void 0 : _a.call(error_1)) || 'Unknown error',
                        errorObject: JSON.stringify(error_1, Object.getOwnPropertyNames(error_1 || {})),
                        query: (error_1 === null || error_1 === void 0 ? void 0 : error_1.query) || 'Query not available',
                        params: (error_1 === null || error_1 === void 0 ? void 0 : error_1.params) || 'Params not available',
                        code: (error_1 === null || error_1 === void 0 ? void 0 : error_1.code) || 'Code not available'
                    });
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
