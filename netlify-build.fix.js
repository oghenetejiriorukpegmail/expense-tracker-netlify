// Custom build script for Netlify with schema fixes
const fs = require('fs');
const { execSync } = require('child_process');

console.log('Starting custom Netlify build script...');

// Copy the fixed schema file
console.log('Applying schema fixes...');
fs.copyFileSync('shared/schema.fix.ts', 'shared/schema.ts');

// Build the server first
try {
  console.log('Building server...');
  execSync('npm run build:server', { stdio: 'inherit' });
  console.log('Server build completed successfully');
} catch (error) {
  console.error('Error building server:', error);
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