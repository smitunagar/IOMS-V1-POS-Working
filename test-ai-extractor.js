// Simple test to debug the AI menu extractor
const fs = require('fs');

// Try to understand what the AI extractor is returning
async function testAIExtractor() {
  console.log('Testing AI extractor...');
  
  try {
    // Import the extractor
    const { extractMenuFromPdf } = require('./src/lib/aiMenuExtractor.ts');
    
    // Create a simple test PDF (base64 encoded)
    const testPdfDataUri = 'data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNCAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0xlbmd0aCA0NAo+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjEwMCA3MDAgVGQKKFRlc3QgTWVudSkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago';
    
    const result = await extractMenuFromPdf({ pdfDataUri: testPdfDataUri });
    
    console.log('Result type:', typeof result);
    console.log('Is array:', Array.isArray(result));
    console.log('Result keys:', result ? Object.keys(result) : 'null');
    console.log('Result length/count:', Array.isArray(result) ? result.length : 'not array');
    
    if (result && !Array.isArray(result)) {
      console.log('Object values:', Object.values(result));
    }
    
    console.log('Full result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAIExtractor();
