/**
 * Test Suite for Enhanced SupplySync Agent Features
 * Tests all backend connectivity and functional implementations
 */

const testApiEndpoint = async (url, data, description) => {
  console.log(`\n🧪 Testing: ${description}`);
  console.log(`📍 URL: ${url}`);
  console.log(`📦 Data:`, JSON.stringify(data, null, 2));
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`✅ SUCCESS: ${description}`);
      console.log(`📊 Response:`, JSON.stringify(result, null, 2));
    } else {
      console.log(`❌ FAILED: ${description}`);
      console.log(`📊 Error:`, result);
    }
    
    return result;
  } catch (error) {
    console.log(`💥 NETWORK ERROR: ${description}`);
    console.log(`📊 Error:`, error.message);
    return { success: false, error: error.message };
  }
};

const runSupplySyncTests = async () => {
  console.log('🚀 Starting SupplySync Agent Feature Tests\n');
  console.log('=' * 50);
  
  const baseUrl = 'http://localhost:3000/api/supply-sync';
  
  // Test 1: Vendor Comparison
  await testApiEndpoint(
    `${baseUrl}/vendor-comparison`,
    {
      itemName: 'Fresh Chicken',
      quantity: 50,
      urgencyLevel: 'medium',
      qualityRequirements: ['fresh', 'local', 'organic']
    },
    'Vendor Comparison for Fresh Chicken'
  );
  
  // Test 2: Schedule Order
  await testApiEndpoint(
    `${baseUrl}/schedule-order`,
    {
      itemName: 'Basmati Rice',
      currentStock: 5,
      dailyUsage: 2.5,
      leadTime: 3,
      confidence: 0.85
    },
    'Schedule Order for Basmati Rice'
  );
  
  // Test 3: Generate Purchase Order
  await testApiEndpoint(
    `${baseUrl}/purchase-orders`,
    {
      itemName: 'Fresh Chicken',
      quantity: 50,
      vendorId: 'v1',
      urgencyLevel: 'medium',
      estimatedCost: 425.00,
      reason: 'Forecast-based replenishment',
      scheduledDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    'Generate Purchase Order from Forecast'
  );
  
  // Test 4: Request Quotations
  await testApiEndpoint(
    `${baseUrl}/quotations`,
    {
      itemName: 'Garam Masala',
      quantity: 10,
      urgencyLevel: 'low',
      specifications: 'Premium quality, authentic blend',
      requiredDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    },
    'Request Quotations for Garam Masala'
  );
  
  // Test 5: Approval Workflow
  await testApiEndpoint(
    `${baseUrl}/approvals`,
    {
      quotationResponseId: 'qr_12345_r1',
      itemName: 'Olive Oil',
      quantity: 20,
      vendorName: 'Bavaria Premium Foods',
      totalCost: 300.00,
      urgencyLevel: 'high'
    },
    'Approval Workflow for Olive Oil Purchase'
  );
  
  console.log('\n' + '=' * 50);
  console.log('🎯 SupplySync Agent Feature Tests Complete');
  console.log('📋 Please review results above for any failures');
  console.log('🔧 If any tests fail, check the corresponding API endpoints');
};

// Browser-compatible test runner
if (typeof window !== 'undefined') {
  // Running in browser
  window.testSupplySyncFeatures = runSupplySyncTests;
  console.log('📱 Browser test runner loaded. Call window.testSupplySyncFeatures() to run tests.');
} else {
  // Running in Node.js
  runSupplySyncTests().then(() => {
    console.log('✨ All tests completed');
  }).catch(error => {
    console.error('💥 Test runner failed:', error);
  });
}

/**
 * Individual Feature Test Functions
 * Can be called separately for targeted testing
 */

const testVendorComparison = async () => {
  console.log('🏪 Testing Vendor Comparison Feature...');
  
  const testCases = [
    {
      itemName: 'Fresh Chicken',
      quantity: 50,
      urgencyLevel: 'medium',
      qualityRequirements: ['fresh', 'local']
    },
    {
      itemName: 'Basmati Rice',
      quantity: 100,
      urgencyLevel: 'low',
      qualityRequirements: ['premium', 'aged']
    }
  ];
  
  for (const testCase of testCases) {
    await testApiEndpoint(
      'http://localhost:3000/api/supply-sync/vendor-comparison',
      testCase,
      `Vendor Comparison: ${testCase.itemName}`
    );
  }
};

const testOrderScheduling = async () => {
  console.log('📅 Testing Order Scheduling Feature...');
  
  const testCases = [
    {
      itemName: 'Fresh Tomatoes',
      currentStock: 8,
      dailyUsage: 3.2,
      leadTime: 2,
      confidence: 0.9
    },
    {
      itemName: 'Olive Oil',
      currentStock: 2,
      dailyUsage: 0.8,
      leadTime: 5,
      confidence: 0.75
    }
  ];
  
  for (const testCase of testCases) {
    await testApiEndpoint(
      'http://localhost:3000/api/supply-sync/schedule-order',
      testCase,
      `Order Scheduling: ${testCase.itemName}`
    );
  }
};

const testPurchaseOrderGeneration = async () => {
  console.log('📝 Testing Purchase Order Generation...');
  
  const testCases = [
    {
      itemName: 'Fresh Chicken',
      quantity: 50,
      vendorId: 'v1',
      urgencyLevel: 'medium',
      estimatedCost: 425.00,
      reason: 'Regular supply replenishment'
    },
    {
      itemName: 'Garam Masala',
      quantity: 5,
      vendorId: 'v4',
      urgencyLevel: 'low',
      estimatedCost: 125.00,
      reason: 'Spice inventory restocking'
    }
  ];
  
  for (const testCase of testCases) {
    await testApiEndpoint(
      'http://localhost:3000/api/supply-sync/purchase-orders',
      testCase,
      `PO Generation: ${testCase.itemName}`
    );
  }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runSupplySyncTests,
    testVendorComparison,
    testOrderScheduling,
    testPurchaseOrderGeneration,
    testApiEndpoint
  };
}
