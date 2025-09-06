// Test script to simulate successful menu upload with the new ingredient handling
fetch('http://localhost:3000/api/uploadMenu', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    manualData: [
      {
        id: "1",
        name: "Chicken Biryani", 
        price: "12.90 EUR",
        category: "Main Dishes",
        ingredients: ["Basmati Rice", "Chicken Breast", "Onions", "Tomatoes", "Olive Oil"] // Simulating AI extraction
      },
      {
        id: "2",
        name: "Dal Masoor Tadka",
        price: "9.90 EUR", 
        category: "Vegetarian",
        ingredients: ["Red Lentils", "Cumin", "Turmeric", "Onions", "Tomatoes"] // Simulating AI extraction
      },
      {
        id: "3",
        name: "New Test Item",
        price: "7.50 EUR",
        category: "Test Category",
        ingredients: [] // This should get fallback ingredients
      }
    ]
  })
})
.then(response => response.json())
.then(data => {
  console.log('✅ Upload Response:', JSON.stringify(data, null, 2));
})
.catch(error => {
  console.error('❌ Upload Error:', error);
});
