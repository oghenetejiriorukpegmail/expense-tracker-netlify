import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { SupabaseStorage } from "../../server/supabase-storage"; // Adjust path as needed
import { Expense } from "../../shared/schema"; // Use relative path for schema
import Papa from 'papaparse'; // For CSV generation
import * as XLSX from 'xlsx'; // For Excel generation

// Define the expected payload structure
interface ExportPayload {
  userId: string;
  format: 'csv' | 'xlsx';
  filters?: {
    startDate?: string; // YYYY-MM-DD
    endDate?: string;   // YYYY-MM-DD
    tripName?: string; // Filter by trip name instead of ID
    type?: string;
  };
  taskId: number; // ID of the background task record to update
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Ensure environment variables are loaded if needed
  // require('dotenv').config({ path: '../../.env' });

  if (event.httpMethod !== 'POST' || !event.body) {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let storage: SupabaseStorage | null = null;
  let payload: ExportPayload | null = null; // Declare payload outside try

  try {
    payload = JSON.parse(event.body) as ExportPayload; // Assign inside try

    // Add null check for payload right after parsing
    if (!payload) {
        throw new Error("Failed to parse request body or body is empty.");
    }

    const taskId = payload.taskId; // Now safe to access taskId
    console.log(`Processing expense export for task ${taskId}, payload:`, payload);

    storage = await SupabaseStorage.initialize();
    const userIdNum = parseInt(payload.userId); // Now safe to access userId

    // Update task status to 'processing'
    await storage.updateBackgroundTaskStatus(taskId, 'processing');

    // 1. Fetch expenses based on filters
    // TODO: Enhance storage method to accept filters directly for better performance.
    // For now, fetch all and filter in memory.
    const expenses: Expense[] = await storage.getExpensesByUserId(userIdNum);

    // Assign checked payload to a new const to satisfy TS flow analysis within the filter
    const checkedPayload = payload;

    // Apply filters if provided
    const filteredExpenses = expenses.filter(exp => {
        let keep = true;
        // Date filtering (schema stores date as string 'YYYY-MM-DD')
        if (checkedPayload.filters?.startDate) {
            keep = keep && exp.date >= checkedPayload.filters.startDate;
        }
        if (checkedPayload.filters?.endDate) {
            keep = keep && exp.date <= checkedPayload.filters.endDate;
        }
        // Trip Name filtering (case-insensitive comparison)
        if (checkedPayload.filters?.tripName) {
            keep = keep && exp.tripName.toLowerCase() === checkedPayload.filters.tripName.toLowerCase();
        }
        // Type filtering (case-insensitive comparison)
        if (checkedPayload.filters?.type) {
            keep = keep && exp.type.toLowerCase() === checkedPayload.filters.type.toLowerCase();
        }
        return keep;
    });


    if (filteredExpenses.length === 0) {
      const message = "No expenses found matching the criteria.";
      console.log(`Task ${taskId}: ${message}`);
      // Update task status to completed (successfully, but with no data)
      await storage.updateBackgroundTaskStatus(taskId, 'completed', { message: message, downloadUrl: null, filePath: null });
      return {
        statusCode: 200,
        body: JSON.stringify({ message: message }),
      };
    }

    // 2. Format data into the desired file format
    let fileContent: string | Buffer;
    let fileName: string;
    let contentType: string;

    const exportTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFileName = `expenses-export-${payload.userId}-${exportTimestamp}`;

    // Prepare data for export (select/rename columns)
    const dataToExport = filteredExpenses.map(exp => ({
        Date: exp.date, // Use the date string directly
        Type: exp.type,
        Vendor: exp.vendor,
        Location: exp.location,
        Cost: parseFloat(exp.cost), // Parse numeric string to float
        // Currency: exp.currency, // Removed - not in schema
        Comments: exp.comments, // Use comments field
        TripName: exp.tripName,
        // Add/remove fields as needed
    }));


    if (payload.format === 'csv') {
      // Generate CSV content
      fileContent = Papa.unparse(dataToExport, {
          header: true, // Include header row based on object keys
      });
      fileName = `${baseFileName}.csv`;
      contentType = 'text/csv;charset=utf-8;'; // Specify charset
      console.log("Generated CSV content.");
    } else if (payload.format === 'xlsx') {
      // Generate Excel content
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses'); // Sheet name 'Expenses'
      // Write to buffer
      fileContent = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      fileName = `${baseFileName}.xlsx`;
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      console.log("Generated XLSX content.");
    } else {
      throw new Error(`Unsupported export format: ${payload.format}`);
    }

    // 3. Upload the generated file to Supabase Storage
    const exportFilePath = `exports/${fileName}`; // Store in an 'exports' folder
    await storage.uploadFile(exportFilePath, Buffer.from(fileContent), contentType); // Ensure content is Buffer

    // 4. (Optional) Generate a signed URL for download
    const { signedUrl } = await storage.getSignedUrl(exportFilePath, 60 * 10); // URL valid for 10 minutes

    console.log(`Task ${taskId}: Expense export file generated and uploaded to ${exportFilePath}`);

    // 5. Update background task status to completed with result
    const resultData = {
        message: "Expense export generated successfully.",
        downloadUrl: signedUrl,
        filePath: exportFilePath,
        expenseCount: filteredExpenses.length
    };
    await storage.updateBackgroundTaskStatus(taskId, 'completed', resultData);

    return {
      statusCode: 200,
      body: JSON.stringify(resultData),
    };
  } catch (error) {
    console.error("Error processing expense export background function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Unhandled error processing expense export task ${payload?.taskId}:`, error);
    // Attempt to update task status to failed if payload and storage were initialized
    if (payload && payload.taskId && storage) {
        try {
            await storage.updateBackgroundTaskStatus(payload.taskId, 'failed', null, `Unhandled Function Error: ${errorMessage}`);
        } catch (statusUpdateError) {
            console.error(`Failed to update task status for ${payload.taskId} after unhandled error:`, statusUpdateError);
        }
    } else {
         console.error("Cannot update task status: payload or storage not initialized before error.");
    }
    return {
      statusCode: 200, // Return 200 even on unhandled error to prevent retries, error logged in DB if possible
      body: JSON.stringify({ message: "Unhandled error during expense export processing.", error: errorMessage }),
    };
  }
};

export { handler };