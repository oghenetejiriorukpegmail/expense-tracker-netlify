// Custom Netlify build script that handles both client and server builds
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting custom Netlify build script...');

try {
  // Build client
  console.log('Building client...');
  execSync('cd client && npm run build', { stdio: 'inherit' });
  console.log('Client build completed successfully.');

  // Create minimal server build to satisfy Netlify
  console.log('Creating minimal server build...');
  
  // Ensure dist-server directory exists
  const distServerDir = path.join(__dirname, 'dist-server');
  const serverDir = path.join(distServerDir, 'server');
  const sharedDir = path.join(distServerDir, 'shared');
  
  if (!fs.existsSync(distServerDir)) {
    fs.mkdirSync(distServerDir, { recursive: true });
  }
  
  if (!fs.existsSync(serverDir)) {
    fs.mkdirSync(serverDir, { recursive: true });
  }
  
  if (!fs.existsSync(sharedDir)) {
    fs.mkdirSync(sharedDir, { recursive: true });
  }
  
  // Create minimal schema.js
  const schemaContent = `
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Minimal schema definition to satisfy imports
    exports.expenses = {};
    exports.users = {};
    exports.trips = {};
    exports.mileageLogs = {};
    exports.backgroundTasks = {};
  `;
  
  fs.writeFileSync(path.join(sharedDir, 'schema.js'), schemaContent);
  
  // Create minimal routes.js
  const routesContent = `
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Minimal routes definition
    exports.setupRoutes = function(app) {
      return app;
    };
  `;
  
  fs.writeFileSync(path.join(serverDir, 'routes.js'), routesContent);
  
  console.log('Minimal server build created successfully.');
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Error building:', error);
  process.exit(1);
}