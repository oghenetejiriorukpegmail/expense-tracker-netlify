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
exports.createExpenseRouter = createExpenseRouter;
var express_1 = require("express");
var zod_1 = require("zod");
var schema_1 = require("@shared/schema");
var multer_config_1 = require("../middleware/multer-config"); // Assuming multer config is still needed
var uuid_1 = require("uuid"); // Import uuid
var config_1 = require("../config"); // Import config loading
function createExpenseRouter(storage) {
    var _this = this;
    var router = express_1.default.Router();
    // GET /api/expenses
    router.get("/", function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var authReq, userProfile, internalUserId, tripName, expenses, _a, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    authReq = req;
                    userProfile = authReq.user;
                    internalUserId = userProfile.id;
                    tripName = req.query.tripName;
                    if (!tripName) return [3 /*break*/, 2];
                    return [4 /*yield*/, storage.getExpensesByTripName(internalUserId, tripName)];
                case 1:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, storage.getExpensesByUserId(internalUserId)];
                case 3:
                    _a = _b.sent();
                    _b.label = 4;
                case 4:
                    expenses = _a;
                    res.json(expenses);
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _b.sent();
                    next(error_1);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    // GET /api/expenses/:id
    router.get("/:id", function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var authReq, userProfile, internalUserId, expenseId, expense, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    authReq = req;
                    userProfile = authReq.user;
                    internalUserId = userProfile.id;
                    expenseId = parseInt(req.params.id);
                    if (isNaN(expenseId))
                        return [2 /*return*/, res.status(400).send("Invalid expense ID")];
                    return [4 /*yield*/, storage.getExpense(expenseId)];
                case 1:
                    expense = _a.sent();
                    if (!expense)
                        return [2 /*return*/, res.status(404).send("Expense not found")];
                    if (expense.userId !== internalUserId)
                        return [2 /*return*/, res.status(403).send("Forbidden")];
                    res.json(expense);
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    next(error_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // POST /api/expenses
    router.post("/", multer_config_1.upload.single("receipt"), function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var authReq, userProfile, internalUserId, config, currentTemplate, baseExpenseSchema, parsedBody, expenseData, supabasePath, uniquePath, uploadResult, finalExpenseData, expense, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    authReq = req;
                    userProfile = authReq.user;
                    internalUserId = userProfile.id;
                    config = (0, config_1.loadConfig)();
                    currentTemplate = config.ocrTemplate || 'general';
                    baseExpenseSchema = zod_1.z.object({
                        date: zod_1.z.string(),
                        cost: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
                        tripName: zod_1.z.string(),
                        comments: zod_1.z.string().optional(),
                        type: zod_1.z.string().optional(),
                        description: zod_1.z.string().optional(), // Added description
                        vendor: zod_1.z.string().optional(),
                        location: zod_1.z.string().optional(),
                    });
                    parsedBody = baseExpenseSchema.parse(req.body);
                    expenseData = {
                        date: parsedBody.date,
                        cost: String(parsedBody.cost), // Keep cost as string
                        tripName: parsedBody.tripName,
                        comments: parsedBody.comments || '',
                        type: '', // Initialize
                        vendor: '', // Initialize
                        location: '', // Initialize
                    };
                    if (currentTemplate === 'travel') {
                        expenseData.type = parsedBody.type || parsedBody.description || 'Travel Expense';
                        if (parsedBody.description && (!expenseData.comments || expenseData.comments.trim() === ''))
                            expenseData.comments = parsedBody.description;
                        else if (parsedBody.description)
                            expenseData.comments = "".concat(parsedBody.description, "\n\n").concat(expenseData.comments);
                        expenseData.vendor = parsedBody.vendor || 'Travel Vendor';
                        expenseData.location = parsedBody.location || 'Travel Location';
                    }
                    else {
                        expenseData.type = parsedBody.type || 'General Expense';
                        expenseData.vendor = parsedBody.vendor || 'Unknown Vendor';
                        expenseData.location = parsedBody.location || 'Unknown Location';
                    }
                    supabasePath = null;
                    if (!req.file) return [3 /*break*/, 2];
                    uniquePath = "receipts/".concat(internalUserId, "/").concat((0, uuid_1.v4)(), "-").concat(req.file.originalname);
                    return [4 /*yield*/, storage.uploadFile(uniquePath, req.file.buffer, req.file.mimetype)];
                case 1:
                    uploadResult = _a.sent();
                    supabasePath = uploadResult.path;
                    console.log("Uploaded receipt for new expense to Supabase: ".concat(supabasePath));
                    _a.label = 2;
                case 2:
                    finalExpenseData = __assign(__assign({}, expenseData), { userId: internalUserId, receiptPath: supabasePath, cost: expenseData.cost, status: 'pending' });
                    return [4 /*yield*/, storage.createExpense(finalExpenseData)];
                case 3:
                    expense = _a.sent();
                    res.status(201).json(expense);
                    return [3 /*break*/, 5];
                case 4:
                    error_3 = _a.sent();
                    if (error_3 instanceof zod_1.z.ZodError)
                        return [2 /*return*/, res.status(400).json({ message: "Validation failed", errors: error_3.errors })];
                    next(error_3);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    // PUT /api/expenses/:id
    router.put("/:id", multer_config_1.upload.single("receipt"), function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var authReq, userProfile, internalUserId, expenseId, expense, updateExpenseSchema, parsedBody, config, currentTemplate, expenseData, supabasePath, uniquePath, uploadResult, finalUpdatePayload, updatedExpense, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    authReq = req;
                    userProfile = authReq.user;
                    internalUserId = userProfile.id;
                    expenseId = parseInt(req.params.id);
                    if (isNaN(expenseId))
                        return [2 /*return*/, res.status(400).send("Invalid expense ID")];
                    return [4 /*yield*/, storage.getExpense(expenseId)];
                case 1:
                    expense = _a.sent();
                    if (!expense)
                        return [2 /*return*/, res.status(404).send("Expense not found")];
                    if (expense.userId !== internalUserId)
                        return [2 /*return*/, res.status(403).send("Forbidden")];
                    updateExpenseSchema = schema_1.insertExpenseSchema.partial().extend({
                        description: zod_1.z.string().optional() // Add optional description
                    });
                    parsedBody = updateExpenseSchema.parse(req.body);
                    config = (0, config_1.loadConfig)();
                    currentTemplate = config.ocrTemplate || 'general';
                    expenseData = {};
                    if (parsedBody.date !== undefined)
                        expenseData.date = parsedBody.date;
                    if (parsedBody.cost !== undefined)
                        expenseData.cost = String(parsedBody.cost); // Keep cost as string
                    if (parsedBody.tripName !== undefined)
                        expenseData.tripName = parsedBody.tripName;
                    if (parsedBody.comments !== undefined)
                        expenseData.comments = parsedBody.comments || '';
                    // Handle template-specific fields based on presence in parsedBody
                    if (currentTemplate === 'travel') {
                        if (parsedBody.type !== undefined)
                            expenseData.type = parsedBody.type || parsedBody.description || 'Travel Expense';
                        if (parsedBody.description && (!expenseData.comments || expenseData.comments.trim() === ''))
                            expenseData.comments = parsedBody.description;
                        else if (parsedBody.description)
                            expenseData.comments = "".concat(parsedBody.description, "\n\n").concat(expenseData.comments);
                        if (parsedBody.vendor !== undefined)
                            expenseData.vendor = parsedBody.vendor || 'Travel Vendor';
                        if (parsedBody.location !== undefined)
                            expenseData.location = parsedBody.location || 'Travel Location';
                    }
                    else {
                        if (parsedBody.type !== undefined)
                            expenseData.type = parsedBody.type || 'General Expense';
                        if (parsedBody.vendor !== undefined)
                            expenseData.vendor = parsedBody.vendor || 'Unknown Vendor';
                        if (parsedBody.location !== undefined)
                            expenseData.location = parsedBody.location || 'Unknown Location';
                    }
                    supabasePath = expense.receiptPath;
                    if (!req.file) return [3 /*break*/, 5];
                    if (!expense.receiptPath) return [3 /*break*/, 3];
                    console.log("Deleting old receipt ".concat(expense.receiptPath, " from Supabase."));
                    return [4 /*yield*/, storage.deleteFile(expense.receiptPath).catch(function (e) { return console.error("Failed to delete old Supabase receipt:", e); })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    uniquePath = "receipts/".concat(internalUserId, "/").concat((0, uuid_1.v4)(), "-").concat(req.file.originalname);
                    return [4 /*yield*/, storage.uploadFile(uniquePath, req.file.buffer, req.file.mimetype)];
                case 4:
                    uploadResult = _a.sent();
                    supabasePath = uploadResult.path;
                    console.log("Uploaded new receipt for expense ".concat(expenseId, " to Supabase: ").concat(supabasePath));
                    _a.label = 5;
                case 5:
                    finalUpdatePayload = __assign(__assign({}, expenseData), { receiptPath: supabasePath, cost: expenseData.cost });
                    return [4 /*yield*/, storage.updateExpense(expenseId, finalUpdatePayload)];
                case 6:
                    updatedExpense = _a.sent();
                    res.json(updatedExpense);
                    return [3 /*break*/, 8];
                case 7:
                    error_4 = _a.sent();
                    if (error_4 instanceof zod_1.z.ZodError)
                        return [2 /*return*/, res.status(400).json({ message: "Validation failed", errors: error_4.errors })];
                    next(error_4);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); });
    // DELETE /api/expenses/:id
    router.delete("/:id", function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var authReq, userProfile, internalUserId, expenseId, expense, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    authReq = req;
                    userProfile = authReq.user;
                    internalUserId = userProfile.id;
                    expenseId = parseInt(req.params.id);
                    if (isNaN(expenseId))
                        return [2 /*return*/, res.status(400).send("Invalid expense ID")];
                    return [4 /*yield*/, storage.getExpense(expenseId)];
                case 1:
                    expense = _a.sent();
                    if (!expense)
                        return [2 /*return*/, res.status(404).send("Expense not found")];
                    if (expense.userId !== internalUserId)
                        return [2 /*return*/, res.status(403).send("Forbidden")];
                    if (!expense.receiptPath) return [3 /*break*/, 3];
                    console.log("Deleting receipt ".concat(expense.receiptPath, " from Supabase for expense ").concat(expenseId, "."));
                    return [4 /*yield*/, storage.deleteFile(expense.receiptPath).catch(function (e) { return console.error("Failed to delete Supabase receipt:", e); })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [4 /*yield*/, storage.deleteExpense(expenseId)];
                case 4:
                    _a.sent();
                    res.status(204).send();
                    return [3 /*break*/, 6];
                case 5:
                    error_5 = _a.sent();
                    next(error_5);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    // Removed /api/expenses/process-ocr route (handled by background function)
    // Removed /api/expenses/batch-upload-trigger route (handled by background function)
    return router;
}
