# 🔧 Retell AI Integration Troubleshooting Guide

## Current Issue: Webhook Authentication

The IOMS webhook endpoints are working correctly, but your Vercel deployment appears to have **password protection** enabled, which is blocking the Retell AI webhook calls.

## 🚨 CRITICAL: Disable Vercel Password Protection

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: `ioms-v1-pos-working`
3. **Go to Settings > Password Protection**
4. **Disable password protection** for your deployment
5. **Or configure Retell AI to bypass protection**

## 🔗 Webhook URLs to Configure in Retell AI

**Main Webhook URL:**
```
https://ioms-v1-pos-working-git-smit-nishants-projects-5417fec2.vercel.app/api/retell-webhook
```

**Debug Webhook URL (for testing):**
```
https://ioms-v1-pos-working-git-smit-nishants-projects-5417fec2.vercel.app/api/retell-webhook-debug
```

## 🔐 Authentication Setup

The webhook expects one of these authentication methods:

### Option 1: Authorization Header (Recommended)
```
Authorization: Bearer default-secret-dev
```

### Option 2: X-Retell-Signature Header
```
X-Retell-Signature: [20+ character signature]
```

## 📞 Retell AI Configuration Steps

1. **Login to Retell AI Dashboard**
2. **Go to your SAM AI Agent settings**
3. **Add webhook URL**: `https://ioms-v1-pos-working-git-smit-nishants-projects-5417fec2.vercel.app/api/retell-webhook`
4. **Set webhook events**: `call_ended`, `call_analyzed`
5. **Add authentication header**: `Authorization: Bearer default-secret-dev`

## 🧪 Test Your Setup

After configuring, test with these methods:

### Method 1: Make a real call to your Retell AI number
- Call your Retell AI phone number
- Make a reservation (e.g., "I want to book a table for 4 people tomorrow at 7 PM, my name is John Smith")
- Check IOMS dashboard for the reservation

### Method 2: Use our test script
```bash
node test-webhook-auth.js
```

## 🎯 Expected Flow

1. **Customer calls** → Retell AI answers
2. **Customer requests reservation** → SAM AI processes
3. **Call ends** → Retell AI sends webhook to IOMS
4. **IOMS receives data** → Creates reservation automatically
5. **Reservation appears** in IOMS dashboard immediately

## 🐛 Debugging

If it's still not working:

1. **Check Vercel Logs**: Go to Vercel dashboard → Deployments → View Logs
2. **Check IOMS Dashboard**: Look for new reservations
3. **Use Debug Endpoint**: Test with `/api/retell-webhook-debug` first
4. **Contact Support**: Share Vercel logs and Retell AI webhook logs

## 📋 Current Status

✅ **Working**: IOMS webhook endpoint code
✅ **Working**: Reservation creation system  
✅ **Working**: Dashboard display
❌ **Issue**: Vercel password protection blocking webhooks

## 🔄 Next Steps

1. **IMMEDIATE**: Disable Vercel password protection
2. **Configure Retell AI** with the webhook URL above
3. **Test with a real call**
4. **Verify reservation appears** in IOMS dashboard

---

**Need help?** The webhook endpoint is ready and waiting for Retell AI calls. The main blocker is the Vercel authentication that needs to be disabled for webhook access.
