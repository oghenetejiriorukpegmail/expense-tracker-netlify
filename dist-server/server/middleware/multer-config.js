"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer = require("multer");

// Configure multer for memory storage
const storage = multer.memoryStorage();

// Create multer instance with memory storage
exports.upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB file size limit
    },
    fileFilter: (req, file, cb) => {
        // Accept images and PDFs
        if (
            file.mimetype.startsWith('image/') ||
            file.mimetype === 'application/pdf'
        ) {
            cb(null, true);
        } else {
            cb(new Error('Only images and PDF files are allowed'));
        }
    },
});