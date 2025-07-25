/**
 * 📞 Custom Phone System Service
 * Manages restaurant phone numbers and call routing without external dependencies
 */

export interface PhoneNumber {
  id: string;
  number: string;
  displayName: string;
  isActive: boolean;
  isPrimary: boolean;
  department: 'main' | 'orders' | 'reservations' | 'delivery' | 'catering';
  voiceMailEnabled: boolean;
  autoAttendantEnabled: boolean;
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
  updatedAt: Date;
}

export interface CallLog {
  id: string;
  phoneNumberId: string;
  callerNumber: string;
  callType: 'incoming' | 'outgoing' | 'missed';
  duration: number; // seconds
  timestamp: Date;
  handled: boolean;
  handledBy: 'ai' | 'staff' | 'voicemail';
  intent: 'reservation' | 'order' | 'inquiry' | 'complaint' | 'other';
  success: boolean;
  notes?: string;
}

export interface VoiceSettings {
  id: string;
  phoneNumberId: string;
  aiEnabled: boolean;
  voiceName: string;
  speechRate: number;
  volume: number;
  language: string;
  greetingMessage: string;
  transferToStaff: boolean;
  businessHoursOnly: boolean;
  maxCallDuration: number; // minutes
}

// In-memory storage (replace with database in production)
let phoneNumbers: PhoneNumber[] = [];
let callLogs: CallLog[] = [];
let voiceSettings: VoiceSettings[] = [];

/**
 * Phone Number Management
 */
export function addPhoneNumber(data: Omit<PhoneNumber, 'id' | 'createdAt' | 'updatedAt'>): PhoneNumber {
  const phoneNumber: PhoneNumber = {
    id: `phone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // If this is set as primary, make sure no other number is primary
  if (phoneNumber.isPrimary) {
    phoneNumbers.forEach(phone => {
      if (phone.isPrimary) {
        phone.isPrimary = false;
        phone.updatedAt = new Date();
      }
    });
  }

  phoneNumbers.push(phoneNumber);
  
  // Create default voice settings for this number
  createDefaultVoiceSettings(phoneNumber.id);
  
  return phoneNumber;
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

export function getPhoneNumberById(id: string): PhoneNumber | null {
  return phoneNumbers.find(p => p.id === id) || null;
}

export function updatePhoneNumber(id: string, updates: Partial<PhoneNumber>): PhoneNumber | null {
  const index = phoneNumbers.findIndex(phone => phone.id === id);
  if (index === -1) return null;

  // If setting as primary, remove primary from others
  if (updates.isPrimary) {
    phoneNumbers.forEach(phone => {
      if (phone.id !== id && phone.isPrimary) {
        phone.isPrimary = false;
        phone.updatedAt = new Date();
      }
    });
  }

  phoneNumbers[index] = {
    ...phoneNumbers[index],
    ...updates,
    updatedAt: new Date()
  };

  return phoneNumbers[index];
}

export function deletePhoneNumber(id: string): boolean {
  const index = phoneNumbers.findIndex(phone => phone.id === id);
  if (index === -1) return false;

  phoneNumbers.splice(index, 1);
  
  // Remove associated voice settings and call logs
  voiceSettings = voiceSettings.filter(setting => setting.phoneNumberId !== id);
  callLogs = callLogs.filter(log => log.phoneNumberId !== id);
  
  return true;
}

export function getPrimaryPhoneNumber(): PhoneNumber | undefined {
  return phoneNumbers.find(phone => phone.isPrimary && phone.isActive);
}

/**
 * Call Logging
 */
export function logCall(data: Omit<CallLog, 'id'>): CallLog {
  const callLog: CallLog = {
    id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...data
  };

  callLogs.push(callLog);
  return callLog;
}

export function getCallLogs(phoneNumberId?: string, limit?: number): CallLog[] {
  let logs = callLogs;
  
  if (phoneNumberId) {
    logs = logs.filter(log => log.phoneNumberId === phoneNumberId);
  }
  
  logs = logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  if (limit) {
    logs = logs.slice(0, limit);
  }
  
  return logs;
}

export function getCallStats(phoneNumberId?: string, days: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  let logs = callLogs.filter(log => log.timestamp >= cutoffDate);
  
  if (phoneNumberId) {
    logs = logs.filter(log => log.phoneNumberId === phoneNumberId);
  }
  
  const totalCalls = logs.length;
  const successfulCalls = logs.filter(log => log.success).length;
  const aiHandledCalls = logs.filter(log => log.handledBy === 'ai').length;
  const averageDuration = logs.length > 0 
    ? logs.reduce((sum, log) => sum + log.duration, 0) / logs.length 
    : 0;
  
  const intentBreakdown = logs.reduce((acc, log) => {
    acc[log.intent] = (acc[log.intent] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalCalls,
    successfulCalls,
    successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
    aiHandledCalls,
    aiHandlingRate: totalCalls > 0 ? (aiHandledCalls / totalCalls) * 100 : 0,
    averageDuration: Math.round(averageDuration),
    intentBreakdown
  };
}

/**
 * Voice Settings Management
 */
function createDefaultVoiceSettings(phoneNumberId: string): VoiceSettings {
  const settings: VoiceSettings = {
    id: `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    phoneNumberId,
    aiEnabled: true,
    voiceName: 'Google US English',
    speechRate: 1.0,
    volume: 0.8,
    language: 'en-US',
    greetingMessage: "Hello! Welcome to our restaurant. How can I help you today?",
    transferToStaff: true,
    businessHoursOnly: false,
    maxCallDuration: 10
  };

  voiceSettings.push(settings);
  return settings;
}

