export interface OccupiedTableInfo {
  orderId: string;
  // Add other relevant fields if needed
}

export function getOccupiedTables(userId: string): Record<string, OccupiedTableInfo> {
  if (typeof window === 'undefined') return {};
  const orders = JSON.parse(localStorage.getItem(`orders_${userId}`) || '[]');
  const occupied: Record<string, OccupiedTableInfo> = {};
  orders.forEach((order: any) => {
    if (order.tableId && order.status !== 'Completed') {
      occupied[order.tableId] = { orderId: order.id };
    }
  });
  return occupied;
} 