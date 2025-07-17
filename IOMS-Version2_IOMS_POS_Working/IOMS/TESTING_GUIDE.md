# 🧪 IOMS Enhanced POS-Inventory Integration Testing Guide

## 🔧 Prerequisites & Setup

### 1. First, ensure the application builds and runs:

```bash
cd IOMS-Version2_IOMS_POS_Working/IOMS
npm install
npm run dev
```

**✅ Expected Result:** Application should start on http://localhost:3000 without build errors.

---

## 📋 Step-by-Step Testing Protocol

### Phase 1: Basic System Health Check

#### Test 1.1: Application Startup
1. **Action:** Open http://localhost:3000
2. **Expected:** Login page loads without errors
3. **Status:** ⭕ Pass / ❌ Fail

#### Test 1.2: User Authentication
1. **Action:** Sign up/Login with test credentials
2. **Expected:** Dashboard/POS page loads successfully
3. **Status:** ⭕ Pass / ❌ Fail

---

### Phase 2: Enhanced Inventory Features Testing

#### Test 2.1: Inventory Management
1. **Navigate to:** `/inventory`
2. **Actions to Test:**
   - ✅ View existing inventory items
   - ✅ Add new inventory item
   - ✅ Edit existing item quantities
   - ✅ Set low stock thresholds
   - ✅ Add expiry dates
   - ✅ CSV import/export functionality

**Test Script:**
```
1. Go to Inventory page
2. Click "Add Item" or edit existing
3. Set: Name="Test Tomato", Quantity=10, Unit="kg", Low Stock=3
4. Set expiry date 2 days from today
5. Save and verify item appears in list
```

**✅ Expected Results:**
- Item appears in inventory list
- Low stock warning shows if quantity ≤ threshold
- Expiry warning appears for items expiring soon

#### Test 2.2: Stock Status Indicators
1. **Location:** Inventory page
2. **Actions:**
   - Create items with different stock levels
   - Set some items to 0 quantity (out of stock)
   - Set some items below low stock threshold
   - Set some items with near expiry dates

**Status Check:**
- 🔴 Out of Stock items show red indicators
- 🟡 Low Stock items show yellow indicators  
- 🟠 Expiring items show orange indicators
- 🟢 Available items show green indicators

---

### Phase 3: Menu-Inventory Integration Testing

#### Test 3.1: Menu Setup with Ingredients
1. **Navigate to:** `/menu-upload`
2. **Actions:**
   - Create a test dish: "Test Pasta"
   - Use AI to generate ingredients OR manually add:
     - Pasta: 200g
     - Tomato: 150g
     - Cheese: 50g
   - Save dish to menu

**Test Script:**
```
1. Go to Menu Upload page
2. Add dish name "Test Pasta"
3. Click "Generate Ingredients" or add manually
4. Save dish
5. Verify dish appears in main POS menu
```

#### Test 3.2: Real-time Stock Validation
1. **Navigate to:** Main POS page (`/`)
2. **Setup:** Ensure you have:
   - Menu dish with linked ingredients
   - Some ingredients in inventory
   - Some ingredients below required quantities

**Test Actions:**
```
Test A: Sufficient Stock
1. Select dish with available ingredients
2. Try to add to order
Expected: ✅ Dish adds successfully, shows green indicator

Test B: Low Stock Warning
1. Reduce ingredient quantity to just above minimum needed
2. Try to add dish to order
Expected: ⚠️ Dish adds with low stock warning

Test C: Insufficient Stock
1. Set ingredient quantity below dish requirement
2. Try to add dish to order
Expected: ❌ Error message, dish cannot be added

Test D: Out of Stock
1. Set ingredient quantity to 0
2. Try to add dish to order
Expected: ❌ "Out of Stock" error, button disabled
```

---

### Phase 4: POS Order Processing Testing

#### Test 4.1: Enhanced Order Flow
1. **Location:** Main POS page
2. **Test Scenario:** Complete order with stock validation

**Test Script:**
```
1. Add multiple dishes to order (mix of available/low stock)
2. Verify stock warnings appear appropriately
3. Complete order (assign table/delivery details)
4. Submit order
5. Check inventory levels decreased automatically
```

**✅ Expected Results:**
- Stock validation prevents insufficient orders
- Inventory quantities decrease after order
- Usage tracking records consumption
- Warnings shown for low stock items

