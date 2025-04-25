// Fix script for OCR routes to handle missing background_tasks table
const fs = require('fs');
const path = require('path');

// Path to the OCR routes file
const ocrRoutesPath = path.join(__dirname, 'dist-server', 'server', 'routes', 'ocr.routes.js');

// Read the file
console.log(`Reading file: ${ocrRoutesPath}`);
fs.readFile(ocrRoutesPath, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading file: ${err}`);
    return;
  }

  // Modify the OCR route to handle missing background_tasks table
  let updatedContent = data;
  
  // Find the section where the background task is created
  const taskCreationPattern = /\/\/ Create a background task for OCR processing[\s\S]*?const task = await storage\.createBackgroundTask\(taskData\);/;
  
  // Replace with a try-catch block that handles the missing table
  const taskCreationReplacement = `// Create a background task for OCR processing
            let task;
            try {
                const taskData = {
                    userId: userId, // Use userId instead of user_id to match schema
                    type: 'receipt_ocr',
                    status: 'processing',
                    result: JSON.stringify({ // Use result instead of data to match schema
                        receipt_path: filePath,
                        mime_type: req.file.mimetype,
                        timestamp: timestamp
                    })
                };
                
                task = await storage.createBackgroundTask(taskData);
                console.log("Background task created successfully:", task);
            } catch (taskError) {
                // Handle the case where the background_tasks table doesn't exist
                console.error("[SupabaseStorage] Error creating background task:", taskError);
                
                // Create a mock task object to continue processing
                task = {
                    id: 'temp_' + Date.now(),
                    userId: userId,
                    type: 'receipt_ocr',
                    status: 'processing',
                    result: JSON.stringify({
                        receipt_path: filePath,
                        mime_type: req.file.mimetype,
                        timestamp: timestamp
                    })
                };
                console.log("Created mock task to continue processing:", task);
            }`;
  
  updatedContent = updatedContent.replace(taskCreationPattern, taskCreationReplacement);
  
  // Find the section where the task status is updated
  const taskUpdatePattern = /\/\/ Update the task with the OCR result[\s\S]*?await storage\.updateBackgroundTaskStatus\([^;]*;/;
  
  // Replace with a try-catch block that handles the missing table
  const taskUpdateReplacement = `// Update the task with the OCR result
                try {
                    if (!task.id.toString().startsWith('temp_')) {
                        await storage.updateBackgroundTaskStatus(
                            task.id,
                            ocrResult.success ? 'completed' : 'failed',
                            JSON.stringify(ocrResult)
                        );
                        console.log("Background task updated successfully:", task.id);
                    }
                } catch (updateError) {
                    console.error("[SupabaseStorage] Error updating background task:", updateError);
                    // Continue processing even if update fails
                }`;
  
  updatedContent = updatedContent.replace(taskUpdatePattern, taskUpdateReplacement);
  
  // Find the section where the task status is updated on error
  const taskErrorUpdatePattern = /\/\/ Update the task with the error[\s\S]*?await storage\.updateBackgroundTaskStatus\([^;]*;/;
  
  // Replace with a try-catch block that handles the missing table
  const taskErrorUpdateReplacement = `// Update the task with the error
                try {
                    if (!task.id.toString().startsWith('temp_')) {
                        await storage.updateBackgroundTaskStatus(
                            task.id,
                            'failed',
                            null,
                            ocrError.message || 'Failed to process receipt with OCR'
                        );
                        console.log("Background task updated with error:", task.id);
                    }
                } catch (updateError) {
                    console.error("[SupabaseStorage] Error updating background task status:", updateError);
                    // Continue processing even if update fails
                }`;
  
  updatedContent = updatedContent.replace(taskErrorUpdatePattern, taskErrorUpdateReplacement);
  
  // Write the updated content back to the file
  fs.writeFile(ocrRoutesPath, updatedContent, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error(`Error writing file: ${writeErr}`);
      return;
    }
    console.log(`Successfully updated ${ocrRoutesPath}`);
    console.log('Changes made:');
    console.log('1. Added try-catch blocks around background task creation and updates');
    console.log('2. Created a mock task object when the background_tasks table doesn\'t exist');
    console.log('3. Fixed field names to match schema (userId instead of user_id, result instead of data)');
    console.log('4. Added more detailed error logging');
  });
});