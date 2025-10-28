# Script khoi dong chat app voi cac che do khac nhau
param(
    [string]$mode = "localhost"
)

Write-Host "Starting Chat App in $mode mode..." -ForegroundColor Cyan

if ($mode -eq "localhost") {
    Write-Host "LOCALHOST MODE - for testing on same machine" -ForegroundColor Yellow
    Write-Host "   Frontend: http://localhost:5174" -ForegroundColor White
    Write-Host "   Backend:  http://localhost:5002" -ForegroundColor White
    
} elseif ($mode -eq "network") {
    Write-Host "NETWORK MODE - for testing on 2 machines" -ForegroundColor Green
    Write-Host "   Frontend: http://192.168.1.218:5174 (access from other machine)" -ForegroundColor White
    Write-Host "   Backend:  http://192.168.1.218:5002 (API endpoint)" -ForegroundColor White
    Write-Host "   WARNING: Make sure Windows Firewall allows these ports!" -ForegroundColor Red
    
    # Switch frontend to network mode
    Set-Location "frontend"
    .\switch-env.ps1 network
    Set-Location ".."
}

Write-Host ""
Write-Host "Setup instructions:" -ForegroundColor Cyan
Write-Host "1. Terminal 1 (Backend):" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray

Write-Host ""
Write-Host "2. Terminal 2 (Frontend):" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray

if ($mode -eq "network") {
    Write-Host ""
    Write-Host "For network mode:" -ForegroundColor Yellow
    Write-Host "   - Run backend on machine 1" -ForegroundColor Gray
    Write-Host "   - Access frontend from machine 2 at: http://192.168.1.218:5174" -ForegroundColor Gray
    Write-Host "   - Or run both on machine 1 and access from machine 2" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Ready to start!" -ForegroundColor Green