#### Test 4.2: Order Prevention for Unavailable Items
**Setup:** Create scenario with insufficient ingredients

**Test Actions:**
```
1. Set pasta quantity to 50g (dish needs 200g)
2. Try to add "Test Pasta" to order
Expected: Error message about missing ingredients
3. Try to force add through direct button click
Expected: Validation prevents addition
```

---

### Phase 5: Dashboard Analytics Testing

#### Test 5.1: POS-Inventory Integration Dashboard
1. **Navigate to:** `/dashboard`
2. **Tab:** "POS-Inventory Integration"

**Test Elements:**
- ✅ Inventory Items count display
- ✅ Menu Availability status
- ✅ Critical alerts section
- ✅ Stock level progress bars
- ✅ Menu status overview
- ✅ Expiring dishes section

**Test Data Generation:**
```
Create mix of inventory items:
- 5 items with normal stock
- 3 items with low stock  
- 2 items out of stock
- 2 items expiring soon

Check dashboard reflects these accurately
```

#### Test 5.2: Real-time Dashboard Updates
**Test Flow:**
```
1. Note current dashboard metrics
2. Process an order that consumes ingredients
3. Refresh dashboard or wait for auto-update
Expected: Metrics update to reflect new inventory levels
```

---

### Phase 6: AI Features Integration Testing

#### Test 6.1: AI Order Agent with Stock Validation
1. **Navigate to:** `/ai-order-agent`
2. **Test:** Voice/text order processing with stock checks

**Test Script:**
```
1. Input order: "I want 2 Test Pasta and 1 Caesar Salad"
2. Process with AI
3. Verify AI-extracted items checked against inventory
4. Complete order if stock available
Expected: Stock validation works with AI-processed orders
```

#### Test 6.2: AI Ingredient Generation
1. **Navigate to:** `/ingredient-tool`
2. **Test:** Generate ingredients and add to inventory

**Test Script:**
```
1. Enter dish name: "Chicken Curry"
2. Generate ingredients with AI
3. Review and edit quantities
4. Add to inventory
5. Verify items appear in inventory list
```

---

### Phase 7: Advanced Features Testing

#### Test 7.1: Expiring Ingredient Promotions
**Setup:** Create ingredients expiring in 1-2 days

**Test Flow:**
```
1. Create menu items using expiring ingredients
2. Check main POS page for promotion suggestions
3. Verify orange "Expiring Soon" indicators
4. Check dashboard alerts mention these items
```

#### Test 7.2: Cost Calculation Features
**Test Menu Item Cost Tracking:**
```
1. Create dish with known ingredient costs
2. Place order and check if cost calculations work
3. Verify profit margin displays (if implemented)
```

---

## 🐛 Common Issues & Troubleshooting

### Build/Runtime Errors
```bash
# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

### localStorage Issues
```javascript
// Open browser console and clear data
localStorage.clear()
// Or check specific keys
localStorage.getItem('restaurantInventory_userId')
```

### API/AI Issues
```
1. Check .env.local file has GEMINI_API_KEY
2. Verify API key is valid
3. Check network connectivity
```

---

## 📊 Testing Checklist Summary

### Core Functionality ✅
- [ ] User authentication works
- [ ] Inventory CRUD operations
- [ ] Menu management
- [ ] Order processing
- [ ] Dashboard analytics

### Enhanced Integration Features ✅  
- [ ] Real-time stock validation
- [ ] Visual stock indicators
- [ ] Menu-inventory linking
- [ ] Usage tracking automation
- [ ] Cost calculations
- [ ] Expiry management
- [ ] AI integration with stock checks

### User Experience ✅
- [ ] Intuitive stock status display
- [ ] Clear error messages
- [ ] Smooth order flow
- [ ] Responsive design
- [ ] Performance acceptable

---

## 🚀 Next Steps After Testing

1. **Document Issues:** Note any failures with details
2. **Performance Check:** Test with larger datasets
3. **Mobile Testing:** Verify mobile responsiveness  
4. **User Acceptance:** Test with actual restaurant workflow
5. **Production Readiness:** Security and data validation review

---

## 💬 Feedback Collection

After each test phase, note:
- ✅ **What Works Well:** Successful features
- ⚠️ **Issues Found:** Problems encountered  
- 💡 **Improvement Ideas:** Enhancement suggestions
- 🎯 **Priority Fixes:** Critical issues to address

---

**Ready to start testing? Begin with Phase 1 and work through systematically!**
