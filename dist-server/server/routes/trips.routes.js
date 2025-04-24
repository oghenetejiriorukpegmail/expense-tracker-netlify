var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
import express from "express";
import { z } from "zod";
import { insertTripSchema } from "../../shared/schema.js";
export function createTripRouter(storage) {
    var _this = this;
    var router = express.Router();
    // GET /api/trips
    router.get("/", function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var authReq, userProfile, internalUserId, trips, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    authReq = req;
                    userProfile = authReq.user;
                    internalUserId = userProfile.id;
                    return [4 /*yield*/, storage.getTripsByUserId(internalUserId)];
                case 1:
                    trips = _a.sent();
                    res.json(trips);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    next(error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // POST /api/trips
    router.post("/", function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var authReq, userProfile, internalUserId, validatedData, trip, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    console.log("[TRIPS] POST /api/trips - Creating new trip");
                    authReq = req;
                    userProfile = authReq.user;
                    internalUserId = userProfile.id;
                    console.log("[TRIPS] User ID:", internalUserId);
                    console.log("[TRIPS] Request body:", req.body);
                    validatedData = insertTripSchema.parse(req.body);
                    console.log("[TRIPS] Validated data:", validatedData);
                    console.log("[TRIPS] Storage object type:", typeof storage);
                    console.log("[TRIPS] Storage has createTrip method:", typeof storage.createTrip === 'function');
                    return [4 /*yield*/, storage.createTrip(__assign(__assign({}, validatedData), { userId: internalUserId }))];
                case 1:
                    trip = _a.sent();
                    console.log("[TRIPS] Trip created successfully:", trip);
                    res.status(201).json(trip);
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error("[TRIPS] Error creating trip:", error_2);
                    if (error_2 instanceof Error) {
                        console.error("[TRIPS] Error stack:", error_2.stack);
                    }
                    if (error_2 instanceof z.ZodError)
                        return [2 /*return*/, res.status(400).json({ message: "Validation failed", errors: error_2.errors })];
                    next(error_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // PUT /api/trips/:id
    router.put("/:id", function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var authReq, userProfile, internalUserId, tripId, trip, validatedData, updatedTrip, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    authReq = req;
                    userProfile = authReq.user;
                    internalUserId = userProfile.id;
                    tripId = parseInt(req.params.id);
                    if (isNaN(tripId))
                        return [2 /*return*/, res.status(400).send("Invalid trip ID")];
                    return [4 /*yield*/, storage.getTrip(tripId)];
                case 1:
                    trip = _a.sent();
                    if (!trip)
                        return [2 /*return*/, res.status(404).send("Trip not found")];
                    if (trip.userId !== internalUserId)
                        return [2 /*return*/, res.status(403).send("Forbidden")];
                    validatedData = insertTripSchema.parse(req.body);
                    return [4 /*yield*/, storage.updateTrip(tripId, validatedData)];
                case 2:
                    updatedTrip = _a.sent();
                    res.json(updatedTrip);
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _a.sent();
                    if (error_3 instanceof z.ZodError)
                        return [2 /*return*/, res.status(400).json({ message: "Validation failed", errors: error_3.errors })];
                    next(error_3);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    // DELETE /api/trips/:id
    router.delete("/:id", function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var authReq, userProfile, internalUserId, tripId, trip, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    authReq = req;
                    userProfile = authReq.user;
                    internalUserId = userProfile.id;
                    tripId = parseInt(req.params.id);
                    if (isNaN(tripId))
                        return [2 /*return*/, res.status(400).send("Invalid trip ID")];
                    return [4 /*yield*/, storage.getTrip(tripId)];
                case 1:
                    trip = _a.sent();
                    if (!trip)
                        return [2 /*return*/, res.status(404).send("Trip not found")];
                    if (trip.userId !== internalUserId)
                        return [2 /*return*/, res.status(403).send("Forbidden")];
                    return [4 /*yield*/, storage.deleteTrip(tripId)];
                case 2:
                    _a.sent();
                    res.status(204).send();
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _a.sent();
                    next(error_4);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    // Note: Batch process receipts route removed as it's complex and might need rethinking with background functions
    return router;
}
