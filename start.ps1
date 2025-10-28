# Script tuy chon IP toi gian cho chat app
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "     CHAT APP SETUP" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Chon che do:" -ForegroundColor Yellow
Write-Host "1. Localhost (cung may) - nhan Enter" -ForegroundColor White
Write-Host "2. Network (may khac) - nhap IP cua may backend" -ForegroundColor White
Write-Host ""

$userInput = Read-Host "Nhap IP hoac Enter cho localhost"

if ([string]::IsNullOrWhiteSpace($userInput)) {
    # Localhost mode
    $backendUrl = "http://localhost:5002/api"
    $socketUrl = "http://localhost:5002"
    $frontendUrl = "http://localhost:5174"
    
    Write-Host ""
    Write-Host "LOCALHOST MODE" -ForegroundColor Green
    Write-Host "Frontend: $frontendUrl" -ForegroundColor White
    Write-Host "Backend: $socketUrl" -ForegroundColor White
} else {
    # Network mode with custom IP
    $ip = $userInput.Trim()
    $backendUrl = "http://${ip}:5002/api"
    $socketUrl = "http://${ip}:5002"
    $frontendUrl = "http://${ip}:5174"
    
    Write-Host ""
    Write-Host "NETWORK MODE - IP: $ip" -ForegroundColor Green
    Write-Host "Frontend: $frontendUrl" -ForegroundColor White
    Write-Host "Backend: $socketUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "Luu y:" -ForegroundColor Yellow
    Write-Host "- Backend phai chay tren may co IP: $ip" -ForegroundColor Gray
    Write-Host "- Mo port 5002 va 5174 trong firewall" -ForegroundColor Gray
}

# Tao file .env
$envContent = @"
# Auto-generated configuration
VITE_BACKEND_URL=$backendUrl
VITE_SOCKET_URL=$socketUrl
"@

Write-Host ""
Write-Host "Dang cap nhat cau hinh..." -ForegroundColor Yellow
$envContent | Out-File -FilePath "frontend\.env" -Encoding UTF8
Write-Host "Da cap nhat frontend/.env" -ForegroundColor Green

Write-Host ""
Write-Host "KHOI DONG:" -ForegroundColor Cyan
Write-Host "Terminal 1: cd backend && npm run dev" -ForegroundColor White  
Write-Host "Terminal 2: cd frontend && npm run dev" -ForegroundColor White

Write-Host ""
Write-Host "TEST ACCOUNTS:" -ForegroundColor Magenta
Write-Host "Email: emma.thompson@example.com" -ForegroundColor Gray
Write-Host "Password: 123456" -ForegroundColor Gray

Write-Host ""
$startNow = Read-Host "Ban co muon khoi dong ngay khong? (y/n)"

if ($startNow -eq "y" -or $startNow -eq "Y") {
    Write-Host ""
    Write-Host "Dang khoi dong backend..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host 'Starting backend...' -ForegroundColor Green; npm run dev"
    
    Start-Sleep -Seconds 3
    
    Write-Host "Dang khoi dong frontend..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host 'Starting frontend...' -ForegroundColor Green; npm run dev"
    
    Write-Host ""
    Write-Host "Da khoi dong! Truy cap: $frontendUrl" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Chay thu cong:" -ForegroundColor Yellow
    Write-Host "cd backend && npm run dev" -ForegroundColor Gray
    Write-Host "cd frontend && npm run dev" -ForegroundColor Gray
}