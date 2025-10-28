# Script khoi dong nhanh chat app
param(
    [string]$mode = "localhost"
)

Write-Host "Starting Chat App in $mode mode..." -ForegroundColor Green

if ($mode -eq "network") {
    Write-Host "Switching frontend to network mode..." -ForegroundColor Yellow
    Set-Location "frontend"
    .\switch-env.ps1 network
    Set-Location ".."
}

Write-Host "Starting backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm run dev"

Start-Sleep -Seconds 3

Write-Host "Starting frontend..." -ForegroundColor Cyan  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"

Write-Host ""
Write-Host "Chat App is starting..." -ForegroundColor Green
Write-Host "Backend: http://localhost:5002" -ForegroundColor White
Write-Host "Frontend: http://localhost:5174" -ForegroundColor White

if ($mode -eq "network") {
    Write-Host "Network access: http://192.168.1.218:5174" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press Ctrl+C in backend/frontend windows to stop" -ForegroundColor Gray