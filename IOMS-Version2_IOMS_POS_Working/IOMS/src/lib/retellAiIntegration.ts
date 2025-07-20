/**
 * 🤖 SAM AI Integration Service for Retell AI
 * Handles integration between Retell AI calling agent and IOMS
 * For automatic order creation and table reservations from phone calls
 */

export interface RetellCallData {
  // Call information from Retell AI
  call_id: string;
  call_type: string;
  agent_id: string;
  call_status: string;
  call_duration?: number;
  transcript: string;
  
  // Customer information extracted by AI
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  
  // Order information
  order_items?: Array<{
    item_name: string;
    quantity: number;
    special_instructions?: string;
    price?: number;
  }>;
  order_type?: 'dine-in' | 'delivery' | 'pickup';
  
  // Reservation information
  reservation_datetime?: string;
  party_size?: number;
  special_requests?: string;
  occasion?: string;
  
  // Delivery information (if applicable)
  delivery_address?: string;
  delivery_instructions?: string;
  preferred_delivery_time?: string;
  
  // AI confidence and metadata
  ai_confidence?: number;
  requires_manual_review?: boolean;
  extracted_data?: any;
}

export interface ProcessingResult {
  success: boolean;
  order_id?: string;
  reservation_id?: string;
  message: string;
  warnings?: string[];
  errors?: string[];
  confidence_score?: number;
}

export interface TableReservation {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  reservation_datetime: string;
  party_size: number;
  table_id?: string;
  table_name?: string;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled';
  special_requests?: string;
  occasion?: string;
  created_at: string;
  created_by: 'retell-ai' | 'manual';
  retell_call_id?: string;
  confidence_score?: number;
}

// Storage keys
const RESERVATIONS_KEY = 'samAiReservations';
const ORDERS_KEY = 'samAiOrders';

// In-memory storage for server-side (temporary until database implementation)
const serverStorage: Record<string, any> = {};

// Export server storage for API access
export { serverStorage };

/**
 * Generate unique ID
 */
function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get user-specific storage key
 */
function getUserStorageKey(userId: string, type: string): string {
  return `${type}_${userId}`;
}

/**
 * Save data to storage (localStorage on client, memory on server)
 */
function saveToStorage(userId: string, type: string, data: any[]): void {
  const key = getUserStorageKey(userId, type);
  
  try {
    if (typeof window !== 'undefined') {
      // Client-side: use localStorage
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`✅ Saved to localStorage: ${key}`, data.length, 'items');
    } else {
      // Server-side: use in-memory storage
      serverStorage[key] = data;
      console.log(`✅ Saved to server memory: ${key}`, data.length, 'items');
    }
  } catch (error) {
    console.error(`Error saving ${type} to storage:`, error);
  }
}

/**
 * Get data from storage (localStorage on client, memory on server)
 */
function getFromStorage(userId: string, type: string): any[] {
  const key = getUserStorageKey(userId, type);
  
  try {
    if (typeof window !== 'undefined') {
      // Client-side: use localStorage
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } else {
      // Server-side: use in-memory storage
      return serverStorage[key] || [];
    }
  } catch (error) {
    console.error(`Error getting ${type} from storage:`, error);
    return [];
  }
}

/**
 * Add new reservation
 */
export function addReservation(userId: string, reservationData: Omit<TableReservation, 'id' | 'created_at'>): TableReservation | null {
  try {
    const reservations = getFromStorage(userId, RESERVATIONS_KEY);
    const newReservation: TableReservation = {
      id: generateId('res'),
      created_at: new Date().toISOString(),
      ...reservationData,
    };
    
    reservations.push(newReservation);
    saveToStorage(userId, RESERVATIONS_KEY, reservations);
    return newReservation;
  } catch (error) {
    console.error('Error adding reservation:', error);
    return null;
  }
}

/**
 * Get all reservations for user
 */
export function getReservations(userId: string): TableReservation[] {
  return getFromStorage(userId, RESERVATIONS_KEY);
}

/**
 * Find available tables for party size
 */
