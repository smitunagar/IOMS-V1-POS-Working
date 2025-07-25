# Real Phone Integration Setup Guide

## Overview

Your AI Order Agent can now handle real phone calls from customers! This guide will walk you through setting up VoIP integration so customers can call actual phone numbers and speak directly with your AI assistant.

## How It Works

1. **Customer calls your restaurant phone number**
2. **VoIP provider routes the call to your AI agent**
3. **AI agent processes speech and handles orders/reservations**
4. **Orders are automatically created in your POS system**
5. **Call recordings and transcripts are saved for review**

## Setup Steps

### 1. Choose a VoIP Provider

We support these major VoIP providers:
- **Twilio** (Recommended) - Most reliable, excellent AI features
- **Vonage** - Good international coverage
- **Plivo** - Cost-effective option
- **Bandwidth** - Enterprise-grade solution

### 2. Configure Your Provider

1. Go to **Phone System Setup** (`/phone-setup`)
2. Click **Add VoIP Provider**
3. Enter your provider credentials:
   - **Twilio**: Account SID + Auth Token
   - **Vonage**: API Key + API Secret
   - **Plivo**: Auth ID + Auth Token
   - **Bandwidth**: User ID + Token

### 3. Get Phone Numbers

1. Use the **Get Phone Numbers** tab
2. Search by area code, city, or state
3. Choose local or toll-free numbers
4. Provision numbers with AI enabled

### 4. Configure Webhooks

Your VoIP provider needs these webhook URLs:

**Twilio:**
```
Incoming Call: https://yourapp.com/api/phone/webhooks/twilio
Call Status: https://yourapp.com/api/phone/webhooks/twilio
Recording: https://yourapp.com/api/phone/webhooks/twilio/recording
```

**Vonage:**
```
Answer URL: https://yourapp.com/api/phone/webhooks/vonage
Event URL: https://yourapp.com/api/phone/webhooks/vonage
```

## AI Agent Features

### Automatic Order Taking
- Listens to customer orders
- Asks clarifying questions
- Confirms order details
- Creates order in POS system
- Provides pickup/delivery times

### Reservation Booking
- Checks availability
- Books tables automatically
- Collects customer information
- Sends confirmation

### Smart Call Routing
- Business hours detection
- Department routing (orders, reservations, general)
- Voicemail for after-hours calls
- Human transfer when needed

## Sample Call Flow

```
Customer: "Hi, I'd like to place an order"
AI: "I'd be happy to help you with an order! What would you like today?"

Customer: "Two pepperoni pizzas, large"
AI: "Great! Two large pepperoni pizzas. Would you like any drinks or sides?"

Customer: "Two Cokes please"
AI: "Perfect! Two large pepperoni pizzas and two Cokes. Your total is $28.50. 
     For pickup or delivery?"

Customer: "Pickup"
AI: "Your order will be ready for pickup in 20-25 minutes. 
     Can I get your name and phone number?"
```

## Environment Variables

Add these to your `.env.local`:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token

# Vonage Configuration  
VONAGE_API_KEY=your_api_key
VONAGE_API_SECRET=your_api_secret

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

## Testing Your Setup

1. **Test Webhook Connection**
   - Verify endpoints are accessible
   - Check SSL certificates
   - Confirm webhook signatures

2. **Make Test Calls**
   - Call your provisioned number
   - Test different scenarios:
     - Order placement
     - Reservation booking
     - After-hours calls
     - Human transfer requests

3. **Review Call Logs**
   - Check AI Order Agent dashboard
   - Review call recordings
   - Analyze transcripts
   - Monitor success rates

## Business Hours Configuration

Configure when your AI agent should answer calls:

```javascript
businessHours: {
  enabled: true,
  schedule: {
    monday: { open: '09:00', close: '21:00', isOpen: true },
    tuesday: { open: '09:00', close: '21:00', isOpen: true },
    // ... other days
  }
}
```

Outside business hours, calls go to voicemail automatically.

## Cost Considerations

**Typical VoIP Costs:**
- Phone numbers: $1-5/month per number
- Incoming calls: $0.01-0.02 per minute
- Recording/transcription: $0.02-0.05 per minute
- SMS (optional): $0.01 per message

**Cost Savings:**
- Reduced staff time answering phones
- 24/7 order availability
- Fewer missed calls
- Accurate order entry

## Troubleshooting

### Common Issues

**Calls not connecting:**
- Check webhook URLs in provider dashboard
- Verify SSL certificate validity
- Confirm phone number provisioning

**AI not responding:**
- Check business hours settings
- Verify AI agent is enabled
- Review webhook logs

**Poor speech recognition:**
- Check call quality/connection
- Verify microphone/audio settings
- Review ambient noise levels

### Support

For technical support:
1. Check call logs in AI Order Agent dashboard
2. Review webhook delivery logs
3. Test webhook endpoints manually
4. Contact VoIP provider support if needed

## Advanced Features

### Custom Prompts
Customize AI responses for your restaurant's style and menu.

### Analytics Dashboard
Track call volume, success rates, and customer satisfaction.

### Integration with POS
Orders automatically sync with your existing POS system.

### Multi-language Support
Configure AI to handle calls in multiple languages.

---

## Next Steps

1. ✅ Set up VoIP provider account
2. ✅ Configure provider in Phone Setup
3. ✅ Provision phone numbers
4. ✅ Test with sample calls
5. ✅ Update your marketing materials with new number
6. ✅ Train staff on AI dashboard

Your customers can now call and place orders 24/7 with your AI assistant!
