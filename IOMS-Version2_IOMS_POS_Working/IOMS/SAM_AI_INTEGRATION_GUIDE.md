# 🤖 SAM AI Integration with Retell AI - Complete Documentation

## 📋 Overview

The SAM AI Integration connects your Retell AI calling agent with IOMS to automatically process phone orders and reservations. When customers call your restaurant, SAM AI understands their requests and creates orders/reservations in IOMS without manual intervention.

## 🏗️ Architecture

```
Customer Call → Retell AI → SAM AI Agent → Webhook → IOMS → Order/Reservation
```

### Components Created:

1. **Retell AI Integration Service** (`/lib/retellAiIntegration.ts`)
2. **Webhook Endpoint** (`/api/retell-webhook/route.ts`)
3. **SAM AI Dashboard** (`/sam-ai-integration`)
4. **Navigation Integration** (AppLayout.tsx updated)

## ⚙️ Setup Instructions

### 1. Retell AI Configuration

In your Retell AI dashboard:

1. **Create/Configure Agent:**
   ```
   Agent Name: SAM AI Restaurant Assistant
   Voice: Choose your preferred voice
   Language: English (US)
   ```

2. **Set System Prompt:**
   ```
   You are SAM, a friendly restaurant AI assistant. You help customers:
   - Place food orders
   - Make table reservations
   - Answer menu questions
   
   Always extract:
   - Customer name and phone number
   - Order items with quantities
   - Reservation date, time, and party size
   - Special requests or dietary restrictions
   
   Be conversational but efficient.
   ```

3. **Configure Webhook:**
   ```
   Webhook URL: https://your-domain.vercel.app/api/retell-webhook
   Events: call_ended, call_analyzed
   Secret: [Set in environment variables]
   ```

### 2. Environment Configuration

Add to your `.env.local`:

```env
# Retell AI Integration
RETELL_WEBHOOK_SECRET=your-secure-webhook-secret-here
RETELL_API_KEY=your-retell-api-key-here

# Optional: Retell Agent ID mapping
RETELL_AGENT_ID=your-agent-id-here
```

### 3. Deploy Webhook

The webhook is automatically deployed at:
```
https://your-vercel-app.vercel.app/api/retell-webhook
```

### 4. Test Integration

1. Go to `/sam-ai-integration` in IOMS
2. Click "Test Webhook" button
3. Verify test reservation appears
4. Make a real test call to your Retell AI number

## 📞 How It Works

### Call Flow:
1. **Customer calls** your restaurant number
2. **Retell AI answers** with SAM AI agent
3. **SAM AI converses** with customer naturally
4. **Call ends** and Retell AI sends webhook
5. **IOMS processes** webhook data automatically
6. **Order/reservation** created in system

### Data Processing:

**Webhook receives:**
```json
{
  "event_type": "call_ended",
  "call": {
    "call_id": "call_123",
    "transcript": "...",
    "analysis": {
      "customer_info": {
        "name": "John Doe",
        "phone": "+1234567890"
      },
      "order_info": {
        "items": [
          {"item": "Margherita Pizza", "quantity": 2}
        ],
        "order_type": "delivery"
      },
      "reservation_info": {
        "date_time": "2024-01-15T19:00:00Z",
        "party_size": 4
      }
    }
  }
}
```

**IOMS creates:**
- Order in order management system
- Reservation with auto-assigned table
- Customer contact information
- Activity logs for tracking

## 🎯 Features

### Automatic Order Creation
- ✅ Extracts items from conversation
- ✅ Matches menu items automatically
- ✅ Calculates pricing and tax
- ✅ Handles special requests
- ✅ Supports dine-in, delivery, pickup

### Automatic Reservations
- ✅ Books table reservations
- ✅ Auto-assigns available tables
- ✅ Handles party size requirements
- ✅ Records special occasions
- ✅ Manages confirmation status

### Smart Processing
- ✅ AI confidence scoring
- ✅ Manual review flagging
- ✅ Error handling and recovery
- ✅ Duplicate prevention
- ✅ Data validation

### Dashboard & Monitoring
- ✅ Real-time call activity
- ✅ Success/failure tracking
- ✅ Upcoming reservations view
- ✅ Order history from calls
- ✅ Performance analytics

## 📊 Dashboard Guide

### Navigation
Go to **SAM AI Integration** in the main menu.

### Tabs Overview:

1. **Upcoming Reservations**
   - Next 24 hours of bookings
   - Table assignments
   - Customer contact info
   - Special requests

2. **All Reservations**
   - Complete reservation history
   - Filter by SAM AI source
   - Status tracking
   - Confidence scores

3. **Recent Orders**
   - Orders from phone calls
   - Item details and pricing
   - Customer information
   - Order status tracking

