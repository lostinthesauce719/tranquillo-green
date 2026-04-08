# Tranquillo Green Convex Dev Starter
# Run this FIRST in a separate terminal before starting Next.js
# Usage: .\start-convex.ps1

Write-Host "Pulling latest..." -ForegroundColor Cyan
git pull

Write-Host ""
Write-Host "Starting Convex dev..." -ForegroundColor Green
Write-Host ""

npx convex dev
