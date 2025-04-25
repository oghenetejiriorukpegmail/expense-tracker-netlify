"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOcrRouter = void 0;
const express = require("express");
const multer_config_js_1 = require("../middleware/multer-config.js");
const ocr_service_js_1 = require("../services/ocr.service.js");

// Create OCR router
function createOcrRouter(storage) {
    const router = express.Router();
    
    // POST /api/ocr/process - Process a receipt image with OCR
    router.post('/process', multer_config_js_1.upload.single('receipt'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No receipt file provided' });
            }
            
            const userId = req.user.id;
            const timestamp = Date.now();
            const filename = `${userId}_${timestamp}_${req.file.originalname}`;
            // Update the file path to match the bucket structure
            const filePath = `${userId}/${filename}`;
            
            // Upload file to storage
            const uploadResult = await storage.uploadFile(
                filePath,
                req.file.buffer,
                req.file.mimetype
            );
            
            // Create a background task for OCR processing
            const taskData = {
                user_id: userId,
                type: 'receipt_ocr',
                status: 'processing',
                data: JSON.stringify({
                    receipt_path: filePath,
                    mime_type: req.file.mimetype,
                    timestamp: timestamp
                })
            };
            
            const task = await storage.createBackgroundTask(taskData);
            
            try {
                // Process the receipt with OCR using Google Cloud Vision API
                const ocrResult = await (0, ocr_service_js_1.processReceiptWithOcr)(req.file.buffer, req.file.mimetype);
                
                // Update the task with the OCR result
                await storage.updateBackgroundTaskStatus(
                    task.id,
                    ocrResult.success ? 'completed' : 'failed',
                    JSON.stringify(ocrResult)
                );
                
                // Return the OCR result
                res.json({
                    success: true,
                    task_id: task.id,
                    receipt_path: filePath,
                    ocr_result: ocrResult
                });
            } catch (ocrError) {
                console.error('Error processing receipt with OCR:', ocrError);
                
                // Update the task with the error
                await storage.updateBackgroundTaskStatus(
                    task.id,
                    'failed',
                    null,
                    ocrError.message || 'Failed to process receipt with OCR'
                );
                
                // Return error response
                res.status(500).json({ 
                    success: false,
                    message: 'Failed to process receipt with OCR',
                    error: ocrError.message,
                    task_id: task.id,
                    receipt_path: filePath
                });
            }
        } catch (error) {
            console.error('Error processing receipt with OCR:', error);
            res.status(500).json({ message: 'Failed to process receipt with OCR' });
        }
    });
    
    // GET /api/ocr/tasks - Get all OCR tasks for a user
    router.get('/tasks', async (req, res) => {
        try {
            const userId = req.user.id;
            const tasks = await storage.getBackgroundTasksByUserId(userId);
            
            // Filter for OCR tasks only
            const ocrTasks = tasks.filter(task => task.type === 'receipt_ocr');
            
            res.json(ocrTasks);
        } catch (error) {
            console.error('Error getting OCR tasks:', error);
            res.status(500).json({ message: 'Failed to get OCR tasks' });
        }
    });
    
    // GET /api/ocr/tasks/:id - Get a specific OCR task
    router.get('/tasks/:id', async (req, res) => {
        try {
            const taskId = req.params.id;
            const task = await storage.getBackgroundTask(taskId);
            
            if (!task) {
                return res.status(404).json({ message: 'OCR task not found' });
            }
            
            if (task.type !== 'receipt_ocr') {
                return res.status(400).json({ message: 'Task is not an OCR task' });
            }
            
            res.json(task);
        } catch (error) {
            console.error('Error getting OCR task:', error);
            res.status(500).json({ message: 'Failed to get OCR task' });
        }
    });
    
    return router;
}
exports.createOcrRouter = createOcrRouter;