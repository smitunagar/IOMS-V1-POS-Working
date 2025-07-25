/**
 * 📞 Simple Phone System Service
 * Basic functionality for AI call handling with order and reservation creation
 */

export interface PhoneNumber {
  id: string;
  number: string;
  displayName: string;
  isActive: boolean;
  isPrimary: boolean;
  department: 'main' | 'orders' | 'reservations';
  aiEnabled: boolean;
  businessHours: {
    enabled: boolean;
    schedule: {
      [key: string]: { // monday, tuesday, etc.
        open: string; // "09:00"
        close: string; // "22:00"
        isOpen: boolean;
      }
    }
  };
  createdAt: Date;
}

export interface CallLog {
  id: string;
  phoneNumberId: string;
  callerNumber: string;
  duration: number; // in seconds
  timestamp: Date;
  handled: boolean;
  handledBy: 'ai' | 'staff';
  intent: 'order' | 'reservation' | 'inquiry';
  success: boolean;
  orderCreated?: boolean;
  reservationCreated?: boolean;
}

export interface CallSession {
  id: string;
  callSid: string; // Provider's call ID
  phoneNumberId: string;
  callerNumber: string;
  status: 'ringing' | 'in-progress' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  aiProcessed: boolean;
  orderCreated?: boolean;
  reservationCreated?: boolean;
}

// Simple data storage
const phoneNumbers: PhoneNumber[] = [];
const callLogs: CallLog[] = [];
const activeCalls: Map<string, CallSession> = new Map();

// ==========================================
// PHONE NUMBER MANAGEMENT
// ==========================================

