"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertExpenseSchema = exports.insertMileageLogSchema = exports.insertTripSchema = exports.insertUserSchema = void 0;

// Simple schema for user
const insertUserSchema = {
    authUserId: true,
    email: true,
    firstName: true,
    lastName: true,
    profileImageUrl: true,
    createdAt: true,
    updatedAt: true
};
exports.insertUserSchema = insertUserSchema;

// Schema for trip
const insertTripSchema = {
    name: true,
    description: true,
    startDate: true,
    endDate: true,
    userId: true,
    createdAt: true,
    updatedAt: true
};
exports.insertTripSchema = insertTripSchema;

// Schema for expense
const insertExpenseSchema = {
    date: true,
    cost: true,
    tripName: true,
    type: true,
    vendor: true,
    location: true,
    comments: true,
    receiptPath: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
    status: true
};
exports.insertExpenseSchema = insertExpenseSchema;

// Schema for mileage log
const insertMileageLogSchema = {
    userId: true,
    tripId: true,
    tripDate: true,
    startOdometer: true,
    endOdometer: true,
    purpose: true,
    entryMethod: true,
    createdAt: true,
    updatedAt: true
};
exports.insertMileageLogSchema = insertMileageLogSchema;