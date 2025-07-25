/**
 * 📞 Twilio Phone Service
 * Real phone number provisioning and management with Twilio
 */

// import { Twilio } from 'twilio';
import { PhoneNumber } from './simplePhoneService';

// Temporary type definitions until Twilio is properly installed
interface TwilioClient {
  availablePhoneNumbers: any;
  incomingPhoneNumbers: any;
}

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

let twilioClient: TwilioClient | null = null;

// Temporarily disable Twilio until package is installed
// if (accountSid && authToken) {
//   twilioClient = new Twilio(accountSid, authToken);
// }

export interface TwilioPhoneNumber {
  sid: string;
  phoneNumber: string;
  friendlyName: string;
  addressRequirements: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
}

export interface AvailablePhoneNumber {
  phoneNumber: string;
  friendlyName: string;
  locality: string;
  region: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
}

/**
 * Check if Twilio is configured
 */
export function isTwilioConfigured(): boolean {
  // Temporarily return false until Twilio package is installed
  return false;
  // return !!(accountSid && authToken && baseUrl && twilioClient);
}

/**
 * Search for available phone numbers
 */
export async function searchAvailableNumbers(
  areaCode?: string,
  contains?: string,
  nearNumber?: string
): Promise<AvailablePhoneNumber[]> {
  // Temporarily return mock data until Twilio is installed
  return [
    {
      phoneNumber: '+14155551234',
      friendlyName: 'San Francisco Number',
      locality: 'San Francisco',
      region: 'CA',
      capabilities: { voice: true, sms: true, mms: false }
    },
    {
      phoneNumber: '+14155551235',
      friendlyName: 'San Francisco Number',
      locality: 'San Francisco', 
      region: 'CA',
      capabilities: { voice: true, sms: true, mms: false }
    }
  ];

  /* TODO: Uncomment when Twilio package is installed
  if (!twilioClient) {
    throw new Error('Twilio not configured. Please add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to your environment variables.');
  }

  try {
    const searchOptions: any = {
      voiceEnabled: true,
      limit: 20,
    };

    if (areaCode) {
      searchOptions.areaCode = areaCode;
    }
    if (contains) {
      searchOptions.contains = contains;
    }
    if (nearNumber) {
      searchOptions.nearNumber = nearNumber;
    }

    const availableNumbers = await twilioClient.availablePhoneNumbers('US')
      .local
      .list(searchOptions);

    return availableNumbers.map((number: any) => ({
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName || number.phoneNumber,
      locality: number.locality || '',
      region: number.region || '',
      capabilities: {
        voice: number.capabilities?.voice || false,
        sms: number.capabilities?.sms || false,
        mms: number.capabilities?.mms || false,
      }
    }));
  } catch (error) {
    console.error('Error searching phone numbers:', error);
    throw new Error(`Failed to search for available numbers: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  */
}

/**
 * Purchase and configure a phone number
 */
export async function purchasePhoneNumber(
  phoneNumber: string,
  friendlyName: string,
  department: string
): Promise<TwilioPhoneNumber> {
  // Temporarily return mock data until Twilio is installed
  console.log('Mock purchase:', { phoneNumber, friendlyName, department });
  
  return {
    sid: `PN${Date.now()}mock`,
    phoneNumber: phoneNumber,
    friendlyName: friendlyName,
    addressRequirements: 'none',
    capabilities: {
      voice: true,
      sms: true,
      mms: false,
    }
  };

  /* TODO: Uncomment when Twilio package is installed
  if (!twilioClient || !baseUrl) {
    throw new Error('Twilio not configured. Please add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and NEXT_PUBLIC_BASE_URL to your environment variables.');
  }

  try {
    // Purchase the phone number
    const purchasedNumber = await twilioClient.incomingPhoneNumbers.create({
      phoneNumber: phoneNumber,
      friendlyName: friendlyName,
      voiceUrl: `${baseUrl}/api/phone/webhooks/twilio`,
      voiceMethod: 'POST',
      statusCallback: `${baseUrl}/api/phone/webhooks/twilio/status`,
      statusCallbackMethod: 'POST',
      voiceReceiveMode: 'voice'
    });

    return {
      sid: purchasedNumber.sid,
      phoneNumber: purchasedNumber.phoneNumber,
      friendlyName: purchasedNumber.friendlyName || phoneNumber,
      addressRequirements: purchasedNumber.addressRequirements,
      capabilities: {
        voice: purchasedNumber.capabilities?.voice || false,
        sms: purchasedNumber.capabilities?.sms || false,
        mms: purchasedNumber.capabilities?.mms || false,
      }
    };
  } catch (error) {
    console.error('Error purchasing phone number:', error);
    throw new Error(`Failed to purchase phone number: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  */
}

