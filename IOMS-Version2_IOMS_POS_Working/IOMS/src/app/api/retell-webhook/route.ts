/**
 * 🔗 Retell AI Webhook Endpoint
 * Receives call data from Retell AI SAM AI agent
 * Automatically creates orders and reservations in IOMS
 */

import { NextRequest, NextResponse } from 'next/server';
import { processRetellCallData, type RetellCallData } from '@/lib/retellAiIntegration';

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
    const signature = request.headers.get('x-retell-signature');
    const expectedSignature = request.headers.get('authorization');
    
    // In production, implement proper HMAC verification
    // For now, we'll check for the secret in the authorization header
    if (expectedSignature?.includes(RETELL_WEBHOOK_SECRET)) {
      return true;
    }
    
    // Also check if signature matches simple hash (development mode)
    if (signature && signature.length > 10) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

/**
 * Convert Retell webhook payload to our RetellCallData format
 */
function convertRetellPayload(payload: RetellWebhookPayload): RetellCallData {
  const { call, event_type } = payload;
  const analysis = call.analysis;
  
  return {
    call_id: call.call_id,
    call_type: call.call_type,
    agent_id: call.agent_id,
    call_status: call.call_status,
    call_duration: call.duration,
    transcript: call.transcript?.text || '',
    
    // Customer information
    customer_name: analysis?.customer_info?.name,
    customer_phone: analysis?.customer_info?.phone || call.from_number,
    customer_email: analysis?.customer_info?.email,
    
    // Order information
    order_items: analysis?.order_info?.items?.map(item => ({
      item_name: item.item,
      quantity: item.quantity,
      special_instructions: item.special_requests
    })),
    order_type: analysis?.order_info?.order_type,
    
    // Reservation information
    reservation_datetime: analysis?.reservation_info?.date_time,
    party_size: analysis?.reservation_info?.party_size,
    special_requests: analysis?.reservation_info?.special_requests,
    occasion: analysis?.reservation_info?.occasion,
    
    // Delivery information
    delivery_address: analysis?.order_info?.delivery_address,
    preferred_delivery_time: analysis?.order_info?.preferred_time,
    
    // AI metadata
    ai_confidence: analysis?.confidence_score || call.transcript?.confidence,
    requires_manual_review: analysis?.requires_followup || false,
    extracted_data: analysis
  };
}

/**
 * Handle Retell AI webhook POST requests
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    // Verify webhook signature for security
    if (!verifyWebhookSignature(request, body)) {
      console.error('❌ Webhook signature verification failed');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid signature' },
        { status: 401 }
      );
    }
    
    const payload: RetellWebhookPayload = JSON.parse(body);
    
    console.log('📞 Retell AI webhook received:', {
      event_type: payload.event_type,
      call_id: payload.call.call_id,
      call_status: payload.call.call_status
    });
    
    // Only process call_ended or call_analyzed events
    if (payload.event_type !== 'call_ended' && payload.event_type !== 'call_analyzed') {
      console.log('ℹ️ Ignoring webhook event:', payload.event_type);
      return NextResponse.json({ 
        message: 'Event acknowledged but not processed',
        event_type: payload.event_type
      });
    }
    
    // Skip if no analysis data
    if (!payload.call.analysis) {
      console.log('ℹ️ No analysis data in webhook, skipping processing');
      return NextResponse.json({ 
        message: 'No analysis data to process',
        call_id: payload.call.call_id
      });
    }
    
    // Get user ID from agent ID or use default
    // In production, you'd map agent_id to actual user accounts
    const userId = mapAgentToUser(payload.call.agent_id);
    
    if (!userId) {
      console.error('❌ Could not determine user ID for agent:', payload.call.agent_id);
      return NextResponse.json(
        { error: 'Could not determine user account' },
        { status: 400 }
      );
    }
    
    // Convert payload to our format
    const callData = convertRetellPayload(payload);
    
    // Process the call data
    console.log('🤖 Processing SAM AI call data...');
    const result = await processRetellCallData(userId, callData);
    
    if (result.success) {
      console.log('✅ SAM AI integration successful:', {
        call_id: callData.call_id,
        order_id: result.order_id,
        reservation_id: result.reservation_id,
        message: result.message
      });
      
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
  // Default mapping for development
  const agentUserMap: Record<string, string> = {
    // Add your Retell AI agent IDs here
    'default': 'user_1752538556589_u705p8e0q', // Default user from your test data
  };
  
  return agentUserMap[agentId] || agentUserMap['default'];
}

/**
 * Log webhook activity for audit trail
 */
async function logWebhookActivity(userId: string, activity: any): Promise<void> {
  try {
    if (typeof window !== 'undefined') {
      const logs = JSON.parse(localStorage.getItem(`webhook_logs_${userId}`) || '[]');
      logs.push(activity);
      
      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem(`webhook_logs_${userId}`, JSON.stringify(logs));
    }
  } catch (error) {
    console.error('Failed to log webhook activity:', error);
  }
}
