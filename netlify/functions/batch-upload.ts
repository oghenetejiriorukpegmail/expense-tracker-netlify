import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { SupabaseStorage } from "../../server/supabase-storage"; // Adjust path as needed
import Papa from 'papaparse'; // For CSV parsing
import * as XLSX from 'xlsx'; // For Excel parsing
import { InsertExpense } from "../../shared/schema"; // Use relative path for shared schema

// Define the expected payload structure
interface BatchUploadPayload {
  filePath: string; // Path to the uploaded batch file in storage
  userId: string;
  fileType: 'csv' | 'xlsx'; // Indicate the type of file to parse
  taskId: number; // ID of the background task record to update
}

// Define the structure of an expense row in the batch file (remains the same)
interface ExpenseRow {
  date: string; // Or Date object after parsing
  type: string;
  vendor: string;
  location: string;
  cost: number; // Or string, needs validation/parsing
  currency?: string;
  description?: string;
  tripName?: string;
  // Add other potential fields from the batch file
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Ensure environment variables are loaded if needed
  // require('dotenv').config({ path: '../../.env' });

  if (event.httpMethod !== 'POST' || !event.body) {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let storage: SupabaseStorage | null = null;
  let payload: BatchUploadPayload | null = null; // Declare payload outside try

  try {
    payload = JSON.parse(event.body) as BatchUploadPayload; // Assign inside try
    const taskId = payload.taskId; // Extract taskId early
    console.log(`Processing batch upload for task ${taskId}, payload:`, payload);

    storage = await SupabaseStorage.initialize();

    // Update task status to 'processing'
    await storage.updateBackgroundTaskStatus(taskId, 'processing');

    // 1. Download the batch file from Supabase Storage
    const fileBuffer = await storage.downloadFile(payload.filePath);

    // 2. Parse the file based on its type
    let parsedRows: any[] = []; // Use 'any' initially, validation will structure it
    let parseErrors: string[] = [];

    try {
        if (payload.fileType === 'csv') {
            const csvString = fileBuffer.toString('utf-8'); // Assuming UTF-8 encoding
            const result = Papa.parse(csvString, {
                header: true, // Assume first row is header
                skipEmptyLines: true,
                dynamicTyping: false, // Keep values as strings initially for consistent validation
                transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, '_'), // Normalize headers
            });
            if (result.errors.length > 0) {
                parseErrors = result.errors.map(e => `CSV Parse Error (Row ${e.row}): ${e.message}`);
                // Continue processing valid data if any
            }
            parsedRows = result.data;
            console.log(`Parsed ${parsedRows.length} rows from CSV file.`);

        } else if (payload.fileType === 'xlsx') {
            const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true }); // Attempt to parse dates
            const sheetName = workbook.SheetNames[0]; // Use the first sheet
            if (!sheetName) throw new Error("Excel file contains no sheets.");
            const worksheet = workbook.Sheets[sheetName];
            // Convert sheet to JSON, try to normalize headers like CSV
            parsedRows = XLSX.utils.sheet_to_json(worksheet, {
                raw: false, // Use formatted strings
                dateNF: 'yyyy-mm-dd', // Specify date format if cellDates is true
                header: 1, // Get header row separately
                defval: '', // Default value for empty cells
            });

            if (parsedRows.length > 0) {
                const headerRow = (parsedRows[0] as string[]).map(h => String(h).trim().toLowerCase().replace(/\s+/g, '_'));
                const dataRows = parsedRows.slice(1);
                parsedRows = dataRows.map(rowArray => {
                    const rowObject: { [key: string]: any } = {};
                    headerRow.forEach((header, index) => {
                        rowObject[header] = (rowArray as any[])[index];
                    });
                    return rowObject;
                });
                console.log(`Parsed ${parsedRows.length} rows from Excel sheet '${sheetName}'.`);
            } else {
                 console.log("Excel sheet appears empty or header-only.");
                 parsedRows = [];
            }

        } else {
            throw new Error(`Unsupported file type: ${payload.fileType}`);
        }
    } catch (parseError) {
        console.error(`File parsing error for task ${taskId}:`, parseError);
        const errorMessage = parseError instanceof Error ? parseError.message : "Unknown parsing error";
        // Update task status to failed
        await storage.updateBackgroundTaskStatus(taskId, 'failed', null, `File Parsing Error: ${errorMessage}`);
        return { statusCode: 200, body: JSON.stringify({ message: "Failed to parse the uploaded file.", error: errorMessage }) };
    }

    if (parseErrors.length > 0) {
        console.warn("Parsing errors encountered:", parseErrors);
        // Decide if we should stop or continue with potentially partial data
        // For now, we continue but will report errors later
    }

    // 3. Validate and prepare expense data for insertion
    const validationResults = parsedRows.map((row, index) => {
        const errors: string[] = [];
        // Initialize based on InsertExpense schema + userId
        // InsertExpense includes: type, date, vendor, location, cost, comments, tripName
        // Add null check for payload before accessing properties
        if (!payload) {
             errors.push("Internal error: Payload is null during validation.");
             // Cannot proceed without payload, return immediately
             return { data: null as any, errors, originalIndex: index }; // Return null data
        }
        const expense: InsertExpense & { userId: number } = {
             userId: parseInt(payload.userId, 10), // Now safe due to null check above
             date: '', // Placeholder, will be validated (schema expects string)
             type: '', // Placeholder
             vendor: '', // Placeholder
             location: '', // Placeholder
             cost: '', // Placeholder, schema expects string
             tripName: '', // Placeholder
             comments: null, // Optional field from schema
             // Fields NOT in InsertExpense: currency, description, receiptPath, items, etc.
             // We will add extra info to comments if found.
        };

        let extraInfoForComments: string[] = []; // To store extra data like currency


        // --- Field Validation & Transformation ---
        // User ID check (already parsed)
        if (isNaN(expense.userId)) {
             errors.push("Invalid User ID provided in payload.");
             // No point continuing validation if userId is bad
             return { data: expense, errors, originalIndex: index };
        }

        // Date (Required)
        if (!row.date) {
            errors.push("Missing 'date'");
        } else {
            const date = row.date instanceof Date ? row.date : new Date(String(row.date));
            if (isNaN(date.getTime())) {
                errors.push(`Invalid 'date' format: ${row.date}`);
            } else {
                // Format date as YYYY-MM-DD string, as schema expects text
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
                const day = String(date.getDate()).padStart(2, '0');
                expense.date = `${year}-${month}-${day}`;
            }
        }

        // Type (Required)
        expense.type = String(row.type || 'Uncategorized').trim();
        if (!expense.type) errors.push("Missing 'type'");

        // Vendor (Required)
        expense.vendor = String(row.vendor || 'Unknown').trim();
        if (!expense.vendor) errors.push("Missing 'vendor'");

        // Location (Required)
        expense.location = String(row.location || 'Unknown').trim();
        if (!expense.location) errors.push("Missing 'location'");

        // Cost (Required, must be number > 0)
        if (row.cost === undefined || row.cost === null || String(row.cost).trim() === '') {
            errors.push("Missing 'cost'");
        } else {
            const cost = parseFloat(String(row.cost).replace(/[^0-9.-]+/g, '')); // Clean currency symbols etc.
            if (isNaN(cost) || cost <= 0) {
                errors.push(`Invalid 'cost' value: ${row.cost}`);
            } else {
                expense.cost = String(cost); // Convert validated number back to string for schema
            }
        }

        // Trip Name (Required) - Use default or validate if provided
        expense.tripName = String(row.trip_name || row.tripname || 'Default Trip').trim(); // Allow variations
        if (!expense.tripName) errors.push("Missing 'tripName'");

        // Handle comments field from schema
        expense.comments = String(row.comments || '').trim(); // Start with provided comments

        // Capture extra fields (like currency, description) into comments
        if (row.currency && String(row.currency).trim()) {
            extraInfoForComments.push(`Currency: ${String(row.currency).trim().toUpperCase()}`);
        }
        if (row.description && String(row.description).trim()) {
            extraInfoForComments.push(`Desc: ${String(row.description).trim()}`);
        }
        // Add any other fields from the row that aren't in the schema
        const knownHeaders = ['date', 'type', 'vendor', 'location', 'cost', 'trip_name', 'tripname', 'comments', 'currency', 'description'];
        for (const key in row) {
            if (!knownHeaders.includes(key) && row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
                extraInfoForComments.push(`${key}: ${String(row[key]).trim()}`);
            }
        }

        // Append extra info to comments if any
        if (extraInfoForComments.length > 0) {
            const extraInfoString = extraInfoForComments.join('; ');
            expense.comments = expense.comments ? `${expense.comments} | ${extraInfoString}` : extraInfoString;
        }
        // Ensure comments is null if empty after all processing
        if (!expense.comments) {
            expense.comments = null;
        }

        // --- End Validation ---

        return { data: expense, errors, originalIndex: index }; // Type is already correct
    });

    const validExpenses = validationResults.filter(r => r.errors.length === 0).map(r => r.data);
    const invalidRows = validationResults.filter(r => r.errors.length > 0);

    if (invalidRows.length > 0) {
        console.warn(`Found ${invalidRows.length} invalid rows during validation:`);
        invalidRows.slice(0, 10).forEach(r => console.warn(`  Row ${r.originalIndex + 1}: ${r.errors.join(', ')}`)); // Log first 10 errors
        if (invalidRows.length > 10) console.warn(`  ... and ${invalidRows.length - 10} more invalid rows.`);
    }

    // Add null check for payload before accessing filePath
    if (!payload) {
        throw new Error("Internal error: Payload became null before file deletion.");
    }
    // const taskId = payload.taskId; // Remove redeclaration, use taskId from outer scope

    if (validExpenses.length === 0) {
        const errorDetail = `No valid expenses found after validation. Found ${invalidRows.length} invalid rows. ${parseErrors.join(' ')}`;
        console.warn(`Task ${taskId}: ${errorDetail}`);
        // Update task status to failed
        await storage.updateBackgroundTaskStatus(taskId, 'failed', { createdCount: 0, skippedCount: invalidRows.length, parseErrorCount: parseErrors.length }, errorDetail);
        // Delete the file as it's processed (even if invalid)
        await storage.deleteFile(payload.filePath).catch(delErr => console.error(`Task ${taskId}: Error deleting processed invalid file:`, delErr));
        return {
            statusCode: 200, // Function succeeded, but no valid data
            body: JSON.stringify({
                message: "No valid expenses found in the batch file after validation.",
                error: errorDetail,
                invalidRowDetails: invalidRows.slice(0, 20)
            }),
        };
    }

    // 4. Insert valid expenses into the database using the batch method
    console.log(`Task ${taskId}: Attempting to batch insert ${validExpenses.length} valid expenses...`);
    const batchResult = await storage.createExpensesBatch(validExpenses);

    console.log(`Task ${taskId}: Batch insert completed. Success count: ${batchResult.successCount}. Errors: ${batchResult.errors.length}`);
    if (batchResult.errors.length > 0) {
        console.error(`Task ${taskId}: Errors during batch insertion:`, batchResult.errors);
    }

    // 5. Delete the processed batch file from storage
    try {
        await storage.deleteFile(payload.filePath);
        console.log(`Task ${taskId}: Successfully deleted processed batch file: ${payload.filePath}`);
    } catch (deleteError) {
        console.error(`Task ${taskId}: Failed to delete processed batch file ${payload.filePath}:`, deleteError);
        // Log error but don't fail the whole function because insertion might have succeeded
    }

    // 6. Update background task status
    const finalStatus = batchResult.errors.length > 0 || batchResult.successCount < validExpenses.length ? 'failed' : 'completed';
    const resultData = {
        createdCount: batchResult.successCount,
        skippedCount: invalidRows.length,
        parseErrorCount: parseErrors.length,
        totalValidRows: validExpenses.length,
        batchInsertErrors: batchResult.errors,
        validationErrors: invalidRows.slice(0, 20) // Include details of first 20 validation errors
    };
    const finalMessage = `Batch upload processed. ${batchResult.successCount}/${validExpenses.length} valid expenses created. ${invalidRows.length} rows skipped. ${parseErrors.length} parsing errors.`;

    await storage.updateBackgroundTaskStatus(taskId, finalStatus, resultData, finalStatus === 'failed' ? finalMessage : null);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: finalMessage, ...resultData }),
    };
  } catch (error) {
    console.error(`Unhandled error processing batch upload task ${payload?.taskId}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
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
      body: JSON.stringify({ message: "Unhandled error during batch upload processing.", error: errorMessage }),
    };
  }
};

export { handler };