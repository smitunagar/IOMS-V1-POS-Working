# 🎤 Voice Commands & Smart SAM Features Test

## Voice Commands in Search Bar

### Test the Voice Search Feature:
1. Open the Inventory page
2. Look for the search bar with a microphone icon
3. Click the microphone button to start voice recognition
4. Say item names like:
   - "Search for tomatoes"
   - "Find chicken"
   - "Show me dairy products"
   - "Look for frozen items"

### Expected Behavior:
- Microphone button should change color when listening
- Speech should be converted to text in the search bar
- Search results should filter automatically
- Voice recognition should stop after a few seconds of silence

## Smart SAM Chatbot

### Test the Chatbot Feature:
1. Look for the "Chat with Smart SAM" button (message circle icon)
2. Click to open the chatbot dialog
3. Try these sample questions:

#### Inventory Management Questions:
- "How do I add new items?"
- "What do the color codes mean?"
- "How to upload CSV files?"
- "What storage temperature for dairy?"
- "How to check expiry dates?"

#### System Help Questions:
- "What is IOMS?"
- "How do I manage inventory?"
- "What are the main features?"
- "How to use voice commands?"
- "What does Smart SAM do?"

#### Storage and Food Safety:
- "How to store fresh vegetables?"
- "What temperature for meat storage?"
- "How long does milk last?"
- "FIFO rotation meaning?"
- "Freezer storage tips?"

### Expected Behavior:
- SAM should respond with helpful, contextual answers
- Responses should be friendly and informative
- Chat history should be maintained during the session
- SAM should understand IOMS-specific terminology

## Voice Command Examples:

### Search Commands:
- "Search chicken" → filters to chicken items
- "Find tomato" → shows tomato-related items
- "Show dairy" → filters by dairy category
- "Look for expired" → could search for "expired" in items

### Navigation Commands (Future Enhancement):
- "Go to dashboard"
- "Open menu management"
- "Show payment system"

## Smart SAM Knowledge Areas:

### 1. Inventory Management:
- Adding/editing items
- CSV upload process
- Category explanations
- Stock level management

### 2. Food Storage:
- Temperature requirements
- Storage tips by category
- Expiry date guidelines
- Food safety best practices

### 3. System Navigation:
- Feature explanations
- User interface help
- Process guidance
- Troubleshooting

### 4. IOMS Features:
- Dashboard overview
- Menu management
- Order processing
- Payment handling
- Barcode scanning

## Browser Compatibility:

### Voice Recognition Support:
- ✅ Chrome (recommended)
- ✅ Edge
- ✅ Safari (limited)
- ❌ Firefox (limited support)

### Fallback Behavior:
- If voice recognition fails, manual typing still works
- Error messages guide users to supported browsers
- Graceful degradation for unsupported browsers

## Testing Checklist:

- [ ] Voice button appears in search bar
- [ ] Microphone permission requested
- [ ] Voice recognition starts/stops correctly
- [ ] Speech converted to text accurately
- [ ] Search filters work with voice input
- [ ] Smart SAM button visible
- [ ] Chatbot dialog opens/closes
- [ ] SAM responds to inventory questions
- [ ] SAM provides helpful storage advice
- [ ] Chat history maintained in session
- [ ] UI remains responsive during voice/chat operations

## Troubleshooting:

### Voice Recognition Issues:
1. Check microphone permissions
2. Ensure HTTPS connection
3. Try Chrome/Edge browsers
4. Check microphone hardware

### Smart SAM Issues:
1. Refresh the page
2. Check console for errors
3. Verify all imports are working
4. Test with simple questions first