/**
 * Get all purchased phone numbers
 */
export async function getTwilioPhoneNumbers(): Promise<TwilioPhoneNumber[]> {
  // Temporarily return empty array until Twilio is installed
  return [];

  /* TODO: Uncomment when Twilio package is installed
  if (!twilioClient) {
    throw new Error('Twilio not configured');
  }

  try {
    const numbers = await twilioClient.incomingPhoneNumbers.list();
    
    return numbers.map((number: any) => ({
      sid: number.sid,
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName || number.phoneNumber,
      addressRequirements: number.addressRequirements,
      capabilities: {
        voice: number.capabilities?.voice || false,
        sms: number.capabilities?.sms || false,
        mms: number.capabilities?.mms || false,
      }
    }));
  } catch (error) {
    console.error('Error fetching Twilio phone numbers:', error);
    throw new Error(`Failed to fetch phone numbers: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  */
}

/**
 * Update phone number webhook URLs
 */
export async function updatePhoneNumberWebhooks(
  twilioSid: string,
  voiceUrl?: string,
  statusCallbackUrl?: string
): Promise<void> {
  // Temporarily do nothing until Twilio is installed
  console.log('Mock webhook update:', { twilioSid, voiceUrl, statusCallbackUrl });

  /* TODO: Uncomment when Twilio package is installed
  if (!twilioClient || !baseUrl) {
    throw new Error('Twilio not configured');
  }

  try {
    const updateOptions: any = {};
    
    if (voiceUrl !== undefined) {
      updateOptions.voiceUrl = voiceUrl || `${baseUrl}/api/phone/webhooks/twilio`;
      updateOptions.voiceMethod = 'POST';
    }
    
    if (statusCallbackUrl !== undefined) {
      updateOptions.statusCallback = statusCallbackUrl || `${baseUrl}/api/phone/webhooks/twilio/status`;
      updateOptions.statusCallbackMethod = 'POST';
    }

    await twilioClient.incomingPhoneNumbers(twilioSid).update(updateOptions);
  } catch (error) {
    console.error('Error updating phone number webhooks:', error);
    throw new Error(`Failed to update webhooks: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  */
}

/**
 * Release (delete) a phone number
 */
export async function releasePhoneNumber(twilioSid: string): Promise<void> {
  // Temporarily do nothing until Twilio is installed
  console.log('Mock phone number release:', twilioSid);

  /* TODO: Uncomment when Twilio package is installed
  if (!twilioClient) {
    throw new Error('Twilio not configured');
  }

  try {
    await twilioClient.incomingPhoneNumbers(twilioSid).remove();
  } catch (error) {
    console.error('Error releasing phone number:', error);
    throw new Error(`Failed to release phone number: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  */
}

/**
 * Get webhook URLs for a phone number
 */
export function getWebhookUrls() {
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_BASE_URL not configured');
  }

  return {
    voice: `${baseUrl}/api/phone/webhooks/twilio`,
    status: `${baseUrl}/api/phone/webhooks/twilio/status`,
    transcription: `${baseUrl}/api/phone/webhooks/twilio/transcription`
  };
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phoneNumber: string): { isValid: boolean; formatted?: string; error?: string } {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a US number (10 or 11 digits)
  if (cleaned.length === 10) {
    return {
      isValid: true,
      formatted: `+1${cleaned}`
    };
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return {
      isValid: true,
      formatted: `+${cleaned}`
    };
  } else {
    return {
      isValid: false,
      error: 'Phone number must be a valid US number (10 or 11 digits)'
    };
  }
}
