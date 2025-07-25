/**
 * 🤖 IOMS Voice AI Agent - Core Engine
 * Custom voice calling agent for restaurant orders and reservations
 */

// Web Speech API TypeScript declarations
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface VoiceConfig {
  language: string;
  voiceIndex: number;
  rate: number;
  pitch: number;
  volume: number;
  voiceName: string;
  persona: {
    name: string;
    role: string;
    restaurant: string;
    language: string;
  };
}

interface ConversationState {
  phase: 'greeting' | 'listening' | 'collecting_info' | 'confirming' | 'processing' | 'completed';
  intent: 'order' | 'reservation' | 'delivery' | 'inquiry' | 'complaint' | 'hours' | 'menu_question' | 'unknown' | 'delivery_status' | 'delivery_options' | 'delivery_time' | 'location' | 'parking' | 'dietary' | 'catering';
  conversationFlow: 'initial' | 'collecting_customer_info' | 'collecting_order_details' | 'collecting_delivery_info' | 'finalizing' | 'delivery_status' | 'delivery_info' | 'collecting_address' | 'inquiry_handling';
  customerData: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    preferredContact?: 'phone' | 'email' | 'sms';
    isReturningCustomer?: boolean;
    customerNotes?: string;
  };
  orderData: {
    items: Array<{
      name: string;
      quantity: number;
      specialInstructions?: string;
      price?: number;
    }>;
    total?: number;
    orderType: 'dine-in' | 'takeout' | 'delivery';
    deliveryAddress?: string;
    deliveryInstructions?: string;
    preferredTime?: string;
    paymentMethod?: 'cash' | 'card' | 'online';
    specialRequests?: string;
  };
  reservationData: {
    partySize?: number;
    date?: string;
    time?: string;
    specialRequests?: string;
    occasion?: string;
    seatingPreference?: string;
  };
  inquiryData: {
    topic?: 'hours' | 'menu' | 'location' | 'parking' | 'dietary' | 'catering' | 'other';
    question?: string;
    response?: string;
  };
  confidence: number;
  transcript: string[];
  needsHumanAssistance: boolean;
  currentQuestion?: string;
  expectedResponse?: 'name' | 'phone' | 'address' | 'order_type' | 'time' | 'confirmation' | 'menu_item';
}

export class VoiceAIAgent {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private config: VoiceConfig;
  private state: ConversationState = {
    phase: 'greeting',
    intent: 'unknown',
    conversationFlow: 'initial',
    customerData: {},
    orderData: { items: [], orderType: 'dine-in' },
    reservationData: {},
    inquiryData: {},
    confidence: 0,
    transcript: [],
    needsHumanAssistance: false
  };
  private isListening: boolean = false;
  private onStateChange?: (state: ConversationState) => void;

  constructor(config: Partial<VoiceConfig> = {}) {
    this.config = {
      language: 'en-US',
      voiceIndex: 0,
      rate: 0.9,
      pitch: 1.1,
      volume: 1.0,
      voiceName: 'Microsoft Zira - English (United States)',
      persona: {
        name: 'Sam',
        role: 'AI receptionist and phone order assistant',
        restaurant: 'Museum Restaurant Hechingen',
        language: 'English'
      },
      ...config
    };

    this.synthesis = window.speechSynthesis;
    
    // Load voices immediately for Sam
    this.loadVoices();
    
    // Listen for voices changed event
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => {
        console.log('🎤 Voices loaded/changed for Sam');
        this.loadVoices();
      };
    }
    
