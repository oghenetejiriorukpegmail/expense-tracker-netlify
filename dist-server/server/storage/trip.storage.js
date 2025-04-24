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
import * as schema from '../../shared/schema.js';
import { eq, and, desc } from 'drizzle-orm';
// Trip methods extracted from SupabaseStorage
export function getTrip(db, id) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db.select().from(schema.trips).where(eq(schema.trips.id, id)).limit(1)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result[0]];
            }
        });
    });
}
export function getTripsByUserId(db, userId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, db.select().from(schema.trips).where(eq(schema.trips.userId, userId)).orderBy(desc(schema.trips.createdAt))];
        });
    });
}
export function createTrip(db, tripData) {
    return __awaiter(this, void 0, void 0, function () {
        var dataToInsert, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("[TRIP_STORAGE] Creating trip with data:", tripData);
                    if (!tripData.name) {
                        console.error("[TRIP_STORAGE] Trip creation failed: Trip name is required");
                        throw new Error("Trip name is required");
                    }
                    console.log("[TRIP_STORAGE] Database instance type:", typeof db);
                    console.log("[TRIP_STORAGE] Database has insert method:", typeof db.insert === 'function');
                    dataToInsert = __assign(__assign({ description: '' }, tripData), { createdAt: new Date(), updatedAt: new Date() });
                    console.log("[TRIP_STORAGE] Prepared data to insert:", dataToInsert);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, db.insert(schema.trips).values(dataToInsert).returning()];
                case 2:
                    result = _a.sent();
                    console.log("[TRIP_STORAGE] Trip created successfully:", result[0]);
                    return [2 /*return*/, result[0]];
                case 3:
                    error_1 = _a.sent();
                    console.error("[TRIP_STORAGE] Error inserting trip into database:", error_1);
                    if (error_1 instanceof Error) {
                        console.error("[TRIP_STORAGE] Error stack:", error_1.stack);
                    }
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
export function updateTrip(db, id, tripData) {
    return __awaiter(this, void 0, void 0, function () {
        var dataToUpdate, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dataToUpdate = __assign(__assign({}, tripData), { updatedAt: new Date() });
                    return [4 /*yield*/, db.update(schema.trips)
                            .set(dataToUpdate)
                            .where(eq(schema.trips.id, id))
                            .returning()];
                case 1:
                    result = _a.sent();
                    if (result.length === 0) {
                        throw new Error("Trip with ID ".concat(id, " not found"));
                    }
                    return [2 /*return*/, result[0]];
            }
        });
    });
}
export function deleteTrip(db, id) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db.transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                        var trip;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, tx.select({ name: schema.trips.name, userId: schema.trips.userId })
                                        .from(schema.trips)
                                        .where(eq(schema.trips.id, id))
                                        .limit(1)];
                                case 1:
                                    trip = _a.sent();
                                    if (!trip[0]) {
                                        throw new Error("Trip with ID ".concat(id, " not found"));
                                    }
                                    // Delete associated expenses first using the internal user ID
                                    return [4 /*yield*/, tx.delete(schema.expenses).where(and(eq(schema.expenses.userId, trip[0].userId), eq(schema.expenses.tripName, trip[0].name)))];
                                case 2:
                                    // Delete associated expenses first using the internal user ID
                                    _a.sent();
                                    // Now delete the trip
                                    return [4 /*yield*/, tx.delete(schema.trips).where(eq(schema.trips.id, id))];
                                case 3:
                                    // Now delete the trip
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
