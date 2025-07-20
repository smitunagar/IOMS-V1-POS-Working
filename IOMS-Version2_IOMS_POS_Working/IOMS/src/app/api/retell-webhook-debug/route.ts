/**
 * 🔍 Retell AI Webhook Debug Endpoint
 * Logs all incoming webhook requests for troubleshooting
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🔍 DEBUG: Webhook received');
  
  try {
    // Log headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log('📋 Headers:', headers);
    
    // Log body
    const body = await request.text();
    console.log('📄 Body length:', body.length);
    console.log('📄 Body content:', body);
    
    // Try to parse as JSON
    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
      console.log('✅ Parsed JSON:', parsedBody);
    } catch (e) {
      console.log('❌ Failed to parse as JSON:', e);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Debug webhook received',
      headers: headers,
      bodyLength: body.length,
      bodyPreview: body.substring(0, 200),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Debug webhook error:', error);
    return NextResponse.json(
      { error: 'Debug webhook failed', details: error },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Retell AI Webhook Debug Endpoint',
    status: 'active',
    timestamp: new Date().toISOString(),
    instructions: 'Send POST requests here to debug webhook calls'
  });
}
