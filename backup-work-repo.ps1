# Backup work's current state before pulling anything
Write-Host "Creating backup of current work state..." -ForegroundColor Yellow

$date = Get-Date -Format 'yyyy-MM-dd'
$branchName = "backup-work-$date"

git checkout -b $branchName
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to create backup branch" -ForegroundColor Red
    exit 1
}

git push origin $branchName
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to push backup branch to GitHub" -ForegroundColor Red
    exit 1
}

git checkout main
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to switch to main" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Backup created: $branchName" -ForegroundColor Green
Write-Host "Ready to run merge script" -ForegroundColor Green
