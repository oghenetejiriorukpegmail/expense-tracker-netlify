import express from "express";
import { processReceiptWithOCR } from "../util/ocr.js"; // Import OCR utility
export function createBackgroundProcessorRouter(storage) {
    const router = express.Router();
    // POST /api/background-processor/process-next
    // This endpoint processes the next pending background task
    router.post("/process-next", async (req, res, next) => {
        try {
            // Cast the request to our authenticated request type
            const authReq = req;
            const userProfile = authReq.user;
            const internalUserId = userProfile.id;
            // Get all pending tasks for this user
            const tasks = await storage.getBackgroundTasksByUserId(internalUserId);
            const pendingTasks = tasks.filter((task) => task.status === 'pending');
            if (pendingTasks.length === 0) {
                return res.json({ message: "No pending tasks found" });
            }
            // Process the oldest pending task
            const task = pendingTasks[pendingTasks.length - 1]; // Get the oldest task (last in the array)
            console.log(`Processing background task ${task.id} of type ${task.type}`);
            // Update task status to processing
            await storage.updateBackgroundTaskStatus(task.id, 'processing');
            try {
                // Parse the task result to get the task details
                const taskDetails = JSON.parse(task.result || '{}');
                if (task.type === 'receipt_ocr') {
                    // Process receipt OCR
                    const { expenseId, receiptPath, template } = taskDetails;
                    if (!expenseId || !receiptPath) {
                        throw new Error("Missing required task details: expenseId or receiptPath");
                    }
                    // Get the expense
                    const expense = await storage.getExpense(expenseId);
                    if (!expense) {
                        throw new Error(`Expense ${expenseId} not found`);
                    }
                    // Get the receipt file
                    const fileData = await storage.downloadFile(receiptPath);
                    if (!fileData || !fileData.buffer) {
                        throw new Error(`Receipt file ${receiptPath} not found or empty`);
                    }
                    // Process the receipt with OCR
                    console.log(`Processing receipt ${receiptPath} with OCR using template ${template || 'general'}`);
                    // Get OCR provider from environment or use default
                    const ocrProvider = process.env.OCR_PROVIDER || 'gemini';
                    const ocrResult = await processReceiptWithOCR(fileData.buffer, fileData.contentType || 'application/pdf', ocrProvider, template || 'general');
                    if (ocrResult.success) {
                        // Update the expense with the OCR results
                        const extractedData = ocrResult.extractedData || {};
                        const updateData = {
                            status: 'complete',
                        };
                        // Update expense fields if they're empty and we have OCR data
                        if (extractedData.vendor && (!expense.vendor || expense.vendor === 'Unknown Vendor')) {
                            updateData.vendor = extractedData.vendor;
                        }
                        if (extractedData.date && (!expense.date)) {
                            updateData.date = extractedData.date;
                        }
                        if (extractedData.cost && (!expense.cost || expense.cost === '0')) {
                            updateData.cost = String(extractedData.cost);
                        }
                        if (extractedData.location && (!expense.location || expense.location === 'Unknown Location')) {
                            updateData.location = extractedData.location;
                        }
                        if (extractedData.type && (!expense.type || expense.type === 'General Expense')) {
                            updateData.type = extractedData.type;
                        }
                        if (extractedData.description && (!expense.comments || expense.comments === '')) {
                            updateData.comments = extractedData.description;
                        }
                        // Update the expense
                        await storage.updateExpense(expenseId, updateData);
                        // Update the task status
                        await storage.updateBackgroundTaskStatus(task.id, 'completed', { message: "OCR processing completed successfully", extractedData }, null);
                        res.json({
                            message: "Task processed successfully",
                            taskId: task.id,
                            expenseId,
                            extractedData
                        });
                    }
                    else {
                        // OCR failed
                        await storage.updateExpense(expenseId, { status: 'ocr_failed' });
                        await storage.updateBackgroundTaskStatus(task.id, 'failed', null, ocrResult.error || "OCR processing failed");
                        res.json({
                            message: "OCR processing failed",
                            taskId: task.id,
                            expenseId,
                            error: ocrResult.error
                        });
                    }
                }
                else {
                    // Unknown task type
                    await storage.updateBackgroundTaskStatus(task.id, 'failed', null, `Unknown task type: ${task.type}`);
                    res.json({
                        message: "Unknown task type",
                        taskId: task.id,
                        type: task.type
                    });
                }
            }
            catch (processError) {
                // Task processing failed
                console.error(`Error processing task ${task.id}:`, processError);
                await storage.updateBackgroundTaskStatus(task.id, 'failed', null, processError.message || "Task processing failed");
                res.status(500).json({
                    message: "Task processing failed",
                    taskId: task.id,
                    error: processError.message
                });
            }
        }
        catch (error) {
            next(error);
        }
    });
    return router;
}
