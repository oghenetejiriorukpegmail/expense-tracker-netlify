"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExpenseRouter = void 0;
const express = require("express");
const multer_config_js_1 = require("../middleware/multer-config.js");

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
    
    // POST /api/expenses - Create a new expense
    router.post('/', multer_config_js_1.upload.single('receipt'), async (req, res) => {
        try {
            const userId = req.user.id;
            const expenseData = {
                ...req.body,
                userId,
                date: req.body.date || new Date().toISOString().split('T')[0],
                status: 'active'
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
                expenseData.receiptPath = filePath;
                
                // Create expense
                const newExpense = await storage.createExpense(expenseData);
                
                // Process receipt with OCR in background
                try {
                    // Create a background task for OCR processing
                    const taskData = {
                        userId,
                        type: 'receipt_ocr',
                        status: 'pending',
                        data: JSON.stringify({
                            expenseId: newExpense.id,
                            receiptPath: filePath,
                            mimeType: req.file.mimetype
                        })
                    };
                    
                    await storage.createBackgroundTask(taskData);
                } catch (ocrError) {
                    console.error('Error creating OCR background task:', ocrError);
                    // Continue with expense creation even if OCR task creation fails
                }
                
                res.status(201).json(newExpense);
            } else {
                // Create expense without receipt
                const newExpense = await storage.createExpense(expenseData);
                res.status(201).json(newExpense);
            }
        } catch (error) {
            console.error('Error creating expense:', error);
            res.status(500).json({ message: 'Failed to create expense' });
        }
    });
    
    // PUT /api/expenses/:id - Update an expense
    router.put('/:id', multer_config_js_1.upload.single('receipt'), async (req, res) => {
        try {
            const expenseId = req.params.id;
            const expenseData = { ...req.body };
            
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
                expenseData.receiptPath = filePath;
                
                // Process receipt with OCR in background
                try {
                    // Create a background task for OCR processing
                    const taskData = {
                        userId,
                        type: 'receipt_ocr',
                        status: 'pending',
                        data: JSON.stringify({
                            expenseId,
                            receiptPath: filePath,
                            mimeType: req.file.mimetype
                        })
                    };
                    
                    await storage.createBackgroundTask(taskData);
                } catch (ocrError) {
                    console.error('Error creating OCR background task:', ocrError);
                    // Continue with expense update even if OCR task creation fails
                }
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
            
            if (expense && expense.receiptPath) {
                // Delete the receipt file
                try {
                    await storage.deleteFile(expense.receiptPath);
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