4. **Recent Activity**
   - Webhook call logs
   - Success/error messages
   - Processing details
   - Troubleshooting info

### Stats Cards:
- **Total Calls**: Webhook calls received
- **AI Orders**: Successfully processed orders
- **AI Reservations**: Successfully booked tables
- **Avg Confidence**: AI processing confidence

## 🧪 Testing

### Test Webhook Button
1. Click "Test Webhook" in dashboard
2. Simulates a reservation call
3. Creates test data in system
4. Verifies integration working

### Manual Testing Scenarios:

**Reservation Call:**
```
"Hi, I'd like to make a reservation for 4 people tomorrow at 7 PM. 
My name is John Smith and my number is 555-1234."
```

**Order Call:**
```
"I'd like to order 2 Margherita pizzas and 1 Caesar salad for delivery. 
My name is Jane Doe, phone 555-5678. Deliver to 123 Main St."
```

**Mixed Call:**
```
"I want to order food for pickup at 6 PM and also book a table for 
Saturday at 8 PM for 6 people. Name is Bob Johnson, 555-9999."
```

## 🔧 Configuration Options

### Agent-to-User Mapping
In `route.ts`, update `mapAgentToUser()`:

```typescript
function mapAgentToUser(agentId: string): string | null {
  const agentUserMap: Record<string, string> = {
    'agent_123': 'user_restaurant_1',
    'agent_456': 'user_restaurant_2',
    // Add your mappings
  };
  return agentUserMap[agentId] || agentUserMap['default'];
}
```

### Confidence Thresholds
Adjust in `retellAiIntegration.ts`:

```typescript
// Low confidence warning threshold
if (callData.ai_confidence && callData.ai_confidence < 0.8) {
  result.warnings?.push('Low confidence - manual review needed');
}
```

### Table Assignment Logic
Modify `autoAssignTable()` for your table layout:

```typescript
// Custom table capacity and layout
const tables = [
  {id: 'table_1', name: 'Table 1', capacity: 2},
  {id: 'booth_1', name: 'Booth 1', capacity: 4},
  {id: 'private_1', name: 'Private Room', capacity: 8},
];
```

## 🛠️ Troubleshooting

### Common Issues:

**Webhook Not Receiving Calls:**
- Check Retell AI webhook URL configuration
- Verify environment variables set correctly
- Check Vercel deployment logs
- Test webhook endpoint manually

**Orders Not Creating:**
- Check menu items matching logic
- Verify order service integration
- Review AI extraction accuracy
- Check error logs in dashboard

**Reservations Not Booking:**
- Verify date/time parsing
- Check table availability logic
- Review party size matching
- Check customer info extraction

**Low AI Confidence:**
- Improve Retell AI agent prompts
- Add more specific instructions
- Train agent with sample calls
- Review conversation patterns

### Debug Mode:
Enable detailed logging by setting:
```env
DEBUG_SAM_AI=true
```

### Webhook Testing:
Use curl to test webhook directly:
```bash
curl -X POST https://your-app.vercel.app/api/retell-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-webhook-secret" \
  -d '{"event_type":"call_ended","call":{...}}'
```

## 📈 Analytics & Insights

### Key Metrics to Monitor:
- **Call-to-Order Conversion Rate**
- **Reservation Success Rate**
- **AI Confidence Scores**
- **Manual Review Requirements**
- **Processing Time**
- **Error Rates**

### Performance Optimization:
- Monitor webhook response times
- Track AI accuracy improvements
- Analyze common failure patterns
- Optimize menu item matching
- Improve table assignment logic

## 🔐 Security Considerations

### Webhook Security:
- Always verify webhook signatures
- Use HTTPS endpoints only
- Rotate webhook secrets regularly
- Log suspicious activities

### Data Privacy:
- Customer phone numbers stored securely
- Call recordings handled per privacy policy
- PCI compliance for payment data
- GDPR compliance for EU customers

## 🚀 Advanced Features

### Custom Integrations:
- Connect to external POS systems
- Integrate with delivery platforms
- Sync with reservation platforms
- Connect to CRM systems

### AI Improvements:
- Train custom speech models
- Implement sentiment analysis
- Add multilingual support
- Enhance menu understanding

### Automation Extensions:
- SMS confirmations
- Email receipts
- Delivery tracking
- Customer follow-ups

## 📞 Support

### Getting Help:
1. Check dashboard activity logs
2. Review webhook response codes
3. Test with simple scenarios first
4. Check Retell AI agent configuration
5. Verify environment variables

### Contact Information:
- Technical Support: [your-email]
- Documentation: [docs-url]
- API Reference: [api-docs-url]

---

**🎉 Congratulations!** Your SAM AI integration is now ready to automatically handle customer calls and create orders/reservations in IOMS.
