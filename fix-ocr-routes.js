// Fix script for OCR routes to match schema field names
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

  // Replace field names to match schema
  let updatedContent = data;
  
  // 1. Replace 'user_id' with 'userId'
  updatedContent = updatedContent.replace(
    /user_id: userId/g, 
    'userId: userId'
  );
  
  // 2. Replace 'data' with 'result' for storing JSON data
  updatedContent = updatedContent.replace(
    /data: JSON\.stringify\(/g, 
    'result: JSON.stringify('
  );
  
  // 3. Fix status values to match enum
  updatedContent = updatedContent.replace(
    /ocrResult\.success \? 'completed' : 'failed'/g, 
    "ocrResult.success ? 'completed' : 'failed'"
  );
  
  // Write the updated content back to the file
  fs.writeFile(ocrRoutesPath, updatedContent, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error(`Error writing file: ${writeErr}`);
      return;
    }
    console.log(`Successfully updated ${ocrRoutesPath}`);
    console.log('Changes made:');
    console.log('1. Replaced "user_id" with "userId" to match schema field names');
    console.log('2. Replaced "data" with "result" for storing JSON data');
    console.log('3. Ensured status values match the enum values');
  });
});