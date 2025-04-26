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
exports.createExportRouter = createExportRouter;
var express_1 = require("express");
var zod_1 = require("zod");
var node_fetch_1 = require("node-fetch"); // Import fetch for triggering background functions
function createExportRouter(storage) {
    var _this = this;
    var router = express_1.default.Router();
    // POST /api/export-expenses (Now triggers background function)
    router.post("/expenses", function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var authReq, userProfile, internalUserId, exportRequestSchema, validatedBody, taskData, backgroundTask_1, payload, functionUrl_1, error_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    authReq = req;
                    userProfile = authReq.user;
                    internalUserId = userProfile.id;
                    exportRequestSchema = zod_1.z.object({
                        format: zod_1.z.enum(['csv', 'xlsx']).default('xlsx'),
                        filters: zod_1.z.object({
                            startDate: zod_1.z.string().optional(), // Expect YYYY-MM-DD
                            endDate: zod_1.z.string().optional(), // Expect YYYY-MM-DD
                            tripName: zod_1.z.string().optional(), // Use tripName
                            type: zod_1.z.string().optional(), // Add type filter
                        }).optional(),
                    });
                    validatedBody = exportRequestSchema.parse(req.body);
                    console.log("Received request to export expenses for user ".concat(internalUserId, " with format ").concat(validatedBody.format));
                    taskData = {
                        userId: internalUserId,
                        type: 'expense_export', // Use const assertion
                        status: 'pending',
                    };
                    return [4 /*yield*/, storage.createBackgroundTask(taskData)];
                case 1:
                    backgroundTask_1 = _a.sent();
                    console.log("Created background task (ID: ".concat(backgroundTask_1.id, ") for expense export."));
                    payload = {
                        userId: String(internalUserId), // Pass internal ID
                        format: validatedBody.format,
                        filters: validatedBody.filters || {}, // Pass filters from body
                        taskId: backgroundTask_1.id // Pass the task ID
                    };
                    functionUrl_1 = "/.netlify/functions/export-expenses";
                    console.log("Triggering background function: ".concat(functionUrl_1, " for task ID ").concat(backgroundTask_1.id));
                    (0, node_fetch_1.default)(functionUrl_1, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    }).catch(function (fetchError) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    console.error("Error triggering background function ".concat(functionUrl_1, " for task ").concat(backgroundTask_1.id, ":"), fetchError);
                                    // Update task status to failed if trigger fails
                                    return [4 /*yield*/, storage.updateBackgroundTaskStatus(backgroundTask_1.id, 'failed', null, "Failed to trigger background function: ".concat(fetchError instanceof Error ? fetchError.message : String(fetchError)))];
                                case 1:
                                    // Update task status to failed if trigger fails
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    // 4. Return an immediate response to the client with the task info
                    res.status(202).json({
                        message: "Expense export started. You can monitor the task status.",
                        task: backgroundTask_1, // Return the created task record
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    if (error_1 instanceof zod_1.z.ZodError) {
                        return [2 /*return*/, res.status(400).json({ message: "Invalid query parameters", errors: error_1.errors })];
                    }
                    console.error("Error in /api/export-expenses trigger:", error_1);
                    next(error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    return router;
}
