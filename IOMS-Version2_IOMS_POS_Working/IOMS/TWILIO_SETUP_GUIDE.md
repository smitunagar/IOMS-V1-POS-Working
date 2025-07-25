# Twilio Configuration for Real Phone Integration

## Setup Instructions

### 1. Get Twilio Credentials
1. Go to [Twilio Console](https://console.twilio.com)
2. Sign up or log in to your account
3. Find your Account SID and Auth Token

### 2. Configure Environment Variables
Create a `.env.local` file in your project root with:

```bash
# Twilio Account Credentials
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here

# Your app's public URL (for webhooks)
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app

# For local development with ngrok
# NEXT_PUBLIC_BASE_URL=https://your-ngrok-url.ngrok.io
```

### 3. Purchase Phone Numbers
1. Go to the AI Order Agent page
2. Navigate to "Phone Setup" tab
3. Use the phone number search to find available numbers
4. Purchase numbers that will handle real incoming calls

### 4. Test Your Setup
- The AI agent will automatically handle incoming calls
- Orders and reservations will be processed through AI
- All calls are logged in the "Call History" tab

### Webhook URLs
Your webhooks will be automatically configured at:
- Voice: `${NEXT_PUBLIC_BASE_URL}/api/phone/webhooks/twilio`
- Status: `${NEXT_PUBLIC_BASE_URL}/api/phone/webhooks/twilio/status`

### Cost Information
- Twilio charges for phone numbers (~$1/month) and usage
- Voice calls are charged per minute
- Check Twilio pricing for your region

### Troubleshooting
1. **"Twilio not configured" error**: Check your .env.local file
2. **Webhook errors**: Ensure your NEXT_PUBLIC_BASE_URL is publicly accessible
3. **No available numbers**: Try different area codes or search parameters
