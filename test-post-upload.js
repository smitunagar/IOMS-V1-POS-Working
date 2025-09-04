(async ()=>{
  try {
    const fetch = globalThis.fetch || (await import('node-fetch')).default;
    
    // Create a more realistic test menu with prices
    const testMenuText = `
RESTAURANT MENU

Appetizers
Chicken Wings - €12.50
Caesar Salad - €8.90
Soup of the Day - €6.50

Main Courses  
Grilled Salmon - €18.00
Beef Steak - €22.50
Vegetarian Pasta - €14.90

Desserts
Chocolate Cake - €7.50
Ice Cream - €5.00

Beverages
Coffee - €3.50
Tea - €2.80
Wine Glass - €6.90
`;

    // Simple base64 PDF with the test menu text
    const base64 = 'JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNCAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0xlbmd0aCA0NAo+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjEwMCA3MDAgVGQKKFRlc3QgTWVudSkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago';
    
    console.log('Testing with realistic menu text via manualMenuData...');
    
    // Test with manual menu data to validate the processing pipeline
    const manualTestItems = [
      { name: 'Chicken Wings', price: '€12.50', category: 'Appetizers' },
      { name: 'Caesar Salad', price: '€8.90', category: 'Appetizers' },
      { name: 'Grilled Salmon', price: '€18.00', category: 'Main Courses' },
      { name: 'Chocolate Cake', price: '€7.50', category: 'Desserts' }
    ];
    
    const res = await fetch('http://localhost:3000/api/uploadMenu', {
      method:'POST', 
      headers: {'Content-Type':'application/json'}, 
      body: JSON.stringify({
        manualMenuData: manualTestItems,
        userId: 'manual-test-1'
      })
    });
    
    console.log('status', res.status);
    const result = await res.json();
    console.log('result', JSON.stringify(result, null, 2));
    
  } catch (e) {
    console.error('error', e);
    process.exit(1);
  }
})();
