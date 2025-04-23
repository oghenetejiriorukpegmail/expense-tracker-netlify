import express, { type Request, Response, NextFunction } from "express";
import { testOCR } from "../util/ocr"; // Import OCR types and test function
import { updateOcrApiKey, setDefaultOcrMethod, saveConfig, loadConfig } from "../config";
import type { User, PublicUser } from "@shared/schema"; // Import PublicUser

// Define request type with user property
interface AuthenticatedRequest extends Request {
  user: PublicUser; // Our middleware attaches the user object here
}

export function createSettingsRouter(): express.Router {
  const router = express.Router();

  // POST /api/test-ocr
  router.post("/test-ocr", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Cast the request to our authenticated request type
      const authReq = req as AuthenticatedRequest;

      const { method, apiKey, ocrApiKey } = req.body;
      const actualApiKey = ocrApiKey !== undefined ? ocrApiKey : apiKey;
      const result = await testOCR(method, actualApiKey);
      res.json(result);
    } catch (error) { next(error); }
  });

  // POST /api/update-env (Renamed to /api/settings for clarity)
  router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Cast the request to our authenticated request type
      const authReq = req as AuthenticatedRequest;

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