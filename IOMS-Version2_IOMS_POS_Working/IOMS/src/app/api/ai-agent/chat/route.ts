/**
 * 🤖 AI Voice Agent API - Direct interaction without phone
 */

import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  intent?: 'order' | 'reservation' | 'inquiry';
  actionRequired?: boolean;
  actionType?: 'create_order' | 'create_reservation';
  orderData?: any;
  reservationData?: any;
}

interface ChatSession {
  id: string;
  messages: ChatMessage[];
  status: 'active' | 'completed';
  customerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  createdAt: Date;
  completedAt?: Date;
}

// In-memory storage for chat sessions
const chatSessions: Map<string, ChatSession> = new Map();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, message, customerInfo } = body;

    switch (action) {
      case 'start-session':
        return handleStartSession(customerInfo);
      case 'send-message':
        return handleSendMessage(sessionId, message);
      case 'end-session':
        return handleEndSession(sessionId);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in AI agent API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

function handleStartSession(customerInfo?: any) {
  const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const session: ChatSession = {
    id: sessionId,
    messages: [{
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: "Hello! I'm your AI assistant. I can help you place orders, make table reservations, or answer any questions about our restaurant. How can I assist you today?",
      timestamp: new Date()
    }],
    status: 'active',
    customerInfo: customerInfo || {},
    createdAt: new Date()
  };

  chatSessions.set(sessionId, session);

  return NextResponse.json({
    success: true,
    sessionId,
    session,
    message: 'Chat session started'
  });
}

function handleSendMessage(sessionId: string, userMessage: string) {
  const session = chatSessions.get(sessionId);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Session not found' },
      { status: 404 }
    );
  }

  // Add user message
  const userMsgId = `msg_${Date.now()}_user`;
  session.messages.push({
    id: userMsgId,
    role: 'user',
    content: userMessage,
    timestamp: new Date()
  });

  // Process message and generate AI response
  const aiResponse = processAIMessage(userMessage, session);
  
  // Add AI response
  const aiMsgId = `msg_${Date.now()}_ai`;
  session.messages.push({
    id: aiMsgId,
    role: 'assistant',
    content: aiResponse.content,
    timestamp: new Date(),
    intent: aiResponse.intent,
    actionRequired: aiResponse.actionRequired,
    actionType: aiResponse.actionType,
    orderData: aiResponse.orderData,
    reservationData: aiResponse.reservationData
  });

  chatSessions.set(sessionId, session);

  // If action is required, create the order or reservation
  let actionResult = null;
  if (aiResponse.actionRequired) {
    if (aiResponse.actionType === 'create_order' && aiResponse.orderData) {
      actionResult = createOrderInSystem(aiResponse.orderData, sessionId);
    } else if (aiResponse.actionType === 'create_reservation' && aiResponse.reservationData) {
      actionResult = createReservationInSystem(aiResponse.reservationData, sessionId);
    }
  }

  return NextResponse.json({
    success: true,
    session,
    aiResponse: {
      content: aiResponse.content,
      intent: aiResponse.intent,
      actionRequired: aiResponse.actionRequired,
      actionType: aiResponse.actionType,
      orderData: aiResponse.orderData,
      reservationData: aiResponse.reservationData
    },
    actionResult
  });
}

// Helper function to create order in the system
async function createOrderInSystem(orderData: any, sessionId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9003'}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        orderData,
        sessionId
      })
    });

    const result = await response.json();
    if (result.success) {
      console.log('✅ Order created in system:', result.order.orderNumber);
      return {
        success: true,
        type: 'order',
        data: result.order
      };
    } else {
      console.error('❌ Failed to create order:', result.error);
      return {
        success: false,
        type: 'order',
        error: result.error
      };
    }
  } catch (error) {
    console.error('❌ Error creating order:', error);
    return {
      success: false,
      type: 'order',
      error: 'Failed to create order in system'
    };
  }
}

// Helper function to create reservation in the system
async function createReservationInSystem(reservationData: any, sessionId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9003'}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        reservationData,
        sessionId
      })
    });

    const result = await response.json();
    if (result.success) {
      console.log('✅ Reservation created in system:', result.reservation.reservationNumber);
      return {
        success: true,
        type: 'reservation',
        data: result.reservation
      };
    } else {
      console.error('❌ Failed to create reservation:', result.error);
      return {
        success: false,
        type: 'reservation',
        error: result.error
      };
    }
  } catch (error) {
    console.error('❌ Error creating reservation:', error);
    return {
      success: false,
      type: 'reservation',
      error: 'Failed to create reservation in system'
    };
  }
}

