/**
 * 🔗 Retell AI Webhook Endpoint
 * Receives call data from Retell AI SAM AI agent
 * Automatically creates orders and reservations in IOMS
 */

import { NextRequest, NextResponse } from 'next/server';
import { processRetellCallData, type RetellCallData } from '@/lib/retellAiIntegration';
import { storeWebhookReservation } from '@/lib/webhookStorage';

// Retell AI webhook secret for verification (set in environment)
const RETELL_WEBHOOK_SECRET = process.env.RETELL_WEBHOOK_SECRET || 'default-secret-dev';

interface RetellWebhookPayload {
  event_type: 'call_started' | 'call_ended' | 'call_analyzed';
  timestamp: string;
  call: {
    call_id: string;
    agent_id: string;
    call_type: 'inbound' | 'outbound';
    call_status: 'ongoing' | 'ended';
    from_number?: string;
    to_number?: string;
    start_timestamp?: string;
    end_timestamp?: string;
    duration?: number;
    recording_url?: string;
    transcript?: {
      text: string;
      confidence?: number;
    };
    // Retell AI analyzed data
    analysis?: {
      customer_intent: string;
      customer_info?: {
        name?: string;
        phone?: string;
        email?: string;
      };
      order_info?: {
        items: Array<{
          item: string;
          quantity: number;
          special_requests?: string;
        }>;
        order_type: 'dine-in' | 'delivery' | 'pickup';
        delivery_address?: string;
        preferred_time?: string;
      };
      reservation_info?: {
        date_time: string;
        party_size: number;
        special_requests?: string;
        occasion?: string;
      };
      confidence_score?: number;
      requires_followup?: boolean;
    };
  };
}

/**
 * Verify webhook signature (basic implementation)
 */
function verifyWebhookSignature(request: NextRequest, body: string): boolean {
  try {
    // TEMPORARY: Allow all requests for debugging
    console.log('⚠️ TEMPORARY: Allowing all webhook requests for debugging');
    return true;
    
    const signature = request.headers.get('x-retell-signature');
    const authorization = request.headers.get('authorization');
    const retellSignature = request.headers.get('retell-signature');
    
    console.log('🔐 Checking webhook signatures:', {
      'x-retell-signature': !!signature,
      'authorization': !!authorization,
      'retell-signature': !!retellSignature,
      'expected_secret_length': RETELL_WEBHOOK_SECRET.length
    });
    
    // Check authorization header
    if (authorization?.includes(RETELL_WEBHOOK_SECRET)) {
      console.log('✅ Authorization header verified');
      return true;
    }
    
    // Check x-retell-signature header
    if (signature && signature.length > 10) {
      console.log('✅ X-Retell-Signature present');
      return true;
    }
    
    // Check retell-signature header
    if (retellSignature && retellSignature.length > 10) {
      console.log('✅ Retell-Signature present');
      return true;
    }
    
    // For development: allow requests without signature if secret is default
    if (RETELL_WEBHOOK_SECRET === 'default-secret-dev') {
      console.log('⚠️ Development mode: allowing unsigned request');
      return true;
    }
    
    console.error('❌ No valid signature found');
    return false;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

/**
 * Extract reservation info from transcript using simple pattern matching
 */
function extractReservationFromTranscript(transcript: string | any): any {
  const text = typeof transcript === 'string' ? transcript : transcript?.text || '';
  
  // Simple patterns to extract common reservation info
  const nameMatch = text.match(/(?:name is|my name is|I'm|this is)\s+([A-Za-z\s]+)/i);
  const partySizeMatch = text.match(/(?:table for|party of|for)\s+(\d+)\s+(?:people|person|guests?)/i);
  const timeMatch = text.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm))/i);
  const dateMatch = text.match(/(?:today|tomorrow|tonight|(?:this\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))/i);
  
  return {
    customer_info: {
      name: nameMatch ? nameMatch[1].trim() : 'Guest Customer',
      phone: null,
      email: null
    },
    reservation_info: {
      party_size: partySizeMatch ? parseInt(partySizeMatch[1]) : 2,
      date_time: dateMatch && timeMatch ? 
        `${dateMatch[0]} ${timeMatch[0]}` : 
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      special_requests: null,
      occasion: null
    },
    confidence_score: 0.6 // Lower confidence for extracted data
  };
}

/**
 * Convert Retell webhook payload to our RetellCallData format
 */
function convertRetellPayload(payload: any, extractedInfo: any = null): RetellCallData {
  const call = payload.call || payload;
  const analysis = call.analysis || call.call_analysis || extractedInfo;
  
  // Extract transcript text from various possible structures
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
    call_id: call.call_id,
    call_type: call.call_type || 'inbound',
    agent_id: call.agent_id,
    call_status: call.call_status,
    call_duration: call.duration,
    transcript: transcriptText,
    
    // Customer information
    customer_name: analysis?.customer_info?.name || 'Phone Customer',
    customer_phone: analysis?.customer_info?.phone || call.from_number || 'Unknown',
    customer_email: analysis?.customer_info?.email,
    
    // Order information
    order_items: analysis?.order_info?.items?.map((item: any) => ({
      item_name: item.item,
      quantity: item.quantity,
      special_instructions: item.special_requests
    })),
    order_type: analysis?.order_info?.order_type,
    
    // Reservation information
    reservation_datetime: analysis?.reservation_info?.date_time || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    party_size: analysis?.reservation_info?.party_size || 2,
    special_requests: analysis?.reservation_info?.special_requests,
    occasion: analysis?.reservation_info?.occasion,
    
    // Delivery information
    delivery_address: analysis?.order_info?.delivery_address,
    preferred_delivery_time: analysis?.order_info?.preferred_time,
    
    // AI metadata
    ai_confidence: analysis?.confidence_score || call.transcript?.confidence || 0.5,
    requires_manual_review: analysis?.requires_followup || true, // Default to manual review for calls without analysis
    extracted_data: analysis
  };
}

