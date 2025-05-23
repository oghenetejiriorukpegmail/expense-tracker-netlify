import multer from "multer";
import { v4 as uuidv4 } from "uuid";

// Configure storage
// Use memory storage to handle files as buffers
const storage = multer.memoryStorage();

// File filter to only accept images and PDFs
const fileFilter = (_req: any, file: any, cb: any) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, PNG, GIF, and PDF files are allowed."), false);
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});
