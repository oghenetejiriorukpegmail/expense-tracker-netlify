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
exports.createMileageLogRouter = createMileageLogRouter;
var express_1 = require("express");
var zod_1 = require("zod");
var schema_1 = require("@shared/schema");
var multer_config_1 = require("../middleware/multer-config"); // Assuming multer config is still needed
var uuid_1 = require("uuid"); // Import uuid
var config_1 = require("../config"); // Import config loading
var ocr_1 = require("../util/ocr"); // Import OCR function and OcrProvider type
function createMileageLogRouter(storage) {
    var _this = this;
    var router = express_1.default.Router();
    // GET /api/mileage-logs
    router.get("/", function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var authReq, userProfile, internalUserId, querySchema, validatedQuery, logs, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    authReq = req;
                    userProfile = authReq.user;
                    internalUserId = userProfile.id;
                    querySchema = zod_1.z.object({
                        tripId: zod_1.z.coerce.number().int().positive().optional(), startDate: zod_1.z.string().optional(), endDate: zod_1.z.string().optional(),
                        limit: zod_1.z.coerce.number().int().positive().optional(), offset: zod_1.z.coerce.number().int().min(0).optional(),
                        sortBy: zod_1.z.string().optional(), sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
                    });
                    validatedQuery = querySchema.parse(req.query);
                    return [4 /*yield*/, storage.getMileageLogsByUserId(internalUserId, validatedQuery)];
                case 1:
                    logs = _a.sent();
                    res.json(logs);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    if (error_1 instanceof zod_1.z.ZodError)
                        return [2 /*return*/, res.status(400).json({ message: "Invalid query parameters", errors: error_1.errors })];
                    next(error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // POST /api/mileage-logs
    router.post("/", function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var authReq, userProfile, internalUserId, validatedData, calculatedDistance, newLog, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    authReq = req;
                    userProfile = authReq.user;
                    internalUserId = userProfile.id;
                    validatedData = schema_1.insertMileageLogSchema.parse(req.body);
                    calculatedDistance = validatedData.endOdometer - validatedData.startOdometer;
                    if (calculatedDistance <= 0)
                        return [2 /*return*/, res.status(400).json({ message: "Calculated distance must be positive." })];
                    return [4 /*yield*/, storage.createMileageLog(__assign(__assign({}, validatedData), { userId: internalUserId, calculatedDistance: calculatedDistance }))];
                case 1:
                    newLog = _a.sent();
                    res.status(201).json(newLog);
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    if (error_2 instanceof zod_1.z.ZodError)
                        return [2 /*return*/, res.status(400).json({ message: "Validation failed", errors: error_2.errors })];
                    next(error_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // PUT /api/mileage-logs/:id
    router.put("/:id", function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var authReq, userProfile, internalUserId, logId, existingLog_1, updateSchema, validatedData, calculatedDistance, startOdo, endOdo, updatePayload, finalUpdatePayload, updatedLog, error_3;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 7, , 8]);
                    authReq = req;
                    userProfile = authReq.user;
                    internalUserId = userProfile.id;
                    logId = parseInt(req.params.id);
                    if (isNaN(logId))
                        return [2 /*return*/, res.status(400).send("Invalid mileage log ID")];
                    return [4 /*yield*/, storage.getMileageLogById(logId)];
                case 1:
                    existingLog_1 = _c.sent();
                    if (!existingLog_1)
                        return [2 /*return*/, res.status(404).send("Mileage log not found")];
                    if (existingLog_1.userId !== internalUserId)
                        return [2 /*return*/, res.status(403).send("Forbidden")];
                    updateSchema = schema_1.rawInsertMileageLogSchema.partial().extend({
                        startOdometer: zod_1.z.number().positive().optional(), endOdometer: zod_1.z.number().positive().optional(), tripId: zod_1.z.number().int().positive().optional(),
                        startImageUrl: zod_1.z.string().url().optional().nullable(), endImageUrl: zod_1.z.string().url().optional().nullable(), entryMethod: zod_1.z.enum(['manual', 'ocr']).optional(),
                    }).refine(function (data) {
                        if (data.startOdometer !== undefined && data.endOdometer !== undefined)
                            return data.endOdometer > data.startOdometer;
                        if (data.startOdometer !== undefined && existingLog_1.endOdometer !== null)
                            return parseFloat(existingLog_1.endOdometer) > data.startOdometer;
                        if (data.endOdometer !== undefined && existingLog_1.startOdometer !== null)
                            return data.endOdometer > parseFloat(existingLog_1.startOdometer);
                        return true;
                    }, { message: "End odometer must be greater than start", path: ["endOdometer"] });
                    validatedData = updateSchema.parse(req.body);
                    calculatedDistance = undefined;
                    startOdo = (_a = validatedData.startOdometer) !== null && _a !== void 0 ? _a : parseFloat(existingLog_1.startOdometer);
                    endOdo = (_b = validatedData.endOdometer) !== null && _b !== void 0 ? _b : parseFloat(existingLog_1.endOdometer);
                    if (validatedData.startOdometer !== undefined || validatedData.endOdometer !== undefined) {
                        calculatedDistance = endOdo - startOdo;
                        if (calculatedDistance <= 0)
                            return [2 /*return*/, res.status(400).json({ message: "Calculated distance must be positive." })];
                    }
                    if (!(validatedData.startImageUrl === null && existingLog_1.startImageUrl)) return [3 /*break*/, 3];
                    console.log("Deleting old start image ".concat(existingLog_1.startImageUrl, " from Supabase."));
                    return [4 /*yield*/, storage.deleteFile(existingLog_1.startImageUrl).catch(function (e) { return console.error("Failed to delete old Supabase start image:", e); })];
                case 2:
                    _c.sent();
                    _c.label = 3;
                case 3:
                    if (!(validatedData.endImageUrl === null && existingLog_1.endImageUrl)) return [3 /*break*/, 5];
                    console.log("Deleting old end image ".concat(existingLog_1.endImageUrl, " from Supabase."));
                    return [4 /*yield*/, storage.deleteFile(existingLog_1.endImageUrl).catch(function (e) { return console.error("Failed to delete old Supabase end image:", e); })];
                case 4:
                    _c.sent();
                    _c.label = 5;
                case 5:
                    updatePayload = __assign(__assign({}, validatedData), { calculatedDistance: calculatedDistance !== undefined ? String(calculatedDistance) : undefined });
                    finalUpdatePayload = __assign(__assign({}, updatePayload), { calculatedDistance: updatePayload.calculatedDistance !== undefined ? parseFloat(updatePayload.calculatedDistance) : undefined });
                    return [4 /*yield*/, storage.updateMileageLog(logId, finalUpdatePayload)];
                case 6:
                    updatedLog = _c.sent();
                    res.json(updatedLog);
                    return [3 /*break*/, 8];
                case 7:
                    error_3 = _c.sent();
                    if (error_3 instanceof zod_1.z.ZodError)
                        return [2 /*return*/, res.status(400).json({ message: "Validation failed", errors: error_3.errors })];
                    next(error_3);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); });
    // DELETE /api/mileage-logs/:id
    router.delete("/:id", function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var authReq, userProfile, internalUserId, logId_1, log, deleteSupabaseImage, error_4;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    authReq = req;
                    userProfile = authReq.user;
                    internalUserId = userProfile.id;
                    logId_1 = parseInt(req.params.id);
                    if (isNaN(logId_1))
                        return [2 /*return*/, res.status(400).send("Invalid mileage log ID")];
                    return [4 /*yield*/, storage.getMileageLogById(logId_1)];
                case 1:
                    log = _a.sent();
                    if (!log)
                        return [2 /*return*/, res.status(404).send("Mileage log not found")];
                    if (log.userId !== internalUserId)
                        return [2 /*return*/, res.status(403).send("Forbidden")];
                    deleteSupabaseImage = function (imagePath) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!imagePath)
                                        return [2 /*return*/];
                                    console.log("Deleting image ".concat(imagePath, " from Supabase for mileage log ").concat(logId_1, "."));
                                    return [4 /*yield*/, storage.deleteFile(imagePath).catch(function (e) { return console.error("Error deleting Supabase image ".concat(imagePath, ":"), e); })];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); };
                    return [4 /*yield*/, deleteSupabaseImage(log.startImageUrl)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, deleteSupabaseImage(log.endImageUrl)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, storage.deleteMileageLog(logId_1)];
                case 4:
                    _a.sent();
                    res.status(204).send();
                    return [3 /*break*/, 6];
                case 5:
                    error_4 = _a.sent();
                    next(error_4);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    // POST /api/mileage-logs/upload-odometer-image
    router.post("/upload-odometer-image", multer_config_1.upload.single("odometerImage"), function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var authReq, userProfile, internalUserId, uniquePath, uploadResult, supabasePath, config, method, ocrResult, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    authReq = req;
                    userProfile = authReq.user;
                    internalUserId = userProfile.id;
                    if (!req.file)
                        return [2 /*return*/, res.status(400).send("No odometer image file uploaded")];
                    uniquePath = "odometer-images/".concat(internalUserId, "/").concat((0, uuid_1.v4)(), "-").concat(req.file.originalname);
                    return [4 /*yield*/, storage.uploadFile(uniquePath, req.file.buffer, req.file.mimetype)];
                case 1:
                    uploadResult = _a.sent();
                    supabasePath = uploadResult.path;
                    console.log("Uploaded odometer image to Supabase: ".concat(supabasePath));
                    config = (0, config_1.loadConfig)();
                    method = (config.defaultOcrMethod || "gemini");
                    console.log("Processing odometer image buffer (".concat(req.file.mimetype, ") using method: ").concat(method));
                    return [4 /*yield*/, (0, ocr_1.processOdometerImageWithAI)(req.file.buffer, req.file.mimetype, method)];
                case 2:
                    ocrResult = _a.sent();
                    if (!ocrResult.success) return [3 /*break*/, 3];
                    res.json({ success: true, imageUrl: supabasePath, reading: ocrResult.reading });
                    return [3 /*break*/, 5];
                case 3:
                    console.warn("Odometer OCR failed for ".concat(supabasePath, ": ").concat(ocrResult.error));
                    return [4 /*yield*/, storage.deleteFile(supabasePath).catch(function (e) { return console.error("Failed to delete Supabase file after OCR error:", e); })];
                case 4:
                    _a.sent();
                    res.status(400).json({ success: false, imageUrl: null, error: ocrResult.error || "Failed to extract reading." });
                    _a.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    error_5 = _a.sent();
                    console.error("Odometer image upload/OCR error:", error_5);
                    // Handle potential deletion if upload succeeded but OCR failed
                    // This requires careful state management or passing the path if available
                    next(error_5);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); });
    return router;
}