    this.resetConversation(); // Initialize state first
    this.initializeSpeechRecognition();
  }

  private loadVoices() {
    const voices = this.synthesis.getVoices();
    console.log('🎤 Loading voices for Sam. Available:', voices.length);
    
    // Find the best female voice for Sam
    const femaleVoice = this.findBestFemaleVoice(voices);
    if (femaleVoice) {
      console.log('🎤 Sam will use voice:', femaleVoice.name);
      this.config.voiceName = femaleVoice.name;
    }
  }

  private findBestFemaleVoice(voices: SpeechSynthesisVoice[]) {
    const preferredVoices = [
      'Microsoft Zira Desktop - English (United States)',
      'Microsoft Zira - English (United States)', 
      'Google US English Female',
      'Microsoft Eva - English (United States)',
      'Microsoft Aria - English (United States)',
      'Samantha',
      'Victoria',
      'Karen',
      'Moira'
    ];
    
    // Try preferred voices first
    for (const voiceName of preferredVoices) {
      const voice = voices.find(v => 
        v.name.includes(voiceName) || 
        v.name.toLowerCase().includes(voiceName.toLowerCase())
      );
      if (voice) return voice;
    }
    
    // Fallback to any female voice
    return voices.find(voice => {
      const name = voice.name.toLowerCase();
      return name.includes('female') ||
             name.includes('woman') ||
             name.includes('zira') ||
             name.includes('eva') ||
             name.includes('aria') ||
             name.includes('samantha') ||
             name.includes('karen') ||
             name.includes('moira') ||
             name.includes('victoria');
    });
  }

  private initializeSpeechRecognition() {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      if (this.recognition) {
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.config.language;
        this.recognition.maxAlternatives = 1;

        this.recognition.onresult = this.handleSpeechResult.bind(this);
        this.recognition.onerror = this.handleSpeechError.bind(this);
        this.recognition.onend = this.handleSpeechEnd.bind(this);
      }
    }
  }

  private resetConversation() {
    this.state = {
      phase: 'greeting',
      intent: 'unknown',
      conversationFlow: 'initial',
      customerData: {},
      orderData: {
        items: [],
        orderType: 'dine-in'
      },
      reservationData: {},
      inquiryData: {},
      confidence: 0,
      transcript: [],
      needsHumanAssistance: false
    };
    
    // Welcome the customer warmly for a fresh start
    this.speak("Thank you for calling Museum Restaurant Hechingen! This is Sam, your friendly assistant. How may I help you today?");
  }

  private handleSpeechResult(event: SpeechRecognitionEvent) {
    const result = event.results[event.results.length - 1];
    const transcript = result[0].transcript.trim();
    
    if (result.isFinal) {
      console.log('🎤 Customer said:', transcript);
      this.state.transcript.push(`Customer: ${transcript}`);
      this.processCustomerInput(transcript);
    }
  }

  private handleSpeechError(event: SpeechRecognitionErrorEvent) {
    console.error('🎤 Speech recognition error:', event.error);
    
    if (event.error === 'no-speech') {
      this.speak("I'm sorry, I didn't catch that. Could you please repeat what you said?");
    } else if (event.error === 'audio-capture') {
      this.speak("I'm having a bit of trouble hearing you clearly. Could you please check your microphone?");
    } else {
      this.speak("I apologize, I'm experiencing some technical difficulties. Let me connect you with one of our team members for assistance.");
      this.state.needsHumanAssistance = true;
    }
    
    this.updateState();
  }

  private handleSpeechEnd() {
    if (this.isListening && this.state.phase !== 'completed') {
      // Restart listening if we're still in conversation
      setTimeout(() => {
        if (this.isListening) {
          this.recognition?.start();
        }
      }, 100);
    }
  }

  private async processCustomerInput(transcript: string) {
    // Update conversation state based on current phase
    switch (this.state.phase) {
      case 'greeting':
        await this.handleGreetingPhase(transcript);
        break;
      case 'listening':
        await this.handleListeningPhase(transcript);
        break;
      case 'confirming':
        await this.handleConfirmingPhase(transcript);
        break;
      default:
        await this.handleGenericInput(transcript);
    }
    
    this.updateState();
  }

  private async handleGreetingPhase(transcript: string) {
    // Use enhanced intent detection for better understanding
    const enhancedIntent = this.detectEnhancedIntent(transcript);
    console.log('🎯 Sam detected intent from greeting:', enhancedIntent);
    
    // Set conversation flow based on enhanced intent
    switch (enhancedIntent) {
      case 'reservation':
        this.state.intent = 'reservation';
        this.state.phase = 'listening';
        this.state.conversationFlow = 'collecting_customer_info';
        this.speak("Wonderful! I'd be delighted to help you with a reservation at Museum Restaurant Hechingen. How many guests will be joining you?");
        break;
        
      case 'order':
        this.state.intent = 'order';
        this.state.phase = 'listening';
        this.state.conversationFlow = 'collecting_order_details';
        this.speak("Perfect! I'd be happy to take your order today. What delicious items can I get started for you from our menu?");
        break;
        
      case 'delivery_options':
      case 'delivery_time':
      case 'delivery_status':
        this.state.intent = enhancedIntent as any;
        this.state.phase = 'listening';
        this.handleDeliveryInquiry(enhancedIntent, transcript);
        break;
        
      case 'hours':
      case 'location':
      case 'parking':
      case 'dietary':
      case 'catering':
        this.state.intent = enhancedIntent as any;
        this.state.phase = 'listening';
        this.state.conversationFlow = 'inquiry_handling';
        this.handleGeneralInquiry(enhancedIntent);
        break;
        
      default:
        this.state.phase = 'listening';
        this.speak("I'm here to help! Would you like to place a food order for pickup or delivery, make a table reservation, or do you have questions about our restaurant?");
    }
  }

  private async handleListeningPhase(transcript: string) {
    const lowerTranscript = transcript.toLowerCase();
    
    // First check if we're in a specific conversation flow for customer information
    if (this.state.expectedResponse) {
      const handled = this.handleCustomerInformationFlow(this.state.expectedResponse, transcript);
      if (handled) return;
    }
    
    // Use enhanced intent detection
    const enhancedIntent = this.detectEnhancedIntent(transcript);
    console.log('🧠 Sam detected enhanced intent:', enhancedIntent);
    
    // Handle new intent types for comprehensive assistant
    if (enhancedIntent.startsWith('delivery_')) {
      this.state.intent = enhancedIntent as any;
      const handled = this.handleDeliveryInquiry(enhancedIntent, transcript);
      if (handled) return;
    }
    
    if (['hours', 'location', 'parking', 'dietary', 'catering'].includes(enhancedIntent)) {
      this.state.intent = enhancedIntent as any;
      this.state.conversationFlow = 'inquiry_handling';
      const handled = this.handleGeneralInquiry(enhancedIntent);
      if (handled) return;
    }
    
    // Handle existing intents
    if (this.state.intent === 'reservation') {
      await this.processReservationInfo(transcript);
    } else if (this.state.intent === 'order') {
      await this.processOrderInfo(transcript);
    } else {
      // Try to determine intent if still unknown
      if (this.containsWords(lowerTranscript, ['reservation', 'table'])) {
        this.state.intent = 'reservation';
        await this.processReservationInfo(transcript);
      } else if (this.containsWords(lowerTranscript, ['order', 'food', 'menu'])) {
        this.state.intent = 'order';
        await this.processOrderInfo(transcript);
      } else {
        this.speak("I'm here to assist you! Would you like to place a food order or make a reservation at Museum Restaurant Hechingen?");
      }
    }
  }

  private async processReservationInfo(transcript: string) {
    const extracted = this.extractReservationData(transcript);
    
    // Update reservation data
    if (extracted.partySize) this.state.reservationData.partySize = extracted.partySize;
    if (extracted.date) this.state.reservationData.date = extracted.date;
    if (extracted.time) this.state.reservationData.time = extracted.time;
    if (extracted.name) this.state.customerData.name = extracted.name;
    
    // Check what information we still need
    const missing = this.getMissingReservationInfo();
    
    if (missing.length > 0) {
      this.askForMissingInfo(missing, 'reservation');
    } else {
      this.state.phase = 'confirming';
      await this.confirmReservation();
    }
  }

  private async processOrderInfo(transcript: string) {
    const extracted = await this.extractOrderData(transcript);
    
    // Add items to order
    if (extracted.items.length > 0) {
      this.state.orderData.items.push(...extracted.items);
    }
    
    if (extracted.orderType) {
      this.state.orderData.orderType = extracted.orderType;
    }
    
    if (extracted.name) {
      this.state.customerData.name = extracted.name;
    }
    
    // Check if order seems complete
    if (this.state.orderData.items.length > 0) {
      this.speak("Excellent! I've got that added to your order. Would you like to add anything else, or shall I review your order with you?");
    } else {
      this.speak("I'd be delighted to help you with your order! What wonderful dishes can I get started for you today?");
    }
  }

  private extractReservationData(transcript: string) {
    const data: any = {};
    
    // Extract party size
    const partyMatch = transcript.match(/(\d+)\s*(people|person|guests?|party)/i);
    if (partyMatch) {
      data.partySize = parseInt(partyMatch[1]);
    }
    
    // Extract time
    const timeMatch = transcript.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM))/i);
    if (timeMatch) {
      data.time = timeMatch[1];
    }
    
    // Extract date
    const dateWords = ['today', 'tomorrow', 'tonight', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const dateWord of dateWords) {
      if (transcript.toLowerCase().includes(dateWord)) {
        data.date = dateWord;
        break;
      }
    }
    
    // Extract name
    const nameMatch = transcript.match(/(?:name is|I'm|this is)\s+([A-Za-z\s]+)/i);
    if (nameMatch) {
      data.name = nameMatch[1].trim();
    }
    
    return data;
  }

  private async extractOrderData(transcript: string) {
    const data: any = { items: [] };
    
    console.log('[Voice AI Agent] Extracting order from transcript:', transcript);
    
    // Use the AI-powered order extraction instead of hardcoded menu items
    try {
      const response = await fetch('/api/ai/extract-order-from-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcript
        })
      });
      
      if (response.ok) {
        const aiResult = await response.json();
        console.log('[Voice AI Agent] AI extraction result:', aiResult);
        
        if (aiResult.orderType) {
          data.orderType = aiResult.orderType;
        }
        
        if (aiResult.items && Array.isArray(aiResult.items)) {
          data.items = aiResult.items.map((item: any) => ({
            name: item.name,
            quantity: Math.max(1, item.quantity || 1), // Ensure minimum quantity of 1
            specialInstructions: item.specialInstructions
          }));
        }
        
        // Extract customer info if available
        if (aiResult.customerName) {
          this.state.customerData.name = aiResult.customerName;
        }
        if (aiResult.customerPhone) {
          this.state.customerData.phone = aiResult.customerPhone;
        }
        
        console.log('[Voice AI Agent] Extracted items:', data.items);
      } else {
        console.warn('[Voice AI Agent] AI extraction failed, using fallback');
        // Fallback to simple word matching
        data.items = this.fallbackOrderExtraction(transcript);
      }
    } catch (error) {
      console.error('[Voice AI Agent] Error in AI extraction:', error);
      // Fallback to simple word matching
      data.items = this.fallbackOrderExtraction(transcript);
    }
    
    // Extract order type if not already set
    if (!data.orderType) {
      if (this.containsWords(transcript, ['delivery'])) {
        data.orderType = 'delivery';
      } else if (this.containsWords(transcript, ['takeout', 'pickup', 'take out'])) {
        data.orderType = 'takeout';
      } else {
        data.orderType = 'dine-in';
      }
    }
    
    return data;
  }
  
  private fallbackOrderExtraction(transcript: string) {
    const items: any[] = [];
    
    // Look for common quantity words and numbers
    const text = transcript.toLowerCase();
    
    // Check for biryani specifically since that's your issue
    if (text.includes('biryani')) {
      const biryaniMatch = text.match(/(\d+|one|two|three|four|five)\s*(chicken|vegetable|beef|mutton)?\s*biryani/i);
      if (biryaniMatch) {
        const quantityText = biryaniMatch[1];
        const type = biryaniMatch[2] || 'chicken';
        
        let quantity = 1;
        if (quantityText.match(/\d+/)) {
          quantity = parseInt(quantityText);
        } else if (quantityText === 'one') quantity = 1;
        else if (quantityText === 'two') quantity = 2;
        else if (quantityText === 'three') quantity = 3;
        else if (quantityText === 'four') quantity = 4;
        else if (quantityText === 'five') quantity = 5;
        
        items.push({
          name: `${type} biryani`,
          quantity: quantity,
          specialInstructions: undefined
        });
      }
    }
    
    // Check for samosa
    if (text.includes('samosa')) {
      const samosaMatch = text.match(/(\d+|one|two|three|four|five)\s*(vegetable|chicken|beef|meat)?\s*samosa/i);
      if (samosaMatch) {
        const quantityText = samosaMatch[1];
        const type = samosaMatch[2] || 'vegetable';
        
        let quantity = 1;
        if (quantityText.match(/\d+/)) {
          quantity = parseInt(quantityText);
        } else if (quantityText === 'one') quantity = 1;
        else if (quantityText === 'two') quantity = 2;
        
        items.push({
          name: `${type} samosa`,
          quantity: quantity,
          specialInstructions: undefined
        });
      }
    }
    
    console.log('[Voice AI Agent] Fallback extraction found:', items);
    return items;
  }

  private extractSpecialInstructions(transcript: string): string | undefined {
    // Look for common instruction phrases
    const instructionPhrases = [
      'no onions', 'extra cheese', 'well done', 'medium rare', 'no pickles',
      'on the side', 'extra sauce', 'light sauce', 'no sauce'
    ];
    
    for (const phrase of instructionPhrases) {
      if (transcript.toLowerCase().includes(phrase)) {
        return phrase;
      }
    }
    
    return undefined;
  }

  private getMissingReservationInfo(): string[] {
    const missing = [];
    
    if (!this.state.reservationData.partySize) missing.push('party size');
    if (!this.state.reservationData.date) missing.push('date');
    if (!this.state.reservationData.time) missing.push('time');
    if (!this.state.customerData.name) missing.push('name');
    
    return missing;
  }

  private askForMissingInfo(missing: string[], type: 'reservation' | 'order') {
    const questions: Record<string, string> = {
      'party size': 'How many people will be dining?',
      'date': 'What date would you like the reservation for?',
      'time': 'What time would you prefer?',
      'name': 'Could I get a name for the reservation?',
      'phone': 'Could I get a phone number for the reservation?'
    };
    
    const question = questions[missing[0]];
    if (question) {
      this.speak(question);
    }
  }

  private async confirmReservation() {
    const { partySize, date, time } = this.state.reservationData;
    const { name } = this.state.customerData;
    
    const confirmation = `Perfect! I have a reservation for ${partySize} people under ${name} for ${date} at ${time}. Is this correct?`;
    this.speak(confirmation);
  }

  private async handleConfirmingPhase(transcript: string) {
    const lowerTranscript = transcript.toLowerCase();
    
    if (this.containsWords(lowerTranscript, ['yes', 'correct', 'right', 'confirm'])) {
      this.state.phase = 'processing';
      
      if (this.state.intent === 'reservation') {
        await this.processReservation();
      } else if (this.state.intent === 'order') {
        await this.processOrder();
      }
    } else if (this.containsWords(lowerTranscript, ['no', 'wrong', 'incorrect'])) {
      this.state.phase = 'listening';
      this.speak("Certainly! Let me just make those changes for you. What would you like to update?");
    }
  }

  private async processReservation() {
    try {
      this.speak("Perfect! Let me process your reservation right away. This will just take a moment...");
      
      // Create reservation in IOMS
      const reservationData = {
        customer_name: this.state.customerData.name,
        customer_phone: this.state.customerData.phone || 'From Voice Call',
        party_size: this.state.reservationData.partySize,
        reservation_datetime: this.formatDateTime(
          this.state.reservationData.date,
          this.state.reservationData.time
        ),
        special_requests: this.state.reservationData.specialRequests,
        source: 'voice-ai-agent',
        status: 'confirmed'
      };
      
      const response = await fetch('/api/voice-agent/reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData)
      });
      
      if (response.ok) {
        const result = await response.json();
        this.speak(`Great! Your reservation has been confirmed. Your reservation number is ${result.reservation_id}. We look forward to seeing you!`);
        this.state.phase = 'completed';
      } else {
        throw new Error('Failed to create reservation');
      }
    } catch (error) {
      console.error('Error processing reservation:', error);
      this.speak("I'm sorry, there was an issue processing your reservation. Let me transfer you to our staff for assistance.");
      this.state.needsHumanAssistance = true;
    }
  }

  private async processOrder() {
    try {
      this.speak("Wonderful! Let me get this order prepared for you right away. This will just take a moment...");
      
      // Use the correct create-order API that integrates with menu system
      const orderData = {
        userId: process.env.NEXT_PUBLIC_DEFAULT_USER_ID || 'user_1752538556589_u705p8e0q',
        customerName: this.state.customerData.name || 'Voice Customer',
        items: this.state.orderData.items.map(item => ({
          itemName: item.name,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions || ''
        })),
        orderType: this.state.orderData.orderType,
        tableId: this.state.orderData.orderType === 'dine-in' ? 't1' : undefined,
        customerPhone: this.state.customerData.phone,
        customerAddress: this.state.orderData.deliveryAddress
      };
      
      console.log('[Voice AI Agent] Creating order with data:', orderData);
      
      const response = await fetch('/api/voice-agent/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const orderNumber = result.orderNumber;
          const total = result.orderDetails.totalAmount;
          this.speak(`Excellent! Your order has been successfully placed at Museum Restaurant Hechingen. Your order number is ${orderNumber}. Your total comes to $${total.toFixed(2)}. We'll have your delicious meal ready shortly! Is there anything else I can assist you with today?`);
          this.state.phase = 'completed';
        } else {
          throw new Error(result.error || 'Failed to create order');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error processing order:', error);
      this.speak("I apologize, but I'm experiencing a technical difficulty with your order. Let me connect you with one of our team members who can help you complete this right away.");
      this.state.needsHumanAssistance = true;
    }
  }

  private formatDateTime(date?: string, time?: string): string {
    const now = new Date();
    let targetDate = new Date();
    
    if (date === 'tomorrow') {
      targetDate.setDate(now.getDate() + 1);
    } else if (date === 'today' || date === 'tonight') {
      // Keep current date
    } else if (date) {
      // Handle day names like 'monday', 'tuesday', etc.
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayIndex = days.indexOf(date.toLowerCase());
      if (dayIndex !== -1) {
        const currentDay = now.getDay();
        const daysUntilTarget = (dayIndex - currentDay + 7) % 7 || 7;
        targetDate.setDate(now.getDate() + daysUntilTarget);
      }
    }
    
    if (time) {
      const timeMatch = time.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)/);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2] || '0');
        const ampm = timeMatch[3].toLowerCase();
        
        if (ampm === 'pm' && hours !== 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;
        
        targetDate.setHours(hours, minutes, 0, 0);
      }
    }
    
    return targetDate.toISOString();
  }

  private containsWords(text: string, words: string[]): boolean {
    return words.some(word => text.includes(word));
  }

  private speak(text: string) {
    console.log('🤖 Sam says:', text);
    this.state.transcript.push(`Sam: ${text}`);
    
    if (this.synthesis) {
      // Cancel any ongoing speech
      this.synthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = this.config.rate;
      utterance.pitch = this.config.pitch;
      utterance.volume = this.config.volume;
      utterance.lang = this.config.language;
      
      // Get available voices
      const voices = this.synthesis.getVoices();
      console.log('🎤 Available voices:', voices.map(v => v.name));
      
      let selectedVoice = null;
      
      // First try to use the stored voice name
      if (this.config.voiceName) {
        selectedVoice = voices.find(voice => voice.name === this.config.voiceName);
        if (selectedVoice) {
          console.log('🎤 Using stored voice for Sam:', selectedVoice.name);
        }
      }
      
      // If no stored voice found, search for female voices
      if (!selectedVoice) {
        selectedVoice = this.findBestFemaleVoice(voices);
        if (selectedVoice) {
          console.log('🎤 Found female voice for Sam:', selectedVoice.name);
          this.config.voiceName = selectedVoice.name; // Store for next time
        }
      }
      
      // Final fallback: use voice index or first available
      if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices[Math.min(this.config.voiceIndex, voices.length - 1)];
        console.log('🎤 Using fallback voice for Sam:', selectedVoice.name);
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('🎤 Sam is speaking with voice:', selectedVoice.name, 'Lang:', selectedVoice.lang);
      } else {
        console.log('🎤 No voice selected, Sam using default system voice');
      }
      
      // Add event listeners for debugging
      utterance.onstart = () => console.log('🎤 Sam started speaking');
      utterance.onend = () => console.log('🎤 Sam finished speaking');
      utterance.onerror = (event) => console.error('🎤 Sam speech error:', event);
      
      this.synthesis.speak(utterance);
    }
  }

  private updateState() {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  private async handleGenericInput(transcript: string) {
    // Handle general conversation and fallbacks
    const lowerTranscript = transcript.toLowerCase();
    
    if (this.containsWords(lowerTranscript, ['help', 'assistance', 'human', 'person'])) {
      this.speak("Of course! Let me connect you with one of our wonderful team members who can assist you personally. Please hold on just a moment.");
      this.state.needsHumanAssistance = true;
    } else if (this.containsWords(lowerTranscript, ['cancel', 'nevermind', 'forget it'])) {
      this.speak("No worries at all! Is there anything else I can help you with today?");
      this.resetConversation();
    } else {
      this.speak("I'm sorry, I didn't quite catch that. Could you please rephrase what you'd like help with?");
    }
  }

  // Public methods
  public startConversation() {
    // Ensure voices are loaded before starting conversation
    this.loadVoices();
    
    this.resetConversation();
    this.isListening = true;
    
    // Wait a moment for voices to load, then start speaking
    setTimeout(() => {
      this.speak(`Hello! This is Sam from ${this.config.persona.restaurant}. Thank you for calling! How may I assist you today? Are you looking to place an order or make a reservation?`);
    }, 100);
    
    if (this.recognition) {
      this.recognition.start();
      console.log('🎤 Sam started listening for customer input');
    }
  }

  public stopConversation() {
    this.isListening = false;
    if (this.recognition) {
      this.recognition.stop();
    }
    this.synthesis.cancel();
  }

  public setStateChangeCallback(callback: (state: ConversationState) => void) {
    this.onStateChange = callback;
  }

  public getCurrentState(): ConversationState {
    return { ...this.state };
  }

  public simulateCustomerInput(text: string) {
    // For testing purposes
    this.processCustomerInput(text);
  }

  public testVoice() {
    // Method to test Sam's voice
    console.log('🎤 Testing Sam\'s voice...');
    this.loadVoices();
    this.speak("Hello! This is Sam testing my voice. I'm your AI assistant for Museum Restaurant Hechingen. How do I sound?");
  }

  public getAvailableVoices() {
    // Method to check available voices
    const voices = this.synthesis.getVoices();
    console.log('🎤 Available voices:', voices.map(v => `${v.name} (${v.lang})`));
    return voices;
  }

  // ============================
  // COMPREHENSIVE CONVERSATION METHODS
  // ============================

  // Handle delivery management inquiries
  private handleDeliveryInquiry(intent: string, transcript: string): boolean {
    console.log('🚚 Sam handling delivery inquiry:', intent);
    
    switch (intent) {
      case 'delivery_status':
        this.state.conversationFlow = 'delivery_status';
        this.speak("I'd be happy to help you check your delivery status. Could you please provide your order number or the phone number the order was placed under?");
        this.state.expectedResponse = 'phone';
        return true;
        
      case 'delivery_options':
        this.state.conversationFlow = 'delivery_info';
        this.speak("We offer delivery within a 5-mile radius of Museum Restaurant Hechingen. Delivery typically takes 30-45 minutes. Our delivery fee is $3.99, and orders must be minimum $20. Would you like to place a delivery order?");
        return true;
        
      case 'delivery_time':
        this.speak("Current delivery time is approximately 35-40 minutes depending on your location. May I get your address to provide a more accurate estimate?");
        this.state.expectedResponse = 'address';
        this.state.conversationFlow = 'collecting_address';
        return true;
        
      default:
        return false;
    }
  }

  // Handle customer information collection
  private handleCustomerInformationFlow(expectedResponse: string, transcript: string): boolean {
    console.log('👤 Sam collecting customer info:', expectedResponse);
    
    switch (expectedResponse) {
      case 'name':
        this.state.customerData.name = this.extractName(transcript);
        this.speak(`Thank you, ${this.state.customerData.name}. Could I also get your phone number please?`);
        this.state.expectedResponse = 'phone';
        return true;
        
      case 'phone':
        const phone = this.extractPhoneNumber(transcript);
        if (phone) {
          this.state.customerData.phone = phone;
          this.speak(`Perfect! I have your number as ${phone}. Now, what's your delivery address?`);
          this.state.expectedResponse = 'address';
        } else {
          this.speak("I didn't catch that phone number clearly. Could you please repeat it?");
        }
        return true;
        
      case 'address':
        this.state.customerData.address = transcript.trim();
        this.speak(`Great! I have your address as ${this.state.customerData.address}. Would you prefer us to call or text you with updates about your order?`);
        this.state.expectedResponse = 'confirmation';
        return true;
        
      default:
        return false;
    }
  }

  // Handle general restaurant inquiries
  private handleGeneralInquiry(intent: string): boolean {
    console.log('❓ Sam handling general inquiry:', intent);
    
    switch (intent) {
      case 'hours':
        this.state.inquiryData = { topic: 'hours', response: "We're open Tuesday through Sunday, 11:30 AM to 9:00 PM. We're closed on Mondays. Is there anything else you'd like to know?" };
        this.speak(this.state.inquiryData.response!);
        return true;
        
      case 'location':
        this.state.inquiryData = { topic: 'location', response: "Museum Restaurant Hechingen is located in the heart of Hechingen's historic district. We're right next to the local museum, with convenient parking available. Would you like our exact address?" };
        this.speak(this.state.inquiryData.response!);
        return true;
        
      case 'parking':
        this.state.inquiryData = { topic: 'parking', response: "We have free parking available right next to the restaurant, and there's also street parking nearby. Our parking area can accommodate about 20 cars. Is there anything else about visiting us you'd like to know?" };
        this.speak(this.state.inquiryData.response!);
        return true;
        
      case 'dietary':
        this.state.inquiryData = { topic: 'dietary', response: "We're happy to accommodate dietary restrictions! We have vegetarian, vegan, and gluten-free options available. Our chef can also modify most dishes. What specific dietary needs do you have?" };
        this.speak(this.state.inquiryData.response!);
        return true;
        
      case 'catering':
        this.state.inquiryData = { topic: 'catering', response: "Yes, we provide catering services for events of all sizes! We can customize menus for your occasion. Would you like me to connect you with our catering coordinator, or can I take some initial details?" };
        this.speak(this.state.inquiryData.response!);
        return true;
        
      default:
        return false;
    }
  }

  // Enhanced intent detection for comprehensive assistant
  private detectEnhancedIntent(transcript: string): string {
    const text = transcript.toLowerCase();
    
    // Delivery-related intents
    if (text.includes('delivery') && (text.includes('status') || text.includes('where') || text.includes('track'))) {
      return 'delivery_status';
    }
    if (text.includes('delivery') && (text.includes('options') || text.includes('do you deliver') || text.includes('available'))) {
      return 'delivery_options';
    }
    if (text.includes('delivery') && (text.includes('time') || text.includes('how long') || text.includes('when'))) {
      return 'delivery_time';
    }
    
    // Information inquiries
    if (text.includes('hours') || text.includes('open') || text.includes('close') || text.includes('what time')) {
      return 'hours';
    }
    if (text.includes('location') || text.includes('address') || text.includes('where are you') || text.includes('directions')) {
      return 'location';
    }
    if (text.includes('parking') || text.includes('park') || text.includes('car')) {
      return 'parking';
    }
    if (text.includes('dietary') || text.includes('vegetarian') || text.includes('vegan') || text.includes('gluten') || text.includes('allergies')) {
      return 'dietary';
    }
    if (text.includes('catering') || text.includes('event') || text.includes('party') || text.includes('large order')) {
      return 'catering';
    }
    
    // Existing food ordering intents
    if (text.includes('order') || text.includes('like') || text.includes('want') || text.includes('get')) {
      return 'order';
    }
    if (text.includes('reservation') || text.includes('table') || text.includes('book')) {
      return 'reservation';
    }
    
    return 'unknown';
  }

  // Utility methods for data extraction
  private extractName(transcript: string): string {
    // Simple name extraction - could be enhanced with more sophisticated NLP
    const namePatterns = [
      /my name is (\w+)/i,
      /i'm (\w+)/i,
      /this is (\w+)/i,
      /(\w+) speaking/i
    ];
    
    for (const pattern of namePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    // Fallback: assume first word after common phrases is the name
    const words = transcript.split(' ');
    return words[0] || 'Customer';
  }

  private extractPhoneNumber(transcript: string): string | null {
    // Phone number patterns for various formats
    const phonePatterns = [
      /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/,
      /(\(\d{3}\)\s?\d{3}[-.\s]?\d{4})/,
      /(\d{10})/
    ];
    
    for (const pattern of phonePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }
}

// Export types for use in other components
export type { VoiceConfig, ConversationState };
