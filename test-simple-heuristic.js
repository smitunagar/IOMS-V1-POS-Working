// Test with simple heuristic extraction using text data
(async () => {
  try {
    const fetch = globalThis.fetch || (await import('node-fetch')).default;
    
    // Create simple test content as raw text that should trigger heuristic parsing
    const testText = `RESTAURANT MENU
Chicken Wings - €12.50
Caesar Salad - €8.90
Grilled Salmon - €18.00
Chocolate Cake - €7.50`;
    
    console.log('Testing heuristic text extraction...');
    
    // Send as text data which should bypass PDF parsing and use heuristic extraction
    const res = await fetch('http://localhost:3000/api/uploadMenu', {
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({
        textData: testText,  // Raw text instead of file
        userId: 'text-heuristic-test'
      })
    });
    
    console.log('Response status:', res.status);
    
    if (res.ok) {
      const result = await res.json();
      console.log('\nSuccess! Response:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      const errorText = await res.text();
      console.log('\nError response:');
      console.log(errorText);
    }
    
  } catch (e) {
    console.error('Error:', e);
  }
})();
