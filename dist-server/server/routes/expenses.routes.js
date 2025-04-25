"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExpenseRouter = void 0;
const express = require("express");
const multer_config_js_1 = require("../middleware/multer-config.js");
const ocr_service_js_1 = require("../services/ocr.service.js");

// Create expense router
function createExpenseRouter(storage) {
    const router = express.Router();
    
    // GET /api/expenses - Get all expenses for a user
    router.get('/', async (req, res) => {
        try {
            const userId = req.user.id;
            const expenses = await storage.getExpensesByUserId(userId);
            res.json(expenses);
        } catch (error) {
            console.error('Error getting expenses:', error);
            res.status(500).json({ message: 'Failed to get expenses' });
        }
    });
    
    // GET /api/expenses/:id - Get a specific expense
    router.get('/:id', async (req, res) => {
        try {
            const expenseId = req.params.id;
            const expense = await storage.getExpense(expenseId);
            
            if (!expense) {
                return res.status(404).json({ message: 'Expense not found' });
            }
            
            res.json(expense);
        } catch (error) {
            console.error('Error getting expense:', error);
            res.status(500).json({ message: 'Failed to get expense' });
        }
    });
    
    // POST /api/expenses/process-ocr - Process a receipt with OCR
    router.post('/process-ocr', multer_config_js_1.upload.single('receipt'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No receipt file provided' });
            }
            
            const userId = req.user.id;
            const timestamp = Date.now();
            const filename = `${userId}_${timestamp}_${req.file.originalname}`;
            const filePath = `receipts/${userId}/${filename}`;
            
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
                    timestamp: timestamp,
                    trip_name: req.body.tripName || null
                })
            };
            
            const task = await storage.createBackgroundTask(taskData);
            
            // Process the receipt with OCR in the background
            // We'll respond to the client immediately and process in the background
            res.status(202).json({
                success: true,
                message: 'Receipt processing started',
                task_id: task.id,
                receipt_path: filePath
            });
            
            // Process OCR in the background after responding to the client
            try {
                // Process the receipt with OCR using Google Cloud Vision API
                const ocrResult = await (0, ocr_service_js_1.processReceiptWithOcr)(req.file.buffer, req.file.mimetype);
                
                // Update the task with the OCR result
                await storage.updateBackgroundTaskStatus(
                    task.id,
                    ocrResult.success ? 'completed' : 'failed',
                    JSON.stringify(ocrResult)
                );
                
                // If OCR was successful and we have a trip name, create an expense
                if (ocrResult.success && req.body.tripName) {
                    const expenseData = {
                        user_id: userId,
                        date: ocrResult.date || new Date().toISOString().split('T')[0],
                        cost: ocrResult.total || '0.00',
                        trip_name: req.body.tripName,
                        type: 'Receipt',
                        vendor: ocrResult.vendor || 'Unknown',
                        location: 'Unknown',
                        comments: `Automatically created from receipt. Items: ${JSON.stringify(ocrResult.items || [])}`,
                        receipt_path: filePath,
                        status: 'active',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    
                    await storage.createExpense(expenseData);
                }
            } catch (ocrError) {
                console.error('Error processing receipt with OCR:', ocrError);
                
                // Update the task with the error
                await storage.updateBackgroundTaskStatus(
                    task.id,
                    'failed',
                    null,
                    ocrError.message || 'Failed to process receipt with OCR'
                );
            }
        } catch (error) {
            console.error('Error processing receipt with OCR:', error);
            res.status(500).json({ message: 'Failed to process receipt with OCR' });
        }
    });
    
    // POST /api/expenses - Create a new expense
    router.post('/', multer_config_js_1.upload.single('receipt'), async (req, res) => {
        try {
            const userId = req.user.id;
            const expenseData = {
                ...req.body,
                user_id: userId,
                date: req.body.date || new Date().toISOString().split('T')[0],
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            // Handle receipt upload if present
            if (req.file) {
                const timestamp = Date.now();
                const filename = `${userId}_${timestamp}_${req.file.originalname}`;
                const filePath = `receipts/${userId}/${filename}`;
                
                // Upload file to storage
                const uploadResult = await storage.uploadFile(
                    filePath,
                    req.file.buffer,
                    req.file.mimetype
                );
                
                // Add receipt path to expense data
                expenseData.receipt_path = filePath;
            }
            
            // Create expense
            const newExpense = await storage.createExpense(expenseData);
            
            res.status(201).json(newExpense);
        } catch (error) {
            console.error('Error creating expense:', error);
            res.status(500).json({ message: 'Failed to create expense' });
        }
    });
    
    // PUT /api/expenses/:id - Update an expense
    router.put('/:id', multer_config_js_1.upload.single('receipt'), async (req, res) => {
        try {
            const expenseId = req.params.id;
            const expenseData = { ...req.body, updated_at: new Date().toISOString() };
            
            // Handle receipt upload if present
            if (req.file) {
                const userId = req.user.id;
                const timestamp = Date.now();
                const filename = `${userId}_${timestamp}_${req.file.originalname}`;
                const filePath = `receipts/${userId}/${filename}`;
                
                // Upload file to storage
                const uploadResult = await storage.uploadFile(
                    filePath,
                    req.file.buffer,
                    req.file.mimetype
                );
                
                // Add receipt path to expense data
                expenseData.receipt_path = filePath;
            }
            
            // Update expense
            const updatedExpense = await storage.updateExpense(expenseId, expenseData);
            res.json(updatedExpense);
        } catch (error) {
            console.error('Error updating expense:', error);
            res.status(500).json({ message: 'Failed to update expense' });
        }
    });
    
    // DELETE /api/expenses/:id - Delete an expense
    router.delete('/:id', async (req, res) => {
        try {
            const expenseId = req.params.id;
            
            // Get the expense to check if it has a receipt
            const expense = await storage.getExpense(expenseId);
            
            if (expense && expense.receipt_path) {
                // Delete the receipt file
                try {
                    await storage.deleteFile(expense.receipt_path);
                } catch (fileError) {
                    console.error('Error deleting receipt file:', fileError);
                    // Continue with expense deletion even if file deletion fails
                }
            }
            
            // Delete the expense
            await storage.deleteExpense(expenseId);
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting expense:', error);
            res.status(500).json({ message: 'Failed to delete expense' });
        }
    });
    
    return router;
}
exports.createExpenseRouter = createExpenseRouter;
