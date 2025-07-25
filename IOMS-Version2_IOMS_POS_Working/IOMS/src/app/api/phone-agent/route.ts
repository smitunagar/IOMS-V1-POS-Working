/**
 * 📞 Phone Agent API - Simple and Clean
 * Streamlined API for the ultimate phone system interface
 */

import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for demo purposes
let callHistory: any[] = [];
let systemStats = {
  totalCalls: 127,
  callsToday: 15,
  avgDuration: 185,
  successRate: 94,
  systemHealth: 'excellent'
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        return NextResponse.json({
          success: true,
          stats: systemStats
        });

      case 'history':
        return NextResponse.json({
          success: true,
          callHistory: callHistory.slice(0, 10) // Return last 10 calls
        });

      case 'health':
        return NextResponse.json({
          success: true,
          health: {
            phoneSystem: 'online',
            voiceAI: 'ready',
            callForwarding: 'active',
            database: 'connected'
          }
        });

      default:
        return NextResponse.json({
          success: true,
          message: 'Phone Agent API is running',
          stats: systemStats,
          callHistory: callHistory.slice(0, 5)
        });
    }
  } catch (error) {
    console.error('Error in Phone Agent API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'log-call':
        const newCall = {
          id: Date.now().toString(),
          ...data,
          timestamp: new Date().toISOString()
        };
        callHistory.unshift(newCall);
        
        // Update stats
        systemStats.totalCalls += 1;
        systemStats.callsToday += 1;
        
        return NextResponse.json({
          success: true,
          message: 'Call logged successfully',
          call: newCall
        });

      case 'process-message':
        const { message } = data;
        
        // Simple AI response generation
        let response = '';
        const msg = message.toLowerCase();
        
        if (msg.includes('reservation') || msg.includes('table') || msg.includes('book')) {
          response = `I'd be happy to help with a reservation! I have availability tonight. What time would work best for you? I can also check our menu specialties for tonight if you'd like.`;
        } else if (msg.includes('order') || msg.includes('food') || msg.includes('pizza') || msg.includes('delivery')) {
          response = `Great! I can help you place an order. Our popular items today are our wood-fired pizzas and fresh salads. Would you like delivery or pickup? I can also suggest our chef's specials.`;
        } else if (msg.includes('hours') || msg.includes('open') || msg.includes('time')) {
          response = `We're open today from 11 AM to 10 PM. Our kitchen closes at 9:30 PM for dine-in orders. We also offer delivery until 9:45 PM. Is there anything specific you'd like to know about our schedule?`;
        } else if (msg.includes('menu') || msg.includes('special') || msg.includes('today')) {
          response = `Today's specials include our signature truffle pizza and grilled salmon with seasonal vegetables. Our full menu is available, and I'd recommend our house-made pasta dishes. Would you like me to describe any specific items?`;
        } else {
          response = `Thank you for calling! I understand you're asking about "${message}". Let me help you with that right away. What specific information can I provide for you today?`;
        }
        
        return NextResponse.json({
          success: true,
          response: response,
          intent: detectIntent(msg),
          confidence: 0.95
        });

      case 'update-stats':
        systemStats = { ...systemStats, ...data };
        return NextResponse.json({
          success: true,
          message: 'Stats updated successfully',
          stats: systemStats
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in Phone Agent API POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Helper function to detect intent
function detectIntent(message: string): string {
  if (message.includes('reservation') || message.includes('table') || message.includes('book')) {
    return 'reservation';
  } else if (message.includes('order') || message.includes('food') || message.includes('pizza') || message.includes('delivery')) {
    return 'order';
  } else if (message.includes('hours') || message.includes('open') || message.includes('time')) {
    return 'hours';
  } else if (message.includes('menu') || message.includes('special')) {
    return 'menu';
  } else {
    return 'general';
  }
}
