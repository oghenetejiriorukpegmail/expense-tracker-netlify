"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOcrRouter = void 0;
const multer_config_js_1 = require("../middleware/multer-config.js");
const ocr_js_1 = require("../util/ocr.js");
function createOcrRouter(storage) {
    const router = require('express').Router();
    // POST /api/ocr/process
    router.post("/process", multer_config_js_1.upload.single("receipt"), async (req, res, next) => {
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
            const ocrResult = await (0, ocr_js_1.processReceiptWithOCR)(authReq.file.buffer, authReq.file.mimetype, process.env.OCR_PROVIDER || 'gemini', template);
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
exports.createOcrRouter = createOcrRouter;