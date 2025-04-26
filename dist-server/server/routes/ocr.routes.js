import express from "express";
import { upload } from "../middleware/multer-config.js";
import { processReceiptWithOCR } from "../util/ocr.js";
export function createOcrRouter(storage) {
    const router = express.Router();
    // POST /api/ocr/process
    router.post("/process", upload.single("receipt"), async (req, res, next) => {
        try {
            // Cast the request to our authenticated request type
            const authReq = req;
            const userProfile = authReq.user;
            const internalUserId = userProfile.id;
            // Check if a file was uploaded
            if (!authReq.file) {
                return res.status(400).json({ success: false, error: "No receipt file uploaded" });
            }
            // Get the template from the request body
            const template = req.body.template || 'general';
            // Process the receipt with OCR
            console.log(`Processing receipt with OCR using template ${template}`);
            const ocrResult = await processReceiptWithOCR(authReq.file.buffer, authReq.file.mimetype, process.env.OCR_PROVIDER || 'gemini', template);
            // Return the OCR result
            if (ocrResult.success) {
                return res.json({
                    success: true,
                    data: ocrResult.extractedData,
                    text: ocrResult.text
                });
            }
            else {
                return res.status(500).json({
                    success: false,
                    error: ocrResult.error || "OCR processing failed"
                });
            }
        }
        catch (error) {
            console.error("Error processing OCR:", error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Unknown error during OCR processing"
            });
        }
    });
    return router;
}
