# 📞 Phone System Setup Guide

## 🎯 What This Enables

Your customers can now **call a real phone number** and speak directly with your Voice AI Agent! The AI will handle:
- Table reservations over the phone
- Food orders with delivery/pickup
- Natural conversation flow
- Automatic integration with IOMS

## 🔧 Setup Steps

### 1. Create Twilio Account
1. Go to [Twilio Console](https://console.twilio.com)
2. Sign up for a free account (includes $15 trial credit)
3. Verify your phone number

### 2. Get Your Credentials
1. From Twilio Console Dashboard, copy:
   - **Account SID** 
   - **Auth Token**
2. Add to your `.env.local` file:
```env
TWILIO_ACCOUNT_SID=your_actual_account_sid
TWILIO_AUTH_TOKEN=your_actual_auth_token
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
RESTAURANT_PHONE_NUMBER=+1234567890
```

### 3. Buy a Phone Number
1. In Twilio Console, go to **Phone Numbers > Manage > Buy a number**
2. Choose a local number in your area
3. Purchase the number (usually $1/month)
4. Copy the number and add to `.env.local`:
```env
TWILIO_PHONE_NUMBER=+15551234567
```

### 4. Configure Webhooks
1. Go to **Phone Numbers > Manage > Active numbers**
2. Click on your purchased number
3. In the **Voice Configuration** section:
   - **Webhook**: `https://your-app.vercel.app/api/twilio/voice`
   - **HTTP Method**: POST
4. Save the configuration

### 5. For Local Development (Testing)
1. Install ngrok: `npm install -g ngrok`
2. Run your local server: `npm run dev`
3. In another terminal: `ngrok http 9003`
4. Copy the https ngrok URL and add to `.env.local`:
```env
NEXT_PUBLIC_BASE_URL=https://abc123.ngrok.io
```
5. Update Twilio webhook to: `https://abc123.ngrok.io/api/twilio/voice`

## 🎭 How It Works

### Customer Experience
1. **Customer dials your Twilio number**
2. **AI answers**: "Hello! Welcome to our restaurant. I am your AI assistant. How can I help you today?"
3. **Customer speaks**: "I'd like to make a reservation for 4 people tonight at 7pm"
4. **AI asks follow-up questions** to gather all details
5. **AI confirms**: "Perfect! I have a reservation for 4 people under John Smith for tonight at 7pm. Is this correct?"
6. **Customer confirms**: "Yes, that's right"
7. **AI creates reservation**: "Your reservation is confirmed! Confirmation number is RES-1234567"

### Restaurant Staff Experience
- **Dashboard updates in real-time** with phone reservations/orders
- **Call logs** show in Voice AI Analytics tab
- **Automatic handoff** to staff phone for complex requests

## 🧪 Testing Your Phone System

### Test Call Flow
1. **Call your Twilio number**
2. **Test Reservation**:
   - Say: "I want to book a table"
   - Follow AI prompts for party size, date, time, name
   - Confirm details when asked
   - Check dashboard for new reservation

3. **Test Order**:
   - Say: "I'd like to place an order"
   - Say: "2 pizzas and a salad for delivery"
   - Provide your name when asked
   - Confirm order and total
   - Check dashboard for new order

### Test Phrases
- "Hi, table for 4 tonight at 8pm please"
- "I need a reservation for tomorrow, 6 people at 7:30"
- "Can I order food for pickup?"
- "I want 3 burgers and 2 salads for delivery"

## 📊 Monitoring & Analytics

### Real-time Tracking
- **Dashboard > Voice AI Agent tab** shows:
  - Phone calls received today
  - Successful reservations/orders
  - Average call duration
  - Revenue from phone orders

### Call Logs
- Each phone call creates entries in:
  - Table reservations (if reservation made)
  - Order history (if order placed)
  - Voice AI analytics dashboard

## 🔧 Advanced Configuration

### Custom Greetings
Edit `/api/twilio/voice/route.ts` to customize the greeting:
```typescript
twiml.say({
  voice: 'alice',
  language: 'en-US'
}, 'Welcome to Mario\'s Italian Restaurant! I\'m your AI assistant.');
```

### Voice Settings
- **Voice**: alice, man, woman
- **Language**: en-US, en-GB, es-ES, fr-FR, etc.
- **Speed**: 0.5 to 2.0

### Business Hours
Add business hours logic in `/api/twilio/voice/route.ts`:
```typescript
const now = new Date();
const hour = now.getHours();

if (hour < 10 || hour > 22) {
  twiml.say('Thank you for calling! We are currently closed. Our hours are 10 AM to 10 PM.');
  twiml.hangup();
  return;
}
```

## 💰 Pricing

### Twilio Costs
- **Phone Number**: ~$1/month
- **Incoming Calls**: ~$0.0085/minute
- **Speech Recognition**: ~$0.02/minute
- **Text-to-Speech**: ~$16/million characters

### Example Monthly Cost
- 100 calls/month × 3 minutes average = 300 minutes
- Phone number: $1
- Call time: 300 × $0.0085 = $2.55
- Speech/TTS: ~$2
- **Total: ~$6/month for 100 calls**

## 🚀 Production Deployment

### Vercel Deployment
1. Deploy your app to Vercel
2. Add environment variables in Vercel dashboard
3. Update Twilio webhook to production URL
4. Test with real phone calls

### Phone Number Setup
1. **Port existing number** (if you have a restaurant number)
2. **Buy new local number** from Twilio
3. **Update marketing materials** with new number
4. **Set up call forwarding** as backup

## 🎉 Success!

Your customers can now:
- ✅ **Call a real phone number**
- ✅ **Speak naturally** with AI assistant
- ✅ **Make reservations** automatically
- ✅ **Place orders** with pricing
- ✅ **Get confirmation numbers**
- ✅ **Connect with staff** if needed

**Your restaurant now has a professional phone AI system!** 📞🤖

---

### 🆘 Troubleshooting

**Call not connecting?**
- Check Twilio webhook URL is correct
- Verify environment variables
- Check Twilio console for error logs

**AI not understanding speech?**
- Twilio uses automatic speech recognition
- Customers should speak clearly
- Complex requests auto-transfer to staff

**Local testing issues?**
- Use ngrok for local development
- Update webhook URL when ngrok restarts
- Check ngrok logs for webhook calls
