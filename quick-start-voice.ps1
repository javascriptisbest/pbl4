# Voice Call Quick Start

# 1. Seed test users (run once)
Write-Host "Seeding test users..." -ForegroundColor Green
cd e:\essential\fullstack-chat-app-master\backend
node src/seeds/user.seed.js

# 2. Start backend
Write-Host "Starting backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd e:\essential\fullstack-chat-app-master\backend; npm run dev"

# 3. Start frontend  
Write-Host "Starting frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd e:\essential\fullstack-chat-app-master\frontend; npm run dev"

Write-Host "✅ Starting services..." -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:5174" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://localhost:5002" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test Users:" -ForegroundColor Yellow
Write-Host "User 1: emma.thompson@example.com / 123456" -ForegroundColor White
Write-Host "User 2: olivia.miller@example.com / 123456" -ForegroundColor White
Write-Host ""
Write-Host "Instructions:" -ForegroundColor Yellow
Write-Host "1. Open 2 browser windows (normal + incognito)" -ForegroundColor White  
Write-Host "2. Login with different users" -ForegroundColor White
Write-Host "3. Select user in sidebar" -ForegroundColor White
Write-Host "4. Click Phone icon in chat header" -ForegroundColor White
Write-Host "5. Accept call in other window" -ForegroundColor White