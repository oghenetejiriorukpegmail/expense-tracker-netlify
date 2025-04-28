/**
 * OCR Routes
 * 
 * This file defines the routes for OCR processing.
 */

import { Router, Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { Readable } from 'stream';
import multer from 'multer';
import { processReceipt, processBatchReceipts, getOcrTaskStatus } from '../util/ocr-orchestrator';
import { catchAsync } from '../util/error-handler';

// Define multer file interface
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
  stream: Readable;
}

// Define request with file
interface RequestWithFile extends Request {
  file?: MulterFile;
  files?: MulterFile[];
  user?: {
    id: number;
    [key: string]: any;
  };
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to only allow certain file types
const fileFilter = (req: any, file: any, cb: any) => {
  // Accept images and PDFs
  if (
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/tiff' ||
    file.mimetype === 'application/pdf'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
    cb(new Error('Unsupported file type. Only JPEG, PNG, TIFF, and PDF files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Define the storage interface
interface IStorage {
  getUserByFirebaseId?: (id: string) => Promise<any>;
  // Add any other methods used in this file
}

export function createOcrRouter(storage: IStorage): Router {
  const router = Router();

/**
 * Process a single receipt
 * POST /api/ocr/receipt
 */
router.post(
  '/receipt',
  (upload as any).single('receipt'),
  catchAsync(async (req: RequestWithFile, res: Response) => {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }
    
    const userId = req.user?.id || 1; // Default to user ID 1 if not authenticated
    
    const result = await processReceipt(req.file.path, userId);
    
    res.status(202).json({
      status: 'success',
      message: 'Receipt processing started',
      data: {
        taskId: result.taskId
      }
    });
  })
);

/**
 * Process multiple receipts
 * POST /api/ocr/batch
 */
router.post(
  '/batch',
  (upload as any).array('receipts', 10),
  catchAsync(async (req: RequestWithFile, res: Response) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No files uploaded'
      });
    }
    
    const userId = req.user?.id || 1; // Default to user ID 1 if not authenticated
    
    const filePaths = req.files.map((file: MulterFile) => file.path);
    
    const taskId = await processBatchReceipts(filePaths, userId);
    
    res.status(202).json({
      status: 'success',
      message: 'Batch processing started',
      data: {
        taskId,
        fileCount: req.files.length
      }
    });
  })
);

/**
 * Get OCR task status
 * GET /api/ocr/task/:taskId
 */
router.get(
  '/task/:taskId', 
  catchAsync(async (req: Request, res: Response) => {
    const taskIdParam = req.params.taskId || '';
    const taskId = parseInt(taskIdParam, 10);
    
    if (isNaN(taskId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid task ID'
      });
    }
    
    const userId = (req as any).user?.id || 1; // Default to user ID 1 if not authenticated
    
    const taskStatus = await getOcrTaskStatus(taskId, userId);
    
    res.status(200).json({
      status: 'success',
      data: taskStatus
    });
  })
);

  return router;
}