/**
 * 📞 Voice Settings API - Configure AI voice behavior for phone numbers
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getVoiceSettings, 
  updateVoiceSettings,
  initializeSampleData 
} from '@/lib/phoneSystemService';

export async function GET(request: NextRequest) {
  try {
    // Initialize sample data if needed
    initializeSampleData();
    
    const { searchParams } = new URL(request.url);
    const phoneNumberId = searchParams.get('phoneNumberId');

    if (!phoneNumberId) {
      return NextResponse.json(
        { success: false, error: 'Phone number ID is required' },
        { status: 400 }
      );
    }

    const voiceSettings = getVoiceSettings(phoneNumberId);
    
    if (!voiceSettings) {
      return NextResponse.json(
        { success: false, error: 'Voice settings not found for this phone number' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      voiceSettings
    });
  } catch (error) {
    console.error('Error fetching voice settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch voice settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumberId, ...updates } = body;

    if (!phoneNumberId) {
      return NextResponse.json(
        { success: false, error: 'Phone number ID is required' },
        { status: 400 }
      );
    }

    // Validate voice settings
    if (updates.speechRate && (updates.speechRate < 0.1 || updates.speechRate > 2.0)) {
      return NextResponse.json(
        { success: false, error: 'Speech rate must be between 0.1 and 2.0' },
        { status: 400 }
      );
    }

    if (updates.volume && (updates.volume < 0 || updates.volume > 1.0)) {
      return NextResponse.json(
        { success: false, error: 'Volume must be between 0 and 1.0' },
        { status: 400 }
      );
    }

    if (updates.maxCallDuration && (updates.maxCallDuration < 1 || updates.maxCallDuration > 60)) {
      return NextResponse.json(
        { success: false, error: 'Max call duration must be between 1 and 60 minutes' },
        { status: 400 }
      );
    }

    const updatedSettings = updateVoiceSettings(phoneNumberId, updates);
    
    if (!updatedSettings) {
      return NextResponse.json(
        { success: false, error: 'Voice settings not found for this phone number' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Voice settings updated successfully',
      voiceSettings: updatedSettings
    });
  } catch (error) {
    console.error('Error updating voice settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update voice settings' },
      { status: 500 }
    );
  }
}
