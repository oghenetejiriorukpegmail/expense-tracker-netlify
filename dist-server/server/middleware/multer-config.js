import multer from "multer";
// Configure storage
// Use memory storage to handle files as buffers
var storage = multer.memoryStorage();
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
export var upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});
