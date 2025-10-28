# Script kiem tra trang thai cac service
Write-Host "Checking Chat App status..." -ForegroundColor Cyan

# Check backend
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:5002" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "Backend: RUNNING on port 5002" -ForegroundColor Green
} catch {
    Write-Host "Backend: NOT RUNNING on port 5002" -ForegroundColor Red
}

# Check frontend  
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:5174" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "Frontend: RUNNING on port 5174" -ForegroundColor Green
} catch {
    Write-Host "Frontend: NOT RUNNING on port 5174" -ForegroundColor Red
}

# Check processes
Write-Host ""
Write-Host "Node processes:" -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Format-Table Id, ProcessName, CPU

Write-Host "Network ports in use:" -ForegroundColor Yellow
netstat -an | findstr ":500[0-9]"