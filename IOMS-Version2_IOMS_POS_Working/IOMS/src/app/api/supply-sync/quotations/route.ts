import { NextRequest, NextResponse } from 'next/server';
import { ProcurementWorkflowService } from '@/lib/procurementWorkflowService';

const workflowService = new ProcurementWorkflowService();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    
    const quotations = await workflowService.getQuotationRequests(status || undefined);
    
    return NextResponse.json({
      success: true,
      data: quotations
    });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quotations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productName, quantity, unit, urgencyLevel, specifications } = body;
    
    if (!productName || !quantity || !unit) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const quotationRequest = await workflowService.createQuotationRequest(
      productName,
      quantity,
      unit,
      urgencyLevel,
      specifications
    );
    
    return NextResponse.json({
      success: true,
      data: quotationRequest
    });
  } catch (error) {
    console.error('Error creating quotation request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create quotation request' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { quotationId, vendorId, action } = body;
    
    if (!quotationId || !vendorId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    let result;
    
    switch (action) {
      case 'select_vendor':
        result = await workflowService.selectVendorForQuotation(quotationId, vendorId);
        break;
      case 'reject_vendor':
        result = await workflowService.rejectVendorQuotation(quotationId, vendorId);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error updating quotation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update quotation' },
      { status: 500 }
    );
  }
}
