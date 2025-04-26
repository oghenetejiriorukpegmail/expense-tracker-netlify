// Custom build script for Netlify that skips the server TypeScript build
const { execSync } = require('child_process');
const fs = require('fs');

console.log('Starting custom Netlify build script...');

// Skip server build and only build the client
try {
  console.log('Building client...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Client build completed successfully');
} catch (error) {
  console.error('Error building client:', error);
  process.exit(1);
}

console.log('Build completed successfully');