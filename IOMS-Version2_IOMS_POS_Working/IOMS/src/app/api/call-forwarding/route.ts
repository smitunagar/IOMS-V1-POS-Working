/**
 * 📞 Call Forwarding Configuration API
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return call forwarding configuration and instructions
    const config = {
      supportedMethods: [
        {
          type: 'landline',
          name: 'Traditional Landline',
          instructions: [
            'Pick up your phone and listen for dial tone',
            'Dial *72 (or *21 in some regions)',
            'Wait for second dial tone',
            'Dial the forwarding number (staff phone)',
            'Wait for confirmation tone or message'
          ],
          cost: 'Usually free, check with provider',
          notes: 'Most reliable method for consistent forwarding'
        },
        {
          type: 'cellular',
          name: 'Cell Phone',
          instructions: [
            'Open Phone Settings',
            'Look for "Call Forwarding" or "Call Settings"',
            'Select "Forward when unreachable" or "Always forward"',
            'Enter the staff phone number',
            'Save the settings'
          ],
          cost: 'May incur forwarding charges',
          notes: 'Good for mobile-first restaurants'
        },
        {
          type: 'voip',
          name: 'VoIP System (Vonage, RingCentral, etc.)',
          instructions: [
            'Log into your VoIP provider portal',
            'Go to Phone Settings or Call Routing',
            'Set up call forwarding rules',
            'Add staff phone as destination',
            'Test the forwarding'
          ],
          cost: 'Usually included in plan',
          notes: 'Most flexible option with advanced features'
        },
        {
          type: 'pbx',
          name: 'Business Phone System (PBX)',
          instructions: [
            'Access your PBX admin panel',
            'Navigate to Call Routing/Forwarding',
            'Create forwarding rule for main line',
            'Set destination to staff extension or external number',
            'Apply and test configuration'
          ],
          cost: 'No additional cost',
          notes: 'Contact your IT department for assistance'
        }
      ],
      
      staffSetup: {
        requirements: [
          'Staff phone capable of receiving calls',
          'Access to this IOMS interface on computer/tablet',
          'Stable internet connection for AI assistance',
          'Basic training on the call interface'
        ],
        
        workflow: [
          'Restaurant phone rings → forwards to staff phone',
          'Staff answers call on their phone',
          'Staff opens IOMS Call Forwarding interface',
          'Staff types customer requests into interface',
          'AI provides intelligent responses and suggestions',
          'Staff follows AI guidance or transfers if needed',
          'Call details automatically logged in system'
        ]
      },
      
      testingProcedure: [
        'Set up call forwarding to your test phone',
        'Call your restaurant number from another phone',
        'Verify the call forwards to staff phone',
        'Answer the call and open IOMS interface',
        'Test AI assistance with sample customer requests',
        'Confirm reservations/orders are created in IOMS'
      ]
    };

    return NextResponse.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error fetching call forwarding config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      forwardingMethod, 
      staffPhone, 
      restaurantPhone, 
      isActive,
      notes 
    } = body;

    // In a real implementation, this would:
    // 1. Store the configuration in database
    // 2. Possibly integrate with phone system APIs
    // 3. Send setup instructions to staff
    
    const configuration = {
      id: `forward_${Date.now()}`,
      forwardingMethod,
      restaurantPhone,
      staffPhone,
      isActive: isActive ?? true,
      notes: notes || '',
      createdAt: new Date(),
      status: 'configured'
    };

    // Mock saving configuration
    console.log('Call forwarding configuration saved:', configuration);

    return NextResponse.json({
      success: true,
      message: 'Call forwarding configured successfully',
      configuration,
      nextSteps: [
        'Test the forwarding by calling your restaurant number',
        'Ensure staff phone receives the forwarded call',
        'Train staff on using the IOMS call interface',
        'Monitor call quality and adjust if needed'
      ]
    });
  } catch (error) {
    console.error('Error configuring call forwarding:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to configure call forwarding' },
      { status: 500 }
    );
  }
}
