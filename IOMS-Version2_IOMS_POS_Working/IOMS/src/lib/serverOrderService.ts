import { Order, OrderItem, OrderStatus, OrderType, NewOrderData, DEFAULT_TAX_RATE } from './orderService';
import fs from 'fs';
import path from 'path';

// Server-side order service that uses file system instead of localStorage
const ORDERS_FILE_PATH = path.join(process.cwd(), 'data', 'orders.json');

function generateId(prefix: string = "id"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function ensureDataDirectory() {
  const dataDir = path.dirname(ORDERS_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readOrdersFromFile(): Record<string, Order[]> {
  try {
    ensureDataDirectory();
    if (!fs.existsSync(ORDERS_FILE_PATH)) {
      return {};
    }
    const data = fs.readFileSync(ORDERS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[Server Order Service] Error reading orders file:', error);
    return {};
  }
}

function writeOrdersToFile(orders: Record<string, Order[]>) {
  try {
    ensureDataDirectory();
    fs.writeFileSync(ORDERS_FILE_PATH, JSON.stringify(orders, null, 2));
  } catch (error) {
    console.error('[Server Order Service] Error writing orders file:', error);
  }
}

export function getServerSideOrders(userId: string | null): Order[] {
  if (!userId) return [];
  
  console.log('[Server Order Service] Getting orders for user:', userId);
  const allOrders = readOrdersFromFile();
  return allOrders[userId] || [];
}

export function addServerSideOrder(userId: string | null, orderData: NewOrderData): Order | null {
  if (!userId) {
    console.error('[Server Order Service] No userId provided');
    return null;
  }

  console.log('[Server Order Service] Adding order for user:', userId);
  console.log('[Server Order Service] Order data:', orderData);

  const taxAmount = orderData.subtotal * (orderData.taxRate || DEFAULT_TAX_RATE);
  const totalAmount = orderData.subtotal + taxAmount;

  const newOrder: Order = {
    ...orderData,
    id: generateId("order"),
    createdAt: new Date().toISOString(),
    status: 'Pending Payment',
    taxAmount,
    totalAmount,
    taxRate: orderData.taxRate || DEFAULT_TAX_RATE,
  };

  console.log('[Server Order Service] Created new order:', newOrder.id);

  // Read current orders, add new order, and save
  const allOrders = readOrdersFromFile();
  const userOrders = allOrders[userId] || [];
  userOrders.push(newOrder);
  allOrders[userId] = userOrders;
  
  writeOrdersToFile(allOrders);
  
  console.log('[Server Order Service] Order saved successfully');
  return newOrder;
}

export function updateServerSideOrderStatus(userId: string | null, orderId: string, newStatus: OrderStatus): Order | null {
  if (!userId) return null;

  console.log('[Server Order Service] Updating order status:', orderId, 'to', newStatus);
  
  const allOrders = readOrdersFromFile();
  const userOrders = allOrders[userId] || [];
  const orderIndex = userOrders.findIndex(order => order.id === orderId);
  
  if (orderIndex === -1) {
    console.error('[Server Order Service] Order not found:', orderId);
    return null;
  }

  userOrders[orderIndex].status = newStatus;
  if (newStatus === 'Completed') {
    userOrders[orderIndex].completedAt = new Date().toISOString();
  }
  
  allOrders[userId] = userOrders;
  writeOrdersToFile(allOrders);
  
  console.log('[Server Order Service] Order status updated successfully');
  return userOrders[orderIndex];
}

// Table management functions (server-side compatible)
const TABLES_FILE_PATH = path.join(process.cwd(), 'data', 'tables.json');

function readTablesFromFile(): Record<string, any> {
  try {
    if (!fs.existsSync(TABLES_FILE_PATH)) {
      return {};
    }
    const data = fs.readFileSync(TABLES_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[Server Order Service] Error reading tables file:', error);
    return {};
  }
}

function writeTablesToFile(tables: Record<string, any>) {
  try {
    ensureDataDirectory();
    fs.writeFileSync(TABLES_FILE_PATH, JSON.stringify(tables, null, 2));
  } catch (error) {
    console.error('[Server Order Service] Error writing tables file:', error);
  }
}

export function setServerSideOccupiedTable(userId: string | null, tableId: string, orderId: string): void {
  if (!userId) return;

  console.log('[Server Order Service] Setting table as occupied:', tableId, 'for order:', orderId);
  
  const allTables = readTablesFromFile();
  if (!allTables[userId]) {
    allTables[userId] = {};
  }
  
  allTables[userId][tableId] = {
    status: 'occupied',
    orderId,
    occupiedAt: new Date().toISOString()
  };
  
  writeTablesToFile(allTables);
  console.log('[Server Order Service] Table status updated successfully');
}
