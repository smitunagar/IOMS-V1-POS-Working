// Test the enhanced menu upload API with proper quota handling
const fs = require('fs');
const FormData = require('form-data');

async function testEnhancedMenuUpload() {
    console.log('🧪 Testing Enhanced Menu Upload API...\n');
    
    // Check if test file exists
    const testFile = 'test_pdf_base64.txt';
    if (!fs.existsSync(testFile)) {
        console.log('❌ Test file not found. Please ensure test_pdf_base64.txt exists.');
        return;
    }

    try {
        // Read test PDF content
        const pdfContent = fs.readFileSync(testFile, 'utf8');
        console.log('📄 Test PDF loaded successfully');
        
        // Create form data
        const formData = new FormData();
        
        // Create a buffer from base64 content (if it's base64) or use directly
        let pdfBuffer;
        try {
            // Try to decode as base64 first
            pdfBuffer = Buffer.from(pdfContent, 'base64');
            console.log('📋 Base64 content decoded');
        } catch (e) {
            // If not base64, use as-is
            pdfBuffer = Buffer.from(pdfContent);
            console.log('📋 Using content as-is');
        }
        
        formData.append('pdf', pdfBuffer, {
            filename: 'test-menu.pdf',
            contentType: 'application/pdf'
        });

        console.log('🚀 Sending request to enhanced API...\n');
        
        // Send request to our enhanced API
        const fetch = (await import('node-fetch')).default;
        const response = await fetch('http://localhost:3000/api/uploadMenu', {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        const result = await response.json();
        
        console.log('📊 API Response Status:', response.status);
        console.log('📋 Response Data:');
        console.log(JSON.stringify(result, null, 2));
        
        // Analyze the response
        if (result.success) {
            console.log('\n✅ Success!');
            console.log(`🍽️  Items extracted: ${result.items?.length || 0}`);
            console.log(`🔧 Extraction method: ${result.extractionTier || 'unknown'}`);
            console.log(`🤖 AI quota status: ${result.quotaStatus || 'unknown'}`);
            
            if (result.items && result.items.length > 0) {
                console.log('\n📝 Sample items:');
                result.items.slice(0, 3).forEach((item, i) => {
                    console.log(`  ${i+1}. ${item.name} - $${item.price}`);
                });
            }
        } else {
            console.log('\n❌ Request failed');
            console.log(`📛 Error: ${result.error}`);
            
            // Check for quota-related messages
            if (result.error?.includes('quota') || result.error?.includes('429')) {
                console.log('💡 This appears to be a quota exhaustion - the enhanced API detected this correctly!');
            }
            
            // Check fallback information
            if (result.extractionTier) {
                console.log(`🔧 Fallback tier used: ${result.extractionTier}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testEnhancedMenuUpload().catch(console.error);
