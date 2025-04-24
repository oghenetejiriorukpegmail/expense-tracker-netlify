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
import express from "express";
import { z } from "zod";
export function createProfileRouter(storage) {
    var _this = this;
    var router = express.Router();
    // GET /api/profile
    router.get("/", function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var authReq, userProfile;
        return __generator(this, function (_a) {
            authReq = req;
            try {
                userProfile = authReq.user;
                // Return the user profile
                res.json(userProfile);
            }
            catch (error) {
                next(error);
            }
            return [2 /*return*/];
        });
    }); });
    // PUT /api/profile
    var profileUpdateSchema = z.object({
        firstName: z.string().min(1, "First name cannot be empty").default(''),
        lastName: z.string().optional().default(''),
        phoneNumber: z.string().optional().default(''),
        email: z.string().email("Invalid email address"), // Clerk manages email, consider if this should be updatable here
        bio: z.string().optional(),
    });
    router.put("/", function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var authReq, validatedData, userProfile, internalUserId, existingUserByEmail, updatedUser, password, profileData, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    authReq = req;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    validatedData = profileUpdateSchema.parse(req.body);
                    userProfile = authReq.user;
                    internalUserId = userProfile.id;
                    if (!(validatedData.email && validatedData.email !== userProfile.email)) return [3 /*break*/, 3];
                    return [4 /*yield*/, storage.getUserByEmail(validatedData.email)];
                case 2:
                    existingUserByEmail = _a.sent();
                    if (existingUserByEmail && existingUserByEmail.id !== internalUserId) {
                        return [2 /*return*/, res.status(409).json({ message: "Email already in use by another account." })];
                    }
                    _a.label = 3;
                case 3: return [4 /*yield*/, storage.updateUserProfile(internalUserId, validatedData)];
                case 4:
                    updatedUser = _a.sent();
                    if (!updatedUser)
                        return [2 /*return*/, res.status(404).send("User not found after update attempt")];
                    password = updatedUser.password, profileData = __rest(updatedUser, ["password"]);
                    res.json(profileData);
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    if (error_1 instanceof z.ZodError)
                        return [2 /*return*/, res.status(400).json({ message: "Validation failed", errors: error_1.errors })];
                    // Removed UNIQUE constraint check as email uniqueness might be handled differently
                    next(error_1);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    // POST /api/profile/change-password - This should be handled by Clerk UI/API, not a custom endpoint
    // router.post("/change-password", ... ); // Removed
    return router;
}
