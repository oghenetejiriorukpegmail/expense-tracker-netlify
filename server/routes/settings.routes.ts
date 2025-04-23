import express, { type Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express"; // Import Clerk getAuth
import { testOCR } from "../util/ocr"; // Import OCR types and test function
import { updateOcrApiKey, setDefaultOcrMethod, saveConfig, loadConfig } from "../config";
import type { User } from "@shared/schema"; // Assuming User type is still relevant for internal ID

// Define request type augmentation for Clerk auth
interface ClerkRequest extends Request {
  auth?: { userId?: string | null }; // Clerk attaches auth here
  user?: User | null | undefined; // Keep for potential internal ID usage if needed
}

export function createSettingsRouter(): express.Router {
  const router = express.Router();

  // POST /api/test-ocr
  router.post("/test-ocr", async (req: ClerkRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: authUserId } = getAuth(req);
      if (!authUserId) return res.status(401).send("Unauthorized"); // Check Clerk auth

      const { method, apiKey, ocrApiKey } = req.body;
      const actualApiKey = ocrApiKey !== undefined ? ocrApiKey : apiKey;
      const result = await testOCR(method, actualApiKey);
      res.json(result);
    } catch (error) { next(error); }
  });

  // POST /api/update-env (Renamed to /api/settings for clarity)
  router.post("/", async (req: ClerkRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: authUserId } = getAuth(req);
      if (!authUserId) return res.status(401).send("Unauthorized"); // Check Clerk auth

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

  return router;
}