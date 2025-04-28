# Push to GitHub script for Expense Tracker

Write-Host "===== Expense Tracker GitHub Deployment Script =====" -ForegroundColor Cyan
Write-Host "This script will push the Expense Tracker app to GitHub" -ForegroundColor Cyan
Write-Host ""

# Check if git is installed
try {
    git --version | Out-Null
    Write-Host "Git is installed. Proceeding..." -ForegroundColor Green
} catch {
    Write-Host "Git is not installed or not in PATH. Please install Git and try again." -ForegroundColor Red
    exit 1
}

# Check if the directory is already a git repository
if (-not (Test-Path -Path ".git")) {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
    
    # Create .gitignore file if it doesn't exist
    if (-not (Test-Path -Path ".gitignore")) {
        Write-Host "Creating .gitignore file..." -ForegroundColor Yellow
        @"
# Node modules
node_modules/

# Environment variables
.env
.env.*
!.env.example

# Build output
.svelte-kit/
build/
dist/

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor directories and files
.idea/
.vscode/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS files
.DS_Store
Thumbs.db
"@ | Out-File -FilePath ".gitignore" -Encoding utf8
    }
} else {
    Write-Host "Git repository already initialized." -ForegroundColor Green
}

# Prompt for GitHub repository details
$repoName = Read-Host "Enter the GitHub repository name (e.g., expense-tracker-app)"
$repoDescription = Read-Host "Enter a description for the repository (optional)"

# Check if the repository already exists on GitHub
$githubUsername = Read-Host "Enter your GitHub username"

# Add all files to git
Write-Host "Adding files to Git..." -ForegroundColor Yellow
git add .

# Commit changes
$commitMessage = Read-Host "Enter a commit message (default: 'Initial commit')"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Initial commit"
}

git commit -m $commitMessage

# Create repository on GitHub using GitHub CLI if available
try {
    gh --version | Out-Null
    Write-Host "GitHub CLI is installed. Creating repository..." -ForegroundColor Green
    
    if ([string]::IsNullOrWhiteSpace($repoDescription)) {
        gh repo create $repoName --public --source=. --push
    } else {
        gh repo create $repoName --description $repoDescription --public --source=. --push
    }
} catch {
    # If GitHub CLI is not available, provide manual instructions
    Write-Host "GitHub CLI not found. Please create a repository manually:" -ForegroundColor Yellow
    Write-Host "1. Go to https://github.com/new" -ForegroundColor Yellow
    Write-Host "2. Enter '$repoName' as the repository name" -ForegroundColor Yellow
    Write-Host "3. Enter '$repoDescription' as the description (optional)" -ForegroundColor Yellow
    Write-Host "4. Choose 'Public' visibility" -ForegroundColor Yellow
    Write-Host "5. Click 'Create repository'" -ForegroundColor Yellow
    
    $repoUrl = Read-Host "Enter the repository URL (e.g., https://github.com/$githubUsername/$repoName.git)"
    
    # Add remote and push
    git remote add origin $repoUrl
    git branch -M main
    git push -u origin main
}

Write-Host ""
Write-Host "Expense Tracker has been pushed to GitHub!" -ForegroundColor Green
Write-Host "Repository: https://github.com/$githubUsername/$repoName" -ForegroundColor Green