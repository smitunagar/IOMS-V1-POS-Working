import { NextRequest, NextResponse } from 'next/server';
import { extractOrderFromText } from '@/ai/flows/extract-order-from-text';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript } = body;
    
    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }
    
    console.log('[AI Extract Order] Processing transcript:', transcript);
    
    const result = await extractOrderFromText({ transcript });
    
    console.log('[AI Extract Order] Extraction result:', result);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('[AI Extract Order] Error:', error);
    
    // Return fallback empty result
    return NextResponse.json({
      orderType: 'dine-in',
      items: [],
      customerName: undefined,
      customerPhone: undefined,
      customerAddress: undefined,
      notes: undefined,
      confidenceScore: 0
    });
  }
}
