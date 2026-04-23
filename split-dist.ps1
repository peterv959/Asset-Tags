#!/usr/bin/env powershell
# Split dist folder into multiple zip files
# Each zip will be approximately 150MB (configurable)

param(
    [string]$DistPath = ".\dist",
    [int]$MaxZipSizeMB = 150,
    [string]$OutputFolder = ".\dist-split"
)

# Validate dist folder exists
if (-not (Test-Path $DistPath)) {
    Write-Host "Error: $DistPath not found" -ForegroundColor Red
    exit 1
}

# Create output folder
if (-not (Test-Path $OutputFolder)) {
    New-Item -ItemType Directory -Path $OutputFolder | Out-Null
}

Write-Host "Asset Tag Label Generator - Split Distribution" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Target zip size: $MaxZipSizeMB MB" -ForegroundColor Yellow
Write-Host "Output folder: $OutputFolder" -ForegroundColor Yellow
Write-Host ""

# Get all files to zip
$allFiles = @(Get-ChildItem -Path $DistPath -Recurse -File | Where-Object { $_.Name -ne 'node_modules' })

Write-Host "Total files to zip: $($allFiles.Count)" -ForegroundColor Cyan

# Sort files by size (largest first) for better distribution
$allFiles = $allFiles | Sort-Object -Property Length -Descending

$zipNumber = 1
$currentZipFiles = @()
$currentZipSize = 0
$maxSizeBytes = $MaxZipSizeMB * 1MB

foreach ($file in $allFiles) {
    $fileSize = $file.Length

    # If adding this file would exceed limit, create zip and start new one
    if (($currentZipSize + $fileSize) -gt $maxSizeBytes -and $currentZipFiles.Count -gt 0) {
        # Create zip file
        $zipName = "dhl-asset-tags-part-$zipNumber.zip"
        $zipPath = Join-Path $OutputFolder $zipName

        Write-Host ""
        Write-Host "Creating $zipName ($([math]::Round($currentZipSize/1MB, 2)) MB)" -ForegroundColor Green

        # Create the zip using Compress-Archive with all files
        $filesToCompress = $currentZipFiles | ForEach-Object {
            $_.FullName
        }

        try {
            Compress-Archive -Path $filesToCompress -DestinationPath $zipPath -Force
            Write-Host "✓ Created: $zipPath" -ForegroundColor Green
        }
        catch {
            Write-Host "✗ Error creating zip: $_" -ForegroundColor Red
        }

        # Reset for next zip
        $zipNumber++
        $currentZipFiles = @()
        $currentZipSize = 0
    }

    # Add file to current batch
    $currentZipFiles += $file
    $currentZipSize += $fileSize
}

# Create final zip with remaining files
if ($currentZipFiles.Count -gt 0) {
    $zipName = "dhl-asset-tags-part-$zipNumber.zip"
    $zipPath = Join-Path $OutputFolder $zipName

    Write-Host ""
    Write-Host "Creating $zipName ($([math]::Round($currentZipSize/1MB, 2)) MB)" -ForegroundColor Green

    try {
        $filesToCompress = $currentZipFiles | ForEach-Object { $_.FullName }
        Compress-Archive -Path $filesToCompress -DestinationPath $zipPath -Force
        Write-Host "✓ Created: $zipPath" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Error creating zip: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Distribution complete!" -ForegroundColor Cyan
Write-Host ""

# Summary
$zipFiles = Get-ChildItem -Path $OutputFolder -Filter "*.zip" | Sort-Object Name
Write-Host "Created $($zipFiles.Count) zip file(s):" -ForegroundColor Cyan
$zipFiles | ForEach-Object {
    $sizeMB = [math]::Round($_.Length / 1MB, 2)
    Write-Host "  - $($_.Name): $sizeMB MB"
}

Write-Host ""
Write-Host "Instructions for other computer:" -ForegroundColor Yellow
Write-Host "1. Download all zip files"
Write-Host "2. Extract them all to the same folder"
Write-Host "3. Run: DHL Asset Tags.exe"
Write-Host ""
