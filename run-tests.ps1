# Test runner script for expense tracker application

param(
    [Parameter()]
    [ValidateSet("unit", "e2e", "all", "coverage")]
    [string]$TestType = "all",
    
    [Parameter()]
    [switch]$Watch,
    
    [Parameter()]
    [switch]$UI,
    
    [Parameter()]
    [switch]$UpdateSnapshots,
    
    [Parameter()]
    [switch]$Verbose
)

# Configuration
$env:NODE_ENV = "test"
$env:VITE_API_URL = "http://localhost:3000"
$env:VITE_AUTH_DOMAIN = "test.auth0.com"
$env:VITE_AUTH_CLIENT_ID = "test-client-id"

# Helper function to write colored output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

# Function to run database setup
function Setup-TestDatabase {
    Write-ColorOutput Green "Setting up test database..."
    try {
        npm run db:migrate
        if ($LASTEXITCODE -ne 0) { throw "Database migration failed" }
    }
    catch {
        Write-ColorOutput Red "Failed to setup test database: $_"
        exit 1
    }
}

# Function to run unit tests
function Run-UnitTests {
    Write-ColorOutput Green "Running unit tests..."
    $command = "npm run test:unit"
    
    if ($Watch) {
        $command += " -- --watch"
    }
    if ($UpdateSnapshots) {
        $command += " -- -u"
    }
    if ($Verbose) {
        $command += " -- --verbose"
    }
    
    Invoke-Expression $command
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "Unit tests failed"
        return $false
    }
    return $true
}

# Function to run E2E tests
function Run-E2ETests {
    Write-ColorOutput Green "Running E2E tests..."
    
    # Start the dev server in background
    $serverJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        npm run dev
    }
    
    # Wait for server to start
    Start-Sleep -Seconds 10
    
    $command = "npm run test:e2e"
    if ($UpdateSnapshots) {
        $command += " -- -u"
    }
    if ($Verbose) {
        $command += " -- --verbose"
    }
    
    try {
        Invoke-Expression $command
        if ($LASTEXITCODE -ne 0) { throw "E2E tests failed" }
    }
    catch {
        Write-ColorOutput Red "E2E tests failed: $_"
        Stop-Job $serverJob
        Remove-Job $serverJob
        return $false
    }
    
    Stop-Job $serverJob
    Remove-Job $serverJob
    return $true
}

# Function to run coverage report
function Run-CoverageReport {
    Write-ColorOutput Green "Running test coverage..."
    $command = "npm run test:coverage"
    
    if ($Verbose) {
        $command += " -- --verbose"
    }
    
    Invoke-Expression $command
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "Coverage report failed"
        return $false
    }
    return $true
}

# Main execution
$success = $true

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-ColorOutput Yellow "Installing dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "Failed to install dependencies"
        exit 1
    }
}

# Setup test database
Setup-TestDatabase

# Run tests based on type
switch ($TestType) {
    "unit" {
        $success = Run-UnitTests
    }
    "e2e" {
        $success = Run-E2ETests
    }
    "coverage" {
        $success = Run-CoverageReport
    }
    "all" {
        $unitSuccess = Run-UnitTests
        $e2eSuccess = Run-E2ETests
        $coverageSuccess = Run-CoverageReport
        $success = $unitSuccess -and $e2eSuccess -and $coverageSuccess
    }
}

# Open UI if requested
if ($UI -and $success) {
    Write-ColorOutput Green "Opening test UI..."
    npm run test:ui
}

# Final status
if ($success) {
    Write-ColorOutput Green "All tests completed successfully!"
    exit 0
} else {
    Write-ColorOutput Red "Tests failed!"
    exit 1
}