export function getVoiceSettings(phoneNumberId: string): VoiceSettings | undefined {
  return voiceSettings.find(setting => setting.phoneNumberId === phoneNumberId);
}

export function updateVoiceSettings(phoneNumberId: string, updates: Partial<VoiceSettings>): VoiceSettings | null {
  const index = voiceSettings.findIndex(setting => setting.phoneNumberId === phoneNumberId);
  if (index === -1) return null;

  voiceSettings[index] = {
    ...voiceSettings[index],
    ...updates
  };

  return voiceSettings[index];
}

/**
 * Phone Number Validation
 */
export function validatePhoneNumber(number: string): { isValid: boolean; formatted: string; errors: string[] } {
  const errors: string[] = [];
  let formatted = number.trim();

  // Remove all non-digit characters for validation
  const digitsOnly = formatted.replace(/\D/g, '');

  // Check length
  if (digitsOnly.length < 10) {
    errors.push('Phone number must have at least 10 digits');
  }

  if (digitsOnly.length > 15) {
    errors.push('Phone number cannot exceed 15 digits');
  }

  // Format US numbers
  if (digitsOnly.length === 10) {
    formatted = `+1 (${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    formatted = `+1 (${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`;
  } else {
    formatted = `+${digitsOnly}`;
  }

  // Check for duplicates
  const existingNumber = phoneNumbers.find(phone => 
    phone.number.replace(/\D/g, '') === digitsOnly
  );
  
  if (existingNumber) {
    errors.push('This phone number is already registered');
  }

  return {
    isValid: errors.length === 0,
    formatted,
    errors
  };
}

/**
 * Business Hours Utilities
 */
export function isWithinBusinessHours(phoneNumberId: string): boolean {
  const phoneNumber = getPhoneNumber(phoneNumberId);
  if (!phoneNumber || !phoneNumber.businessHours.enabled) {
    return true; // Always available if business hours not set
  }

  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

  const todaySchedule = phoneNumber.businessHours.schedule[dayName];
  if (!todaySchedule || !todaySchedule.isOpen) {
    return false;
  }

  return currentTime >= todaySchedule.open && currentTime <= todaySchedule.close;
}

export function getBusinessHoursMessage(phoneNumberId: string): string {
  const phoneNumber = getPhoneNumber(phoneNumberId);
  if (!phoneNumber || !phoneNumber.businessHours.enabled) {
    return "We're currently available to take your call.";
  }

  if (isWithinBusinessHours(phoneNumberId)) {
    return "We're currently open and available to help you.";
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const todaySchedule = phoneNumber.businessHours.schedule[today];
  
  if (todaySchedule && todaySchedule.isOpen) {
    return `We're currently closed. Our hours today are ${todaySchedule.open} to ${todaySchedule.close}.`;
  }

  return "We're currently closed. Please call back during business hours.";
}

/**
 * Initialize with sample data for testing
 */
export function initializeSampleData(): void {
  if (phoneNumbers.length > 0) return; // Already initialized

  // Add sample restaurant phone numbers
  addPhoneNumber({
    number: '+1 (555) 123-4567',
    displayName: 'Main Restaurant Line',
    isActive: true,
    isPrimary: true,
    department: 'main',
    voiceMailEnabled: true,
    autoAttendantEnabled: true,
    businessHours: {
      enabled: true,
      schedule: {
        monday: { open: '11:00', close: '22:00', isOpen: true },
        tuesday: { open: '11:00', close: '22:00', isOpen: true },
        wednesday: { open: '11:00', close: '22:00', isOpen: true },
        thursday: { open: '11:00', close: '22:00', isOpen: true },
        friday: { open: '11:00', close: '23:00', isOpen: true },
        saturday: { open: '10:00', close: '23:00', isOpen: true },
        sunday: { open: '10:00', close: '21:00', isOpen: true }
      }
    }
  });

  addPhoneNumber({
    number: '+1 (555) 123-4568',
    displayName: 'Delivery & Takeout Orders',
    isActive: true,
    isPrimary: false,
    department: 'orders',
    voiceMailEnabled: true,
    autoAttendantEnabled: true,
    businessHours: {
      enabled: true,
      schedule: {
        monday: { open: '11:00', close: '21:30', isOpen: true },
        tuesday: { open: '11:00', close: '21:30', isOpen: true },
        wednesday: { open: '11:00', close: '21:30', isOpen: true },
        thursday: { open: '11:00', close: '21:30', isOpen: true },
        friday: { open: '11:00', close: '22:30', isOpen: true },
        saturday: { open: '10:00', close: '22:30', isOpen: true },
        sunday: { open: '10:00', close: '20:30', isOpen: true }
      }
    }
  });

  // Add some sample call logs
  const mainPhoneId = phoneNumbers[0].id;
  const now = new Date();
  
  // Sample calls from today
  for (let i = 0; i < 5; i++) {
    logCall({
      phoneNumberId: mainPhoneId,
      callerNumber: `+1555000${1000 + i}`,
      callType: 'incoming',
      duration: Math.floor(Math.random() * 300) + 60, // 1-6 minutes
      timestamp: new Date(now.getTime() - Math.random() * 86400000), // Within last 24 hours
      handled: true,
      handledBy: Math.random() > 0.3 ? 'ai' : 'staff',
      intent: ['reservation', 'order', 'inquiry'][Math.floor(Math.random() * 3)] as any,
      success: Math.random() > 0.15, // 85% success rate
      notes: i === 0 ? 'Customer was very satisfied with AI service' : undefined
    });
  }
}

// ==========================================
// REAL VOIP INTEGRATION SERVICES
// ==========================================

export interface VoIPProvider {
  id: string;
  name: string;
  type: 'twilio' | 'vonage' | 'plivo' | 'bandwidth';
  isActive: boolean;
  credentials: {
    accountSid?: string;
    authToken?: string;
    apiKey?: string;
    apiSecret?: string;
    applicationId?: string;
    privateKey?: string;
  };
  webhookUrls: {
    incomingCall: string;
    callStatus: string;
    recording: string;
  };
  settings: {
    recordCalls: boolean;
    transcribeVoice: boolean;
    enableAI: boolean;
    maxCallDuration: number; // in seconds
    callForwarding?: string; // backup number
  };
}

export interface CallSession {
  id: string;
  callSid: string; // Provider's call ID
  phoneNumberId: string;
  callerNumber: string;
  status: 'ringing' | 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  recordingUrl?: string;
  transcriptUrl?: string;
  aiProcessed: boolean;
  aiAgentId?: string;
  orderCreated?: boolean;
  reservationCreated?: boolean;
  customerSatisfaction?: number; // 1-5 rating
  metadata: {
    voipProvider: string;
    callDirection: 'inbound' | 'outbound';
    sipHeaders?: Record<string, string>;
    transferHistory?: Array<{
      fromNumber: string;
      toNumber: string;
      timestamp: Date;
      reason: string;
    }>;
  };
}

// VoIP Provider configurations
const voipProviders: VoIPProvider[] = [];

// Active call sessions
const activeCalls: Map<string, CallSession> = new Map();

// ==========================================
// VOIP PROVIDER MANAGEMENT
// ==========================================

export function addVoIPProvider(provider: Omit<VoIPProvider, 'id'>): VoIPProvider {
  const newProvider: VoIPProvider = {
    id: `provider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...provider
  };
  voipProviders.push(newProvider);
  return newProvider;
}

export function getVoIPProviders(): VoIPProvider[] {
  return [...voipProviders];
}

export function getActiveVoIPProvider(): VoIPProvider | null {
  return voipProviders.find(p => p.isActive) || null;
}

export function updateVoIPProvider(id: string, updates: Partial<VoIPProvider>): VoIPProvider | null {
  const index = voipProviders.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  voipProviders[index] = { ...voipProviders[index], ...updates };
  return voipProviders[index];
}

export function deleteVoIPProvider(id: string): boolean {
  const index = voipProviders.findIndex(p => p.id === id);
  if (index === -1) return false;
  
  voipProviders.splice(index, 1);
  return true;
}

// ==========================================
// REAL PHONE NUMBER PROVISIONING
// ==========================================

export interface PhoneNumberProvisionRequest {
  areaCode?: string;
  country: string;
  state?: string;
  city?: string;
  pattern?: string; // e.g., "*FOOD*" for numbers containing FOOD
  quantity: number;
  type: 'local' | 'toll-free' | 'mobile';
}

export interface ProvisionedNumber {
  phoneNumber: string;
  friendlyName: string;
  country: string;
  region: string;
  locality: string;
  postalCode: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
    fax: boolean;
  };
  monthlyPrice: number;
  setupFee: number;
  providerId: string;
}

export async function searchAvailableNumbers(
  request: PhoneNumberProvisionRequest
): Promise<ProvisionedNumber[]> {
  const provider = getActiveVoIPProvider();
  if (!provider) {
    throw new Error('No active VoIP provider configured');
  }

  // This would integrate with actual VoIP provider APIs
  // For now, return mock data structure
  return [
    {
      phoneNumber: '+15551234567',
      friendlyName: 'Restaurant Main Line',
      country: 'US',
      region: 'CA',
      locality: 'San Francisco',
      postalCode: '94102',
      capabilities: {
        voice: true,
        sms: true,
        mms: false,
        fax: false
      },
      monthlyPrice: 1.00,
      setupFee: 0.00,
      providerId: provider.id
    }
  ];
}

export async function provisionPhoneNumber(
  phoneNumber: string,
  config: {
    department: string;
    displayName: string;
    enableAI: boolean;
    forwardToNumber?: string;
  }
): Promise<PhoneNumber> {
  const provider = getActiveVoIPProvider();
  if (!provider) {
    throw new Error('No active VoIP provider configured');
  }

  // Create webhook URLs for this number
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.com';
  const webhookUrl = `${baseUrl}/api/phone/webhooks/${provider.type}`;

  try {
    // This would call the actual VoIP provider API to provision the number
    // and configure webhooks
    
    // Add to our system
    const newPhoneNumber = addPhoneNumber({
      number: phoneNumber,
      displayName: config.displayName,
      isActive: true,
      isPrimary: false,
      department: config.department as any,
      voiceMailEnabled: true,
      autoAttendantEnabled: config.enableAI,
      businessHours: {
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
      }
    });

    return newPhoneNumber;
  } catch (error) {
    console.error('Failed to provision phone number:', error);
    throw new Error('Failed to provision phone number');
  }
}

// ==========================================
// CALL SESSION MANAGEMENT
// ==========================================

export function createCallSession(data: {
  callSid: string;
  phoneNumberId: string;
  callerNumber: string;
  voipProvider: string;
}): CallSession {
  const session: CallSession = {
    id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    callSid: data.callSid,
    phoneNumberId: data.phoneNumberId,
    callerNumber: data.callerNumber,
    status: 'ringing',
    startTime: new Date(),
    aiProcessed: false,
    metadata: {
      voipProvider: data.voipProvider,
      callDirection: 'inbound'
    }
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
      callType: 'incoming',
      duration: updatedSession.duration || 0,
      timestamp: updatedSession.startTime,
      handled: updatedSession.status === 'completed',
      handledBy: updatedSession.aiProcessed ? 'ai' : 'staff',
      intent: updatedSession.orderCreated ? 'order' : updatedSession.reservationCreated ? 'reservation' : 'inquiry',
      success: updatedSession.status === 'completed',
      notes: `VoIP Call (${updatedSession.metadata.voipProvider})`
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

export function getActiveCalls(): CallSession[] {
  return Array.from(activeCalls.values());
}

// ==========================================
// AI AGENT CALL PROCESSING
// ==========================================

export interface AICallProcessor {
  sessionId: string;
  agentId: string;
  currentIntent: 'greeting' | 'menu_inquiry' | 'ordering' | 'reservation' | 'complaint' | 'transfer';
  conversationState: {
    customerName?: string;
    phoneNumber?: string;
    currentOrder?: any;
    currentReservation?: any;
    requiresHumanAssistance: boolean;
  };
  transcript: Array<{
    speaker: 'customer' | 'ai';
    text: string;
    timestamp: Date;
    confidence?: number;
  }>;
}

const aiCallProcessors: Map<string, AICallProcessor> = new Map();

export function initializeAICallProcessor(sessionId: string): AICallProcessor {
  const processor: AICallProcessor = {
    sessionId,
    agentId: `ai_agent_${Date.now()}`,
    currentIntent: 'greeting',
    conversationState: {
      requiresHumanAssistance: false
    },
    transcript: []
  };

  aiCallProcessors.set(sessionId, processor);
  return processor;
}

export function processAICallInput(
  sessionId: string,
  audioData: string,
  speaker: 'customer' | 'ai'
): {
  transcription: string;
  response?: string;
  intent?: string;
  requiresAction?: boolean;
  actionType?: 'create_order' | 'create_reservation' | 'transfer_to_human';
} {
  const processor = aiCallProcessors.get(sessionId);
  if (!processor) {
    throw new Error('AI call processor not found');
  }

  // This would integrate with actual speech-to-text and AI processing
  // For now, return mock response structure
  const mockTranscription = "I'd like to make a reservation for 2 people tonight at 7 PM";
  
  processor.transcript.push({
    speaker,
    text: mockTranscription,
    timestamp: new Date(),
    confidence: 0.95
  });

  // Update intent based on conversation
  if (mockTranscription.includes('reservation')) {
    processor.currentIntent = 'reservation';
  } else if (mockTranscription.includes('order')) {
    processor.currentIntent = 'ordering';
  }

  return {
    transcription: mockTranscription,
    response: "I'd be happy to help you with a reservation. Let me check our availability for tonight at 7 PM for 2 people.",
    intent: processor.currentIntent,
    requiresAction: true,
    actionType: 'create_reservation'
  };
}

export function getAICallProcessor(sessionId: string): AICallProcessor | null {
  return aiCallProcessors.get(sessionId) || null;
}

export function endAICallProcessor(sessionId: string): void {
  aiCallProcessors.delete(sessionId);
}

// ==========================================
// WEBHOOK HELPERS
// ==========================================

export function generateWebhookResponse(
  provider: 'twilio' | 'vonage' | 'plivo',
  action: 'answer' | 'reject' | 'forward' | 'voicemail',
  options: {
    message?: string;
    forwardTo?: string;
    recordCall?: boolean;
    enableAI?: boolean;
  } = {}
): string {
  switch (provider) {
    case 'twilio':
      return generateTwilioTwiML(action, options);
    case 'vonage':
      return generateVonageNCCO(action, options);
    case 'plivo':
      return generatePlivoXML(action, options);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

function generateTwilioTwiML(
  action: string,
  options: any
): string {
  switch (action) {
    case 'answer':
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Thank you for calling! Your order is important to us. Please hold while I connect you with our AI assistant.</Say>
    ${options.recordCall ? '<Record action="/api/phone/webhooks/twilio/recording" transcribe="true" transcribeCallback="/api/phone/webhooks/twilio/transcription" />' : ''}
    <Redirect>/api/phone/webhooks/twilio/ai-agent</Redirect>
</Response>`;
    case 'voicemail':
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">We're currently closed or busy. Please leave a message after the beep.</Say>
    <Record action="/api/phone/webhooks/twilio/voicemail" maxLength="120" finishOnKey="#" />
    <Say voice="Polly.Joanna">Thank you for your message. We'll get back to you soon!</Say>
</Response>`;
    default:
      return `<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`;
  }
}

function generateVonageNCCO(action: string, options: any): string {
  const ncco = [];
  
  switch (action) {
    case 'answer':
      ncco.push({
        action: 'talk',
        text: 'Thank you for calling! Your order is important to us. Please hold while I connect you with our AI assistant.',
        voiceName: 'Amy'
      });
      if (options.recordCall) {
        ncco.push({
          action: 'record',
          eventUrl: ['/api/phone/webhooks/vonage/recording'],
          transcription: {
            transcriptionEngine: 'automated',
            eventUrl: ['/api/phone/webhooks/vonage/transcription']
          }
        });
      }
      break;
    case 'voicemail':
      ncco.push({
        action: 'talk',
        text: "We're currently closed or busy. Please leave a message after the beep."
      });
      ncco.push({
        action: 'record',
        eventUrl: ['/api/phone/webhooks/vonage/voicemail'],
        timeOut: 120,
        endOnSilence: 3
      });
      break;
  }
  
  return JSON.stringify(ncco);
}

function generatePlivoXML(action: string, options: any): string {
  switch (action) {
    case 'answer':
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Speak voice="WOMAN">Thank you for calling! Your order is important to us. Please hold while I connect you with our AI assistant.</Speak>
    ${options.recordCall ? '<Record action="/api/phone/webhooks/plivo/recording" transcriptionType="auto" transcriptionUrl="/api/phone/webhooks/plivo/transcription" />' : ''}
    <Redirect>/api/phone/webhooks/plivo/ai-agent</Redirect>
</Response>`;
    default:
      return `<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`;
  }
}
