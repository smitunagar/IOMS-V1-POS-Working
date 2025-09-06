import { NextRequest } from 'next/server';
import { WebSocket, WebSocketServer } from 'ws';
import { TableEvent, TableEventSchema } from '@/lib/schemas/table-management';

// Global WebSocket server instance
let wss: WebSocketServer | null = null;

// Connection management
const connections = new Map<string, Set<WebSocket>>();
const connectionMeta = new WeakMap<WebSocket, { tenantId: string; userId?: string; role?: string }>();

// Initialize WebSocket server
export function initializeWebSocketServer() {
  if (wss) return wss;
  
  wss = new WebSocketServer({ 
    port: 3001,
    path: '/api/pos/table-events'
  });
  
  wss.on('connection', (ws, request) => {
    console.log('New WebSocket connection established');
    
    // Parse connection parameters
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const tenantId = url.searchParams.get('tenantId') || 'default';
    const userId = url.searchParams.get('userId');
    const role = url.searchParams.get('role') || 'guest';
    
    // Store connection metadata
    connectionMeta.set(ws, { tenantId, userId, role });
    
    // Add to tenant connection pool
    if (!connections.has(tenantId)) {
      connections.set(tenantId, new Set());
    }
    connections.get(tenantId)!.add(ws);
    
    // Send connection acknowledgment
    ws.send(JSON.stringify({
      type: 'CONNECTION_ACK',
      tenantId,
      userId,
      timestamp: new Date().toISOString()
    }));
    
    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleClientMessage(ws, message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'ERROR',
          message: 'Invalid message format'
        }));
      }
    });
    
    // Handle connection close
    ws.on('close', () => {
      const meta = connectionMeta.get(ws);
      if (meta) {
        const tenantConnections = connections.get(meta.tenantId);
        if (tenantConnections) {
          tenantConnections.delete(ws);
          if (tenantConnections.size === 0) {
            connections.delete(meta.tenantId);
          }
        }
        connectionMeta.delete(ws);
      }
      console.log('WebSocket connection closed');
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  return wss;
}

// Handle messages from clients
function handleClientMessage(ws: WebSocket, message: any) {
  const meta = connectionMeta.get(ws);
  if (!meta) return;
  
  switch (message.type) {
    case 'PING':
      ws.send(JSON.stringify({
        type: 'PONG',
        timestamp: new Date().toISOString()
      }));
      break;
      
    case 'SUBSCRIBE_TABLE':
      // Subscribe to specific table events
      if (message.tableId) {
        // Add table-specific subscription logic here
        ws.send(JSON.stringify({
          type: 'SUBSCRIBED',
          tableId: message.tableId,
          timestamp: new Date().toISOString()
        }));
      }
      break;
      
    case 'UNSUBSCRIBE_TABLE':
      // Unsubscribe from specific table events
      if (message.tableId) {
        ws.send(JSON.stringify({
          type: 'UNSUBSCRIBED',
          tableId: message.tableId,
          timestamp: new Date().toISOString()
        }));
      }
      break;
      
    default:
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Unknown message type'
      }));
  }
}

// Broadcast event to all connected clients in a tenant
export function broadcastTableEvent(tenantId: string, event: TableEvent) {
  const tenantConnections = connections.get(tenantId);
  if (!tenantConnections) return;
  
  const message = JSON.stringify(event);
  
  tenantConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      const meta = connectionMeta.get(ws);
      
      // Apply role-based filtering
      if (meta?.role === 'waiter') {
        // Waiters only get status change events
        if (event.type === 'TABLE_STATUS_CHANGED' || event.type === 'RESERVATION_ASSIGNED') {
          ws.send(message);
        }
      } else if (meta?.role === 'manager' || meta?.role === 'owner') {
        // Managers and owners get all events
        ws.send(message);
      }
    }
  });
}

// Broadcast to specific table subscribers
export function broadcastToTableSubscribers(tenantId: string, tableId: string, event: TableEvent) {
  const tenantConnections = connections.get(tenantId);
  if (!tenantConnections) return;
  
  const message = JSON.stringify({
    ...event,
    tableId
  });
  
  tenantConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      // In production, check if client is subscribed to this specific table
      ws.send(message);
    }
  });
}

// REST API endpoint for triggering events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = request.headers.get('x-tenant-id') || 'default';
    
    // Validate event data
    const event = TableEventSchema.parse({
      ...body,
      tenantId,
      timestamp: new Date().toISOString()
    });
    
    // Broadcast to all relevant clients
    broadcastTableEvent(tenantId, event);
    
    // If event is table-specific, also broadcast to table subscribers
    if (event.tableId) {
      broadcastToTableSubscribers(tenantId, event.tableId, event);
    }
    
    return new Response(JSON.stringify({
      success: true,
      eventType: event.type,
      broadcastCount: connections.get(tenantId)?.size || 0,
      timestamp: event.timestamp
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error broadcasting table event:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to broadcast event',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET endpoint for connection status
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id') || 'default';
  const tenantConnections = connections.get(tenantId);
  
  return new Response(JSON.stringify({
    connected: !!tenantConnections && tenantConnections.size > 0,
    connectionCount: tenantConnections?.size || 0,
    totalTenants: connections.size,
    serverStatus: wss ? 'running' : 'stopped'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Initialize WebSocket server on module load
if (typeof window === 'undefined') {
  // Only initialize on server side
  initializeWebSocketServer();
}

// Export helper functions for use in other APIs
export {
  broadcastTableEvent,
  broadcastToTableSubscribers,
  initializeWebSocketServer
};
