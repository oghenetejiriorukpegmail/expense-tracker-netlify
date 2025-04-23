"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
var multer_1 = require("multer");
// Configure storage
// Use memory storage to handle files as buffers
var storage = multer_1.default.memoryStorage();
// File filter to only accept images and PDFs
var fileFilter = function (_req, file, cb) {
    var allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error("Invalid file type. Only JPG, PNG, GIF, and PDF files are allowed."), false);
    }
};
// Configure multer
exports.upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});
