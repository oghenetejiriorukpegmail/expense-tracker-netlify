# Expense Tracker Deployment Script for Netlify

Write-Host "===== Expense Tracker Netlify Deployment Script ====="
Write-Host "This script will prepare the SvelteKit app for deployment to Netlify"
Write-Host ""

# Step 1: Verify environment files
Write-Host "Step 1: Verifying environment files..."
if (Test-Path "expense-tracker-svelte/.env") {
    Write-Host "Environment file found in expense-tracker-svelte directory"
} else {
    Write-Host "Environment file not found in expense-tracker-svelte directory"
    Write-Host "Please create a .env file based on the .env.example template"
    exit 1
}

# Step 2: Install dependencies
Write-Host ""
Write-Host "Step 2: Installing dependencies..."
Set-Location -Path "expense-tracker-svelte"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies"
    Set-Location -Path ".."
    exit 1
}
Write-Host "Dependencies installed successfully"

# Step 3: Build the SvelteKit app
Write-Host ""
Write-Host "Step 3: Building the SvelteKit app..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed"
    Set-Location -Path ".."
    exit 1
}
Write-Host "Build completed successfully"

# Step 4: Test the build locally
Write-Host ""
Write-Host "Step 4: Testing the build locally..."
Write-Host "Starting preview server. Press Ctrl+C to stop when done testing."
npm run preview
Set-Location -Path ".."

# Step 5: Deployment instructions
Write-Host ""
Write-Host "Step 5: Deployment Instructions"
Write-Host "To deploy to Netlify, you can use one of the following methods:"
Write-Host ""
Write-Host "Option 1: Deploy via Netlify CLI"
Write-Host "1. Install Netlify CLI: npm install -g netlify-cli"
Write-Host "2. Login to Netlify: netlify login"
Write-Host "3. Initialize site: netlify init"
Write-Host "4. Deploy: netlify deploy --prod"
Write-Host ""
Write-Host "Option 2: Deploy via Netlify UI"
Write-Host "1. Go to https://app.netlify.com"
Write-Host "2. Create a new site from Git"
Write-Host "3. Connect to your GitHub repository"
Write-Host "4. Configure build settings:"
Write-Host "   - Build command: cd expense-tracker-svelte; npm install; npm run build"
Write-Host "   - Publish directory: expense-tracker-svelte/build"
Write-Host ""
Write-Host "Do not forget to set up the environment variables in the Netlify dashboard:"
Write-Host "- VITE_FIREBASE_API_KEY"
Write-Host "- VITE_FIREBASE_AUTH_DOMAIN"
Write-Host "- VITE_FIREBASE_PROJECT_ID"
Write-Host "- VITE_FIREBASE_STORAGE_BUCKET"
Write-Host "- VITE_FIREBASE_MESSAGING_SENDER_ID"
Write-Host "- VITE_FIREBASE_APP_ID"
Write-Host "- DATABASE_URL"
Write-Host "- POSTGRES_HOST"
Write-Host "- POSTGRES_PORT"
Write-Host "- POSTGRES_DB"
Write-Host "- POSTGRES_USER"
Write-Host "- POSTGRES_PASSWORD"
Write-Host "- POSTGRES_SSL"
Write-Host "- NODE_ENV"
Write-Host ""
Write-Host "===== Deployment Script Complete ====="