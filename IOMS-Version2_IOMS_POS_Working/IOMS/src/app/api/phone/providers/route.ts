import { NextRequest, NextResponse } from 'next/server';
import { 
  addVoIPProvider,
  getVoIPProviders,
  updateVoIPProvider,
  deleteVoIPProvider,
  searchAvailableNumbers,
  provisionPhoneNumber
} from '@/lib/phoneSystemService';

// ==========================================
// VOIP PROVIDERS API
// ==========================================

export async function GET(request: NextRequest) {
  try {
    const providers = getVoIPProviders();
    return NextResponse.json({ providers });
  } catch (error) {
    console.error('Error fetching VoIP providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch VoIP providers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      type,
      credentials,
      webhookUrls,
      settings
    } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    // Generate webhook URLs if not provided
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.com';
    const defaultWebhookUrls = {
      incomingCall: `${baseUrl}/api/phone/webhooks/${type}`,
      callStatus: `${baseUrl}/api/phone/webhooks/${type}/status`,
      recording: `${baseUrl}/api/phone/webhooks/${type}/recording`,
      ...webhookUrls
    };

    const defaultSettings = {
      recordCalls: true,
      transcribeVoice: true,
      enableAI: true,
      maxCallDuration: 1800, // 30 minutes
      ...settings
    };

    const provider = addVoIPProvider({
      name,
      type,
      isActive: false, // Start inactive until configured
      credentials: credentials || {},
      webhookUrls: defaultWebhookUrls,
      settings: defaultSettings
    });

    return NextResponse.json({ provider });

  } catch (error) {
    console.error('Error creating VoIP provider:', error);
    return NextResponse.json(
      { error: 'Failed to create VoIP provider' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    const provider = updateVoIPProvider(id, updates);
    
    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ provider });

  } catch (error) {
    console.error('Error updating VoIP provider:', error);
    return NextResponse.json(
      { error: 'Failed to update VoIP provider' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    const success = deleteVoIPProvider(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting VoIP provider:', error);
    return NextResponse.json(
      { error: 'Failed to delete VoIP provider' },
      { status: 500 }
    );
  }
}
