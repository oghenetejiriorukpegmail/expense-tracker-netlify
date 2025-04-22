import express, { type Express, Request, Response, NextFunction } from "express"; // Added Response, NextFunction
import { format } from "date-fns";
import { createServer, type Server } from "http";
import { z } from "zod";
import { insertTripSchema, insertExpenseSchema, Expense, InsertExpense, insertMileageLogSchema, rawInsertMileageLogSchema, Trip, User } from "@shared/schema"; // Added Trip and User
import { upload } from "./middleware/multer-config";
import { OcrProvider, OcrTemplate } from "./util/ocr"; // Import OCR types

import { processReceiptWithOCR, processOdometerImageWithAI, testOCR } from "./util/ocr"; // Keep for other routes
import fetch from 'node-fetch'; // Import fetch for triggering background functions
import { BackgroundTask, InsertBackgroundTask } from "@shared/schema"; // Import background task types
import path from "path";
import { v4 as uuidv4 } from "uuid"; // Import uuid
import ExcelJS from 'exceljs';
import { Buffer } from 'buffer';
import archiver from 'archiver';
import type { SupabaseStorage } from "./supabase-storage"; // Use specific type
import { updateOcrApiKey, setDefaultOcrMethod, loadConfig, saveConfig } from "./config";
// Removed old auth imports: import { hashPassword, comparePasswords } from "./auth";
import { authenticateJWT } from "./middleware/auth-middleware"; // Import the new JWT middleware factory

// Define request type with file from multer (file.buffer will be used)
interface MulterRequest extends Request {
  file?: any;
  files?: any[];
  user?: User | null | undefined; // Allow null/undefined to match middleware/Express types
}

// --- Helper Functions ---

async function generateExcelReport(expenses: Expense[], user: { id: number; username: string }, storage: SupabaseStorage): Promise<Buffer> {
    const templatePath = path.join(process.cwd(), 'assets', 'Expense_Template.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) throw new Error("Worksheet not found in template.");

    const userProfile = await storage.getUserById(user.id);
    const firstName = userProfile?.firstName?.trim() || '';
    const lastName = userProfile?.lastName?.trim() || '';
    let fullName = `${firstName} ${lastName}`.trim() || user.username;
    const applicationDate = new Date();

    // Populate template placeholders
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        if (cell.value && typeof cell.value === 'string') {
          let cellValue = cell.value;
          cellValue = cellValue.replace(/{{full name}}/g, fullName);
          cellValue = cellValue.replace(/{{Today's Date}}/g, format(applicationDate, 'M/d/yyyy'));
          cell.value = cellValue;
        } else if (cell.value === "{{Today's Date}}") {
             cell.value = applicationDate;
             if (!cell.numFmt) cell.numFmt = 'mm/dd/yyyy';
        }
      });
    });

    // Populate specific cells
    worksheet.getCell('B9').value = fullName;
    worksheet.getCell('B10').value = applicationDate;
    if (!worksheet.getCell('B10').numFmt) worksheet.getCell('B10').numFmt = 'mm/dd/yyyy';
    worksheet.getCell('B57').value = fullName;
    worksheet.getCell('E58').value = applicationDate;
    if (!worksheet.getCell('E58').numFmt) worksheet.getCell('E58').numFmt = 'mm/dd/yyyy';

    // Populate Expense Data
    const expenseTableStartRow = 13;
    expenses.forEach((expense, index) => {
      const currentRowNumber = expenseTableStartRow + index;
      const currentRow = worksheet.getRow(currentRowNumber);
      currentRow.getCell('A').value = new Date(expense.date);
      if (!currentRow.getCell('A').numFmt) currentRow.getCell('A').numFmt = 'mm/dd/yyyy';
      currentRow.getCell('B').value = typeof expense.cost === 'number' ? expense.cost : parseFloat(expense.cost);
      if (!currentRow.getCell('B').numFmt) currentRow.getCell('B').numFmt = '$#,##0.00';
      currentRow.getCell('C').value = "CAD"; // Assuming CAD, make dynamic if needed
      if (!currentRow.getCell('C').alignment) currentRow.getCell('C').alignment = { horizontal: 'center' };
      currentRow.getCell('D').value = expense.comments || expense.type || "";
    });

    const excelData = await workbook.xlsx.writeBuffer();
    return Buffer.from(excelData);
}

