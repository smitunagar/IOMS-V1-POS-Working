import { NextRequest, NextResponse } from 'next/server';
import { 
  searchAvailableNumbers,
  provisionPhoneNumber
} from '@/lib/phoneSystemService';

// ==========================================
// PHONE NUMBER PROVISIONING API
// ==========================================

// Search for available phone numbers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const areaCode = searchParams.get('areaCode') || undefined;
    const country = searchParams.get('country') || 'US';
    const state = searchParams.get('state') || undefined;
    const city = searchParams.get('city') || undefined;
    const pattern = searchParams.get('pattern') || undefined;
    const quantity = parseInt(searchParams.get('quantity') || '10');
    const type = (searchParams.get('type') || 'local') as 'local' | 'toll-free' | 'mobile';

    const availableNumbers = await searchAvailableNumbers({
      areaCode,
      country,
      state,
      city,
      pattern,
      quantity,
      type
    });

    return NextResponse.json({ numbers: availableNumbers });

  } catch (error) {
    console.error('Error searching available numbers:', error);
    return NextResponse.json(
      { error: 'Failed to search available numbers' },
      { status: 500 }
    );
  }
}

// Provision a phone number
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      phoneNumber,
      department,
      displayName,
      enableAI,
      forwardToNumber
    } = body;

    // Validate required fields
    if (!phoneNumber || !department || !displayName) {
      return NextResponse.json(
        { error: 'Phone number, department, and display name are required' },
        { status: 400 }
      );
    }

    const provisionedNumber = await provisionPhoneNumber(phoneNumber, {
      department,
      displayName,
      enableAI: enableAI ?? true,
      forwardToNumber
    });

    return NextResponse.json({ phoneNumber: provisionedNumber });

  } catch (error) {
    console.error('Error provisioning phone number:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to provision phone number' },
      { status: 500 }
    );
  }
}