function handleEndSession(sessionId: string) {
  const session = chatSessions.get(sessionId);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Session not found' },
      { status: 404 }
    );
  }

  session.status = 'completed';
  session.completedAt = new Date();
  
  // Add farewell message
  session.messages.push({
    id: `msg_${Date.now()}_farewell`,
    role: 'assistant',
    content: "Thank you for using our service! Your order/reservation has been processed. Have a great day!",
    timestamp: new Date()
  });

  chatSessions.set(sessionId, session);

  return NextResponse.json({
    success: true,
    session,
    message: 'Session ended successfully'
  });
}

function processAIMessage(message: string, session: ChatSession) {
  const lowerMessage = message.toLowerCase();
  
  // Detect intent based on keywords
  let intent: 'order' | 'reservation' | 'inquiry' = 'inquiry';
  let actionRequired = false;
  let actionType: 'create_order' | 'create_reservation' | undefined;
  let orderData: any;
  let reservationData: any;

  if (lowerMessage.includes('order') || lowerMessage.includes('food') || lowerMessage.includes('menu') || 
      lowerMessage.includes('pizza') || lowerMessage.includes('burger') || lowerMessage.includes('delivery') ||
      lowerMessage.includes('takeout') || lowerMessage.includes('pickup')) {
    
    intent = 'order';
    
    if (lowerMessage.includes('pizza') || lowerMessage.includes('burger') || 
        lowerMessage.includes('want') || lowerMessage.includes('order')) {
      actionRequired = true;
      actionType = 'create_order';
      
      // Extract order details
      orderData = {
        items: extractOrderItems(message),
        customerInfo: session.customerInfo,
        orderType: lowerMessage.includes('delivery') ? 'delivery' : 
                   lowerMessage.includes('pickup') ? 'pickup' : 'dine-in',
        timestamp: new Date(),
        total: calculateOrderTotal(extractOrderItems(message))
      };
    }
    
    return {
      content: generateOrderResponse(message, orderData),
      intent,
      actionRequired,
      actionType,
      orderData
    };
    
  } else if (lowerMessage.includes('reservation') || lowerMessage.includes('table') || 
             lowerMessage.includes('book') || lowerMessage.includes('reserve') ||
             lowerMessage.includes('party') || lowerMessage.includes('dinner') ||
             lowerMessage.includes('tonight') || lowerMessage.includes('tomorrow')) {
    
    intent = 'reservation';
    
    if (lowerMessage.includes('book') || lowerMessage.includes('reserve') || 
        lowerMessage.includes('table') || lowerMessage.includes('party')) {
      actionRequired = true;
      actionType = 'create_reservation';
      
      // Extract reservation details
      reservationData = {
        partySize: extractPartySize(message),
        date: extractDate(message),
        time: extractTime(message),
        customerInfo: session.customerInfo,
        specialRequests: extractSpecialRequests(message),
        timestamp: new Date()
      };
    }
    
    return {
      content: generateReservationResponse(message, reservationData),
      intent,
      actionRequired,
      actionType,
      reservationData
    };
    
  } else {
    // General inquiry
    return {
      content: generateInquiryResponse(message),
      intent: 'inquiry',
      actionRequired: false
    };
  }
}

function extractOrderItems(message: string): Array<{name: string, quantity: number, price: number}> {
  const items: Array<{name: string, quantity: number, price: number}> = [];
  const lowerMessage = message.toLowerCase();
  
  // Sample menu items with prices
  const menuItems = {
    'pizza': { name: 'Pizza', price: 12.99 },
    'burger': { name: 'Burger', price: 9.99 },
    'pasta': { name: 'Pasta', price: 11.99 },
    'salad': { name: 'Salad', price: 8.99 },
    'sandwich': { name: 'Sandwich', price: 7.99 },
    'chicken': { name: 'Chicken', price: 13.99 },
    'fish': { name: 'Fish', price: 15.99 },
    'steak': { name: 'Steak', price: 18.99 }
  };
  
  for (const [key, item] of Object.entries(menuItems)) {
    if (lowerMessage.includes(key)) {
      // Try to extract quantity
      const quantityMatch = message.match(new RegExp(`(\\d+)\\s*${key}`, 'i'));
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
      
      items.push({
        name: item.name,
        quantity,
        price: item.price
      });
    }
  }
  
  // If no specific items found, add a default item
  if (items.length === 0) {
    items.push({
      name: 'Special of the Day',
      quantity: 1,
      price: 12.99
    });
  }
  
  return items;
}

