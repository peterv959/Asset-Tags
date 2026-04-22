# Merge home's main into work, preserving work's build configs
Write-Host "Merging home changes..." -ForegroundColor Yellow

# Backup work's build configs
Write-Host "Preserving work build configs..." -ForegroundColor Cyan
Copy-Item package.json package.json.work -Force
Copy-Item package-lock.json package-lock.json.work -Force
Copy-Item build.js build.js.work -Force
Copy-Item tsconfig.json tsconfig.json.work -Force

if (Test-Path .npmrc) {
    Copy-Item .npmrc .npmrc.work -Force
}

# Pull home's main branch
Write-Host "Pulling home changes from main..." -ForegroundColor Cyan
git pull origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to pull from main" -ForegroundColor Red
    exit 1
}

# Restore work's build configs
Write-Host "Restoring work build configs..." -ForegroundColor Cyan
Copy-Item package.json.work package.json -Force
Copy-Item package-lock.json.work package-lock.json -Force
Copy-Item build.js.work build.js -Force
Copy-Item tsconfig.json.work tsconfig.json -Force

if (Test-Path .npmrc.work) {
    Copy-Item .npmrc.work .npmrc -Force
}

# Cleanup
Remove-Item *.work -Force

Write-Host "✓ Merge complete!" -ForegroundColor Green
Write-Host "Work build configs preserved" -ForegroundColor Green
Write-Host "Source files updated from home" -ForegroundColor Green
