import express, { type Request, Response, NextFunction } from "express";
import type { PublicUser, BackgroundTask } from "../../shared/schema.js"; // Use relative path with .js extension
import { ocrOrchestrator } from "../util/ocr-orchestrator.js"; // Import OCR orchestrator

// Define request type with user property
interface AuthenticatedRequest extends Request {
  user: PublicUser; // Our middleware attaches the user object here
}

// Define the storage interface
interface IStorage {
  getBackgroundTasksByUserId(userId: number): Promise<BackgroundTask[]>;
  updateBackgroundTaskStatus(id: number, status: string, result?: any, error?: string | null): Promise<any>;
  getExpense(id: number): Promise<any>;
  downloadFile(path: string, bucketName?: string): Promise<any>;
  updateExpense(id: number, data: any): Promise<any>;
}

export function createBackgroundProcessorRouter(storage: IStorage): express.Router {
  const router = express.Router();

  // POST /api/background-processor/process-next
  // This endpoint processes the next pending background task
  router.post("/process-next", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Cast the request to our authenticated request type
      const authReq = req as AuthenticatedRequest;
      const userProfile = authReq.user;
      const internalUserId = userProfile.id;

      // Get all pending tasks for this user
      const tasks = await storage.getBackgroundTasksByUserId(internalUserId);
      const pendingTasks = tasks.filter((task: BackgroundTask) => task.status === 'pending');

      if (pendingTasks.length === 0) {
        return res.json({ message: "No pending tasks found" });
      }

      // Process the oldest pending task
      const task = pendingTasks[pendingTasks.length - 1]; // Get the oldest task (last in the array)
      if (!task) {
        return res.json({ message: "Error retrieving pending task" });
      }
      
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
          if (!fileData || !fileData.data) {
            throw new Error(`Receipt file ${receiptPath} not found or empty`);
          }

          // Process the receipt with OCR
          console.log(`Processing receipt ${receiptPath} with OCR using template ${template || 'general'}`);
          
          // Use the OCR orchestrator for better performance
          const ocrResult = await ocrOrchestrator.processReceipt(
            fileData.data,
            fileData.contentType || 'application/pdf',
            {
              template: (template as any) || 'general',
              useCache: true,
              preprocessImage: true,
              maxRetries: 2
            }
          );

          if (ocrResult.success) {
            // Update the expense with the OCR results
            const extractedData = ocrResult.extractedData || {};
            const updateData: any = {
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
            await storage.updateBackgroundTaskStatus(
              task.id,
              'completed',
              { message: "OCR processing completed successfully", extractedData },
              null
            );

            res.json({
              message: "Task processed successfully",
              taskId: task.id,
              expenseId,
              extractedData
            });
          } else {
            // OCR failed
            await storage.updateExpense(expenseId, { status: 'ocr_failed' });
            await storage.updateBackgroundTaskStatus(
              task.id,
              'failed',
              null,
              ocrResult.error || "OCR processing failed"
            );

            res.json({
              message: "OCR processing failed",
              taskId: task.id,
              expenseId,
              error: ocrResult.error
            });
          }
        } else {
          // Unknown task type
          await storage.updateBackgroundTaskStatus(
            task.id,
            'failed',
            null,
            `Unknown task type: ${task.type}`
          );

          res.json({
            message: "Unknown task type",
            taskId: task.id,
            type: task.type
          });
        }
      } catch (processError: any) {
        // Task processing failed
        console.error(`Error processing task ${task.id}:`, processError);
        await storage.updateBackgroundTaskStatus(
          task.id,
          'failed',
          null,
          processError.message || "Task processing failed"
        );

        res.status(500).json({
          message: "Task processing failed",
          taskId: task.id,
          error: processError.message
        });
      }
    } catch (error) {
      next(error);
    }
  });

  return router;
}