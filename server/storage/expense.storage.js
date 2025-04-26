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
exports.getExpense = getExpense;
exports.getExpensesByUserId = getExpensesByUserId;
exports.getExpensesByTripName = getExpensesByTripName;
exports.createExpense = createExpense;
exports.updateExpense = updateExpense;
exports.deleteExpense = deleteExpense;
exports.updateExpenseStatus = updateExpenseStatus;
exports.createExpensesBatch = createExpensesBatch;
var schema = require("@shared/schema");
var drizzle_orm_1 = require("drizzle-orm");
// Expense methods extracted from SupabaseStorage
function getExpense(db, id) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db.select().from(schema.expenses).where((0, drizzle_orm_1.eq)(schema.expenses.id, id)).limit(1)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result[0]];
            }
        });
    });
}
function getExpensesByUserId(db, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var results;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db.select().from(schema.expenses)
                        .where((0, drizzle_orm_1.eq)(schema.expenses.userId, userId))
                        .orderBy((0, drizzle_orm_1.desc)(schema.expenses.date))];
                case 1:
                    results = _a.sent();
                    return [2 /*return*/, results];
            }
        });
    });
}
function getExpensesByTripName(db, userId, tripName) {
    return __awaiter(this, void 0, void 0, function () {
        var results;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db.select().from(schema.expenses)
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.expenses.userId, userId), (0, drizzle_orm_1.eq)(schema.expenses.tripName, tripName)))
                        .orderBy((0, drizzle_orm_1.desc)(schema.expenses.date))];
                case 1:
                    results = _a.sent();
                    return [2 /*return*/, results];
            }
        });
    });
}
function createExpense(db, expenseData) {
    return __awaiter(this, void 0, void 0, function () {
        var requiredFields, _i, requiredFields_1, field, dataToInsert, result;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    requiredFields = ['date', 'type', 'vendor', 'location', 'cost', 'tripName'];
                    for (_i = 0, requiredFields_1 = requiredFields; _i < requiredFields_1.length; _i++) {
                        field = requiredFields_1[_i];
                        if (expenseData[field] === undefined || expenseData[field] === null) {
                            if (field === 'cost' && typeof expenseData.cost !== 'string') { // Check if cost is string
                                throw new Error("Missing or invalid required expense field: ".concat(field));
                            }
                            else if (field !== 'cost') {
                                throw new Error("Missing required expense field: ".concat(field));
                            }
                        }
                    }
                    dataToInsert = __assign(__assign({}, expenseData), { cost: expenseData.cost, receiptPath: expenseData.receiptPath || null, comments: (_a = expenseData.comments) !== null && _a !== void 0 ? _a : null, createdAt: new Date(), updatedAt: new Date(), status: (_b = expenseData.status) !== null && _b !== void 0 ? _b : 'pending' });
                    return [4 /*yield*/, db.insert(schema.expenses).values(dataToInsert).returning()];
                case 1:
                    result = _c.sent();
                    return [2 /*return*/, result[0]];
            }
        });
    });
}
function updateExpense(db, id, expenseData) {
    return __awaiter(this, void 0, void 0, function () {
        var dataToUpdate, key, typedKey, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dataToUpdate = {};
                    for (key in expenseData) {
                        if (Object.prototype.hasOwnProperty.call(expenseData, key)) {
                            typedKey = key;
                            if (expenseData[typedKey] === undefined) {
                                dataToUpdate[typedKey] = null;
                            }
                            else {
                                dataToUpdate[typedKey] = expenseData[typedKey];
                            }
                        }
                    }
                    dataToUpdate.updatedAt = new Date();
                    return [4 /*yield*/, db.update(schema.expenses)
                            .set(dataToUpdate)
                            .where((0, drizzle_orm_1.eq)(schema.expenses.id, id))
                            .returning()];
                case 1:
                    result = _a.sent();
                    if (result.length === 0) {
                        throw new Error("Expense with ID ".concat(id, " not found"));
                    }
                    return [2 /*return*/, result[0]];
            }
        });
    });
}
function deleteExpense(db, id) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db.delete(schema.expenses).where((0, drizzle_orm_1.eq)(schema.expenses.id, id)).returning({ id: schema.expenses.id })];
                case 1:
                    result = _a.sent();
                    if (result.length === 0) {
                        console.warn("Attempted to delete non-existent expense with ID ".concat(id));
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function updateExpenseStatus(db, id, status, error) {
    return __awaiter(this, void 0, void 0, function () {
        var updateData, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    updateData = {
                        status: status,
                        ocrError: error === undefined ? null : error,
                        updatedAt: new Date()
                    };
                    return [4 /*yield*/, db.update(schema.expenses)
                            .set(updateData)
                            .where((0, drizzle_orm_1.eq)(schema.expenses.id, id))
                            .returning()];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result[0]];
            }
        });
    });
}
function createExpensesBatch(db, expensesData) {
    return __awaiter(this, void 0, void 0, function () {
        var preparedData, successCount, errors, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!expensesData || expensesData.length === 0) {
                        return [2 /*return*/, { successCount: 0, errors: [] }];
                    }
                    preparedData = expensesData.map(function (expense) {
                        var _a, _b;
                        return (__assign(__assign({}, expense), { cost: expense.cost, receiptPath: expense.receiptPath || null, comments: (_a = expense.comments) !== null && _a !== void 0 ? _a : null, createdAt: new Date(), updatedAt: new Date(), status: (_b = expense.status) !== null && _b !== void 0 ? _b : 'pending' }));
                    });
                    successCount = 0;
                    errors = [];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, db.insert(schema.expenses).values(preparedData).returning({ id: schema.expenses.id })];
                case 2:
                    result = _a.sent();
                    successCount = result.length;
                    console.log("Successfully batch inserted ".concat(successCount, " expenses."));
                    if (successCount !== preparedData.length) {
                        console.warn("Batch insert discrepancy: Expected ".concat(preparedData.length, ", inserted ").concat(successCount, "."));
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("Error during batch expense insertion:", error_1);
                    errors.push({ index: -1, error: error_1, data: 'Entire batch failed' });
                    successCount = 0;
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, { successCount: successCount, errors: errors }];
            }
        });
    });
}
