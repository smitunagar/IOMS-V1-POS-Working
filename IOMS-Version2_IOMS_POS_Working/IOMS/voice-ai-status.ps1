# 🎤 Voice AI Agent - Quick Start Guide
Write-Host "🎤 Voice AI Agent Status Check" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (Test-Path "package.json") {
    Write-Host "✅ Found package.json - in correct directory" -ForegroundColor Green
} else {
    Write-Host "❌ No package.json found - wrong directory!" -ForegroundColor Red
    Write-Host "   Navigate to: d:\Webmiester\IOMS-V1-POS-Working\IOMS-Version2_IOMS_POS_Working\IOMS" -ForegroundColor Yellow
    exit 1
}

# Check if node_modules exists
if (Test-Path "node_modules") {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Dependencies missing - run: npm install" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔍 Voice AI Files Check:" -ForegroundColor Cyan

$files = @(
    @{ Path = "src/lib/voiceAIAgent.ts"; Name = "Core Voice AI Engine" },
    @{ Path = "src/app/api/voice-agent/reservation/route.ts"; Name = "Reservation API" },
    @{ Path = "src/app/api/voice-agent/order/route.ts"; Name = "Order API" },
    @{ Path = "src/components/voice/VoiceAIInterface.tsx"; Name = "Voice Interface" },
    @{ Path = "src/app/voice-ai-agent/page.tsx"; Name = "Voice AI Page" }
)

foreach ($file in $files) {
    if (Test-Path $file.Path) {
        Write-Host "✅ $($file.Name): $($file.Path)" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing: $($file.Path)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🚀 Quick Start Commands:" -ForegroundColor Cyan
Write-Host "   1. npm run dev          # Start development server" -ForegroundColor White
Write-Host "   2. Navigate to: http://localhost:9003/voice-ai-agent" -ForegroundColor White
Write-Host "   3. Click 'Start Call' and test voice features" -ForegroundColor White

Write-Host ""
Write-Host "📊 Dashboard:" -ForegroundColor Cyan
Write-Host "   View Voice AI metrics at: http://localhost:9003/dashboard" -ForegroundColor White
Write-Host "   Check the 'Voice AI Agent' tab for analytics" -ForegroundColor White

Write-Host ""
Write-Host "🧪 Testing:" -ForegroundColor Cyan
Write-Host "   node emergency-test.js  # Test webhook integration" -ForegroundColor White
Write-Host "   node public/test-voice-ai-agent.js  # Full test suite" -ForegroundColor White

Write-Host ""
Write-Host "✨ Your Voice AI Agent is ready to use!" -ForegroundColor Green
