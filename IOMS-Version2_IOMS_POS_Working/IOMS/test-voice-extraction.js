// Test file to verify Voice AI food extraction improvements
// Run this to test if "beef samosa" is now correctly detected

function analyzeMessage(message) {
  const lowerMessage = message.toLowerCase();
  
  // Order keywords
  const orderKeywords = ['order', 'buy', 'purchase', 'want', 'need', 'get', 'pizza', 'burger', 'food', 'meal', 'drink', 'coffee'];
  const hasOrderKeyword = orderKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Reservation keywords
  const reservationKeywords = ['table', 'reservation', 'book', 'reserve', 'seat', 'party', 'dinner', 'tonight', 'tomorrow'];
  const hasReservationKeyword = reservationKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Greeting keywords
  const greetingKeywords = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
  const hasGreeting = greetingKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Time extraction
  const timeMatch = lowerMessage.match(/(\d{1,2}):?(\d{2})?\s*(am|pm|o'clock)?/);
  const dateMatch = lowerMessage.match(/(today|tomorrow|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  
  // Party size extraction
  const partySizeMatch = lowerMessage.match(/(\d+)\s*(people|person|guests?|party)/);
  
  // Food items extraction (improved pattern matching)
  const foodItems = [];
  const foodPatterns = [
    // Standard food items
    /(\d+)?\s*(large|medium|small)?\s*(pizza|burger|sandwich|salad|pasta|coffee|drink|water|soda|fries)/g,
    // Proteins and ingredients  
    /(\d+)?\s*(pepperoni|cheese|veggie|chicken|beef|pork|fish|seafood|salmon|tuna)/g,
    // Common dishes
    /(\d+)?\s*(samosa|curry|biryani|naan|rice|soup|stir|fry|grilled|fried|baked)/g,
    // Any word that could be a food item (more generous matching)
    /(\d+)?\s*([a-z]+\s*){1,3}(samosa|curry|biryani|naan|rice|soup|dish|meal|plate)/g
  ];
  
  foodPatterns.forEach(pattern => {
    const matches = [...lowerMessage.matchAll(pattern)];
    matches.forEach(match => {
      foodItems.push(match[0].trim());
    });
  });

  // Additional extraction: look for "order" followed by words
  const orderMatch = lowerMessage.match(/order\s+(.+?)(?:\s+and\s+(.+?))?(?:\s*$|\s+for|\s+at)/);
  if (orderMatch) {
    if (orderMatch[1]) foodItems.push(orderMatch[1].trim());
    if (orderMatch[2]) foodItems.push(orderMatch[2].trim());
  }

  // Extract words after "want" or "get"
  const wantMatch = lowerMessage.match(/(?:want|get|have)\s+(?:to\s+order\s+)?(?:a\s+|an\s+|some\s+)?(.+?)(?:\s*$|\s+and|\s+for|\s+at)/);
  if (wantMatch && wantMatch[1]) {
    foodItems.push(wantMatch[1].trim());
  }
  
  let intent = 'general';
  if (hasGreeting && !hasOrderKeyword && !hasReservationKeyword) {
    intent = 'greeting';
  } else if (hasOrderKeyword || foodItems.length > 0) {
    intent = 'order';
  } else if (hasReservationKeyword || partySizeMatch || timeMatch) {
    intent = 'reservation';
  }
  
  return {
    intent,
    extractedInfo: {
      time: timeMatch ? timeMatch[0] : null,
      date: dateMatch ? dateMatch[0] : null,
      partySize: partySizeMatch ? parseInt(partySizeMatch[1]) : null,
      foodItems,
      message: lowerMessage
    }
  };
}

// Test cases
console.log('\n=== VOICE AI FOOD EXTRACTION TEST ===\n');

const testMessages = [
  "I want to order beef samosa",
  "Can I get a beef samosa",
  "I would like beef samosa please",
  "Order beef samosa",
  "beef samosa",
  "I want chicken curry",
  "Book a table for 4 people",
  "Hello there"
];

testMessages.forEach(message => {
  console.log(`Input: "${message}"`);
  const result = analyzeMessage(message);
  console.log(`Intent: ${result.intent}`);
  console.log(`Food Items: [${result.extractedInfo.foodItems.join(', ')}]`);
  console.log(`Party Size: ${result.extractedInfo.partySize || 'None'}`);
  console.log('---');
});

console.log('\n=== TEST COMPLETE ===\n');
