import { NextRequest, NextResponse } from 'next/server';
import { ProcurementWorkflowService } from '@/lib/procurementWorkflowService';

const workflowService = new ProcurementWorkflowService();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    
    const approvals = await workflowService.getOwnerApprovals(status || undefined);
    
    return NextResponse.json({
      success: true,
      data: approvals
    });
  } catch (error) {
    console.error('Error fetching approvals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch approvals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { approvalId, action, notes } = body;
    
    if (!approvalId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    let result;
    
    switch (action) {
      case 'approve':
        result = await workflowService.approveOwnerRequest(approvalId, notes);
        break;
      case 'reject':
        result = await workflowService.rejectOwnerRequest(approvalId, notes);
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
    console.error('Error processing approval:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process approval' },
      { status: 500 }
    );
  }
}