async function generateZipArchive(res: Response, expenses: Expense[], excelBuffer: Buffer, excelFilename: string, zipFilename: string, storage: SupabaseStorage) {
    const archive = archiver('zip', { zlib: { level: 9 } });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${zipFilename}`);
    archive.pipe(res);

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') console.warn("Archiver warning: ", err);
      else throw err;
    });
    archive.on('error', (err) => {
      console.error("Archiving error:", err);
      if (!res.headersSent) res.status(500).send({ error: 'Failed to create zip file.' });
    });

    // Add Excel
    archive.append(excelBuffer, { name: excelFilename });
    console.log(`Appended ${excelFilename} to archive.`);

    // Add Receipts from Supabase
    console.log("Adding receipts from Supabase to archive...");
    for (const expense of expenses) {
      if (expense.receiptPath) { // receiptPath now stores the Supabase object key/path
        try {
          console.log(`Attempting to download receipt: ${expense.receiptPath}`);
          const receiptBuffer = await storage.downloadFile(expense.receiptPath); // Assuming default bucket
          // Extract original filename or use a generic name if needed
          const filename = expense.receiptPath.split('/').pop() || expense.receiptPath;
          archive.append(receiptBuffer, { name: `receipts/${filename}` });
          console.log(`Successfully added receipt ${filename} (${expense.receiptPath}) to archive.`);
        } catch (downloadError: any) {
          console.error(`Error downloading receipt ${expense.receiptPath} from Supabase:`, downloadError.message || downloadError);
          // Optionally append a placeholder or skip
          archive.append(`Error downloading receipt: ${expense.receiptPath}\n${downloadError.message}`, { name: `receipts/ERROR_${expense.receiptPath}.txt` });
        }
      }
    }
    console.log("Finished adding receipts.");

    await archive.finalize();
    console.log("Archive finalized.");
}


// --- Route Registration Functions ---

function registerProfileRoutes(app: Express, storage: SupabaseStorage, authMiddleware: express.RequestHandler) { // Add authMiddleware param
  // GET /api/profile
  app.get("/api/profile", authMiddleware, async (req: MulterRequest, res, next) => { // Apply middleware
    try {
      // req.user is now the AppUser object from the middleware
      if (!req.user) return res.status(401).send("Unauthorized"); // Should not happen if middleware passed
      // No need to fetch again, req.user is already the profile
      const { password, ...profileData } = req.user; // Directly use req.user
      res.json(profileData);
    } catch (error) { next(error); }
  });

  // PUT /api/profile
  const profileUpdateSchema = z.object({
    firstName: z.string().min(1, "First name cannot be empty").default(''),
    lastName: z.string().optional().default(''),
    phoneNumber: z.string().optional().default(''),
    email: z.string().email("Invalid email address"),
    bio: z.string().optional(),
  });
  app.put("/api/profile", authMiddleware, async (req: MulterRequest, res, next) => { // Apply middleware
    try {
      if (!req.user) return res.status(401).send("Unauthorized"); // Check req.user
      const validatedData = profileUpdateSchema.parse(req.body);
      const existingUserByEmail = await storage.getUserByEmail(validatedData.email);
      if (existingUserByEmail && existingUserByEmail.id !== req.user.id) { // Use req.user.id
         return res.status(409).json({ message: "Email already in use." });
      }
      const updatedUser = await storage.updateUserProfile(req.user.id, validatedData);
      if (!updatedUser) return res.status(404).send("User not found");
      const { password, ...profileData } = updatedUser;
      res.json(profileData);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Validation failed", errors: error.errors });
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) return res.status(409).json({ message: "Email already in use." });
      next(error);
    }
  });

  // POST /api/profile/change-password
  const passwordChangeSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6),
  });
  // POST /api/profile/change-password - Requires Supabase password change flow, remove for now
  /*
  app.post("/api/profile/change-password", authMiddleware, async (req: MulterRequest, res, next) => {
    try {
      if (!req.user) return res.status(401).send("Unauthorized");
      // Password change needs to be handled via Supabase client/API
      // This endpoint is no longer valid with Supabase auth
      return res.status(501).json({ message: "Password change via this endpoint is not supported with Supabase auth." });

      // --- Old Logic (Commented Out) ---
      // const { currentPassword, newPassword } = passwordChangeSchema.parse(req.body);
      // const user = await storage.getUserById(req.user.id); // Need the stored user for comparison if keeping local pw check
      // if (!user) return res.status(404).send("User not found");
      // // Comparison logic might change depending on how Supabase handles password updates
      // // const isMatch = await comparePasswords(currentPassword, user.password);
      // // if (!isMatch) return res.status(400).json({ message: "Incorrect current password." });
      // // Hashing and updating password should be done via Supabase API
      // // const newPasswordHash = await hashPassword(newPassword);
      // // await storage.updateUserPassword(req.user.id, newPasswordHash);
      // res.status(200).json({ message: "Password updated successfully." });
      // --- End Old Logic ---

    } catch (error) {
       if (error instanceof z.ZodError) return res.status(400).json({ message: "Validation failed", errors: error.errors });
      next(error);
    }
  });
  */
}

function registerTripRoutes(app: Express, storage: SupabaseStorage, authMiddleware: express.RequestHandler) { // Add authMiddleware param
  // GET /api/trips
  app.get("/api/trips", authMiddleware, async (req: MulterRequest, res, next) => { // Apply middleware
    try {
      if (!req.user) return res.status(401).send("Unauthorized"); // Check req.user
      const trips = await storage.getTripsByUserId(req.user.id); // Use req.user.id
      res.json(trips);
    } catch (error) { next(error); }
  });

  // POST /api/trips
  app.post("/api/trips", authMiddleware, async (req: MulterRequest, res, next) => { // Apply middleware
    try {
      if (!req.user) return res.status(401).send("Unauthorized"); // Check req.user
      const validatedData = insertTripSchema.parse(req.body);
      const trip = await storage.createTrip({ ...validatedData, userId: req.user.id }); // Use req.user.id
      res.status(201).json(trip);
    } catch (error) { next(error); }
  });

  // PUT /api/trips/:id
  app.put("/api/trips/:id", authMiddleware, async (req: MulterRequest, res, next) => { // Apply middleware
    try {
      if (!req.user) return res.status(401).send("Unauthorized"); // Check req.user
      const tripId = parseInt(req.params.id);
      if (isNaN(tripId)) return res.status(400).send("Invalid trip ID");
      const trip = await storage.getTrip(tripId);
      if (!trip) return res.status(404).send("Trip not found");
      if (trip.userId !== req.user.id) return res.status(403).send("Forbidden"); // Use req.user.id
      const validatedData = insertTripSchema.parse(req.body);
      const updatedTrip = await storage.updateTrip(tripId, validatedData);
      res.json(updatedTrip);
    } catch (error) { next(error); }
  });

  // DELETE /api/trips/:id
  app.delete("/api/trips/:id", authMiddleware, async (req: MulterRequest, res, next) => { // Apply middleware
    try {
      if (!req.user) return res.status(401).send("Unauthorized"); // Check req.user
      const tripId = parseInt(req.params.id);
      if (isNaN(tripId)) return res.status(400).send("Invalid trip ID");
      const trip = await storage.getTrip(tripId);
      if (!trip) return res.status(404).send("Trip not found");
      if (trip.userId !== req.user.id) return res.status(403).send("Forbidden"); // Use req.user.id
      await storage.deleteTrip(tripId);
      res.status(204).send();
    } catch (error) { next(error); }
  });

  // POST /api/trips/:tripId/batch-process-receipts
  app.post("/api/trips/:tripId/batch-process-receipts", authMiddleware, (upload as any).array('receipts', 20), async (req: MulterRequest, res, next) => { // Apply middleware
    try {
      if (!req.user) return res.status(401).send("Unauthorized"); // Check req.user
      const tripId = parseInt(req.params.tripId);
      if (isNaN(tripId)) return res.status(400).send("Invalid trip ID");
      const trip = await storage.getTrip(tripId);
      if (!trip || trip.userId !== req.user.id) return res.status(404).send("Trip not found or not authorized"); // Use req.user.id
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) return res.status(400).send("No receipt files uploaded");

      const files = req.files;
      const results = [];
      const config = loadConfig();
      console.log(`Starting batch processing for trip ${tripId} (${trip.name}) with ${files.length} files.`);

      for (const file of files) {
        // const filePath = path.join(process.cwd(), "uploads", file.filename); // No longer saving locally
        let status = 'failed', errorMsg = 'Unknown processing error', createdExpense = null, supabasePath: string | null = null;
        try {
          console.log(`Processing file buffer: ${file.originalname} (${file.mimetype})`);
          // Pass buffer and mimetype to the updated OCR function, casting method type
          const method = (config.defaultOcrMethod || 'gemini') as OcrProvider;
          const template = (config.ocrTemplate || 'travel') as OcrTemplate;
          const ocrResult = await processReceiptWithOCR(file.buffer, file.mimetype, method, template);

          if (ocrResult.success && ocrResult.extractedData) {
            // Upload file to Supabase first
            const uniquePath = `receipts/${req.user!.id}/${uuidv4()}-${file.originalname}`;
            const uploadResult = await storage.uploadFile(uniquePath, file.buffer, file.mimetype);
            supabasePath = uploadResult.path;
            console.log(`Uploaded ${file.originalname} to Supabase: ${supabasePath}`);

            const data = ocrResult.extractedData;
            const expenseData: Omit<InsertExpense, 'id' | 'createdAt' | 'updatedAt' | 'userId'> = { // Use Omit for clarity
              date: data.date || format(new Date(), 'yyyy-MM-dd'),
              cost: String(typeof data.cost === 'number' ? data.cost : (parseFloat(String(data.cost)) || 0)),
              type: data.type || 'Other',
              vendor: data.vendor || 'Unknown Vendor',
              location: data.location || 'Unknown Location',
              comments: data.description || ocrResult.text?.substring(0, 200) || '',
              tripName: trip.name,
            };
            if (!expenseData.date || !expenseData.cost || !expenseData.type || !expenseData.vendor || !expenseData.location || !expenseData.tripName) {
                throw new Error(`Missing required fields extracted from ${file.originalname}`);
            }
            createdExpense = await storage.createExpense({ ...expenseData, userId: req.user.id, receiptPath: supabasePath });
            status = 'success'; errorMsg = '';
            console.log(`Successfully created expense for ${file.originalname} with receipt ${supabasePath}`);
          } else {
            errorMsg = ocrResult.error || "OCR failed to extract data";
            console.warn(`OCR failed for ${file.originalname}: ${errorMsg}`);
          }
        } catch (processingError) {
          errorMsg = processingError instanceof Error ? processingError.message : String(processingError);
          console.error(`Error processing file ${file.originalname}:`, processingError);
        }
        results.push({ filename: file.originalname, status, error: errorMsg, expenseId: createdExpense?.id });
      }
      console.log(`Batch processing finished for trip ${tripId}.`);
      res.status(200).json({ message: "Batch processing complete.", results });
    } catch (error) { next(error); }
  });
}

function registerExpenseRoutes(app: Express, storage: SupabaseStorage, authMiddleware: express.RequestHandler) { // Add authMiddleware param
  // GET /api/expenses
  // TODO: Consider adding signed URLs for receiptPath here or a separate endpoint
  app.get("/api/expenses", authMiddleware, async (req: MulterRequest, res, next) => { // Apply middleware
    try {
      if (!req.user) return res.status(401).send("Unauthorized"); // Check req.user
      const tripName = req.query.tripName as string | undefined;
      const expenses = tripName ? await storage.getExpensesByTripName(req.user.id, tripName) : await storage.getExpensesByUserId(req.user.id); // Use req.user.id
      res.json(expenses);
    } catch (error) { next(error); }
  });

  // GET /api/expenses/:id
  // TODO: Consider adding signed URL for receiptPath here
  app.get("/api/expenses/:id", authMiddleware, async (req: MulterRequest, res, next) => { // Apply middleware
    try {
      if (!req.user) return res.status(401).send("Unauthorized"); // Check req.user
      const expenseId = parseInt(req.params.id);
      if (isNaN(expenseId)) return res.status(400).send("Invalid expense ID");
      const expense = await storage.getExpense(expenseId);
      if (!expense) return res.status(404).send("Expense not found");
      if (expense.userId !== req.user.id) return res.status(403).send("Forbidden"); // Use req.user.id

      // Optionally generate signed URL if receiptPath exists
      // let signedReceiptUrl: string | null = null;
      // if (expense.receiptPath) {
      //   try {
      //      const { signedUrl } = await storage.getSignedUrl(expense.receiptPath);
      //      signedReceiptUrl = signedUrl;
      //   } catch (urlError) {
      //      console.error(`Failed to get signed URL for ${expense.receiptPath}:`, urlError);
      //   }
      // }
      // res.json({ ...expense, signedReceiptUrl });

      res.json(expense); // Return path for now
    } catch (error) { next(error); }
  });

  // POST /api/expenses
  app.post("/api/expenses", authMiddleware, (upload as any).single("receipt"), async (req: MulterRequest, res, next) => { // Apply middleware
    try {
      if (!req.user) return res.status(401).send("Unauthorized"); // Check req.user
      const config = loadConfig();
      const currentTemplate = config.ocrTemplate || 'general';
      let expenseData: Omit<InsertExpense, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'receiptPath'> = { // Use Omit
        date: req.body.date,
        cost: String(parseFloat(req.body.cost)), // Ensure cost is string for schema
        tripName: req.body.tripName,
        comments: req.body.comments || '',
        type: '', // Initialize type
        vendor: '', // Initialize vendor
        location: '', // Initialize location
      };

      if (currentTemplate === 'travel') {
        expenseData.type = req.body.type || req.body.description || 'Travel Expense';
        if (req.body.description && (!expenseData.comments || expenseData.comments.trim() === '')) expenseData.comments = req.body.description;
        else if (req.body.description) expenseData.comments = `${req.body.description}\n\n${expenseData.comments}`;
        expenseData.vendor = req.body.vendor || 'Travel Vendor';
        expenseData.location = req.body.location || 'Travel Location';
      } else {
        expenseData.type = req.body.type || 'General Expense'; // Provide default
        expenseData.vendor = req.body.vendor || 'Unknown Vendor'; // Provide default
        expenseData.location = req.body.location || 'Unknown Location'; // Provide default
      }

      let supabasePath: string | null = null;
      if (req.file) {
        const uniquePath = `receipts/${req.user!.id}/${uuidv4()}-${req.file.originalname}`;
        const uploadResult = await storage.uploadFile(uniquePath, req.file.buffer, req.file.mimetype);
        supabasePath = uploadResult.path;
        console.log(`Uploaded receipt for new expense to Supabase: ${supabasePath}`);
      }

      const expense = await storage.createExpense({ ...expenseData, userId: req.user.id, receiptPath: supabasePath });
      res.status(201).json(expense);
    } catch (error) { next(error); }
  });

  // PUT /api/expenses/:id
  app.put("/api/expenses/:id", authMiddleware, (upload as any).single("receipt"), async (req: MulterRequest, res, next) => { // Apply middleware
    try {
      if (!req.user) return res.status(401).send("Unauthorized"); // Check req.user
      const expenseId = parseInt(req.params.id);
      if (isNaN(expenseId)) return res.status(400).send("Invalid expense ID");
      const expense = await storage.getExpense(expenseId);
      if (!expense) return res.status(404).send("Expense not found");
      if (expense.userId !== req.user.id) return res.status(403).send("Forbidden"); // Use req.user.id

      const config = loadConfig();
      const currentTemplate = config.ocrTemplate || 'general';
      let expenseData: Partial<Omit<InsertExpense, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'receiptPath'>> = { // Use Partial<Omit<...>>
        date: req.body.date,
        cost: String(parseFloat(req.body.cost)), // Ensure cost is string for schema
        tripName: req.body.tripName,
        comments: req.body.comments || '',
      };

      if (currentTemplate === 'travel') {
        expenseData.type = req.body.type || req.body.description || 'Travel Expense';
        if (req.body.description && (!expenseData.comments || expenseData.comments.trim() === '')) expenseData.comments = req.body.description;
        else if (req.body.description) expenseData.comments = `${req.body.description}\n\n${expenseData.comments}`;
        expenseData.vendor = req.body.vendor || 'Travel Vendor';
        expenseData.location = req.body.location || 'Travel Location';
      } else {
        expenseData.type = req.body.type || 'General Expense'; // Provide default
        expenseData.vendor = req.body.vendor || 'Unknown Vendor'; // Provide default
        expenseData.location = req.body.location || 'Unknown Location'; // Provide default
      }

      let supabasePath = expense.receiptPath; // Keep existing path by default
      if (req.file) {
        // Delete old file from Supabase if it exists
        if (expense.receiptPath) {
          console.log(`Deleting old receipt ${expense.receiptPath} from Supabase.`);
          await storage.deleteFile(expense.receiptPath).catch(e => console.error("Failed to delete old Supabase receipt:", e));
        }
        // Upload new file
        const uniquePath = `receipts/${req.user!.id}/${uuidv4()}-${req.file.originalname}`;
        const uploadResult = await storage.uploadFile(uniquePath, req.file.buffer, req.file.mimetype);
        supabasePath = uploadResult.path;
        console.log(`Uploaded new receipt for expense ${expenseId} to Supabase: ${supabasePath}`);
      }
      // If receipt is explicitly removed (e.g., checkbox in UI not handled here), supabasePath should be set to null
      // Example: if (req.body.removeReceipt === 'true') { supabasePath = null; /* delete old file */ }

      const updatedExpense = await storage.updateExpense(expenseId, { ...expenseData, receiptPath: supabasePath });
      res.json(updatedExpense);
    } catch (error) { next(error); }
  });

  // DELETE /api/expenses/:id
  app.delete("/api/expenses/:id", authMiddleware, async (req: MulterRequest, res, next) => { // Apply middleware
    try {
      if (!req.user) return res.status(401).send("Unauthorized"); // Check req.user
      const expenseId = parseInt(req.params.id);
      if (isNaN(expenseId)) return res.status(400).send("Invalid expense ID");
      const expense = await storage.getExpense(expenseId);
      if (!expense) return res.status(404).send("Expense not found");
      if (expense.userId !== req.user.id) return res.status(403).send("Forbidden"); // Use req.user.id
      // Delete receipt from Supabase if it exists
      if (expense.receiptPath) {
        console.log(`Deleting receipt ${expense.receiptPath} from Supabase for expense ${expenseId}.`);
        await storage.deleteFile(expense.receiptPath).catch(e => console.error("Failed to delete Supabase receipt:", e));
      }
      await storage.deleteExpense(expenseId);
      res.status(204).send();
    } catch (error) { next(error); }
  });


  // POST /api/expenses/process-ocr (New route for creating placeholder and triggering OCR)
  app.post("/api/expenses/process-ocr", authMiddleware, (upload as any).single("receipt"), async (req: MulterRequest, res, next) => { // Apply middleware
    try {
        if (!req.user) return res.status(401).send("Unauthorized"); // Check req.user
        if (!req.file) return res.status(400).send("No receipt file uploaded");

        console.log(`Received file for OCR processing: ${req.file.originalname} (${req.file.mimetype})`);

        // 1. Upload the file to Supabase Storage
        const uniquePath = `receipts/${req.user!.id}/${uuidv4()}-${req.file.originalname}`;
        const uploadResult = await storage.uploadFile(uniquePath, req.file.buffer, req.file.mimetype);
        const supabasePath = uploadResult.path;
        console.log(`Uploaded receipt to Supabase for background processing: ${supabasePath}`);

        // 2. Create a placeholder expense record
        const placeholderExpenseData: InsertExpense & { userId: number } = {
            userId: req.user.id,
            date: format(new Date(), 'yyyy-MM-dd'), // Use current date as placeholder
            type: 'Processing OCR',
            vendor: 'Processing OCR',
            location: 'Processing OCR',
            cost: '0', // Placeholder cost
            tripName: req.body.tripName || 'Default Trip', // Assign trip if provided
            comments: `OCR processing initiated for ${req.file.originalname}`,
            receiptPath: supabasePath,
            status: 'processing_ocr', // Set initial status
        };
        const placeholderExpense = await storage.createExpense(placeholderExpenseData);
        console.log(`Created placeholder expense (ID: ${placeholderExpense.id}) for OCR task.`);

        // 3. Prepare payload for the background function
        const payload = {
            filePath: supabasePath,
            userId: String(req.user.id),
            mimeType: req.file.mimetype,
            expenseId: placeholderExpense.id // Pass the ID of the placeholder expense
        };

        // 4. Trigger the background function (asynchronously)
        const functionUrl = `/.netlify/functions/process-ocr`;
        console.log(`Triggering background function: ${functionUrl} for expense ID ${placeholderExpense.id}`);

        fetch(functionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).catch(async (fetchError) => {
            console.error(`Error triggering background function ${functionUrl} for expense ${placeholderExpense.id}:`, fetchError);
            // Update placeholder expense status to failed if trigger fails
            await storage.updateExpenseStatus(placeholderExpense.id, 'ocr_failed', `Failed to trigger background function: ${fetchError.message}`);
        });

        // 5. Return an immediate response to the client with the placeholder expense
        res.status(202).json({
            message: "Receipt accepted for processing. Results will appear shortly.",
            expense: placeholderExpense, // Return the placeholder
        });

    } catch (error) {
        console.error("Error in /api/expenses/process-ocr:", error);
        next(error);
    }
});


  // POST /api/expenses/batch-upload-trigger (Triggers background function)
  app.post("/api/expenses/batch-upload-trigger", authMiddleware, (upload as any).single("batchFile"), async (req: MulterRequest, res, next) => { // Apply middleware
    try {
      if (!req.user) return res.status(401).send("Unauthorized"); // Check req.user
      if (!req.file) return res.status(400).send("No batch file uploaded");

      console.log(`Received file for batch upload: ${req.file.originalname} (${req.file.mimetype})`);

      // Determine file type (simple check based on extension/mimetype)
      let fileType: 'csv' | 'xlsx' | null = null;
      const extension = path.extname(req.file.originalname).toLowerCase();
      if (extension === '.csv' || req.file.mimetype === 'text/csv') {
        fileType = 'csv';
      } else if (extension === '.xlsx' || req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        fileType = 'xlsx';
      } else {
        return res.status(400).send("Unsupported file type. Please upload CSV or XLSX.");
      }

      // 1. Upload the file to Supabase Storage
      const uniquePath = `batch-uploads/${req.user!.id}/${uuidv4()}-${req.file.originalname}`;
      const uploadResult = await storage.uploadFile(uniquePath, req.file.buffer, req.file.mimetype);
      const supabasePath = uploadResult.path;
      console.log(`Uploaded batch file to Supabase for background processing: ${supabasePath}`);

      // 2. Create a background task record
      const taskData: InsertBackgroundTask = {
          userId: req.user.id,
          type: 'batch_upload',
          status: 'pending', // Initial status
      };
      const backgroundTask = await storage.createBackgroundTask(taskData);
      console.log(`Created background task (ID: ${backgroundTask.id}) for batch upload.`);

      // 3. Prepare payload for the background function
      const payload = {
        filePath: supabasePath,
        userId: String(req.user.id),
        fileType: fileType,
        taskId: backgroundTask.id // Pass the task ID
      };

      // 4. Trigger the background function (asynchronously)
      const functionUrl = `/.netlify/functions/batch-upload`;
      console.log(`Triggering background function: ${functionUrl} for task ID ${backgroundTask.id}`);

      fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(async (fetchError) => {
        console.error(`Error triggering background function ${functionUrl} for task ${backgroundTask.id}:`, fetchError);
        // Update task status to failed if trigger fails
        await storage.updateBackgroundTaskStatus(backgroundTask.id, 'failed', null, `Failed to trigger background function: ${fetchError.message}`);
      });

      // 5. Return an immediate response to the client with the task info
      res.status(202).json({
        message: "Batch file accepted for processing. You can monitor the task status.",
        task: backgroundTask, // Return the created task record
      });

    } catch (error) {
      console.error("Error in /api/expenses/batch-upload-trigger:", error);
      next(error);
    }
  });

}

function registerMileageLogRoutes(app: Express, storage: SupabaseStorage, authMiddleware: express.RequestHandler) { // Add authMiddleware param
  // GET /api/mileage-logs
  // TODO: Consider adding signed URLs for images here or a separate endpoint
  app.get("/api/mileage-logs", authMiddleware, async (req: MulterRequest, res, next) => { // Apply middleware
    try {
      if (!req.user) return res.status(401).send("Unauthorized"); // Check req.user
      const querySchema = z.object({
        tripId: z.coerce.number().int().positive().optional(), startDate: z.string().optional(), endDate: z.string().optional(),
        limit: z.coerce.number().int().positive().optional(), offset: z.coerce.number().int().min(0).optional(),
        sortBy: z.string().optional(), sortOrder: z.enum(['asc', 'desc']).optional(),
      });
      const validatedQuery = querySchema.parse(req.query);
      const logs = await storage.getMileageLogsByUserId(req.user.id, validatedQuery);
      res.json(logs);
    } catch (error) {
       if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      next(error);
    }
  });

  // POST /api/mileage-logs
  app.post("/api/mileage-logs", authMiddleware, async (req: MulterRequest, res, next) => { // Apply middleware
    try {
      if (!req.user) return res.status(401).send("Unauthorized"); // Check req.user
      const validatedData = insertMileageLogSchema.parse(req.body);
      const calculatedDistance = validatedData.endOdometer - validatedData.startOdometer;
      if (calculatedDistance <= 0) return res.status(400).json({ message: "Calculated distance must be positive." });
      const newLog = await storage.createMileageLog({ ...validatedData, userId: req.user.id, calculatedDistance }); // Use req.user.id
      res.status(201).json(newLog);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Validation failed", errors: error.errors });
      next(error);
    }
  });

  // PUT /api/mileage-logs/:id
  app.put("/api/mileage-logs/:id", authMiddleware, async (req: MulterRequest, res, next) => { // Apply middleware
    try {
      if (!req.user) return res.status(401).send("Unauthorized"); // Check req.user
      const logId = parseInt(req.params.id);
      if (isNaN(logId)) return res.status(400).send("Invalid mileage log ID");
      const existingLog = await storage.getMileageLogById(logId);
      if (!existingLog) return res.status(404).send("Mileage log not found");
      if (existingLog.userId !== req.user.id) return res.status(403).send("Forbidden"); // Use req.user.id

      const updateSchema = rawInsertMileageLogSchema.partial().extend({
          startOdometer: z.number().positive().optional(), endOdometer: z.number().positive().optional(), tripId: z.number().int().positive().optional(),
          startImageUrl: z.string().url().optional().nullable(), endImageUrl: z.string().url().optional().nullable(), entryMethod: z.enum(['manual', 'ocr']).optional(),
      }).refine((data: any) => {
          if (data.startOdometer !== undefined && data.endOdometer !== undefined) return data.endOdometer > data.startOdometer;
          if (data.startOdometer !== undefined && existingLog.endOdometer !== null) return parseFloat(existingLog.endOdometer) > data.startOdometer;
          if (data.endOdometer !== undefined && existingLog.startOdometer !== null) return data.endOdometer > parseFloat(existingLog.startOdometer);
          return true;
      }, { message: "End odometer must be greater than start", path: ["endOdometer"] });

      const validatedData = updateSchema.parse(req.body);
      let calculatedDistance: number | undefined = undefined;
      const startOdo = validatedData.startOdometer ?? parseFloat(existingLog.startOdometer);
      const endOdo = validatedData.endOdometer ?? parseFloat(existingLog.endOdometer);
      if (validatedData.startOdometer !== undefined || validatedData.endOdometer !== undefined) {
          calculatedDistance = endOdo - startOdo;
          if (calculatedDistance <= 0) return res.status(400).json({ message: "Calculated distance must be positive." });
      }

      // Handle image deletion
      // Handle image deletion from Supabase
      if (validatedData.startImageUrl === null && existingLog.startImageUrl) {
          console.log(`Deleting old start image ${existingLog.startImageUrl} from Supabase.`);
          await storage.deleteFile(existingLog.startImageUrl).catch(e => console.error(`Failed to delete old Supabase start image:`, e));
      }
      if (validatedData.endImageUrl === null && existingLog.endImageUrl) {
          console.log(`Deleting old end image ${existingLog.endImageUrl} from Supabase.`);
          await storage.deleteFile(existingLog.endImageUrl).catch(e => console.error(`Failed to delete old Supabase end image:`, e));
      }

      // Note: If new images were uploaded via /upload-odometer-image, their Supabase paths
      // should be included in validatedData.startImageUrl / validatedData.endImageUrl by the client.
      const updatePayload = { ...validatedData, calculatedDistance: calculatedDistance !== undefined ? String(calculatedDistance) : undefined };

      // Ensure calculatedDistance is a number if present
      const finalUpdatePayload = {
          ...updatePayload,
          calculatedDistance: updatePayload.calculatedDistance !== undefined ? parseFloat(updatePayload.calculatedDistance) : undefined,
      };

      const updatedLog = await storage.updateMileageLog(logId, finalUpdatePayload);
      res.json(updatedLog);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Validation failed", errors: error.errors });
      next(error);
    }
  });

  // DELETE /api/mileage-logs/:id
  app.delete("/api/mileage-logs/:id", authMiddleware, async (req: MulterRequest, res, next) => { // Apply middleware
    try {
      if (!req.user) return res.status(401).send("Unauthorized"); // Check req.user
      const logId = parseInt(req.params.id);
      if (isNaN(logId)) return res.status(400).send("Invalid mileage log ID");
      const log = await storage.getMileageLogById(logId);
      if (!log) return res.status(404).send("Mileage log not found");
      if (log.userId !== req.user.id) return res.status(403).send("Forbidden"); // Use req.user.id

      // Delete associated images
      // Delete associated images from Supabase
      const deleteSupabaseImage = async (imagePath: string | null) => {
          if (!imagePath) return;
          console.log(`Deleting image ${imagePath} from Supabase for mileage log ${logId}.`);
          await storage.deleteFile(imagePath).catch(e => console.error(`Error deleting Supabase image ${imagePath}:`, e));
      };
      await deleteSupabaseImage(log.startImageUrl);
      await deleteSupabaseImage(log.endImageUrl);

      await storage.deleteMileageLog(logId);
      res.status(204).send();
    } catch (error) { next(error); }
  });

  // POST /api/mileage-logs/upload-odometer-image
  app.post("/api/mileage-logs/upload-odometer-image", authMiddleware, (upload as any).single("odometerImage"), async (req: MulterRequest, res, next) => { // Apply middleware
    try {
      if (!req.user) return res.status(401).send("Unauthorized"); // Check req.user
      if (!req.file) return res.status(400).send("No odometer image file uploaded");

      // const filePath = path.join(process.cwd(), "uploads", req.file.filename); // No longer saving locally
      // const imageUrl = `/uploads/${req.file.filename}`; // Will be Supabase path/URL

      // Upload to Supabase
      const uniquePath = `odometer-images/${req.user!.id}/${uuidv4()}-${req.file.originalname}`;
      const uploadResult = await storage.uploadFile(uniquePath, req.file.buffer, req.file.mimetype);
      const supabasePath = uploadResult.path;
      console.log(`Uploaded odometer image to Supabase: ${supabasePath}`);

      const config = loadConfig();
      const method = (config.defaultOcrMethod || "gemini") as OcrProvider; // Cast method type
      console.log(`Processing odometer image buffer (${req.file.mimetype}) using method: ${method}`);
      // Pass buffer and mimetype to the updated OCR function
      const ocrResult = await processOdometerImageWithAI(req.file.buffer, req.file.mimetype, method);

      if (ocrResult.success) {
        // Return the Supabase path. Client can request signed URL if needed.
        res.json({ success: true, imageUrl: supabasePath, reading: ocrResult.reading });
      } else {
        console.warn(`Odometer OCR failed for ${supabasePath}: ${ocrResult.error}`);
        // Attempt to delete the uploaded file if OCR failed
        await storage.deleteFile(supabasePath).catch(e => console.error("Failed to delete Supabase file after OCR error:", e));
        res.status(400).json({ success: false, imageUrl: null, error: ocrResult.error || "Failed to extract reading." });
      }
    } catch (error) {
      console.error("Odometer image upload/OCR error:", error);
      // If upload succeeded but something else failed, try to delete
      // Need to get supabasePath if error happened after upload but before response
      // This requires careful error handling structure. For now, log the error.
      // if (req.file && supabasePath) { // Check if supabasePath was set
      //     await storage.deleteFile(supabasePath).catch(e => console.error("Failed to delete Supabase file after general error:", e));
      // }
      next(error);
    }
  });
}

function registerOcrRoutes(app: Express, storage: SupabaseStorage, authMiddleware: express.RequestHandler) { // Add authMiddleware param
  // POST /api/ocr/process (Now triggers background function)
  app.post("/api/ocr/process", authMiddleware, (upload as any).single("receipt"), async (req: MulterRequest, res, next) => { // Apply middleware
    try {
      if (!req.user) return res.status(401).send("Unauthorized"); // Check req.user
      if (!req.file) return res.status(400).send("No receipt file uploaded");

      console.log(`Received file for OCR processing: ${req.file.originalname} (${req.file.mimetype})`);

      // 1. Upload the file to Supabase Storage
      const uniquePath = `receipts/${req.user!.id}/${uuidv4()}-${req.file.originalname}`;
      const uploadResult = await storage.uploadFile(uniquePath, req.file.buffer, req.file.mimetype);
      const supabasePath = uploadResult.path;
      console.log(`Uploaded receipt to Supabase for background processing: ${supabasePath}`);

      // 2. Prepare payload for the background function
      const payload = {
        filePath: supabasePath,
        userId: String(req.user.id), // Pass user ID as string
        mimeType: req.file.mimetype, // Pass mime type
        // Add any other necessary data from req.body if needed
        // e.g., specific template requested?
        // template: req.body.template || 'general'
      };

      // 3. Trigger the background function (asynchronously)
      // Use relative path for Netlify Functions endpoint
      const functionUrl = `/.netlify/functions/process-ocr`;
      console.log(`Triggering background function: ${functionUrl}`);

      // We don't wait for the fetch to complete fully, just fire and forget
      fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(fetchError => {
        // Log error if triggering fails, but don't block the response
        console.error(`Error triggering background function ${functionUrl}:`, fetchError);
        // TODO: Consider adding monitoring or retry logic here if needed
      });

      // 4. Return an immediate response to the client
      res.status(202).json({
        message: "Receipt accepted for processing. Results will be available shortly.",
        filePath: supabasePath, // Optionally return the path
      });

    } catch (error) {
      console.error("Error in /api/ocr/process trigger:", error);
      // If upload failed, we won't have triggered the function
      // If triggering failed after upload, the file might be orphaned (needs cleanup?)
      next(error); // Pass to default error handler
    }
  });

  // POST /api/test-ocr
  app.post("/api/test-ocr", authMiddleware, async (req: MulterRequest, res, next) => { // Apply middleware
    try {
      if (!req.user) return res.status(401).send("Unauthorized"); // Check req.user
      const { method, apiKey, ocrApiKey } = req.body;
      const actualApiKey = ocrApiKey !== undefined ? ocrApiKey : apiKey;
      const result = await testOCR(method, actualApiKey);
      res.json(result);
    } catch (error) { next(error); }
  });
}

function registerSettingsRoutes(app: Express, storage: SupabaseStorage, authMiddleware: express.RequestHandler) { // Add authMiddleware param
  // POST /api/update-env
  app.post("/api/update-env", authMiddleware, async (req: MulterRequest, res, next) => { // Apply middleware
    try {
      if (!req.user) return res.status(401).send("Unauthorized"); // Check req.user
      const { ocrMethod, apiKey, ocrApiKey, ocrTemplate } = req.body;
      const actualApiKey = ocrApiKey !== undefined ? ocrApiKey : apiKey;
      if (ocrMethod) {
        setDefaultOcrMethod(ocrMethod);
        console.log(`Set default OCR method to ${ocrMethod}`);
        if (actualApiKey) {
          updateOcrApiKey(ocrMethod, actualApiKey);
          console.log(`Updated API key for ${ocrMethod}`);
        }
      }
      if (ocrTemplate) {
        const config = loadConfig();
        config.ocrTemplate = ocrTemplate;
        saveConfig(config);
        console.log(`Set OCR template to ${ocrTemplate}`);
      }
      res.json({ success: true, message: "Settings updated successfully" });
    } catch (error) { next(error); }
  });
}

function registerBackgroundTaskRoutes(app: Express, storage: SupabaseStorage, authMiddleware: express.RequestHandler) { // Add authMiddleware param
    // GET /api/background-tasks
    app.get("/api/background-tasks", authMiddleware, async (req: MulterRequest, res, next) => { // Apply middleware
        try {
            if (!req.user) return res.status(401).send("Unauthorized"); // Check req.user
            const tasks = await storage.getBackgroundTasksByUserId(req.user.id); // Use req.user.id
            res.json(tasks);
        } catch (error) { next(error); }
    });

    // GET /api/background-tasks/:id
    app.get("/api/background-tasks/:id", authMiddleware, async (req: MulterRequest, res, next) => { // Apply middleware
        try {
            if (!req.user) return res.status(401).send("Unauthorized"); // Check req.user
            const taskId = parseInt(req.params.id);
            if (isNaN(taskId)) return res.status(400).send("Invalid task ID");
            const task = await storage.getBackgroundTaskById(taskId);
            if (!task) return res.status(404).send("Background task not found");
            if (task.userId !== req.user.id) return res.status(403).send("Forbidden"); // Use req.user.id
            res.json(task);
        } catch (error) { next(error); }
    });
}


function registerExportRoutes(app: Express, storage: SupabaseStorage, authMiddleware: express.RequestHandler) { // Add authMiddleware param
  // POST /api/export-expenses (Now triggers background function)
  app.post("/api/export-expenses", authMiddleware, async (req: MulterRequest, res, next) => { // Apply middleware, Changed to POST to accept body payload
    try {
      if (!req.user) return res.status(401).send("Unauthorized"); // Check req.user

      // Extract filters and format from request body
      const exportRequestSchema = z.object({
        format: z.enum(['csv', 'xlsx']).default('xlsx'),
        filters: z.object({
            startDate: z.string().optional(), // Expect YYYY-MM-DD
            endDate: z.string().optional(),   // Expect YYYY-MM-DD
            tripName: z.string().optional(), // Use tripName
            type: z.string().optional(), // Add type filter
        }).optional(),
      });

      const validatedBody = exportRequestSchema.parse(req.body);

      console.log(`Received request to export expenses for user ${req.user.id} with format ${validatedBody.format}`);

      // 1. Create a background task record
      const taskData: InsertBackgroundTask = {
          userId: req.user.id,
          type: 'expense_export',
          status: 'pending',
      };
      const backgroundTask = await storage.createBackgroundTask(taskData);
      console.log(`Created background task (ID: ${backgroundTask.id}) for expense export.`);

      // 2. Prepare payload for the background function
      const payload = {
        userId: String(req.user.id),
        format: validatedBody.format,
        filters: validatedBody.filters || {}, // Pass filters from body
        taskId: backgroundTask.id // Pass the task ID
      };

      // 3. Trigger the background function (asynchronously)
      const functionUrl = `/.netlify/functions/export-expenses`;
      console.log(`Triggering background function: ${functionUrl} for task ID ${backgroundTask.id}`);

      fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(async (fetchError) => {
        console.error(`Error triggering background function ${functionUrl} for task ${backgroundTask.id}:`, fetchError);
        // Update task status to failed if trigger fails
        await storage.updateBackgroundTaskStatus(backgroundTask.id, 'failed', null, `Failed to trigger background function: ${fetchError.message}`);
      });

      // 4. Return an immediate response to the client with the task info
      res.status(202).json({
        message: "Expense export started. You can monitor the task status.",
        task: backgroundTask, // Return the created task record
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      }
      console.error("Error in /api/export-expenses trigger:", error);
      next(error);
    }
  });
}


// --- Main Route Registration ---
export async function registerRoutes(app: Express, storage: SupabaseStorage): Promise<Server> {
  // Instantiate the auth middleware
  const authMiddleware = authenticateJWT(storage);

  // Serve uploaded files - REMOVED as files are in Supabase
  // app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // TODO: Add endpoint for getting signed URLs?
  // Example:
  // app.get("/api/file-url/:bucket/:key", async (req: MulterRequest, res, next) => {
  //   try {
  //     if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
  //     const { bucket, key } = req.params;
  //     // Basic validation/sanitization needed for bucket/key
  //     const decodedKey = decodeURIComponent(key); // Decode key potentially passed in URL
  //     // Add authorization check: ensure user owns the file based on key structure or DB lookup
  //     const { signedUrl } = await storage.getSignedUrl(decodedKey, 60, bucket); // 1 minute expiry
  //     res.json({ signedUrl });
  //   } catch (error) {
  //     next(error);
  //   }
  // });


  // Register grouped routes, passing the middleware instance
  registerProfileRoutes(app, storage, authMiddleware);
  registerTripRoutes(app, storage, authMiddleware);
  registerExpenseRoutes(app, storage, authMiddleware);
  registerMileageLogRoutes(app, storage, authMiddleware);
  registerOcrRoutes(app, storage, authMiddleware); // Contains the old /api/ocr/process route, should be removed or updated if kept
  registerSettingsRoutes(app, storage, authMiddleware);
  registerExportRoutes(app, storage, authMiddleware);
  registerBackgroundTaskRoutes(app, storage, authMiddleware); // Register new task routes

  // Default error handler (ensure it's registered after all routes)
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("Unhandled error:", err);
    // Avoid sending error details in production
    const statusCode = (err as any).status || 500;
    const message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;
    if (!res.headersSent) {
        res.status(statusCode).json({ error: message });
    } else {
        // If headers already sent, delegate to default Express error handler
        next(err);
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}
