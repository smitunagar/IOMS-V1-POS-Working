// Simple test for PDF text extraction only
(async () => {
  try {
    const fetch = globalThis.fetch || (await import('node-fetch')).default;
    
    // Create simple test content as base64 text
    const testText = `
RESTAURANT MENU

Chicken Wings - €12.50
Caesar Salad - €8.90
Grilled Salmon - €18.00
Chocolate Cake - €7.50
`;
    
    const base64Text = Buffer.from(testText).toString('base64');
    
    console.log('Testing text extraction with fallback to heuristic parsing...');
    
    const res = await fetch('http://localhost:3000/api/uploadMenu', {
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({
        file: base64Text,
        userId: 'text-test-user'
      })
    });
    
    console.log('Response status:', res.status);
    const result = await res.json();
    console.log('\nResponse data:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
