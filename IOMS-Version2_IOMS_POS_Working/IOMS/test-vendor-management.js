// Test Vendor Management API Endpoints
console.log('🧪 Testing Vendor Management API...\n');

const baseUrl = 'http://localhost:3000/api/vendors';

const testVendorAPI = async () => {
  console.log('📡 Testing GET /api/vendors');
  
  // Test fetching all vendors
  try {
    const response = await fetch(baseUrl);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ GET vendors successful');
      console.log(`📊 Found ${result.total} vendors`);
    } else {
      console.log('❌ GET vendors failed:', result.error);
    }
  } catch (error) {
    console.log('💥 Network error:', error.message);
  }

  console.log('\n📡 Testing POST /api/vendors (Add new vendor)');
  
  // Test adding a new vendor
  const newVendor = {
    name: 'Test Vendor Ltd.',
    category: 'Fresh Produce',
    contactInfo: {
      email: 'test@vendor.com',
      phone: '+49-123-456789',
      address: 'Test Street 123, Test City, Germany'
    },
    products: ['Test Product 1', 'Test Product 2'],
    paymentTerms: 'Net 30',
    deliveryRadius: '75km',
    minimumOrder: 150,
    notes: 'Test vendor for API validation'
  };

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newVendor)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ POST vendor successful');
      console.log(`📋 Created vendor: ${result.data.name}`);
    } else {
      console.log('❌ POST vendor failed:', result.error);
    }
  } catch (error) {
    console.log('💥 Network error:', error.message);
  }

  console.log('\n🎯 Vendor Management Features:');
  console.log('• Add/Edit/Delete vendors');
  console.log('• Contact information management');
  console.log('• Product/service catalog');
  console.log('• Performance tracking');
  console.log('• Search and filtering');
  console.log('• Business terms management');
  console.log('• Analytics and reporting');

  console.log('\n📱 Access vendor management at:');
  console.log('http://localhost:3000/vendors');
};

// Browser-compatible execution
if (typeof window !== 'undefined') {
  window.testVendorAPI = testVendorAPI;
  console.log('📱 Browser test loaded. Call window.testVendorAPI() to run tests.');
} else {
  testVendorAPI().then(() => {
    console.log('✨ Vendor API tests completed');
  });
}
