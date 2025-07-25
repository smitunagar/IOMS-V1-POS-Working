import { NextRequest, NextResponse } from 'next/server';
import { ProcurementWorkflowService } from '@/lib/procurementWorkflowService';

const workflowService = new ProcurementWorkflowService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, productId, urgencyLevel } = body;
    
    switch (action) {
      case 'check_thresholds':
        // Check all products against 15-day threshold
        const triggeredWorkflows = await workflowService.checkInventoryThresholds();
        return NextResponse.json({
          success: true,
          data: {
            message: `Triggered ${triggeredWorkflows.length} procurement workflows`,
            workflows: triggeredWorkflows
          }
        });
        
      case 'manual_trigger':
        if (!productId) {
          return NextResponse.json(
            { success: false, error: 'Product ID is required for manual trigger' },
            { status: 400 }
          );
        }
        
        const workflow = await workflowService.triggerManualProcurement(productId, urgencyLevel || 'medium');
        return NextResponse.json({
          success: true,
          data: workflow
        });
        
      case 'send_quotation_emails':
        // Send pending quotation requests to vendors
        const emailResults = await workflowService.sendQuotationEmails();
        return NextResponse.json({
          success: true,
          data: {
            message: `Sent ${emailResults.sent} quotation emails`,
            results: emailResults
          }
        });
        
      case 'process_vendor_responses':
        // Process incoming vendor responses and create owner approvals
        const responses = await workflowService.processVendorResponses();
        return NextResponse.json({
          success: true,
          data: {
            message: `Processed ${responses.length} vendor responses`,
            responses
          }
        });
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in workflow automation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute workflow automation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    
    switch (action) {
      case 'status':
        // Get overall workflow status
        const status = await workflowService.getWorkflowStatus();
        return NextResponse.json({
          success: true,
          data: status
        });
        
      case 'metrics':
        // Get procurement metrics
        const metrics = await workflowService.getProcurementMetrics();
        return NextResponse.json({
          success: true,
          data: metrics
        });
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching workflow data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workflow data' },
      { status: 500 }
    );
  }
}
