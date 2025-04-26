// Custom build script for Netlify that skips TypeScript checking
const fs = require('fs');
const { execSync } = require('child_process');

console.log('Starting custom Netlify build script...');

// Skip TypeScript build and just copy the server files
console.log('Skipping TypeScript build and copying server files...');
try {
  // Create dist-server directory if it doesn't exist
  if (!fs.existsSync('./dist-server')) {
    fs.mkdirSync('./dist-server', { recursive: true });
  }
  
  // Copy server files to dist-server without TypeScript compilation
  execSync('cp -r ./server ./dist-server/', { stdio: 'inherit' });
  execSync('cp -r ./shared ./dist-server/', { stdio: 'inherit' });
  
  console.log('Server files copied successfully');
} catch (error) {
  console.error('Error copying server files:', error);
  process.exit(1);
}

// Then build the client
try {
  console.log('Building client...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Client build completed successfully');
} catch (error) {
  console.error('Error building client:', error);
  process.exit(1);
}

console.log('Build completed successfully');