function calculateOrderTotal(items: Array<{name: string, quantity: number, price: number}>): number {
  return items.reduce((total, item) => total + (item.quantity * item.price), 0);
}

function extractPartySize(message: string): number {
  const sizeMatch = message.match(/(\d+)\s*(people|person|guests?|party)/i);
  return sizeMatch ? parseInt(sizeMatch[1]) : 2;
}

function extractDate(message: string): string {
  const today = new Date();
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('today')) {
    return today.toISOString().split('T')[0];
  } else if (lowerMessage.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  } else {
    // Default to today
    return today.toISOString().split('T')[0];
  }
}

function extractTime(message: string): string {
  const timeMatch = message.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
  if (timeMatch) {
    const hour = parseInt(timeMatch[1]);
    const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const period = timeMatch[3].toLowerCase();
    
    let hour24 = hour;
    if (period === 'pm' && hour !== 12) hour24 += 12;
    if (period === 'am' && hour === 12) hour24 = 0;
    
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }
  
  // Default to 7 PM
  return '19:00';
}

function extractSpecialRequests(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('window')) return 'Window table preferred';
  if (lowerMessage.includes('quiet')) return 'Quiet area preferred';
  if (lowerMessage.includes('birthday')) return 'Birthday celebration';
  if (lowerMessage.includes('anniversary')) return 'Anniversary celebration';
  if (lowerMessage.includes('wheelchair')) return 'Wheelchair accessible table';
  
  return '';
}

function generateOrderResponse(message: string, orderData?: any): string {
  if (orderData) {
    const itemsList = orderData.items.map((item: any) => 
      `${item.quantity}x ${item.name} ($${item.price.toFixed(2)})`
    ).join(', ');
    
    return `Perfect! I've prepared your order:\n\n${itemsList}\n\nTotal: $${orderData.total.toFixed(2)}\nOrder Type: ${orderData.orderType}\n\nYour order has been sent to the kitchen! You'll receive a confirmation shortly. Is there anything else I can help you with?`;
  }
  
  return "I'd be happy to help you place an order! Could you tell me what items you'd like from our menu? We have pizza, burgers, pasta, salads, and more!";
}

function generateReservationResponse(message: string, reservationData?: any): string {
  if (reservationData) {
    return `Excellent! I've booked your table reservation:\n\nParty Size: ${reservationData.partySize} guests\nDate: ${reservationData.date}\nTime: ${reservationData.time}\n${reservationData.specialRequests ? `Special Requests: ${reservationData.specialRequests}\n` : ''}\nYour reservation is confirmed! We'll send you a confirmation email shortly. Looking forward to serving you!`;
  }
  
  return "I'd be happy to help you make a reservation! Could you please tell me how many people will be dining, what date, and what time you'd prefer?";
}

function generateInquiryResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hours') || lowerMessage.includes('open')) {
    return "We're open Monday-Thursday 11am-10pm, Friday-Saturday 11am-11pm, and Sunday 12pm-9pm. We also offer delivery and takeout!";
  }
  
  if (lowerMessage.includes('location') || lowerMessage.includes('address')) {
    return "We're located at 123 Main Street, Downtown. There's plenty of parking available, and we're easily accessible by public transit!";
  }
  
  if (lowerMessage.includes('menu') || lowerMessage.includes('food')) {
    return "We serve a variety of delicious dishes including pizza, burgers, pasta, fresh salads, sandwiches, and daily specials. Would you like me to help you place an order?";
  }
  
  if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    return "Our prices range from $7.99 for sandwiches to $18.99 for our premium steaks. Most entrees are between $9-15. Would you like specific pricing for any items?";
  }
  
  return "I'm here to help! I can assist you with placing orders, making reservations, or answering questions about our restaurant. What would you like to know?";
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (sessionId) {
      const session = chatSessions.get(sessionId);
      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Session not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        session
      });
    }
    
    // Return all active sessions
    const activeSessions = Array.from(chatSessions.values())
      .filter(session => session.status === 'active')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return NextResponse.json({
      success: true,
      sessions: activeSessions,
      total: activeSessions.length
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
