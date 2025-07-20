/**
 * 🔓 Public Retell AI Webhook Endpoint (No Auth)
 * Temporary bypass for testing webhook functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { processRetellCallData, type RetellCallData } from '@/lib/retellAiIntegration';
import { storeWebhookReservation } from '@/lib/webhookStorage';

/**
 * Convert Retell AI webhook payload to our format
 */
function convertRetellPayload(payload: any): RetellCallData {
  // Handle both wrapped and direct payload formats
  const call = payload.call || payload;
  const analysis = call.call_analysis || call.analysis || {};
  
  // Extract transcript from various possible formats
  let transcriptText = '';
  if (call.transcript) {
    if (typeof call.transcript === 'string') {
      transcriptText = call.transcript;
    } else if (call.transcript.text) {
      transcriptText = call.transcript.text;
    } else if (Array.isArray(call.transcript)) {
      transcriptText = call.transcript.map((t: any) => t.text || t.content || '').join(' ');
    } else {
      transcriptText = JSON.stringify(call.transcript);
    }
  }
  
  return {
    call_id: call.call_id || `call_${Date.now()}`,
    call_type: call.call_type || 'inbound',
    agent_id: call.agent_id || 'sam_ai_agent',
    call_status: call.call_status || 'ended',
    call_duration: call.duration || 0,
    transcript: transcriptText || 'No transcript available',
    
    // Customer info extraction
    customer_name: analysis.entities?.customer_name || 'Phone Customer',
    customer_phone: call.from_number || 'unknown',
    customer_email: analysis.entities?.email || undefined,
    
    // Reservation details
    reservation_datetime: analysis.entities?.date && analysis.entities?.time ? 
      `${analysis.entities.date} ${analysis.entities.time}` : 
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
    party_size: analysis.entities?.party_size || 2,
    special_requests: analysis.entities?.special_requests || undefined,
    occasion: analysis.entities?.occasion || undefined,
    
    // Order details (if any)
    order_items: analysis.order_info?.items || [],
    order_type: analysis.order_info?.type || 'dine-in',
    preferred_delivery_time: analysis.order_info?.preferred_time,
    
    // AI metadata
    ai_confidence: analysis.confidence_score || call.transcript?.confidence || 0.5,
    requires_manual_review: analysis.requires_followup || false,
    extracted_data: analysis
  };
}

/**
 * Handle Retell AI webhook POST requests (NO AUTHENTICATION)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    console.log('🔓 PUBLIC webhook received. Body length:', body.length);
    
    const payload = JSON.parse(body);
    
    // Handle both wrapped and direct payload formats
    const call = payload.call || payload;
    
    console.log('📞 Public Retell AI webhook received:', {
      event_type: payload.event_type,
      call_id: call.call_id,
      call_status: call.call_status,
      agent_id: call.agent_id,
      has_transcript: !!(call.transcript),
      payload_size: body.length
    });
    
    // Process any ended call (ignore event_type requirement)
    if (call.call_status === 'ended') {
      console.log('🔄 Processing ended call...');
      
      // Convert payload to our format
      const callData = convertRetellPayload(payload);
      
      console.log('📋 Converted call data:', {
        customer_name: callData.customer_name,
        customer_phone: callData.customer_phone,
        party_size: callData.party_size,
        transcript_length: callData.transcript.length
      });
      
      // Process the call data with default user ID
      const result = await processRetellCallData('webhook_user', callData);
      
      if (result.success) {
        console.log('✅ Call processed successfully');
        
        // Store in webhook storage for dashboard if we have a reservation
        if (result.reservation_id) {
          // Create a simple reservation object for storage
          const reservation = {
            id: result.reservation_id,
            customer_name: callData.customer_name || 'Phone Customer',
            customer_phone: callData.customer_phone,
            party_size: callData.party_size || 2,
            reservation_datetime: callData.reservation_datetime,
            status: 'confirmed',
            created_at: new Date().toISOString(),
            retell_call_id: callData.call_id,
            source: 'retell-ai-call'
          };
          storeWebhookReservation('webhook_user', reservation);
          console.log('💾 Reservation stored in webhook storage');
        }
        
        return NextResponse.json({
          success: true,
          message: result.message,
          reservation_id: result.reservation_id,
          order_id: result.order_id,
          call_id: callData.call_id,
          customer_name: callData.customer_name,
          party_size: callData.party_size,
          timestamp: new Date().toISOString()
        });
      } else {
        console.error('❌ Failed to process call:', result.errors);
        return NextResponse.json({
          success: false,
          error: result.message,
          errors: result.errors,
          call_id: callData.call_id,
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    } else {
      console.log('ℹ️ Ignoring non-ended call:', call.call_status);
      return NextResponse.json({
        success: true,
        message: `Call status ${call.call_status} acknowledged but not processed`,
        call_status: call.call_status,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('❌ Public webhook error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Retell AI Public Webhook Endpoint (No Authentication)',
    status: 'active',
    timestamp: new Date().toISOString(),
    instructions: 'Use this endpoint for testing if the main webhook has authentication issues'
  });
}
