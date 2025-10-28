# Script chuyển đổi nhanh giữa localhost và network mode
param(
    [string]$mode = "localhost"
)

$envFile = ".env"

if ($mode -eq "network") {
    Write-Host "Switching to NETWORK mode (for 2 machines)..." -ForegroundColor Green
    
    # Backup current .env
    Copy-Item $envFile "$envFile.backup"
    
    # Create network .env
    @"
# Backend URL - Network mode (for testing on 2 machines)
VITE_BACKEND_URL=http://192.168.1.218:5002/api
VITE_SOCKET_URL=http://192.168.1.218:5002

# Localhost mode (comment out when using network):
# VITE_BACKEND_URL=http://localhost:5002/api
# VITE_SOCKET_URL=http://localhost:5002
"@ | Out-File -FilePath $envFile -Encoding UTF8
    
    Write-Host "✅ Switched to network mode. Frontend will connect to 192.168.1.218:5002"
    Write-Host "⚠️ Make sure backend is running with: npm run dev in backend folder"
    Write-Host "🔥 Restart frontend: npm run dev"
    
} elseif ($mode -eq "localhost") {
    Write-Host "Switching to LOCALHOST mode..." -ForegroundColor Yellow
    
    # Create localhost .env
    @"
# Backend URL - Localhost mode (same machine)
VITE_BACKEND_URL=http://localhost:5002/api
VITE_SOCKET_URL=http://localhost:5002

# Network mode (comment out when using localhost):
# VITE_BACKEND_URL=http://192.168.1.218:5002/api
# VITE_SOCKET_URL=http://192.168.1.218:5002
"@ | Out-File -FilePath $envFile -Encoding UTF8
    
    Write-Host "✅ Switched to localhost mode"
    Write-Host "🔥 Restart frontend: npm run dev"
    
} else {
    Write-Host "Usage: .\switch-env.ps1 [localhost|network]" -ForegroundColor Red
    Write-Host "  localhost - for testing on same machine"
    Write-Host "  network   - for testing on 2 different machines"
}