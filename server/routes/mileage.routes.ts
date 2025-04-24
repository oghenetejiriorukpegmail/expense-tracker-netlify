import express, { type Request, Response, NextFunction } from "express";
import { z } from "zod";
import { insertMileageLogSchema, rawInsertMileageLogSchema } from "@shared/schema";
import { upload } from "../middleware/multer-config.js"; // Assuming multer config is still needed
import type { IStorage } from "../storage.js"; // Import the interface type
import type { User, PublicUser } from "@shared/schema"; // Import PublicUser
import { v4 as uuidv4 } from "uuid"; // Import uuid
import { loadConfig } from "../config.js"; // Import config loading
import { processOdometerImageWithAI, OcrProvider } from "../util/ocr.js"; // Import OCR function and OcrProvider type

// Define request type with user property and Multer
interface AuthenticatedMulterRequest extends Request {
  user: PublicUser; // Our middleware attaches the user object here
  file?: any; // Multer file
}

export function createMileageLogRouter(storage: IStorage): express.Router { // Use IStorage interface
  const router = express.Router();

  // GET /api/mileage-logs
  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Cast the request to our authenticated request type
      const authReq = req as AuthenticatedMulterRequest;
      const userProfile = authReq.user;
      const internalUserId = userProfile.id;

      const querySchema = z.object({
        tripId: z.coerce.number().int().positive().optional(), startDate: z.string().optional(), endDate: z.string().optional(),
        limit: z.coerce.number().int().positive().optional(), offset: z.coerce.number().int().min(0).optional(),
        sortBy: z.string().optional(), sortOrder: z.enum(['asc', 'desc']).optional(),
      });
      const validatedQuery = querySchema.parse(req.query);
      const logs = await storage.getMileageLogsByUserId(internalUserId, validatedQuery);
      res.json(logs);
    } catch (error) {
       if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      next(error);
    }
  });

  // POST /api/mileage-logs
  router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Cast the request to our authenticated request type
      const authReq = req as AuthenticatedMulterRequest;
      const userProfile = authReq.user;
      const internalUserId = userProfile.id;

      const validatedData = insertMileageLogSchema.parse(req.body);
      const calculatedDistance = validatedData.endOdometer - validatedData.startOdometer;
      if (calculatedDistance <= 0) return res.status(400).json({ message: "Calculated distance must be positive." });
      const newLog = await storage.createMileageLog({ ...validatedData, userId: internalUserId, calculatedDistance });
      res.status(201).json(newLog);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Validation failed", errors: error.errors });
      next(error);
    }
  });

  // PUT /api/mileage-logs/:id
  router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Cast the request to our authenticated request type
      const authReq = req as AuthenticatedMulterRequest;
      const userProfile = authReq.user;
      const internalUserId = userProfile.id;

      const logId = parseInt(req.params.id);
      if (isNaN(logId)) return res.status(400).send("Invalid mileage log ID");

      const existingLog = await storage.getMileageLogById(logId);
      if (!existingLog) return res.status(404).send("Mileage log not found");
      if (existingLog.userId !== internalUserId) return res.status(403).send("Forbidden");

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

      // Handle image deletion from Supabase
      if (validatedData.startImageUrl === null && existingLog.startImageUrl) {
          console.log(`Deleting old start image ${existingLog.startImageUrl} from Supabase.`);
          await storage.deleteFile(existingLog.startImageUrl).catch((e: any) => console.error(`Failed to delete old Supabase start image:`, e)); // Add type to catch
      }
      if (validatedData.endImageUrl === null && existingLog.endImageUrl) {
          console.log(`Deleting old end image ${existingLog.endImageUrl} from Supabase.`);
          await storage.deleteFile(existingLog.endImageUrl).catch((e: any) => console.error(`Failed to delete old Supabase end image:`, e)); // Add type to catch
      }

      const updatePayload = { ...validatedData, calculatedDistance: calculatedDistance !== undefined ? String(calculatedDistance) : undefined };

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
  router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Cast the request to our authenticated request type
      const authReq = req as AuthenticatedMulterRequest;
      const userProfile = authReq.user;
      const internalUserId = userProfile.id;

      const logId = parseInt(req.params.id);
      if (isNaN(logId)) return res.status(400).send("Invalid mileage log ID");

      const log = await storage.getMileageLogById(logId);
      if (!log) return res.status(404).send("Mileage log not found");
      if (log.userId !== internalUserId) return res.status(403).send("Forbidden");

      // Delete associated images from Supabase
      const deleteSupabaseImage = async (imagePath: string | null) => {
          if (!imagePath) return;
          console.log(`Deleting image ${imagePath} from Supabase for mileage log ${logId}.`);
          await storage.deleteFile(imagePath).catch((e: any) => console.error(`Error deleting Supabase image ${imagePath}:`, e)); // Add type to catch
      };
      await deleteSupabaseImage(log.startImageUrl);
      await deleteSupabaseImage(log.endImageUrl);

      await storage.deleteMileageLog(logId);
      res.status(204).send();
    } catch (error) { next(error); }
  });

  // POST /api/mileage-logs/upload-odometer-image
  router.post("/upload-odometer-image", (upload as any).single("odometerImage"), async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Cast the request to our authenticated request type
      const authReq = req as AuthenticatedMulterRequest;
      const userProfile = authReq.user;
      const internalUserId = userProfile.id;

      // Remove the redundant cast here, use the one from line 153
      if (!authReq.file) return res.status(400).send("No odometer image file uploaded");

      // Upload to Supabase
      const uniquePath = `odometer-images/${internalUserId}/${uuidv4()}-${authReq.file.originalname}`;
      const uploadResult = await storage.uploadFile(uniquePath, authReq.file.buffer, authReq.file.mimetype);
      const supabasePath = uploadResult.path;
      console.log(`Uploaded odometer image to Supabase: ${supabasePath}`);

      const config = loadConfig();
      // Cast method to OcrProvider type
      const method = (config.defaultOcrMethod || "gemini") as OcrProvider;
      console.log(`Processing odometer image buffer (${authReq.file.mimetype}) using method: ${method}`);
      const ocrResult = await processOdometerImageWithAI(authReq.file.buffer, authReq.file.mimetype, method);

      if (ocrResult.success) {
        res.json({ success: true, imageUrl: supabasePath, reading: ocrResult.reading });
      } else {
        console.warn(`Odometer OCR failed for ${supabasePath}: ${ocrResult.error}`);
        await storage.deleteFile(supabasePath).catch((e: any) => console.error("Failed to delete Supabase file after OCR error:", e)); // Add type to catch
        res.status(400).json({ success: false, imageUrl: null, error: ocrResult.error || "Failed to extract reading." });
      }
    } catch (error) {
      console.error("Odometer image upload/OCR error:", error);
      // Handle potential deletion if upload succeeded but OCR failed
      // This requires careful state management or passing the path if available
      next(error);
    }
  });

  return router;
}