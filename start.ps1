# Tranquillo Green Next.js Dev Starter
# Run AFTER start-convex.ps1 is running in another terminal
# Usage: .\start.ps1

Write-Host "Pulling latest..." -ForegroundColor Cyan
git pull

Write-Host "" 
Write-Host "Starting Next.js dev server..." -ForegroundColor Green
Write-Host "Open: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""

npm run dev
