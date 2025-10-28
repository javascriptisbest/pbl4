# Test Chat Features

Write-Host "🧪 Testing Chat Features..." -ForegroundColor Green
Write-Host ""

# Check if backend is running
$backendResponse = try { 
    Invoke-WebRequest -Uri "http://localhost:5002/api/auth/check" -Method GET -TimeoutSec 5 
    "✅ Backend is running"
} catch { 
    "❌ Backend not running - start it first!" 
}
Write-Host $backendResponse -ForegroundColor $(if($backendResponse -like "*✅*") { "Green" } else { "Red" })

# Check if frontend is running
$frontendResponse = try { 
    Invoke-WebRequest -Uri "http://localhost:5174" -Method GET -TimeoutSec 5
    "✅ Frontend is running"
} catch { 
    "❌ Frontend not running - start it first!" 
}
Write-Host $frontendResponse -ForegroundColor $(if($frontendResponse -like "*✅*") { "Green" } else { "Red" })

Write-Host ""
Write-Host "🎯 Test Checklist:" -ForegroundColor Yellow

Write-Host "📱 Emoji Reactions:" -ForegroundColor Cyan
Write-Host "  1. Hover vào tin nhắn → thấy nút ⋮" -ForegroundColor White
Write-Host "  2. Click ⋮ → Click 'React'" -ForegroundColor White  
Write-Host "  3. Chọn emoji từ grid" -ForegroundColor White
Write-Host "  4. Xem reaction hiển thị dưới tin nhắn" -ForegroundColor White
Write-Host "  5. Click reaction để toggle on/off" -ForegroundColor White

Write-Host ""
Write-Host "📋 Copy Message:" -ForegroundColor Cyan
Write-Host "  1. Hover vào tin nhắn → nút ⋮" -ForegroundColor White
Write-Host "  2. Click 'Copy'" -ForegroundColor White
Write-Host "  3. Paste để kiểm tra clipboard" -ForegroundColor White

Write-Host ""
Write-Host "🗑️ Delete Message:" -ForegroundColor Cyan
Write-Host "  1. Hover vào tin nhắn CỦA MÌNH → nút ⋮" -ForegroundColor White
Write-Host "  2. Click 'Delete' (màu đỏ)" -ForegroundColor White
Write-Host "  3. Confirm deletion" -ForegroundColor White
Write-Host "  4. Tin nhắn chuyển thành 'This message was deleted'" -ForegroundColor White

Write-Host ""
Write-Host "🔄 Real-time Test:" -ForegroundColor Cyan
Write-Host "  1. Mở 2 browser windows" -ForegroundColor White
Write-Host "  2. Login 2 users khác nhau" -ForegroundColor White
Write-Host "  3. React/Delete ở window 1" -ForegroundColor White
Write-Host "  4. Xem update real-time ở window 2" -ForegroundColor White

Write-Host ""
Write-Host "🚀 Ready to test! Open: http://localhost:5174" -ForegroundColor Green