# 🧪 **Complete Test Guide: Smart Inventory Integration**

## **Overview**
This guide will walk you through testing the new smart inventory integration feature that automatically checks ingredients and suggests inventory additions during menu upload.

---

## **🚀 Prerequisites**
1. ✅ Make sure your application is running
2. ✅ You are logged in as a user
3. ✅ You have some inventory items (we'll test with missing ones too)
4. ✅ You have a menu PDF or will create menu items manually

---

## **📋 Test Scenario: Chicken Biryani Example**

### **Step 1: Prepare Test Inventory**
1. **Go to Inventory page**
2. **Add these items manually:**
   ```
   Basmati Rice - 5000g
   Chicken - 2000g  
   Onions - 1000g
   Yogurt - 500ml
   Salt - 100g
   ```
3. **Deliberately SKIP these items (we'll test auto-add):**
   ```
   Ginger Garlic Paste
   Green Chilies
   Red Chili Powder
   Turmeric Powder
   Garam Masala
   ```

---

## **🎯 Test Process**

### **Step 2: Upload/Create Menu with Chicken Biryani**

#### **Option A: Manual Entry**
1. Go to **Menu Upload** page
2. Click **"Add Row"** 
3. Enter:
   ```
   Name: Chicken Biryani
   Category: Main Course
   Price: 15.99
   AI Hint: spicy chicken biryani with basmati rice
   ```

#### **Option B: PDF Upload**
1. Upload a menu PDF containing Chicken Biryani
2. Wait for parsing to complete

### **Step 3: Generate Ingredients**
1. Click **"Generate Ingredients for All"** 
2. Wait for AI to generate ingredients
3. **Expected Result:** Should generate ingredients like:
   ```
   - Basmati Rice (200g)
   - Chicken (150g)
   - Onions (50g)
   - Ginger Garlic Paste (10g)
   - Green Chilies (5g)
   - Yogurt (30ml)
   - Red Chili Powder (2g)
   - Turmeric Powder (1g)
   - Garam Masala (2g)
   - Salt (1g)
   ```

### **Step 4: Smart Inventory Analysis**
1. Click **"Check Inventory"** button
2. **Expected Results:**
   - Analysis modal opens
   - Shows summary: "5/10 ingredients available"
   - Lists missing ingredients in red badges
   - Shows detailed analysis per dish
   - Estimates possible servings

### **Step 5: Auto-Add Missing Ingredients**
1. In the analysis modal, click **"Auto-Add X Ingredients"**
2. **Expected Results:**
   - System automatically adds missing ingredients
   - Shows success toast: "Successfully added X ingredients"
   - Modal auto-refreshes with updated analysis
   - Missing count should decrease

### **Step 6: Verify Inventory Updates**
1. Click **"View Inventory"** in modal
2. **Expected Results:**
   - New ingredients appear in inventory
   - Proper quantities suggested (e.g., 250g Ginger Garlic Paste)
   - Correct categories assigned (e.g., Spices)

---

## **🧪 Detailed Test Cases**

### **Test Case 1: Complete Missing Ingredients**
**Setup:** Empty inventory
**Action:** Create Chicken Biryani, generate ingredients, check inventory
**Expected:** All ingredients flagged as missing, auto-add offers bulk quantities

### **Test Case 2: Partial Missing Ingredients**  
**Setup:** Half the ingredients in inventory
**Action:** Check inventory analysis
**Expected:** Shows mix of available/missing, calculates possible servings

### **Test Case 3: Sufficient Inventory**
**Setup:** All ingredients available with good quantities
**Action:** Check inventory analysis  
**Expected:** Shows all green, calculates max possible servings

### **Test Case 4: Insufficient Quantities**
**Setup:** All ingredients present but very low quantities
**Action:** Check inventory analysis
**Expected:** Shows "insufficient" status, suggests restocking

### **Test Case 5: Multiple Dishes**
**Setup:** 3-5 different dishes with overlapping ingredients
**Action:** Generate ingredients for all, then check inventory
**Expected:** Smart consolidation of ingredient requirements

---

## **🔍 Order Placement Testing**

### **Step 7: Test Order Deduction**
1. **Save the menu** after inventory analysis
2. **Go to Order Entry** page
3. **Add Chicken Biryani to order** (quantity: 2)
4. **Place the order**
5. **Check inventory page**

**Expected Results:**
```
Before Order:
- Basmati Rice: 5000g → After: 4600g (used: 400g)
- Chicken: 2000g → After: 1700g (used: 300g)  
- Onions: 1000g → After: 900g (used: 100g)
- Yogurt: 500ml → After: 440ml (used: 60ml)

"Used" column shows cumulative usage
Available servings decrease appropriately
```

### **Step 8: Multiple Orders Test**
1. **Place 5 more orders** of Chicken Biryani
2. **Check inventory updates** after each order
3. **Verify proportional deduction**

**Expected:** Linear decrease in quantities, "Used" column increases

---

## **🎯 Advanced Testing**

### **Test Case 6: Unit Conversion**
**Setup:** Inventory has "1kg Chicken", recipe needs "150g"
**Expected:** System converts and calculates ~6 servings possible

### **Test Case 7: Synonym Matching**
**Setup:** Inventory has "Cottage Cheese", recipe needs "Paneer"  
**Expected:** System recognizes as same ingredient

### **Test Case 8: Low Stock Warnings**
**Setup:** Ingredients near low stock threshold
**Expected:** Warnings appear in analysis, suggests restocking

---

## **✅ Success Criteria**

### **Functional Requirements:**
- ✅ Ingredients auto-generated from dish names
- ✅ Inventory analysis identifies missing/available ingredients  
- ✅ Auto-add feature creates missing inventory items
- ✅ Order placement deducts correct quantities
- ✅ Multiple orders scale deductions proportionally
- ✅ "Used" column updates correctly
- ✅ Servings calculations are accurate

### **User Experience:**
- ✅ Clear visual indicators (green/red badges)
- ✅ Intuitive workflow: Upload → Generate → Analyze → Auto-Add
- ✅ Helpful suggestions and recommendations
- ✅ Real-time updates and feedback

### **Data Accuracy:**
- ✅ Correct ingredient matching (including synonyms)
- ✅ Proper unit conversions
- ✅ Accurate quantity calculations
- ✅ Consistent inventory state

---

## **🐛 Debugging Guide**

### **If Ingredients Not Generated:**
1. Check console for API errors
2. Verify AI service connectivity
3. Try simpler dish names

### **If Analysis Shows Wrong Results:**
1. Check ingredient format in console logs
2. Verify inventory item names match exactly
3. Look for unit conversion issues

### **If Auto-Add Fails:**
1. Check localStorage permissions
2. Verify user authentication
3. Look for duplicate ingredient conflicts

### **If Order Deduction Fails:**
1. Check console logs during order placement
2. Verify ingredient format: `{inventoryItemName, quantityPerDish, unit}`
3. Test with simpler ingredients first

---

## **📞 Quick Test Commands**

### **Browser Console Debug:**
```javascript
// Check current menu
console.log('Menu:', JSON.parse(localStorage.getItem('restaurantMenu_' + JSON.parse(localStorage.getItem('currentUser')).id)));

// Check current inventory
console.log('Inventory:', JSON.parse(localStorage.getItem('inventory_' + JSON.parse(localStorage.getItem('currentUser')).id)));

// Test ingredient matching
debugChocolava(); // If available from previous setup
```

---

## **🎉 Expected Final State**

After completing all tests:
1. **Menu:** Contains dishes with proper ingredient mappings
2. **Inventory:** Has all required ingredients with realistic quantities  
3. **Orders:** Successfully placed with accurate inventory deduction
4. **Analytics:** Clear visibility into ingredient usage and availability
5. **Workflow:** Seamless process from menu upload to order fulfillment

---

**⏱️ Estimated Test Time:** 30-45 minutes for complete testing
**👥 Recommended:** Test with 2-3 different users to verify isolation
