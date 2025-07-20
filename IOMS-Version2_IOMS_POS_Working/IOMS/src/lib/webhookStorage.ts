/**
 * 📦 Simple Webhook Data Storage
 * In-memory storage for webhook reservations to sync with dashboard
 */

// Simple in-memory storage for demonstration
const recentReservations: Record<string, any[]> = {};

/**
 * Store reservation from webhook
 */
export function storeWebhookReservation(userId: string, reservation: any) {
  if (!recentReservations[userId]) {
    recentReservations[userId] = [];
  }
  recentReservations[userId].push(reservation);
  
  // Keep only last 10 reservations
  if (recentReservations[userId].length > 10) {
    recentReservations[userId] = recentReservations[userId].slice(-10);
  }
  
  console.log(`📦 Stored webhook reservation for ${userId}:`, reservation.id);
}

/**
 * Get webhook reservations for user
 */
export function getWebhookReservations(userId: string): any[] {
  return recentReservations[userId] || [];
}
