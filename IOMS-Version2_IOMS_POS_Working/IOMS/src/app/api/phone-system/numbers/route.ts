/**
 * 📞 Real Phone Numbers API - Twilio integration for actual phone management
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  addPhoneNumber, 
  getPhoneNumbers, 
  updatePhoneNumber, 
  deletePhoneNumber,
  validatePhoneNumber as validatePhoneFormat,
  initializeSampleData 
} from '@/lib/simplePhoneService';
import {
  isTwilioConfigured,
  searchAvailableNumbers,
  purchasePhoneNumber,
  getTwilioPhoneNumbers,
  releasePhoneNumber,
  getWebhookUrls
} from '@/lib/twilioPhoneService';

async function handleSearchNumbers(request: NextRequest) {
  if (!isTwilioConfigured()) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Twilio not configured. Please add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and NEXT_PUBLIC_BASE_URL to your environment variables.',
        requiresSetup: true
      },
      { status: 400 }
    );
  }

  try {
    const url = new URL(request.url);
    const areaCode = url.searchParams.get('areaCode') || undefined;
    const contains = url.searchParams.get('contains') || undefined;
    const nearNumber = url.searchParams.get('nearNumber') || undefined;

    const availableNumbers = await searchAvailableNumbers(areaCode, contains, nearNumber);
    
    return NextResponse.json({
      success: true,
      availableNumbers,
      total: availableNumbers.length
    });
  } catch (error) {
    console.error('Error searching numbers:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to search numbers' },
      { status: 500 }
    );
  }
}

async function handleTwilioStatus() {
  const configured = isTwilioConfigured();
  const webhookUrls = configured ? getWebhookUrls() : null;
  
  return NextResponse.json({
    success: true,
    twilio: {
      configured,
      webhookUrls,
      accountSid: process.env.TWILIO_ACCOUNT_SID ? `***${process.env.TWILIO_ACCOUNT_SID.slice(-4)}` : null,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL
    }
  });
}

function handleGetLocalNumbers() {
  initializeSampleData();
  const phoneNumbers = getPhoneNumbers();
  
  return NextResponse.json({
    success: true,
    phoneNumbers,
    total: phoneNumbers.length
  });
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    switch (action) {
      case 'search':
        return handleSearchNumbers(request);
      case 'twilio-status':
        return handleTwilioStatus();
      default:
        return handleGetLocalNumbers();
    }
  } catch (error) {
    console.error('Error in phone numbers GET:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

async function handlePurchaseNumber(body: any) {
  const { phoneNumber, displayName, department } = body;

  if (!phoneNumber || !displayName || !department) {
    return NextResponse.json(
      { success: false, error: 'Phone number, display name, and department are required' },
      { status: 400 }
    );
  }

  if (!isTwilioConfigured()) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Twilio not configured. Please add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and NEXT_PUBLIC_BASE_URL to your environment variables.',
        requiresSetup: true
      },
      { status: 400 }
    );
  }

  try {
    const twilioNumber = await purchasePhoneNumber(phoneNumber, displayName, department);
    
    const localNumber = {
      number: twilioNumber.phoneNumber,
      displayName: displayName,
      department: department as 'main' | 'orders' | 'reservations',
      businessHours: {
        enabled: true,
        schedule: {
          monday: { open: '09:00', close: '22:00', isOpen: true },
          tuesday: { open: '09:00', close: '22:00', isOpen: true },
          wednesday: { open: '09:00', close: '22:00', isOpen: true },
          thursday: { open: '09:00', close: '22:00', isOpen: true },
          friday: { open: '09:00', close: '22:00', isOpen: true },
          saturday: { open: '09:00', close: '22:00', isOpen: true },
          sunday: { open: '09:00', close: '22:00', isOpen: true },
        }
      },
      twilioSid: twilioNumber.sid
    };

    const newNumber = addPhoneNumber(localNumber);
    
    return NextResponse.json({
      success: true,
      phoneNumber: newNumber,
      twilioNumber,
      message: 'Phone number purchased and configured successfully'
    });
  } catch (error) {
    console.error('Error purchasing number:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to purchase number' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, number, displayName, department, businessHours } = body;

    if (action === 'purchase') {
      return handlePurchaseNumber(body);
    }

    // Default: Add local number
    if (!number || !displayName || !department) {
      return NextResponse.json(
        { success: false, error: 'Number, display name, and department are required' },
        { status: 400 }
      );
    }

    const validation = validatePhoneFormat(number);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.errors?.join(', ') || 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const phoneNumberData = {
      number: validation.formatted || number,
      displayName,
      department: department as 'main' | 'orders' | 'reservations',
      businessHours: businessHours || {
        enabled: true,
        schedule: {
          monday: { open: '09:00', close: '22:00', isOpen: true },
          tuesday: { open: '09:00', close: '22:00', isOpen: true },
          wednesday: { open: '09:00', close: '22:00', isOpen: true },
          thursday: { open: '09:00', close: '22:00', isOpen: true },
          friday: { open: '09:00', close: '22:00', isOpen: true },
          saturday: { open: '09:00', close: '22:00', isOpen: true },
          sunday: { open: '09:00', close: '22:00', isOpen: true },
        }
      }
    };

    const newNumber = addPhoneNumber(phoneNumberData);
    
    return NextResponse.json({
      success: true,
      phoneNumber: newNumber,
      message: 'Phone number added successfully'
    });
  } catch (error) {
    console.error('Error in phone numbers POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add phone number' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Phone number ID is required' },
        { status: 400 }
      );
    }

    const updatedNumber = updatePhoneNumber(id, updates);
    
    return NextResponse.json({
      success: true,
      phoneNumber: updatedNumber,
      message: 'Phone number updated successfully'
    });
  } catch (error) {
    console.error('Error updating phone number:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update phone number' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Phone number ID is required' },
        { status: 400 }
      );
    }

    const phoneNumbers = getPhoneNumbers();
    const phoneNumber = phoneNumbers.find(p => p.id === id);
    
    if (phoneNumber && (phoneNumber as any).twilioSid) {
      if (isTwilioConfigured()) {
        try {
          await releasePhoneNumber((phoneNumber as any).twilioSid);
        } catch (error) {
          console.error('Error releasing Twilio number:', error);
        }
      }
    }

    const deleted = deletePhoneNumber(id);
    
    return NextResponse.json({
      success: true,
      message: 'Phone number deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting phone number:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete phone number' },
      { status: 500 }
    );
  }
}
