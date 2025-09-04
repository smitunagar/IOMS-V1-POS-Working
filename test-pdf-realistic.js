// Test PDF extraction with realistic content
(async () => {
  try {
    const fetch = globalThis.fetch || (await import('node-fetch')).default;
    
    // Create a more complex, realistic test menu content
    const testMenuText = `
BELLA VISTA RESTAURANT
DINNER MENU

🍽️ APPETIZERS
Chicken Wings - €12.50
Fresh oysters, lemon mignonette
Caesar Salad - €8.90
Crisp romaine, parmesan, croutons
Soup of the Day - €6.50
Chef's daily special

🥩 MAIN COURSES
Grilled Salmon - €18.00
Atlantic salmon, herb butter
Beef Steak - €22.50
Prime ribeye, garlic mashed potatoes  
Vegetarian Pasta - €14.90
Penne arrabbiata, fresh basil

🍰 DESSERTS
Chocolate Cake - €7.50
Rich dark chocolate, berry compote
Ice Cream Selection - €5.00
Vanilla, chocolate, strawberry

☕ BEVERAGES
Coffee - €3.50
Premium blend
Tea Selection - €2.80
Earl Grey, Green, Chamomile
Wine Glass - €6.90
House red or white
`;

    // Convert to base64 (simulating PDF upload)
    const base64Text = Buffer.from(testMenuText).toString('base64');
    
    console.log('Testing with realistic menu PDF content...');
    console.log('Content preview:', testMenuText.substring(0, 200) + '...\n');
    
    const res = await fetch('http://localhost:3000/api/uploadMenu', {
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({
        file: base64Text,
        userId: 'pdf-test-user',
        filename: 'bella-vista-menu.pdf'
      })
    });
    
    console.log('Response status:', res.status);
    const result = await res.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
    // Also check the latest debug log
    const fs = require('fs');
    const path = require('path');
    
    try {
      const debugLog = fs.readFileSync(path.join(process.cwd(), 'exports', 'uploadMenu-debug.log'), 'utf8');
      console.log('\n=== LATEST DEBUG LOG ENTRIES ===');
      const logLines = debugLog.split('\n');
      console.log(logLines.slice(-20).join('\n')); // Last 20 lines
    } catch (e) {
      console.log('Could not read debug log:', e.message);
    }
    
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
