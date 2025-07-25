#!/bin/bash
# Quick Status Check for Voice AI Agent

echo "🎤 Voice AI Agent Status Check"
echo "================================"

# Check if we're in the right directory
if [ -f "package.json" ]; then
    echo "✅ Found package.json - in correct directory"
else
    echo "❌ No package.json found - wrong directory!"
    echo "   Navigate to: d:\Webmiester\IOMS-V1-POS-Working\IOMS-Version2_IOMS_POS_Working\IOMS"
    exit 1
fi

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "✅ Dependencies installed"
else
    echo "⚠️  Dependencies missing - run: npm install"
fi

# Check if Voice AI files exist
echo ""
echo "🔍 Voice AI Files Check:"

if [ -f "src/lib/voiceAIAgent.ts" ]; then
    echo "✅ Core Voice AI Engine: src/lib/voiceAIAgent.ts"
else
    echo "❌ Missing: src/lib/voiceAIAgent.ts"
fi

if [ -f "src/app/api/voice-agent/reservation/route.ts" ]; then
    echo "✅ Reservation API: src/app/api/voice-agent/reservation/route.ts"
else
    echo "❌ Missing: src/app/api/voice-agent/reservation/route.ts"
fi

if [ -f "src/app/api/voice-agent/order/route.ts" ]; then
    echo "✅ Order API: src/app/api/voice-agent/order/route.ts"
else
    echo "❌ Missing: src/app/api/voice-agent/order/route.ts"
fi

if [ -f "src/components/voice/VoiceAIInterface.tsx" ]; then
    echo "✅ Voice Interface: src/components/voice/VoiceAIInterface.tsx"
else
    echo "❌ Missing: src/components/voice/VoiceAIInterface.tsx"
fi

if [ -f "src/app/voice-ai-agent/page.tsx" ]; then
    echo "✅ Voice AI Page: src/app/voice-ai-agent/page.tsx"
else
    echo "❌ Missing: src/app/voice-ai-agent/page.tsx"
fi

echo ""
echo "🚀 Quick Start Commands:"
echo "   1. npm run dev          # Start development server"
echo "   2. Navigate to: http://localhost:9003/voice-ai-agent"
echo "   3. Click 'Start Call' and test voice features"
echo ""
echo "📊 Dashboard:"
echo "   View Voice AI metrics at: http://localhost:9003/dashboard"
echo "   Check the 'Voice AI Agent' tab for analytics"
echo ""
echo "🧪 Testing:"
echo "   node emergency-test.js  # Test webhook integration"
echo "   node public/test-voice-ai-agent.js  # Full test suite"
echo ""
echo "✨ Your Voice AI Agent is ready to use!"
