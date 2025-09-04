// Test the fallback extraction paths without hitting AI quota
const fs = require('fs');

async function testFallbacks() {
  try {
    // Read the base64 test file
    const base64Data = fs.readFileSync('test_pdf_base64.txt', 'utf8').trim();
    
    // Test payload
    const payload = {
      file: base64Data,
      userId: 'fallback-test',
      // Force skip AI by using a flag that doesn't exist in real UI
      skipAI: true
    };

    console.log('Testing fallback extraction (no AI)...');
    console.log('Payload size:', JSON.stringify(payload).length);

    const response = await fetch('http://localhost:3000/api/uploadMenu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('Response not OK:', response.status, response.statusText);
      const text = await response.text();
      console.error('Response body:', text);
      return;
    }

    const result = await response.json();
    console.log('Success!');
    console.log('Items found:', result.count);
    console.log('Extraction accuracy:', result.extractionAccuracy + '%');
    console.log('CSV exported:', result.csvExported ? 'Yes' : 'No');
    console.log('CSV path:', result.csvPath);
    
    if (result.menu && result.menu.length > 0) {
      console.log('\nFirst few items:');
      result.menu.slice(0, 3).forEach((item, i) => {
        console.log(`${i+1}. ${item.name} - ${item.price} (${item.extractionMethod})`);
        if (item.ingredients && item.ingredients.length) {
          console.log(`   Ingredients: ${item.ingredients.slice(0, 3).join(', ')}${item.ingredients.length > 3 ? '...' : ''}`);
        }
      });
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testFallbacks();