export function findAvailableTables(partySize: number): Array<{id: string, name: string, capacity: number}> {
  // Mock table data - in real implementation, this would check actual availability
  const tables = Array.from({ length: 12 }, (_, i) => ({
    id: `table_${i + 1}`,
    name: `Table ${i + 1}`,
    capacity: [2, 4, 6, 8][Math.floor(Math.random() * 4)],
  }));
  
  return tables.filter(table => table.capacity >= partySize);
}

/**
 * Auto-assign table to reservation
 */
export function autoAssignTable(userId: string, reservationId: string, partySize: number): {success: boolean, table?: any, message: string} {
  try {
    // Skip table assignment on server-side (webhook calls)
    if (typeof window === 'undefined') {
      return {
        success: true,
        message: 'Table assignment will be done on client-side'
      };
    }

    const availableTables = findAvailableTables(partySize);
    
    if (availableTables.length === 0) {
      return {
        success: false,
        message: `No tables available for party of ${partySize}`
      };
    }
    
    // Find best fitting table (smallest that accommodates party)
    const bestTable = availableTables
      .sort((a, b) => a.capacity - b.capacity)
      .find(table => table.capacity >= partySize);
    
    if (!bestTable) {
      return {
        success: false,
        message: 'No suitable table found'
      };
    }
    
    // Update reservation with table assignment
    const reservations = getFromStorage(userId, RESERVATIONS_KEY);
    const reservationIndex = reservations.findIndex((r: TableReservation) => r.id === reservationId);
    
    if (reservationIndex !== -1) {
      reservations[reservationIndex].table_id = bestTable.id;
      reservations[reservationIndex].table_name = bestTable.name;
      reservations[reservationIndex].status = 'confirmed';
      saveToStorage(userId, RESERVATIONS_KEY, reservations);
      
      return {
        success: true,
        table: bestTable,
        message: `Table ${bestTable.name} (capacity ${bestTable.capacity}) assigned successfully`
      };
    }
    
    return {
      success: false,
      message: 'Reservation not found'
    };
  } catch (error) {
    console.error('Error auto-assigning table:', error);
    return {
      success: false,
      message: 'Error assigning table'
    };
  }
}

/**
 * Process Retell AI call data to create orders and reservations
 */
