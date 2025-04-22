import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { processReceiptWithOCR } from "../../server/util/ocr"; // Correct function import
import { SupabaseStorage } from "../../server/supabase-storage"; // Import the class

// TODO: Define the expected payload structure
interface OcrPayload {
  filePath: string; // Path within the Supabase bucket
  userId: string;   // ID of the user who uploaded the file
  mimeType: string; // Mime type of the uploaded file (e.g., 'image/jpeg', 'application/pdf')
  expenseId: number; // ID of the placeholder expense record to update
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Netlify automatically loads environment variables from the UI or netlify.toml

  if (event.httpMethod !== 'POST' || !event.body) {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let storage: SupabaseStorage | null = null;
  let payload: OcrPayload | null = null; // Declare payload outside try

  try {
    payload = JSON.parse(event.body) as OcrPayload; // Assign inside try
    console.log("Processing OCR for payload:", payload);

    // Initialize Supabase Storage
    storage = await SupabaseStorage.initialize();

    // 1. Download the file from Supabase Storage
    // Assuming filePath is the path within the Supabase bucket
    const fileBuffer = await storage.downloadFile(payload.filePath);

    // 2. Process the receipt using the OCR utility
    // Use the mimeType passed in the payload
    const ocrResult = await processReceiptWithOCR(fileBuffer, payload.mimeType, "gemini", "general"); // Using 'general' template for now

    const expenseId = payload.expenseId;
    const errorMessage = ocrResult.error || "No structured data extracted";

    if (!ocrResult.success || !ocrResult.extractedData) {
      console.error(`OCR processing failed for expense ${expenseId}:`, errorMessage);
      // Update the placeholder expense status to failed using updateExpense
      await storage.updateExpense(expenseId, { status: 'ocr_failed', ocrError: errorMessage });
      return {
        statusCode: 200, // Function itself succeeded, but OCR failed - return 200 so Netlify doesn't retry
        body: JSON.stringify({ message: "OCR processing failed.", error: errorMessage }),
      };
    }

    console.log(`OCR successful for expense ${expenseId}. Extracted data:`, ocrResult.extractedData);

    // 3. Update the placeholder expense record with the extracted data
    try {
      // Attempt to parse the date, default to now if invalid/missing
      let expenseDateStr: string;
      if (ocrResult.extractedData.date && typeof ocrResult.extractedData.date === 'string') {
          const parsedDate = new Date(ocrResult.extractedData.date);
          if (!isNaN(parsedDate.getTime())) {
              const year = parsedDate.getFullYear();
              const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
              const day = String(parsedDate.getDate()).padStart(2, '0');
              expenseDateStr = `${year}-${month}-${day}`;
          } else {
              console.warn(`Could not parse date "${ocrResult.extractedData.date}", using current date.`);
              expenseDateStr = new Date().toISOString().split('T')[0]; // Use current date as YYYY-MM-DD
          }
      } else if (ocrResult.extractedData.date instanceof Date) {
           const date = ocrResult.extractedData.date;
           const year = date.getFullYear();
           const month = String(date.getMonth() + 1).padStart(2, '0');
           const day = String(date.getDate()).padStart(2, '0');
           expenseDateStr = `${year}-${month}-${day}`;
      } else {
           console.warn(`No valid date found in OCR data, using current date.`);
           expenseDateStr = new Date().toISOString().split('T')[0]; // Use current date as YYYY-MM-DD
      }

      // Prepare update data based on schema
      const updateData = {
        date: expenseDateStr, // Schema expects string
        type: String(ocrResult.extractedData.type || 'Uncategorized'),
        vendor: String(ocrResult.extractedData.vendor || 'Unknown'),
        location: String(ocrResult.extractedData.location || 'Unknown'),
        cost: String(Number(ocrResult.extractedData.cost || 0)), // Schema expects string
        // Keep existing tripName unless OCR provides one? For now, keep existing.
        // tripName: String(ocrResult.extractedData.tripName || 'Default Trip'),
        comments: `Processed via OCR. Raw: ${JSON.stringify(ocrResult.extractedData)}`, // Overwrite comments or append?
        status: 'complete', // Set status to complete
        ocrError: null, // Clear any previous error
        // We don't update receiptPath here, it was set when placeholder was created
      };

      const updatedExpense = await storage.updateExpense(expenseId, updateData);
      if (!updatedExpense) {
          throw new Error(`Failed to find expense with ID ${expenseId} to update after OCR.`);
      }
      console.log(`Successfully updated expense (ID: ${expenseId}) with OCR data.`);

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "OCR processing completed successfully and expense updated." }),
      };
    } catch (dbError) {
        console.error(`Database error updating expense ${expenseId} with OCR result:`, dbError);
        const dbErrorMessage = dbError instanceof Error ? dbError.message : "Unknown database error";
        // Update status to failed using updateExpense
        await storage.updateExpense(expenseId, { status: 'ocr_failed', ocrError: `DB Error: ${dbErrorMessage}` });
        return {
            statusCode: 200, // Function succeeded, DB update failed
            body: JSON.stringify({ message: "OCR processed but failed to save results to database.", error: dbErrorMessage }),
        };
    }
  } catch (error) {
    console.error("Error processing OCR background function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Unhandled error in OCR function:", error);
    // Attempt to update status to failed if payload and storage were initialized
    if (payload && payload.expenseId && storage) {
        try {
            await storage.updateExpense(payload.expenseId, { status: 'ocr_failed', ocrError: `Unhandled Function Error: ${errorMessage}` });
        } catch (statusUpdateError) {
            console.error(`Failed to update expense status for ${payload.expenseId} after unhandled error:`, statusUpdateError);
        }
    } else {
        console.error("Cannot update expense status: payload or storage not initialized before error.");
    }
    return {
      statusCode: 200, // Return 200 even on unhandled error to prevent retries, error logged in DB if possible
      body: JSON.stringify({ message: "Unhandled error during OCR processing.", error: errorMessage }),
    };
  }
};

export { handler };