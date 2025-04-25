import express from "express";
import { z } from "zod";
import { insertExpenseSchema } from '../../shared/schema.js';
import { upload } from "../middleware/multer-config.js"; // Add .js extension
import { v4 as uuidv4 } from "uuid"; // Import uuid
import { loadConfig } from "../config.js"; // Add .js extension
export function createExpenseRouter(storage) {
    const router = express.Router();
    // GET /api/expenses
    router.get("/", async (req, res, next) => {
        try {
            // Cast the request to our authenticated request type
            const authReq = req;
            const userProfile = authReq.user;
            const internalUserId = userProfile.id;
            const tripName = req.query.tripName;
            const expenses = tripName
                ? await storage.getExpensesByTripName(internalUserId, tripName)
                : await storage.getExpensesByUserId(internalUserId);
            res.json(expenses);
        }
        catch (error) {
            next(error);
        }
    });
    // GET /api/expenses/:id
    router.get("/:id", async (req, res, next) => {
        try {
            // Cast the request to our authenticated request type
            const authReq = req;
            const userProfile = authReq.user;
            const internalUserId = userProfile.id;
            const expenseId = parseInt(req.params.id);
            if (isNaN(expenseId))
                return res.status(400).send("Invalid expense ID");
            const expense = await storage.getExpense(expenseId);
            if (!expense)
                return res.status(404).send("Expense not found");
            if (expense.userId !== internalUserId)
                return res.status(403).send("Forbidden");
            res.json(expense);
        }
        catch (error) {
            next(error);
        }
    });
    // POST /api/expenses
    router.post("/", upload.single("receipt"), async (req, res, next) => {
        try {
            // Cast the request to our authenticated request type
            const authReq = req;
            const userProfile = authReq.user;
            const internalUserId = userProfile.id;
            const config = loadConfig();
            const currentTemplate = config.ocrTemplate || 'general';
            // Validate required fields from the body first
            // Add description to the base schema
            const baseExpenseSchema = z.object({
                date: z.string(),
                cost: z.union([z.string(), z.number()]),
                tripName: z.string(),
                comments: z.string().optional(),
                type: z.string().optional(),
                description: z.string().optional(), // Added description
                vendor: z.string().optional(),
                location: z.string().optional(),
            });
            const parsedBody = baseExpenseSchema.parse(req.body);
            // Construct the expense data ensuring all required fields for InsertExpense are present
            // Ensure cost remains string as expected by schema
            let expenseData = {
                date: parsedBody.date,
                cost: String(parsedBody.cost), // Keep cost as string
                tripName: parsedBody.tripName,
                comments: parsedBody.comments || '',
                type: '', // Initialize
                vendor: '', // Initialize
                location: '', // Initialize
            };
            if (currentTemplate === 'travel') {
                expenseData.type = parsedBody.type || parsedBody.description || 'Travel Expense';
                if (parsedBody.description && (!expenseData.comments || expenseData.comments.trim() === ''))
                    expenseData.comments = parsedBody.description;
                else if (parsedBody.description)
                    expenseData.comments = `${parsedBody.description}\n\n${expenseData.comments}`;
                expenseData.vendor = parsedBody.vendor || 'Travel Vendor';
                expenseData.location = parsedBody.location || 'Travel Location';
            }
            else {
                expenseData.type = parsedBody.type || 'General Expense';
                expenseData.vendor = parsedBody.vendor || 'Unknown Vendor';
                expenseData.location = parsedBody.location || 'Unknown Location';
            }
            let supabasePath = null;
            if (authReq.file) { // Use authReq.file
                const uniquePath = `receipts/${internalUserId}/${uuidv4()}-${authReq.file.originalname}`;
                const uploadResult = await storage.uploadFile(uniquePath, authReq.file.buffer, authReq.file.mimetype);
                supabasePath = uploadResult.path;
                console.log(`Uploaded receipt for new expense to Supabase: ${supabasePath}`);
            }
            // Ensure the final object matches InsertExpense & { userId: number, receiptPath?: string | null }
            const finalExpenseData = {
                ...expenseData,
                userId: internalUserId,
                receiptPath: supabasePath,
                cost: expenseData.cost, // Keep cost as string
                status: 'pending', // Set status to pending for OCR processing
                // ocrError: null, // Removed this line as it doesn't exist in schema
            };
            // Create the expense
            const expense = await storage.createExpense(finalExpenseData);
            // If a receipt was uploaded, create a background task for OCR processing
            if (supabasePath) {
                try {
                    // Create a background task for OCR processing
                    const taskData = {
                        userId: internalUserId,
                        type: 'receipt_ocr', // Task type for OCR processing
                        status: 'pending',
                        result: JSON.stringify({
                            expenseId: expense.id,
                            receiptPath: supabasePath,
                            template: currentTemplate
                        })
                    };
                    const task = await storage.createBackgroundTask(taskData);
                    console.log(`Created background task ${task.id} for OCR processing of expense ${expense.id}`);
                    // Automatically trigger the background processor to process this task
                    try {
                        // Make a request to the background processor endpoint
                        const processorResponse = await fetch(`${req.protocol}://${req.get('host')}/api/background-processor/process-next`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': req.headers.authorization || '', // Forward the authorization header
                            },
                        });
                        if (processorResponse.ok) {
                            const processorResult = await processorResponse.json();
                            console.log(`Automatically triggered background processor for task ${task.id}:`, processorResult);
                        }
                        else {
                            console.error(`Failed to trigger background processor for task ${task.id}:`, await processorResponse.text());
                        }
                    }
                    catch (processorError) {
                        console.error(`Error triggering background processor for task ${task.id}:`, processorError);
                        // Continue even if the automatic processing fails
                    }
                    // Return the expense with the task ID
                    res.status(201).json({
                        ...expense,
                        ocrTaskId: task.id
                    });
                }
                catch (taskError) {
                    console.error(`Failed to create OCR background task for expense ${expense.id}:`, taskError);
                    // Still return the expense even if task creation fails
                    res.status(201).json(expense);
                }
            }
            else {
                // No receipt, just return the expense
                res.status(201).json(expense);
            }
        }
        catch (error) {
            if (error instanceof z.ZodError)
                return res.status(400).json({ message: "Validation failed", errors: error.errors });
            next(error);
        }
    });
    // PUT /api/expenses/:id
    router.put("/:id", upload.single("receipt"), async (req, res, next) => {
        try {
            // Cast the request to our authenticated request type
            const authReq = req;
            const userProfile = authReq.user;
            const internalUserId = userProfile.id;
            const expenseId = parseInt(req.params.id);
            if (isNaN(expenseId))
                return res.status(400).send("Invalid expense ID");
            const expense = await storage.getExpense(expenseId);
            if (!expense)
                return res.status(404).send("Expense not found");
            if (expense.userId !== internalUserId)
                return res.status(403).send("Forbidden");
            // Validate incoming data (use partial schema for updates)
            // Add description to the update schema
            const updateExpenseSchema = insertExpenseSchema.partial().extend({
                description: z.string().optional() // Add optional description
            });
            const parsedBody = updateExpenseSchema.parse(req.body);
            const config = loadConfig();
            const currentTemplate = config.ocrTemplate || 'general';
            // Prepare data for update, only include fields present in parsedBody
            // Ensure cost remains string
            let expenseData = {};
            if (parsedBody.date !== undefined)
                expenseData.date = parsedBody.date;
            if (parsedBody.cost !== undefined)
                expenseData.cost = String(parsedBody.cost); // Keep cost as string
            if (parsedBody.tripName !== undefined)
                expenseData.tripName = parsedBody.tripName;
            if (parsedBody.comments !== undefined)
                expenseData.comments = parsedBody.comments || '';
            // Handle template-specific fields based on presence in parsedBody
            if (currentTemplate === 'travel') {
                if (parsedBody.type !== undefined)
                    expenseData.type = parsedBody.type || parsedBody.description || 'Travel Expense';
                if (parsedBody.description && (!expenseData.comments || expenseData.comments.trim() === ''))
                    expenseData.comments = parsedBody.description;
                else if (parsedBody.description)
                    expenseData.comments = `${parsedBody.description}\n\n${expenseData.comments}`;
                if (parsedBody.vendor !== undefined)
                    expenseData.vendor = parsedBody.vendor || 'Travel Vendor';
                if (parsedBody.location !== undefined)
                    expenseData.location = parsedBody.location || 'Travel Location';
            }
            else {
                if (parsedBody.type !== undefined)
                    expenseData.type = parsedBody.type || 'General Expense';
                if (parsedBody.vendor !== undefined)
                    expenseData.vendor = parsedBody.vendor || 'Unknown Vendor';
                if (parsedBody.location !== undefined)
                    expenseData.location = parsedBody.location || 'Unknown Location';
            }
            let supabasePath = expense.receiptPath;
            if (authReq.file) { // Use authReq.file
                if (expense.receiptPath) {
                    console.log(`Deleting old receipt ${expense.receiptPath} from Supabase.`);
                    await storage.deleteFile(expense.receiptPath).catch((e) => console.error("Failed to delete old Supabase receipt:", e)); // Add type to catch
                }
                const uniquePath = `receipts/${internalUserId}/${uuidv4()}-${authReq.file.originalname}`;
                const uploadResult = await storage.uploadFile(uniquePath, authReq.file.buffer, authReq.file.mimetype);
                supabasePath = uploadResult.path;
                console.log(`Uploaded new receipt for expense ${expenseId} to Supabase: ${supabasePath}`);
                // Create a background task for OCR processing
                try {
                    const config = loadConfig();
                    const currentTemplate = config.ocrTemplate || 'general';
                    // Create a background task for OCR processing
                    const taskData = {
                        userId: internalUserId,
                        type: 'receipt_ocr', // Task type for OCR processing
                        status: 'pending',
                        result: JSON.stringify({
                            expenseId: expenseId,
                            receiptPath: supabasePath,
                            template: currentTemplate
                        })
                    };
                    const task = await storage.createBackgroundTask(taskData);
                    console.log(`Created background task ${task.id} for OCR processing of expense ${expenseId}`);
                    // Automatically trigger the background processor to process this task
                    try {
                        // Make a request to the background processor endpoint
                        const processorResponse = await fetch(`${req.protocol}://${req.get('host')}/api/background-processor/process-next`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': req.headers.authorization || '', // Forward the authorization header
                            },
                        });
                        if (processorResponse.ok) {
                            const processorResult = await processorResponse.json();
                            console.log(`Automatically triggered background processor for task ${task.id}:`, processorResult);
                        }
                        else {
                            console.error(`Failed to trigger background processor for task ${task.id}:`, await processorResponse.text());
                        }
                    }
                    catch (processorError) {
                        console.error(`Error triggering background processor for task ${task.id}:`, processorError);
                        // Continue even if the automatic processing fails
                    }
                }
                catch (taskError) {
                    console.error(`Failed to create OCR background task for expense ${expenseId}:`, taskError);
                    // Continue even if task creation fails
                }
            }
            // Prepare final update payload, ensuring cost remains string
            const finalUpdatePayload = {
                ...expenseData,
                receiptPath: supabasePath,
                cost: expenseData.cost, // Keep cost as string
            };
            const updatedExpense = await storage.updateExpense(expenseId, finalUpdatePayload);
            res.json(updatedExpense);
        }
        catch (error) {
            if (error instanceof z.ZodError)
                return res.status(400).json({ message: "Validation failed", errors: error.errors });
            next(error);
        }
    });
    // DELETE /api/expenses/:id
    router.delete("/:id", async (req, res, next) => {
        try {
            // Cast the request to our authenticated request type
            const authReq = req;
            const userProfile = authReq.user;
            const internalUserId = userProfile.id;
            const expenseId = parseInt(req.params.id);
            if (isNaN(expenseId))
                return res.status(400).send("Invalid expense ID");
            const expense = await storage.getExpense(expenseId);
            if (!expense)
                return res.status(404).send("Expense not found");
            if (expense.userId !== internalUserId)
                return res.status(403).send("Forbidden");
            if (expense.receiptPath) {
                console.log(`Deleting receipt ${expense.receiptPath} from Supabase for expense ${expenseId}.`);
                await storage.deleteFile(expense.receiptPath).catch((e) => console.error("Failed to delete Supabase receipt:", e)); // Add type to catch
            }
            await storage.deleteExpense(expenseId);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    });
    // Removed /api/expenses/process-ocr route (handled by background function)
    // Removed /api/expenses/batch-upload-trigger route (handled by background function)
    return router;
}
