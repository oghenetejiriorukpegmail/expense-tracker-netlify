// Fix script for task storage to match database column names
const fs = require('fs');
const path = require('path');

// Path to the task storage file
const taskStoragePath = path.join(__dirname, 'server', 'storage', 'task.storage.ts');

// Read the file
console.log(`Reading file: ${taskStoragePath}`);
fs.readFile(taskStoragePath, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading file: ${err}`);
    return;
  }

  // Replace field names to match database schema
  let updatedContent = data;
  
  // Replace 'userId' with 'user_id' in the createBackgroundTask function
  updatedContent = updatedContent.replace(
    /userId: taskData\.userId/g, 
    'user_id: taskData.userId'
  );
  
  // Write the updated content back to the file
  fs.writeFile(taskStoragePath, updatedContent, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error(`Error writing file: ${writeErr}`);
      return;
    }
    console.log(`Successfully updated ${taskStoragePath}`);
    console.log('Changes made:');
    console.log('1. Replaced "userId: taskData.userId" with "user_id: taskData.userId" to match database column names');
  });
});