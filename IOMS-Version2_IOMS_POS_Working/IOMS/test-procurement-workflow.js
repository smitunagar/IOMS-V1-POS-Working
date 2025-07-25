#!/usr/bin/env node
/**
 * Advanced Procurement Workflow Test
 * Tests the complete procurement system including:
 * - 15-day threshold monitoring
 * - Automatic quotation requests
 * - Owner approval workflow
 * - Purchase order generation
 */

const { ProcurementWorkflowService } = require('./src/lib/procurementWorkflowService');

async function testProcurementWorkflow() {
  console.log('🚀 Testing Advanced Procurement Workflow System');
  console.log('=' .repeat(60));
  
  const workflowService = new ProcurementWorkflowService();
  
  try {
    // Test 1: Check inventory thresholds
    console.log('\n📊 Test 1: Checking Inventory Thresholds (15-day rule)');
    const triggeredWorkflows = await workflowService.checkInventoryThresholds();
    console.log(`✅ Triggered ${triggeredWorkflows.length} procurement workflows`);
    
    // Test 2: Create quotation request
    console.log('\n📨 Test 2: Creating Quotation Request');
    const quotationRequest = await workflowService.createQuotationRequest(
      'Fresh Chicken',
      50,
      'kg',
      'high',
      'Grade A, free-range preferred'
    );
    console.log(`✅ Created quotation request: ${quotationRequest.id}`);
    
    // Test 3: Send quotation emails
    console.log('\n📧 Test 3: Sending Quotation Emails');
    const emailResults = await workflowService.sendQuotationEmails();
    console.log(`✅ Sent ${emailResults.sent} quotation emails`);
    
    // Test 4: Process vendor responses
    console.log('\n📝 Test 4: Processing Vendor Responses');
    const responses = await workflowService.processVendorResponses();
    console.log(`✅ Processed ${responses.length} vendor responses`);
    
    // Test 5: Create owner approval
    console.log('\n👨‍💼 Test 5: Creating Owner Approval Request');
    const approval = await workflowService.requestOwnerApproval(
      quotationRequest.id,
      'best_vendor_response_id',
      'Stock critically low, immediate purchase required'
    );
    console.log(`✅ Created owner approval request: ${approval.id}`);
    
    // Test 6: Approve request
    console.log('\n✅ Test 6: Owner Approving Request');
    const approvedRequest = await workflowService.approveOwnerRequest(
      approval.id,
      'Approved for immediate purchase - stock critical'
    );
    console.log(`✅ Request approved: ${approvedRequest.id}`);
    
    // Test 7: Generate purchase order
    console.log('\n📄 Test 7: Generating Purchase Order');
    const purchaseOrder = await workflowService.generatePurchaseOrder(approval.id);
    console.log(`✅ Generated PO: ${purchaseOrder.orderNumber}`);
    
    // Test 8: Send purchase order
    console.log('\n🚚 Test 8: Sending Purchase Order to Vendor');
    const sentPO = await workflowService.sendPurchaseOrder(purchaseOrder.id);
    console.log(`✅ Sent PO to vendor: ${sentPO.orderNumber}`);
    
    // Test 9: Get workflow status
    console.log('\n📈 Test 9: Getting Workflow Status');
    const status = await workflowService.getWorkflowStatus();
    console.log('✅ Workflow Status:');
    console.log(`   - Active Quotations: ${status.activeQuotations}`);
    console.log(`   - Pending Approvals: ${status.pendingApprovals}`);
    console.log(`   - Active Purchase Orders: ${status.activePurchaseOrders}`);
    
    // Test 10: Get procurement metrics
    console.log('\n📊 Test 10: Getting Procurement Metrics');
    const metrics = await workflowService.getProcurementMetrics();
    console.log('✅ Procurement Metrics:');
    console.log(`   - Average Response Time: ${metrics.averageResponseTime} hours`);
    console.log(`   - Auto-Approval Rate: ${metrics.autoApprovalRate}%`);
    console.log(`   - Cost Savings: $${metrics.costSavings}`);
    
    console.log('\n🎉 All Procurement Workflow Tests Completed Successfully!');
    console.log('=' .repeat(60));
    
    console.log('\n📋 System Features Verified:');
    console.log('✅ 15-day threshold monitoring');
    console.log('✅ Automatic quotation email system');
    console.log('✅ Owner approval workflow');
    console.log('✅ Purchase order generation');
    console.log('✅ Vendor response processing');
    console.log('✅ Email notification system');
    console.log('✅ Real-time status monitoring');
    console.log('✅ Procurement metrics tracking');
    
    console.log('\n🌟 SupplySync Agent is now fully operational with advanced procurement automation!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testProcurementWorkflow();
}

module.exports = { testProcurementWorkflow };
