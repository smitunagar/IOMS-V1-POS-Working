/**
 * 🧪 Test Data Generator for SAM AI Reservations
 * Creates dummy reservation data for testing the dashboard
 */

import { storeWebhookReservation } from '@/lib/webhookStorage';

interface TestReservation {
  id: string;
  call_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  party_size: number;
  reservation_datetime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  special_requests?: string;
  occasion?: string;
  created_by: string;
  created_at: string;
  confidence_score: number;
  table_id?: string;
  table_name?: string;
}

/**
 * Generate dummy reservation data
 */
export function generateDummyReservations(count: number = 5): TestReservation[] {
  const customers = [
    { name: 'John Smith', phone: '555-0101', email: 'john.smith@email.com' },
    { name: 'Sarah Johnson', phone: '555-0102', email: 'sarah.j@email.com' },
    { name: 'Mike Chen', phone: '555-0103', email: 'mike.chen@email.com' },
    { name: 'Emily Davis', phone: '555-0104', email: 'emily.d@email.com' },
    { name: 'David Wilson', phone: '555-0105', email: 'david.w@email.com' },
    { name: 'Lisa Brown', phone: '555-0106', email: 'lisa.brown@email.com' },
    { name: 'Alex Garcia', phone: '555-0107', email: 'alex.garcia@email.com' },
    { name: 'Rachel Lee', phone: '555-0108', email: 'rachel.lee@email.com' }
  ];

  const occasions = ['Birthday', 'Anniversary', 'Business Meeting', 'Date Night', 'Family Dinner', null];
  const specialRequests = [
    'Window table please',
    'Quiet corner booth',
    'High chair needed',
    'Wheelchair accessible',
    'Birthday celebration',
    'Close to kitchen',
    null
  ];

  const statuses: ('pending' | 'confirmed' | 'cancelled')[] = ['pending', 'confirmed', 'pending', 'confirmed', 'pending'];

  const reservations: TestReservation[] = [];

  for (let i = 0; i < count; i++) {
    const customer = customers[i % customers.length];
    const now = new Date();
    const futureDate = new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000); // i+1 days from now
    const futureTime = new Date(futureDate);
    futureTime.setHours(18 + (i % 4), (i % 2) * 30, 0, 0); // 6-9:30 PM

    const reservation: TestReservation = {
      id: `res_${Date.now() + i}_test${Math.random().toString(36).substring(2, 8)}`,
      call_id: `test_call_${Date.now() + i}`,
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_email: customer.email,
      party_size: 2 + (i % 6), // 2-7 guests
      reservation_datetime: futureTime.toISOString(),
      status: statuses[i % statuses.length],
      special_requests: specialRequests[i % specialRequests.length] || undefined,
      occasion: occasions[i % occasions.length] || undefined,
      created_by: 'retell-ai-test',
      created_at: new Date(now.getTime() - i * 60 * 60 * 1000).toISOString(), // i hours ago
      confidence_score: 0.85 + (Math.random() * 0.15), // 0.85-1.0
      table_id: i % 3 === 0 ? `table_${i + 1}` : undefined,
      table_name: i % 3 === 0 ? `Table ${i + 1}` : undefined
    };

    reservations.push(reservation);
  }

  return reservations;
}

/**
 * Store dummy reservations for a user
 */
export function createDummyReservationsForUser(userId: string, count: number = 5): TestReservation[] {
  const dummyReservations = generateDummyReservations(count);
  
  // Store each reservation in webhook storage
  dummyReservations.forEach(reservation => {
    storeWebhookReservation(userId, reservation);
  });

  console.log(`✅ Created ${count} dummy reservations for user: ${userId}`);
  return dummyReservations;
}
