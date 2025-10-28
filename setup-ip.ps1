# Script khoi dong chat app voi IP tuy chon
param(
    [string]$ip = ""
)

# Neu khong nhap IP, su dung localhost
if ([string]::IsNullOrEmpty($ip)) {
    $mode = "localhost"
    $backendUrl = "http://localhost:5002/api"
    $socketUrl = "http://localhost:5002"
    $frontendAccess = "http://localhost:5174"
    Write-Host "LOCALHOST MODE - Testing on same machine" -ForegroundColor Yellow
} else {
    $mode = "network"
    $backendUrl = "http://${ip}:5002/api"
    $socketUrl = "http://${ip}:5002"
    $frontendAccess = "http://${ip}:5174"
    Write-Host "NETWORK MODE - Using IP: $ip" -ForegroundColor Green
}

Write-Host "Starting Chat App..." -ForegroundColor Cyan
Write-Host "Backend API: $socketUrl" -ForegroundColor White
Write-Host "Frontend: $frontendAccess" -ForegroundColor White

# Tao file .env cho frontend
$envContent = @"
# Backend URL - Auto generated
VITE_BACKEND_URL=$backendUrl
VITE_SOCKET_URL=$socketUrl

# Generated for mode: $mode
"@

Write-Host ""
Write-Host "Updating frontend configuration..." -ForegroundColor Yellow
$envContent | Out-File -FilePath "frontend\.env" -Encoding UTF8

Write-Host "Configuration updated!" -ForegroundColor Green
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
    Write-Host "Network access:" -ForegroundColor Yellow
    Write-Host "   - Frontend: $frontendAccess" -ForegroundColor Gray
    Write-Host "   - Make sure firewall allows ports 5002 and 5174" -ForegroundColor Gray
    Write-Host "   - Backend must run on machine with IP: $ip" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Test accounts:" -ForegroundColor Magenta
Write-Host "   Email: emma.thompson@example.com" -ForegroundColor Gray
Write-Host "   Password: 123456" -ForegroundColor Gray

Write-Host ""
Write-Host "Ready to start!" -ForegroundColor Green