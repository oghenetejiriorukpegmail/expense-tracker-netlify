import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { ocrOrchestrator } from "../../server/util/ocr-orchestrator"; // Import the OCR orchestrator
import { SupabaseStorage } from "../../server/supabase-storage"; // Import the class
import * as fileStorage from "../../server/storage/file.storage"; // Import direct file storage functions
import * as expenseStorage from "../../server/storage/expense.storage"; // Import direct expense storage functions
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../shared/schema.js';

// Define the expected payload structure
interface OcrPayload {
  filePath: string; // Path within the Supabase bucket
  userId: string;   // ID of the user who uploaded the file
  mimeType: string; // Mime type of the uploaded file (e.g., 'image/jpeg', 'application/pdf')
  expenseId: number; // ID of the placeholder expense record to update
  template?: "general" | "travel" | "odometer"; // Optional template type
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Netlify automatically loads environment variables from the UI or netlify.toml
  console.log("OCR Function started");

  if (event.httpMethod !== 'POST' || !event.body) {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let db: any = null;
  let client: any = null;
  let payload: OcrPayload | null = null; // Declare payload outside try

  try {
    payload = JSON.parse(event.body) as OcrPayload; // Assign inside try
    console.log("Processing OCR for payload:", payload);

    // Initialize database connection
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    
    client = postgres(databaseUrl, { max: 1 });
    db = drizzle(client, { schema });

    // 1. Download the file from Supabase Storage
    console.log(`Downloading file from path: ${payload.filePath}`);
    // Use direct file storage function to get a Buffer
    const fileBuffer = await fileStorage.downloadFile(payload.filePath);
    console.log(`File downloaded successfully, size: ${fileBuffer.length} bytes`);

    // 2. Process the receipt using the OCR orchestrator
    console.log(`Processing receipt with OCR orchestrator, mime type: ${payload.mimeType}`);
    const ocrResult = await ocrOrchestrator.processReceipt(
      fileBuffer,
      payload.mimeType,
      {
        template: payload.template || "general",
        useCache: true,
        preprocessImage: true,
        maxRetries: 2
      }
    );
    console.log(`OCR processing completed, success: ${ocrResult.success}, provider: ${ocrResult.provider}`);

    const expenseId = payload.expenseId;
    const errorMessage = ocrResult.error || "No structured data extracted";

    if (!ocrResult.success || !ocrResult.extractedData) {
      console.error(`OCR processing failed for expense ${expenseId}:`, errorMessage);
      // Update the placeholder expense status to failed using updateExpenseStatus
      await expenseStorage.updateExpenseStatus(db, expenseId, 'ocr_failed', errorMessage);
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
        // We don't update receiptPath here, it was set when placeholder was created
      };

      const updatedExpense = await expenseStorage.updateExpense(db, expenseId, updateData);
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
        // Update status to failed using updateExpenseStatus
        await expenseStorage.updateExpenseStatus(db, expenseId, 'ocr_failed', `DB Error: ${dbErrorMessage}`);
        return {
            statusCode: 200, // Function succeeded, DB update failed
            body: JSON.stringify({ message: "OCR processed but failed to save results to database.", error: dbErrorMessage }),
        };
    }
  } catch (error) {
    console.error("Error processing OCR background function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Unhandled error in OCR function:", error);
    // Attempt to update status to failed if payload and db were initialized
    if (payload && payload.expenseId && db) {
        try {
            await expenseStorage.updateExpenseStatus(db, payload.expenseId, 'ocr_failed', `Unhandled Function Error: ${errorMessage}`);
        } catch (statusUpdateError) {
            console.error(`Failed to update expense status for ${payload.expenseId} after unhandled error:`, statusUpdateError);
        }
    } else {
        console.error("Cannot update expense status: payload or db not initialized before error.");
    }
    return {
      statusCode: 200, // Return 200 even on unhandled error to prevent retries, error logged in DB if possible
      body: JSON.stringify({ message: "Unhandled error during OCR processing.", error: errorMessage }),
    };
  } finally {
    // Close the database connection
    if (client) {
      await client.end();
    }
  }
};

export { handler };