export function addPhoneNumber(data: {
  number: string;
  displayName: string;
  isPrimary?: boolean;
  department: 'main' | 'orders' | 'reservations';
  aiEnabled?: boolean;
  businessHours?: any;
}): PhoneNumber {
  const newPhoneNumber: PhoneNumber = {
    id: `phone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    number: data.number,
    displayName: data.displayName,
    isActive: true,
    isPrimary: data.isPrimary || phoneNumbers.length === 0,
    department: data.department,
    aiEnabled: data.aiEnabled ?? true,
    businessHours: data.businessHours || {
      enabled: true,
      schedule: {
        monday: { open: '09:00', close: '21:00', isOpen: true },
        tuesday: { open: '09:00', close: '21:00', isOpen: true },
        wednesday: { open: '09:00', close: '21:00', isOpen: true },
        thursday: { open: '09:00', close: '21:00', isOpen: true },
        friday: { open: '09:00', close: '22:00', isOpen: true },
        saturday: { open: '10:00', close: '22:00', isOpen: true },
        sunday: { open: '10:00', close: '20:00', isOpen: true }
      }
    },
    createdAt: new Date()
  };

  // If this is primary, make others non-primary
  if (newPhoneNumber.isPrimary) {
    phoneNumbers.forEach(phone => phone.isPrimary = false);
  }

  phoneNumbers.push(newPhoneNumber);
  return newPhoneNumber;
}

export function getPhoneNumbers(): PhoneNumber[] {
  return phoneNumbers.sort((a, b) => {
    if (a.isPrimary) return -1;
    if (b.isPrimary) return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

export function getPhoneNumber(id: string): PhoneNumber | undefined {
  return phoneNumbers.find(phone => phone.id === id);
}

export function getPhoneNumberByNumber(number: string): PhoneNumber | null {
  return phoneNumbers.find(p => p.number === number) || null;
}

export function updatePhoneNumber(id: string, updates: Partial<PhoneNumber>): PhoneNumber | null {
  const index = phoneNumbers.findIndex(phone => phone.id === id);
  if (index === -1) return null;
  
  phoneNumbers[index] = { ...phoneNumbers[index], ...updates };
  return phoneNumbers[index];
}

export function deletePhoneNumber(id: string): boolean {
  const index = phoneNumbers.findIndex(phone => phone.id === id);
  if (index === -1) return false;
  
  phoneNumbers.splice(index, 1);
  return true;
}

export function validatePhoneNumber(number: string): { isValid: boolean; formatted: string; errors: string[] } {
  const errors: string[] = [];
  let formatted = number.trim();
  
  // Remove all non-digit characters except + at the start
  const cleanNumber = formatted.replace(/[^\d+]/g, '');
  
  if (!cleanNumber) {
    errors.push('Phone number is required');
    return { isValid: false, formatted: '', errors };
  }
  
  // Basic US phone number validation
  if (cleanNumber.length === 10) {
    formatted = `+1${cleanNumber}`;
  } else if (cleanNumber.length === 11 && cleanNumber.startsWith('1')) {
    formatted = `+${cleanNumber}`;
  } else if (cleanNumber.startsWith('+1') && cleanNumber.length === 12) {
    formatted = cleanNumber;
  } else {
    errors.push('Invalid phone number format. Use 10-digit US number or international format.');
  }
  
  return {
    isValid: errors.length === 0,
    formatted,
    errors
  };
}

// ==========================================
// CALL SESSION MANAGEMENT
// ==========================================

export function createCallSession(data: {
  callSid: string;
  phoneNumberId: string;
  callerNumber: string;
}): CallSession {
  const session: CallSession = {
    id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    callSid: data.callSid,
    phoneNumberId: data.phoneNumberId,
    callerNumber: data.callerNumber,
    status: 'ringing',
    startTime: new Date(),
    aiProcessed: false
  };

  activeCalls.set(session.id, session);
  return session;
}

export function updateCallSession(id: string, updates: Partial<CallSession>): CallSession | null {
  const session = activeCalls.get(id);
  if (!session) return null;

  const updatedSession = { ...session, ...updates };
  activeCalls.set(id, updatedSession);
  
  // If call is completed, log it and remove from active calls
  if (updatedSession.status === 'completed' || updatedSession.status === 'failed') {
    logCall({
      phoneNumberId: updatedSession.phoneNumberId,
      callerNumber: updatedSession.callerNumber,
      duration: updatedSession.duration || 0,
      timestamp: updatedSession.startTime,
      handled: updatedSession.status === 'completed',
      handledBy: updatedSession.aiProcessed ? 'ai' : 'staff',
      intent: updatedSession.orderCreated ? 'order' : updatedSession.reservationCreated ? 'reservation' : 'inquiry',
      success: updatedSession.status === 'completed',
      orderCreated: updatedSession.orderCreated,
      reservationCreated: updatedSession.reservationCreated
    });
    
    activeCalls.delete(id);
  }

  return updatedSession;
}

export function getCallSession(id: string): CallSession | null {
  return activeCalls.get(id) || null;
}

export function getCallSessionBySid(callSid: string): CallSession | null {
  for (const session of activeCalls.values()) {
    if (session.callSid === callSid) {
      return session;
    }
  }
  return null;
}

// ==========================================
// CALL LOGGING
// ==========================================

export function logCall(data: {
  phoneNumberId: string;
  callerNumber: string;
  duration: number;
  timestamp: Date;
  handled: boolean;
  handledBy: 'ai' | 'staff';
  intent: 'order' | 'reservation' | 'inquiry';
  success: boolean;
  orderCreated?: boolean;
  reservationCreated?: boolean;
}): CallLog {
  const callLog: CallLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...data
  };
  
  callLogs.push(callLog);
  return callLog;
}

export function getCallLogs(phoneNumberId?: string): CallLog[] {
  let logs = [...callLogs];
  
  if (phoneNumberId) {
    logs = logs.filter(log => log.phoneNumberId === phoneNumberId);
  }
  
  return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// ==========================================
// BUSINESS HOURS
// ==========================================

export function isWithinBusinessHours(phoneNumberId: string): boolean {
  const phoneNumber = getPhoneNumber(phoneNumberId);
  if (!phoneNumber || !phoneNumber.businessHours.enabled) {
    return true; // If no business hours set, always open
  }

  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
  
  const schedule = phoneNumber.businessHours.schedule[dayName];
  if (!schedule || !schedule.isOpen) {
    return false;
  }
  
  return currentTime >= schedule.open && currentTime <= schedule.close;
}

// ==========================================
// AI CALL PROCESSING
// ==========================================

export function processAICall(
  sessionId: string,
  customerInput: string
): {
  response: string;
  intent: 'order' | 'reservation' | 'inquiry';
  requiresAction: boolean;
  actionType?: 'create_order' | 'create_reservation';
} {
  // Simple intent detection based on keywords
  const input = customerInput.toLowerCase();
  
  if (input.includes('order') || input.includes('pizza') || input.includes('food') || input.includes('menu')) {
    return {
      response: "I'd be happy to help you place an order! What would you like to order today?",
      intent: 'order',
      requiresAction: true,
      actionType: 'create_order'
    };
  }
  
  if (input.includes('reservation') || input.includes('table') || input.includes('book')) {
    return {
      response: "I can help you make a reservation! What date and time would you prefer, and how many people?",
      intent: 'reservation',
      requiresAction: true,
      actionType: 'create_reservation'
    };
  }
  
  return {
    response: "Thank you for calling! How can I help you today? I can take your order or help you make a reservation.",
    intent: 'inquiry',
    requiresAction: false
  };
}

// ==========================================
// SAMPLE DATA
// ==========================================

export function initializeSampleData(): void {
  if (phoneNumbers.length > 0) return; // Already initialized

  // Add sample phone numbers
  addPhoneNumber({
    number: '+1 (555) 123-4567',
    displayName: 'Main Restaurant Line',
    isPrimary: true,
    department: 'main',
    aiEnabled: true
  });

  addPhoneNumber({
    number: '+1 (555) 123-4568',
    displayName: 'Orders & Takeout',
    department: 'orders',
    aiEnabled: true
  });

  // Add sample call logs
  const mainPhoneId = phoneNumbers[0].id;
  const now = new Date();
  
  // Sample calls from today
  for (let i = 0; i < 3; i++) {
    logCall({
      phoneNumberId: mainPhoneId,
      callerNumber: `+1555000${1000 + i}`,
      duration: Math.floor(Math.random() * 180) + 60, // 1-4 minutes
      timestamp: new Date(now.getTime() - Math.random() * 86400000), // Within last 24 hours
      handled: true,
      handledBy: 'ai',
      intent: i === 0 ? 'order' : i === 1 ? 'reservation' : 'inquiry',
      success: true,
      orderCreated: i === 0,
      reservationCreated: i === 1
    });
  }
}
