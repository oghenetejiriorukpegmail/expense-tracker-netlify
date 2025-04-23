"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMileageLogById = getMileageLogById;
exports.getMileageLogsByUserId = getMileageLogsByUserId;
exports.createMileageLog = createMileageLog;
exports.updateMileageLog = updateMileageLog;
exports.deleteMileageLog = deleteMileageLog;
var schema = require("@shared/schema");
var drizzle_orm_1 = require("drizzle-orm");
// Mileage Log methods extracted from SupabaseStorage
function getMileageLogById(db, id) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db.select().from(schema.mileageLogs).where((0, drizzle_orm_1.eq)(schema.mileageLogs.id, id)).limit(1)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result[0]];
            }
        });
    });
}
function getMileageLogsByUserId(db, userId, options) {
    return __awaiter(this, void 0, void 0, function () {
        var conditions, sortBy, sortOrderFunc, sortColumn, query;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    conditions = [(0, drizzle_orm_1.eq)(schema.mileageLogs.userId, userId)];
                    if (options === null || options === void 0 ? void 0 : options.tripId) {
                        conditions.push((0, drizzle_orm_1.eq)(schema.mileageLogs.tripId, options.tripId));
                    }
                    if (options === null || options === void 0 ? void 0 : options.startDate) {
                        conditions.push((0, drizzle_orm_1.gte)(schema.mileageLogs.tripDate, new Date(options.startDate)));
                    }
                    if (options === null || options === void 0 ? void 0 : options.endDate) {
                        conditions.push((0, drizzle_orm_1.lte)(schema.mileageLogs.tripDate, new Date(options.endDate)));
                    }
                    sortBy = (options === null || options === void 0 ? void 0 : options.sortBy) || 'tripDate';
                    sortOrderFunc = (options === null || options === void 0 ? void 0 : options.sortOrder) === 'asc' ? drizzle_orm_1.asc : drizzle_orm_1.desc;
                    sortColumn = (_a = schema.mileageLogs[sortBy]) !== null && _a !== void 0 ? _a : schema.mileageLogs.tripDate;
                    query = db.select().from(schema.mileageLogs).where(drizzle_orm_1.and.apply(void 0, conditions)).orderBy(sortOrderFunc(sortColumn));
                    if ((options === null || options === void 0 ? void 0 : options.limit) !== undefined) {
                        query = query.limit(options.limit);
                    }
                    if ((options === null || options === void 0 ? void 0 : options.offset) !== undefined) {
                        query = query.offset(options.offset);
                    }
                    return [4 /*yield*/, query];
                case 1: return [2 /*return*/, _b.sent()];
            }
        });
    });
}
function createMileageLog(db, logData) {
    return __awaiter(this, void 0, void 0, function () {
        var dataToInsert, result;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    if (logData.startOdometer === undefined || logData.endOdometer === undefined || logData.tripDate === undefined || logData.entryMethod === undefined) {
                        throw new Error("Missing required fields for mileage log creation.");
                    }
                    dataToInsert = __assign(__assign({}, logData), { startOdometer: String(logData.startOdometer), endOdometer: String(logData.endOdometer), calculatedDistance: String(logData.calculatedDistance), tripId: (_a = logData.tripId) !== null && _a !== void 0 ? _a : null, purpose: (_b = logData.purpose) !== null && _b !== void 0 ? _b : null, startImageUrl: (_c = logData.startImageUrl) !== null && _c !== void 0 ? _c : null, endImageUrl: (_d = logData.endImageUrl) !== null && _d !== void 0 ? _d : null, createdAt: new Date(), updatedAt: new Date() });
                    return [4 /*yield*/, db.insert(schema.mileageLogs).values(dataToInsert).returning()];
                case 1:
                    result = _e.sent();
                    return [2 /*return*/, result[0]];
            }
        });
    });
}
function updateMileageLog(db, id, logData) {
    return __awaiter(this, void 0, void 0, function () {
        var dataToUpdate, result;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    dataToUpdate = {};
                    if (logData.tripId !== undefined)
                        dataToUpdate.tripId = (_a = logData.tripId) !== null && _a !== void 0 ? _a : null;
                    if (logData.tripDate !== undefined)
                        dataToUpdate.tripDate = logData.tripDate;
                    if (logData.startOdometer !== undefined)
                        dataToUpdate.startOdometer = String(logData.startOdometer);
                    if (logData.endOdometer !== undefined)
                        dataToUpdate.endOdometer = String(logData.endOdometer);
                    if (logData.calculatedDistance !== undefined)
                        dataToUpdate.calculatedDistance = String(logData.calculatedDistance);
                    if (logData.purpose !== undefined)
                        dataToUpdate.purpose = (_b = logData.purpose) !== null && _b !== void 0 ? _b : null;
                    if (logData.startImageUrl !== undefined)
                        dataToUpdate.startImageUrl = (_c = logData.startImageUrl) !== null && _c !== void 0 ? _c : null;
                    if (logData.endImageUrl !== undefined)
                        dataToUpdate.endImageUrl = (_d = logData.endImageUrl) !== null && _d !== void 0 ? _d : null;
                    if (logData.entryMethod !== undefined)
                        dataToUpdate.entryMethod = logData.entryMethod;
                    dataToUpdate.updatedAt = new Date();
                    return [4 /*yield*/, db.update(schema.mileageLogs)
                            .set(dataToUpdate)
                            .where((0, drizzle_orm_1.eq)(schema.mileageLogs.id, id))
                            .returning()];
                case 1:
                    result = _e.sent();
                    if (result.length === 0) {
                        throw new Error("Mileage log with ID ".concat(id, " not found"));
                    }
                    return [2 /*return*/, result[0]];
            }
        });
    });
}
function deleteMileageLog(db, id) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db.delete(schema.mileageLogs).where((0, drizzle_orm_1.eq)(schema.mileageLogs.id, id)).returning({ id: schema.mileageLogs.id })];
                case 1:
                    result = _a.sent();
                    if (result.length === 0) {
                        console.warn("Attempted to delete non-existent mileage log with ID ".concat(id));
                    }
                    return [2 /*return*/];
            }
        });
    });
}
