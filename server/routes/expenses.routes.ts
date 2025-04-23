import express, { type Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getAuth } from "@clerk/express"; // Import Clerk getAuth
import * as schema from '@shared/schema'; // Import schema
import { insertExpenseSchema } from "@shared/schema";
import { upload } from "../middleware/multer-config"; // Assuming multer config is still needed
import type { SupabaseStorage } from "../supabase-storage";
import type { User, InsertExpense } from "@shared/schema"; // Import InsertExpense
import { v4 as uuidv4 } from "uuid"; // Import uuid
import { loadConfig } from "../config"; // Import config loading

// Define request type augmentation for Clerk auth and Multer
interface ClerkMulterRequest extends Request {
  auth?: { userId?: string | null }; // Clerk attaches auth here
  file?: any; // Multer file
  user?: User | null | undefined; // Keep for potential internal ID usage if needed
}

export function createExpenseRouter(storage: SupabaseStorage): express.Router {
  const router = express.Router();

  // GET /api/expenses
  router.get("/", async (req: ClerkMulterRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: authUserId } = getAuth(req);
      if (!authUserId) return res.status(401).send("Unauthorized");

      const userProfile = await storage.getUserByClerkId(authUserId);
      if (!userProfile) return res.status(404).send("User profile not found");
      const internalUserId = userProfile.id;

      const tripName = req.query.tripName as string | undefined;
      const expenses = tripName
        ? await storage.getExpensesByTripName(internalUserId, tripName)
        : await storage.getExpensesByUserId(internalUserId);
      res.json(expenses);
    } catch (error) { next(error); }
  });

  // GET /api/expenses/:id
  router.get("/:id", async (req: ClerkMulterRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: authUserId } = getAuth(req);
      if (!authUserId) return res.status(401).send("Unauthorized");

      const userProfile = await storage.getUserByClerkId(authUserId);
      if (!userProfile) return res.status(404).send("User profile not found");
      const internalUserId = userProfile.id;

      const expenseId = parseInt(req.params.id);
      if (isNaN(expenseId)) return res.status(400).send("Invalid expense ID");

      const expense = await storage.getExpense(expenseId);
      if (!expense) return res.status(404).send("Expense not found");
      if (expense.userId !== internalUserId) return res.status(403).send("Forbidden");

      res.json(expense);
    } catch (error) { next(error); }
  });

  // POST /api/expenses
  router.post("/", (upload as any).single("receipt"), async (req: ClerkMulterRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: authUserId } = getAuth(req);
      if (!authUserId) return res.status(401).send("Unauthorized");

      const userProfile = await storage.getUserByClerkId(authUserId);
      if (!userProfile) return res.status(404).send("User profile not found");
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
      let expenseData: Omit<InsertExpense, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'receiptPath' | 'status' | 'ocrError'> = {
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
        if (parsedBody.description && (!expenseData.comments || expenseData.comments.trim() === '')) expenseData.comments = parsedBody.description;
        else if (parsedBody.description) expenseData.comments = `${parsedBody.description}\n\n${expenseData.comments}`;
        expenseData.vendor = parsedBody.vendor || 'Travel Vendor';
        expenseData.location = parsedBody.location || 'Travel Location';
      } else {
        expenseData.type = parsedBody.type || 'General Expense';
        expenseData.vendor = parsedBody.vendor || 'Unknown Vendor';
        expenseData.location = parsedBody.location || 'Unknown Location';
      }

      let supabasePath: string | null = null;
      if (req.file) {
        const uniquePath = `receipts/${internalUserId}/${uuidv4()}-${req.file.originalname}`;
        const uploadResult = await storage.uploadFile(uniquePath, req.file.buffer, req.file.mimetype);
        supabasePath = uploadResult.path;
        console.log(`Uploaded receipt for new expense to Supabase: ${supabasePath}`);
      }

      // Ensure the final object matches InsertExpense & { userId: number, receiptPath?: string | null }
      const finalExpenseData: InsertExpense & { userId: number, receiptPath?: string | null } = {
          ...expenseData,
          userId: internalUserId,
          receiptPath: supabasePath,
          cost: expenseData.cost, // Keep cost as string
          status: 'pending', // Example default status
          // ocrError: null, // Removed this line as it doesn't exist in schema
      };


      const expense = await storage.createExpense(finalExpenseData);
      res.status(201).json(expense);
    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ message: "Validation failed", errors: error.errors });
        next(error);
    }
  });

  // PUT /api/expenses/:id
  router.put("/:id", (upload as any).single("receipt"), async (req: ClerkMulterRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: authUserId } = getAuth(req);
      if (!authUserId) return res.status(401).send("Unauthorized");

      const userProfile = await storage.getUserByClerkId(authUserId);
      if (!userProfile) return res.status(404).send("User profile not found");
      const internalUserId = userProfile.id;

      const expenseId = parseInt(req.params.id);
      if (isNaN(expenseId)) return res.status(400).send("Invalid expense ID");

      const expense = await storage.getExpense(expenseId);
      if (!expense) return res.status(404).send("Expense not found");
      if (expense.userId !== internalUserId) return res.status(403).send("Forbidden");

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
      let expenseData: Partial<Omit<InsertExpense, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'receiptPath' | 'status' | 'ocrError'>> = {};
      if (parsedBody.date !== undefined) expenseData.date = parsedBody.date;
      if (parsedBody.cost !== undefined) expenseData.cost = String(parsedBody.cost); // Keep cost as string
      if (parsedBody.tripName !== undefined) expenseData.tripName = parsedBody.tripName;
      if (parsedBody.comments !== undefined) expenseData.comments = parsedBody.comments || '';

      // Handle template-specific fields based on presence in parsedBody
      if (currentTemplate === 'travel') {
          if (parsedBody.type !== undefined) expenseData.type = parsedBody.type || parsedBody.description || 'Travel Expense';
          if (parsedBody.description && (!expenseData.comments || expenseData.comments.trim() === '')) expenseData.comments = parsedBody.description;
          else if (parsedBody.description) expenseData.comments = `${parsedBody.description}\n\n${expenseData.comments}`;
          if (parsedBody.vendor !== undefined) expenseData.vendor = parsedBody.vendor || 'Travel Vendor';
          if (parsedBody.location !== undefined) expenseData.location = parsedBody.location || 'Travel Location';
      } else {
          if (parsedBody.type !== undefined) expenseData.type = parsedBody.type || 'General Expense';
          if (parsedBody.vendor !== undefined) expenseData.vendor = parsedBody.vendor || 'Unknown Vendor';
          if (parsedBody.location !== undefined) expenseData.location = parsedBody.location || 'Unknown Location';
      }


      let supabasePath = expense.receiptPath;
      if (req.file) {
        if (expense.receiptPath) {
          console.log(`Deleting old receipt ${expense.receiptPath} from Supabase.`);
          await storage.deleteFile(expense.receiptPath).catch(e => console.error("Failed to delete old Supabase receipt:", e));
        }
        const uniquePath = `receipts/${internalUserId}/${uuidv4()}-${req.file.originalname}`;
        const uploadResult = await storage.uploadFile(uniquePath, req.file.buffer, req.file.mimetype);
        supabasePath = uploadResult.path;
        console.log(`Uploaded new receipt for expense ${expenseId} to Supabase: ${supabasePath}`);
      }

      // Prepare final update payload, ensuring cost remains string
      const finalUpdatePayload: Partial<InsertExpense & { receiptPath?: string | null }> = {
          ...expenseData,
          receiptPath: supabasePath,
          cost: expenseData.cost, // Keep cost as string
      };


      const updatedExpense = await storage.updateExpense(expenseId, finalUpdatePayload);
      res.json(updatedExpense);
    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ message: "Validation failed", errors: error.errors });
        next(error);
    }
  });

  // DELETE /api/expenses/:id
  router.delete("/:id", async (req: ClerkMulterRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: authUserId } = getAuth(req);
      if (!authUserId) return res.status(401).send("Unauthorized");

      const userProfile = await storage.getUserByClerkId(authUserId);
      if (!userProfile) return res.status(404).send("User profile not found");
      const internalUserId = userProfile.id;

      const expenseId = parseInt(req.params.id);
      if (isNaN(expenseId)) return res.status(400).send("Invalid expense ID");

      const expense = await storage.getExpense(expenseId);
      if (!expense) return res.status(404).send("Expense not found");
      if (expense.userId !== internalUserId) return res.status(403).send("Forbidden");

      if (expense.receiptPath) {
        console.log(`Deleting receipt ${expense.receiptPath} from Supabase for expense ${expenseId}.`);
        await storage.deleteFile(expense.receiptPath).catch(e => console.error("Failed to delete Supabase receipt:", e));
      }
      await storage.deleteExpense(expenseId);
      res.status(204).send();
    } catch (error) { next(error); }
  });

  // Removed /api/expenses/process-ocr route (handled by background function)
  // Removed /api/expenses/batch-upload-trigger route (handled by background function)

  return router;
}