export async function processRetellCallData(userId: string, callData: RetellCallData): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    success: true,
    message: '',
    warnings: [],
    errors: []
  };
  
  try {
    // Extract customer information
    const customerName = callData.customer_name || extractNameFromTranscript(callData.transcript);
    const customerPhone = callData.customer_phone || extractPhoneFromTranscript(callData.transcript);
    
    if (!customerName || !customerPhone) {
      result.errors?.push('Could not extract customer name or phone number from call');
      result.success = false;
      return result;
    }
    
    // Handle reservation if requested
    if (callData.reservation_datetime && callData.party_size) {
      const reservation = addReservation(userId, {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: callData.customer_email,
        reservation_datetime: callData.reservation_datetime,
        party_size: callData.party_size,
        status: 'pending',
        special_requests: callData.special_requests,
        occasion: callData.occasion,
        created_by: 'retell-ai',
        retell_call_id: callData.call_id,
        confidence_score: callData.ai_confidence
      });
      
      if (reservation) {
        result.reservation_id = reservation.id;
        
        // For webhook calls (server-side), just confirm reservation creation
        if (typeof window === 'undefined') {
          result.message += `Reservation created successfully for ${callData.party_size} guests. Table will be assigned when staff reviews. `;
        } else {
          // Try to auto-assign table (client-side only)
          const tableAssignment = autoAssignTable(userId, reservation.id, callData.party_size);
          if (tableAssignment.success) {
            result.message += `Reservation created and ${tableAssignment.message}. `;
          } else {
            result.message += `Reservation created but ${tableAssignment.message}. `;
            result.warnings?.push('Table assignment requires manual review');
          }
        }
      } else {
        result.errors?.push('Failed to create reservation');
      }
    }
    
    // Handle order if items are present
    if (callData.order_items && callData.order_items.length > 0) {
      try {
        // Import order service dynamically to avoid circular dependencies
        const { addOrder } = await import('./orderService');
        const { getDishes } = await import('./menuService');
        
        // Get restaurant menu
        const menu = getDishes(userId);
        const matchedItems: any[] = [];
        let subtotal = 0;
        
        // Match order items with menu
        for (const item of callData.order_items) {
          const menuItem = menu.find((dish: any) => 
            dish.name.toLowerCase().includes(item.item_name.toLowerCase()) ||
            item.item_name.toLowerCase().includes(dish.name.toLowerCase())
          );
          
          if (menuItem) {
            const totalPrice = menuItem.price * item.quantity;
            matchedItems.push({
              dishId: menuItem.id,
              name: menuItem.name,
              quantity: item.quantity,
              unitPrice: menuItem.price,
              totalPrice
            });
            subtotal += totalPrice;
          } else {
            result.warnings?.push(`Could not match "${item.item_name}" with menu items`);
          }
        }
        
        if (matchedItems.length > 0) {
          // Determine table info
          let tableInfo = { table: 'Retell AI Order', tableId: `retell-${callData.call_id}` };
          
          // If there's a reservation, link the order to that table
          if (result.reservation_id) {
            const reservations = getReservations(userId);
            const reservation = reservations.find(r => r.id === result.reservation_id);
            if (reservation && reservation.table_name) {
              tableInfo = { table: reservation.table_name, tableId: reservation.table_id || reservation.table_name };
            }
          }
          
          // Create order
          const orderData = {
            orderType: (callData.order_type === 'pickup' ? 'delivery' : callData.order_type) || 'dine-in',
            table: tableInfo.table,
            tableId: tableInfo.tableId,
            items: matchedItems,
            subtotal,
            taxRate: 0.10,
            customerName,
            customerPhone,
            customerAddress: callData.delivery_address,
            driverName: callData.order_type === 'delivery' ? 'Auto-assigned' : undefined,
          };
          
          const order = addOrder(userId, orderData);
          
          if (order) {
            result.order_id = order.id;
            result.message += `Order #${order.id.substring(0, 8)} created with ${matchedItems.length} items. `;
          } else {
            result.errors?.push('Failed to create order');
          }
        } else {
          result.errors?.push('No menu items could be matched');
        }
      } catch (error) {
        console.error('Error processing order:', error);
        result.errors?.push(`Order processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Set confidence warnings
    if (callData.ai_confidence && callData.ai_confidence < 0.8) {
      result.warnings?.push(`Low AI confidence (${(callData.ai_confidence * 100).toFixed(1)}%) - manual review recommended`);
    }
    
    if (callData.requires_manual_review) {
      result.warnings?.push('Retell AI flagged this call for manual review');
    }
    
    // Final success determination
    if (result.errors && result.errors.length > 0) {
      result.success = false;
      result.message = `Processing failed: ${result.errors.join(', ')}`;
    } else if (!result.message) {
      result.message = 'Call processed successfully';
    }
    
    result.confidence_score = callData.ai_confidence;
    
  } catch (error) {
    console.error('Error processing Retell call:', error);
    result.success = false;
    result.message = 'Failed to process call data';
    result.errors = [`System error: ${error instanceof Error ? error.message : 'Unknown error'}`];
  }
  
  return result;
}

/**
 * Extract customer name from transcript using simple pattern matching
 */
function extractNameFromTranscript(transcript: string): string | null {
  const namePatterns = [
    /my name is ([^.,\n]+)/i,
    /this is ([^.,\n]+)/i,
    /i'm ([^.,\n]+)/i,
    /call me ([^.,\n]+)/i
  ];
  
  for (const pattern of namePatterns) {
    const match = transcript.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
}

/**
 * Extract phone number from transcript
 */
function extractPhoneFromTranscript(transcript: string): string | null {
  const phonePattern = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;
  const match = transcript.match(phonePattern);
  
  if (match) {
    return match[0];
  }
  
  return null;
}

/**
 * Get upcoming reservations (next 24 hours)
 */
export function getUpcomingReservations(userId: string): TableReservation[] {
  const reservations = getReservations(userId);
  const now = new Date();
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  return reservations
    .filter(r => {
      const reservationTime = new Date(r.reservation_datetime);
      return reservationTime >= now && reservationTime <= next24Hours && r.status !== 'cancelled';
    })
    .sort((a, b) => new Date(a.reservation_datetime).getTime() - new Date(b.reservation_datetime).getTime());
}
