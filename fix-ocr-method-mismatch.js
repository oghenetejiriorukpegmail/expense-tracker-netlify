// Fix script for OCR routes to correct method name mismatch
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

  // Replace method name to match implementation
  let updatedContent = data;
  
  // Replace getBackgroundTask with getBackgroundTaskById
  updatedContent = updatedContent.replace(
    /storage\.getBackgroundTask\(/g, 
    'storage.getBackgroundTaskById('
  );
  
  // Write the updated content back to the file
  fs.writeFile(ocrRoutesPath, updatedContent, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error(`Error writing file: ${writeErr}`);
      return;
    }
    console.log(`Successfully updated ${ocrRoutesPath}`);
    console.log('Changes made:');
    console.log('1. Replaced "getBackgroundTask" with "getBackgroundTaskById" to match implementation');
  });
});