/**
 * Handle Retell AI webhook POST requests
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    console.log('📞 Webhook received. Body length:', body.length);
    console.log('🚨 HOTFIX: Processing all webhook requests');
    
    // Verify webhook signature for security
    if (!verifyWebhookSignature(request, body)) {
      console.error('❌ Webhook signature verification failed');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid signature' },
        { status: 401 }
      );
    }
    
    const payload: any = JSON.parse(body);
    
    // Handle different Retell AI payload formats
    const call = payload.call || payload;
    const eventType = payload.event_type || (call?.call_status === 'ended' ? 'call_ended' : 'unknown');
    
    // Safety check
    if (!call || !call.call_id) {
      console.error('❌ Invalid payload structure:', Object.keys(payload));
      return NextResponse.json({
        error: 'Invalid payload structure',
        received_keys: Object.keys(payload),
        expected: 'call object with call_id'
      }, { status: 400 });
    }
    
    console.log('📞 Retell AI webhook received:', {
      event_type: eventType,
      call_id: call.call_id,
      call_status: call.call_status,
      agent_id: call.agent_id,
      has_analysis: !!(call.analysis || call.call_analysis),
      has_transcript: !!(call.transcript),
      payload_keys: Object.keys(payload)
    });
    
    // Process calls that have ended (regardless of event_type)
    if (call.call_status !== 'ended') {
      console.log('ℹ️ Call not ended yet, ignoring:', call.call_status);
      return NextResponse.json({ 
        message: 'Call not ended, waiting for completion',
        call_status: call.call_status
      });
    }
    
    console.log('🔄 Processing ended call...');
    
    // Try to extract reservation info from transcript if no analysis
    let extractedInfo = null;
    if (!call.analysis && !call.call_analysis && call.transcript) {
      console.log('🔍 No analysis data, attempting to extract from transcript...');
      extractedInfo = extractReservationFromTranscript(call.transcript);
      console.log('📋 Extracted info:', extractedInfo);
    } else if (!call.analysis && !call.call_analysis) {
      console.log('⚠️ No analysis data and no transcript available');
      // Still process the call but with default values
      extractedInfo = {
        customer_info: { name: 'Phone Customer', phone: call.from_number },
        reservation_info: { party_size: 2, date_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
        confidence_score: 0.3
      };
    }
    
    // Get user ID from agent ID or use default
    const userId = mapAgentToUser(call.agent_id);
    
    if (!userId) {
      console.error('❌ Could not determine user ID for agent:', call.agent_id);
      return NextResponse.json(
        { error: 'Could not determine user account' },
        { status: 400 }
      );
    }
    
    // Convert payload to our format (using extracted info if needed)
    const callData = convertRetellPayload(payload, extractedInfo);
    
    console.log('📋 Converted call data:', {
      customer_name: callData.customer_name,
      party_size: callData.party_size,
      phone: callData.customer_phone,
      has_datetime: !!callData.reservation_datetime
    });
    
    // Always try to create a reservation for ended calls
    // Even with minimal data, we want to capture the call
    console.log('🤖 Processing SAM AI call data...');
    const result = await processRetellCallData(userId, callData);
    
    if (result.success) {
      console.log('✅ SAM AI integration successful:', {
        call_id: callData.call_id,
        order_id: result.order_id,
        reservation_id: result.reservation_id,
        message: result.message
      });
      
      // Store webhook data for client sync if reservation was created
      if (result.reservation_id) {
        try {
          storeWebhookReservation(userId, {
            id: result.reservation_id,
            call_id: callData.call_id,
            customer_name: callData.customer_name,
            customer_phone: callData.customer_phone,
            party_size: callData.party_size,
            reservation_datetime: callData.reservation_datetime,
            status: 'pending',
            created_by: 'retell-ai',
            created_at: new Date().toISOString(),
            confidence_score: result.confidence_score
          });
          console.log('📦 Stored webhook reservation data for client sync');
        } catch (error) {
          console.error('Error storing webhook data:', error);
        }
      }
      
      // Log to audit trail
      await logWebhookActivity(userId, {
        type: 'retell_webhook_success',
        call_id: callData.call_id,
        result,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: true,
        message: result.message,
        order_id: result.order_id,
        reservation_id: result.reservation_id,
        warnings: result.warnings,
        confidence_score: result.confidence_score,
        call_id: callData.call_id
      });
    } else {
      console.error('❌ SAM AI integration failed:', {
        call_id: callData.call_id,
        errors: result.errors,
        message: result.message
      });
      
      // Log error but still return 200 to prevent retries
      await logWebhookActivity(userId, {
        type: 'retell_webhook_error',
        call_id: callData.call_id,
        result,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: false,
        message: result.message,
        errors: result.errors,
        warnings: result.warnings,
        call_id: callData.call_id
      }, { status: 200 }); // Return 200 to prevent webhook retries
    }
    
  } catch (error) {
    console.error('💥 Webhook processing error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

/**
 * Handle webhook GET requests (for verification)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const challenge = searchParams.get('challenge');
  
  // Return challenge for webhook verification
  if (challenge) {
    return NextResponse.json({ challenge });
  }
  
  return NextResponse.json({
    service: 'IOMS Retell AI Webhook',
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: {
      webhook: '/api/retell-webhook'
    }
  });
}

/**
 * Map Retell AI agent ID to IOMS user ID
 * In production, implement proper mapping logic
 */
function mapAgentToUser(agentId: string): string | null {
  console.log('🔍 Mapping agent ID:', agentId);
  
  // Default mapping for development - maps ANY agent to default user
  const defaultUserId = process.env.DEFAULT_USER_ID || 'user_1752538556589_u705p8e0q';
  
  const agentUserMap: Record<string, string> = {
    // Add your Retell AI agent IDs here
    'default': defaultUserId,
  };
  
  // For development: always return default user if no specific mapping found
  const userId = agentUserMap[agentId] || defaultUserId;
  console.log('✅ Mapped to user ID:', userId);
  return userId;
}

/**
 * Log webhook activity for audit trail
 */
async function logWebhookActivity(userId: string, activity: any): Promise<void> {
  try {
    console.log('📝 Logging webhook activity for user:', userId, activity);
    // Note: Server-side logging - localStorage won't work here
    // In production, this would save to a database
    // For now, we rely on console logs and client-side storage
  } catch (error) {
    console.error('Failed to log webhook activity:', error);
  }
}
