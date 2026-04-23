#!/usr/bin/env powershell
# Clean and prepare dist folder for distribution
# This removes node_modules and other unnecessary build artifacts

param(
    [string]$DistPath = ".\dist",
    [int]$ZipSizeMB = 150  # Target zip file size in MB
)

Write-Host "Asset Tag Label Generator - Distribution Prep" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Get current dist size
$distSize = (Get-ChildItem -Path $DistPath -Recurse -Force | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Current dist size: $([math]::Round($distSize, 2)) MB"

# Remove node_modules if it exists
if (Test-Path "$DistPath\node_modules") {
    Write-Host "Removing node_modules (no longer needed)..." -ForegroundColor Yellow
    Remove-Item -Path "$DistPath\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ node_modules removed" -ForegroundColor Green
}

# Clean up unnecessary build artifacts
$itemsToRemove = @(
    "$DistPath\*.json" -replace '\\', '\' # Keep only necessary files
)

# Get new size after cleanup
$newSize = (Get-ChildItem -Path $DistPath -Recurse -Force | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "New dist size after cleanup: $([math]::Round($newSize, 2)) MB" -ForegroundColor Green
Write-Host ""

# List what's in dist
Write-Host "Contents of dist folder:" -ForegroundColor Cyan
Get-ChildItem -Path $DistPath | Where-Object { $_.Name -ne 'node_modules' } | Format-Table Name, @{Name="SizeMB";Expression={[math]::Round((Get-ChildItem -Path $_.FullName -Recurse -Force | Measure-Object -Property Length -Sum).Sum/1MB, 2)}} -AutoSize

Write-Host ""
Write-Host "Recommended distribution options:" -ForegroundColor Cyan
Write-Host "1. Just copy the .exe file ($([math]::Round((Get-Item "$DistPath\DHL Asset Tags.exe" -ErrorAction SilentlyContinue).Length/1MB, 2)) MB)"
Write-Host "   - This is the portable executable, needs no installation"
Write-Host ""
Write-Host "2. Create split zip files from dist folder"
Write-Host "   - Run: .\split-dist.ps1"
Write-Host ""
