/**
 * 🧪 Standalone Test Data Generator
 * Run this script to generate dummy reservation data for testing
 */

const webhookUrl = 'https://ioms-v1-pos-working.vercel.app/api/sam-ai/generate-test-data';

async function generateTestData() {
  console.log('🧪 Generating test reservation data...');
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'GET'
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Test Data Generation Successful!');
      console.log(`Generated ${result.count} reservations:`);
      result.reservations.forEach((reservation, index) => {
        console.log(`${index + 1}. ${reservation.customer_name} - ${reservation.party_size} guests - ${new Date(reservation.reservation_datetime).toLocaleDateString()}`);
      });
    } else {
      const error = await response.text();
      console.error('❌ Test Data Generation Failed:', error);
    }
  } catch (error) {
    console.error('❌ Error generating test data:', error.message);
  }
}

// Run the test
generateTestData();
