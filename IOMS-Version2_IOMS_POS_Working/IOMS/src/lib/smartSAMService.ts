/**
 * 🤖 Smart SAM - IOMS Assistant Service
 * Intelligent chatbot for inventory management guidance
 */

export interface ChatMessage {
  id: string;
  type: 'user' | 'sam';
  message: string;
  timestamp: Date;
}

export class SmartSAMService {
  
  /**
   * Generate intelligent responses based on user queries
   */
  static generateResponse(userMessage: string, inventoryContext?: any): string {
    const msg = userMessage.toLowerCase();
    
    // 🏪 Order Management and Menu Questions
    if (msg.includes('order') || msg.includes('menu') || msg.includes('place order') || msg.includes('customer order')) {
      return this.getOrderManagementGuidance(msg);
    }
    
    // 📊 Analytics Questions
    if (msg.includes('analytics') || msg.includes('report') || msg.includes('dashboard') || msg.includes('statistics') || msg.includes('data')) {
      return this.getAnalyticsGuidance(msg);
    }
    
    // 🤖 AI Ingredient Tool Questions
    if (msg.includes('ai ingredient') || msg.includes('ingredient tool') || msg.includes('ai tool') || msg.includes('smart ingredient')) {
      return this.getAIToolGuidance(msg);
    }
    
    // 📅 Order History Questions
    if (msg.includes('order history') || msg.includes('past order') || msg.includes('previous order') || msg.includes('order tracking')) {
      return this.getOrderHistoryGuidance(msg);
    }
    
    // 💳 Payment Questions
    if (msg.includes('payment') || msg.includes('billing') || msg.includes('checkout') || msg.includes('pay')) {
      return this.getPaymentGuidance(msg);
    }
    
    // 🪑 Table Management and Reservation Questions
    if (msg.includes('table') || msg.includes('book') || msg.includes('reserve') || msg.includes('reservation') || msg.includes('table management')) {
      return this.getTableManagementGuidance(msg);
    }
    
    // 📱 Barcode Scanner Questions
    if (msg.includes('barcode') || msg.includes('scanner') || msg.includes('scan') || msg.includes('qr')) {
      return this.getBarcodeScannerGuidance(msg);
    }
    
    // Storage and temperature questions
    if (msg.includes('storage') || msg.includes('store') || msg.includes('temperature') || msg.includes('temp')) {
      return this.getStorageAdvice(msg);
    }
    
    // Expiry and shelf life questions
    if (msg.includes('expiry') || msg.includes('expire') || msg.includes('shelf life') || msg.includes('fresh')) {
      return this.getExpiryAdvice(msg);
    }
    
    // Inventory management questions
    if (msg.includes('add item') || msg.includes('new item') || msg.includes('add inventory')) {
      return this.getAddItemGuidance();
    }
    
    // CSV and import questions
    if (msg.includes('csv') || msg.includes('upload') || msg.includes('import')) {
      return this.getCSVGuidance();
    }
    
    // Categories questions
    if (msg.includes('categor') || msg.includes('type') || msg.includes('classify')) {
      return this.getCategoriesInfo();
    }
    
    // Stock management
    if (msg.includes('stock') || msg.includes('quantity') || msg.includes('alert') || msg.includes('low')) {
      return this.getStockManagementAdvice();
    }
    
    // Search and navigation
    if (msg.includes('search') || msg.includes('find')) {
      return this.getSearchGuidance();
    }
    
    // Voice commands
    if (msg.includes('voice') || msg.includes('mic') || msg.includes('speak')) {
      return this.getVoiceGuidance();
    }
    
    // FIFO and rotation
    if (msg.includes('fifo') || msg.includes('rotation') || msg.includes('first in')) {
      return this.getFIFOAdvice();
    }
    
    // Food safety
    if (msg.includes('safe') || msg.includes('spoil') || msg.includes('bad')) {
      return this.getFoodSafetyAdvice();
    }
    
    // Units and measurements
    if (msg.includes('unit') || msg.includes('measure') || msg.includes('convert')) {
      return this.getUnitsInfo();
    }
    
    // Getting started
    if (msg.includes('help') || msg.includes('start') || msg.includes('how') || msg.includes('tutorial')) {
      return this.getGettingStartedAdvice();
    }
    
    // Greetings
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      return this.getGreeting();
    }
    
    // Specific ingredient questions
    if (msg.includes('chicken') || msg.includes('meat') || msg.includes('fish') || msg.includes('beef')) {
      return this.getMeatStorageAdvice();
    }
    
    if (msg.includes('vegetables') || msg.includes('veggies') || msg.includes('produce')) {
      return this.getVegetableStorageAdvice();
    }
    
    if (msg.includes('dairy') || msg.includes('milk') || msg.includes('cheese')) {
      return this.getDairyStorageAdvice();
    }
    
    // Color coding questions
    if (msg.includes('color') || msg.includes('red') || msg.includes('green') || msg.includes('yellow')) {
      return this.getColorCodeInfo();
    }
    
    // Tooltips and hover info
    if (msg.includes('tooltip') || msg.includes('hover') || msg.includes('click')) {
      return this.getTooltipGuidance();
    }
    
    // Default response
    return this.getDefaultResponse();
  }
  
  private static getStorageAdvice(msg: string): string {
    if (msg.includes('meat') || msg.includes('chicken') || msg.includes('beef') || msg.includes('fish')) {
      return "🥩 **Meat & Seafood Storage:**\n\n• Temperature: 32°F (0°C) or below\n• Location: Bottom shelf to prevent dripping\n• Rotation: Use FIFO (First In, First Out)\n• Shelf life: Fresh meat 1-3 days, frozen 3-6 months\n• Safety: Check dates daily, trust your senses";
    } else if (msg.includes('dairy') || msg.includes('milk') || msg.includes('cheese')) {
      return "🥛 **Dairy Storage Guidelines:**\n\n• Temperature: 32-40°F (0-4°C)\n• Location: Middle/bottom shelves (door too warm for milk)\n• Tip: Check expiry dates regularly\n• Note: Hard cheeses last longer than soft ones\n• Safety: Never leave dairy at room temp >2 hours";
    } else if (msg.includes('vegetable') || msg.includes('fruit')) {
      return "🥬 **Fresh Produce Storage:**\n\n• Most vegetables: Refrigerate at 32-40°F\n• Some fruits: Ripen at room temp first\n• Separation: Keep ethylene producers apart\n• Check: Daily for spoilage signs\n• Tip: Store potatoes/onions in cool, dark place";
    } else {
      return "🌡️ **General Storage Guidelines:**\n\n• **Refrigerated:** 32-40°F (0-4°C)\n• **Frozen:** 0°F (-18°C) or below\n• **Pantry:** Cool, dry place away from light\n• **Spices:** Airtight containers, away from heat\n\nWhat specific item do you need storage info for?";
    }
  }
  
  private static getExpiryAdvice(msg: string): string {
    return "📅 **Expiry Date Intelligence:**\n\nI automatically predict expiry dates based on:\n\n• **Fresh meat:** 1-3 days\n• **Dairy products:** 5-7 days\n• **Fresh produce:** 3-7 days\n• **Frozen items:** 3-6 months\n• **Canned goods:** 12-24 months\n• **Dry goods:** 6-12 months\n\n⚠️ **Important:** Always check for spoilage signs regardless of dates - trust your senses!";
  }
  
  private static getAddItemGuidance(): string {
    return "➕ **Adding Items to Inventory:**\n\n**Method 1 - Manual:**\n1. Click 'Add New Item' button\n2. Enter item name (I'll suggest category!)\n3. Add quantity and unit\n4. I'll predict expiry & storage automatically\n\n**Method 2 - CSV Upload:**\n1. Click 'Upload CSV'\n2. Select any CSV format\n3. I'll analyze and map fields\n4. Review suggestions and confirm\n\nWhich method would you like help with?";
  }
  
  private static getCSVGuidance(): string {
    return "📊 **Smart CSV Upload Guide:**\n\n**What I can do:**\n• Auto-detect any CSV format\n• Map fields intelligently\n• Categorize items automatically\n• Standardize units (kg, L, pcs)\n• Predict expiry dates\n• Add storage recommendations\n\n**Steps:**\n1. Click 'Upload CSV'\n2. Select your file\n3. Review my field mappings\n4. Click 'Confirm and Convert'\n\nI support any CSV format - try me!";
  }
  
  private static getCategoriesInfo(): string {
    return "🏷️ **11 Professional Categories:**\n\n• **Fresh Vegetables** - Refrigerated produce\n• **Fresh Fruits** - Various storage needs\n• **Meat & Seafood** - 32°F or below\n• **Plant Proteins** - Legumes, nuts, tofu\n• **Dairy** - 32-40°F temperature\n• **Grains & Cereals** - Cool, dry storage\n• **Cooking Oils** - Away from heat/light\n• **Herbs & Spices** - Airtight containers\n• **Frozen Foods** - 0°F (-18°C)\n• **Beverages** - Follow individual needs\n• **Baking Essentials** - Pest-proof storage\n\nI auto-detect categories when you add items!";
  }
  
  private static getStockManagementAdvice(): string {
    return "📊 **Stock Level Management:**\n\n**Alert System:**\n🔴 **Red/Critical:** Expired or critically low\n🟡 **Yellow/Warning:** Expiring soon (≤3 days) or low stock\n🟢 **Green/Good:** Adequate stock levels\n\n**Progress Bars:** Show current vs optimal stock\n\n**Best Practices:**\n• Set appropriate low stock thresholds\n• Monitor progress bars regularly\n• Respond to alerts promptly\n• Use FIFO rotation for perishables";
  }
  
  private static getSearchGuidance(): string {
    return "🔍 **Search & Navigation:**\n\n**Text Search:**\n• Type in search bar\n• Search by name or category\n• Real-time filtering\n\n**Voice Search:**\n• Click microphone icon 🎤\n• Speak your search term\n• Perfect for hands-free operation\n\n**Visual Filtering:**\n• Look for color-coded alerts\n• Use category badges\n• Sort by expiry dates\n\nTry voice search - say 'search for tomatoes'!";
  }
  
  private static getVoiceGuidance(): string {
    return "🎤 **Voice Search Features:**\n\n**How to use:**\n1. Click microphone icon next to search bar\n2. Speak clearly when it's listening\n3. I'll automatically search for what you say\n\n**Perfect for:**\n• Hands-free searching while cooking\n• Quick ingredient lookup\n• When your hands are busy\n\n**Tips:**\n• Speak clearly and pause before/after\n• Works best in quiet environments\n• Try: 'chicken', 'vegetables', 'dairy'\n\nGive it a try - it's surprisingly accurate!";
  }
  
  private static getFIFOAdvice(): string {
    return "🔄 **FIFO (First In, First Out) Rotation:**\n\n**Why it matters:**\n• Prevents food waste\n• Ensures food safety\n• Maintains quality\n• Saves money\n\n**How I help:**\n• Sort items by expiry date\n• Color-coded expiry alerts\n• Automatic shelf-life tracking\n• Visual progress indicators\n\n**Best practice:** Always use items with earliest expiry dates first, especially for meat, dairy, and fresh produce!";
  }
  
  private static getFoodSafetyAdvice(): string {
    return "🛡️ **Food Safety Guidelines:**\n\n**Temperature Control:**\n• Monitor fridge/freezer temps daily\n• Keep refrigerated items ≤40°F\n• Frozen items at 0°F or below\n\n**Storage Rules:**\n• Separate raw meat from other foods\n• Use FIFO rotation\n• Label everything with dates\n\n**When in doubt, throw it out!**\n\nI help by tracking all this automatically with color-coded alerts and storage recommendations.";
  }
  
  private static getUnitsInfo(): string {
    return "📏 **Unit Standardization:**\n\nI automatically convert to standard units:\n\n**Weight:** kg (kilograms)\n**Volume:** L (liters), ml (milliliters)\n**Count:** pcs (pieces)\n\n**Auto-conversions:**\n• lbs → kg\n• oz → g\n• gallons → L\n• dozen → 12 pcs\n\n**Smart detection:** I analyze item names to suggest appropriate units (liquids→volume, solids→weight, countable items→pieces).";
  }
  
  private static getGettingStartedAdvice(): string {
    return "🎓 **Getting Started with IOMS:**\n\n**Step 1:** Add items (manual or CSV)\n**Step 2:** I'll categorize & set storage info\n**Step 3:** Monitor color-coded alerts\n**Step 4:** Use tooltips for detailed guidance\n\n**Pro Tips:**\n• Hover over items for storage details\n• Click categories for specific guidance\n• Use voice search for hands-free operation\n• Watch the progress bars for stock levels\n\nWhat would you like to learn first?";
  }
  
  private static getGreeting(): string {
    return "👋 **Hello! I'm Smart SAM!**\n\nYour intelligent IOMS assistant, here to help with:\n\n🏪 Inventory management\n🌡️ Storage temperatures & tips\n📅 Expiry date tracking\n📊 CSV imports & data processing\n🔍 Search & navigation\n🎤 Voice commands\n📋 Best practices & food safety\n\nWhat can I help you with today?";
  }
  
  private static getMeatStorageAdvice(): string {
    return "🥩 **Meat & Seafood Storage:**\n\n**Temperature:** 32°F (0°C) or below\n**Location:** Bottom shelf of refrigerator\n**Packaging:** Keep in original packaging or sealed container\n**Shelf Life:**\n• Fresh meat: 1-3 days\n• Fresh fish: 1-2 days\n• Ground meat: 1-2 days\n• Frozen: 3-6 months\n\n**Safety:** Check color, smell, and texture. When in doubt, discard!";
  }
  
  private static getVegetableStorageAdvice(): string {
    return "🥬 **Fresh Produce Storage:**\n\n**Refrigerated vegetables (32-40°F):**\n• Leafy greens, broccoli, carrots\n• Store in crisper drawer\n• Keep humid for most\n\n**Room temperature:**\n• Potatoes, onions, garlic\n• Store in cool, dark, ventilated area\n\n**Ethylene sensitive:** Keep away from bananas, apples\n\n**Check daily** for signs of spoilage!";
  }
  
  private static getDairyStorageAdvice(): string {
    return "🥛 **Dairy Product Storage:**\n\n**Temperature:** 32-40°F (0-4°C)\n**Location:** Middle or bottom shelves (NOT the door)\n**Types & Shelf Life:**\n• Milk: 5-7 days past sell-by\n• Yogurt: 1-2 weeks past date\n• Hard cheese: Several weeks\n• Soft cheese: 1 week\n• Butter: Several weeks\n\n**Tip:** Store milk in coldest part of fridge!";
  }
  
  private static getColorCodeInfo(): string {
    return "🎨 **Color-Coded Alert System:**\n\n🔴 **Red (Critical):**\n• Expired items\n• Zero stock\n• Critically low quantities\n→ **Action:** Address immediately!\n\n🟡 **Yellow (Warning):**\n• Expiring within 3 days\n• Low stock levels\n→ **Action:** Plan to use or restock soon\n\n🟢 **Green (Good):**\n• Adequate stock levels\n• Fresh with good shelf life\n→ **Action:** Monitor regularly\n\nThe progress bars also use these colors!";
  }
  
  private static getTooltipGuidance(): string {
    return "💡 **Interactive Tooltips & Guidance:**\n\n**Item Names:** Hover to see:\n• Storage temperature requirements\n• Detailed storage tips\n• Allergen information\n• Category classification\n\n**Category Badges:** Hover for:\n• Category-specific storage guidelines\n• Professional recommendations\n• Temperature ranges\n\n**Pro Tip:** The system is designed to teach you as you use it - hover over anything that looks clickable!";
  }
  
  /**
   * 🏪 Order Management Guidance
   */
  private static getOrderManagementGuidance(msg: string): string {
    if (msg.includes('how') || msg.includes('place') || msg.includes('create')) {
      return "🏪 **Order Management in IOMS:**\n\n**Placing Orders:**\n1. Go to **Order Entry** in the sidebar\n2. Select items from your menu\n3. Add customer details and table number\n4. Process payment through integrated system\n\n**Menu Management:**\n• Upload menus via **Menu Upload** with smart CSV conversion\n• AI automatically categorizes dishes and ingredients\n• Set pricing and special offers\n\n**Features:**\n✅ Real-time order tracking\n✅ Kitchen notifications\n✅ Customer order history\n✅ Integration with inventory for automatic stock deduction\n\n**Pro Tip:** Use the AI Order Agent for voice-activated order taking!";
    }
    return "🏪 **IOMS Order System** handles the complete order lifecycle from menu selection to payment processing. Use **Order Entry** to create orders, **Menu Upload** to manage your menu items, and track everything through the integrated dashboard!";
  }

  /**
   * 📊 Analytics Guidance
   */
  private static getAnalyticsGuidance(msg: string): string {
    return "📊 **IOMS Analytics Dashboard:**\n\n**What Analytics Show:**\n• 📈 Sales trends and peak hours\n• 🍽️ Most popular menu items\n• 💰 Revenue breakdown by category\n• 📉 Inventory turnover rates\n• 👥 Customer behavior patterns\n• ⚠️ Stock level alerts and predictions\n\n**Key Metrics:**\n✅ Daily/Weekly/Monthly sales\n✅ Profit margins per dish\n✅ Inventory waste reduction\n✅ Customer satisfaction trends\n✅ Staff performance insights\n\n**How to Access:**\nGo to **Analytics** in the sidebar to view comprehensive reports with interactive charts and actionable insights.\n\n**Pro Tip:** Analytics help optimize menu pricing, reduce waste, and improve profitability!";
  }

  /**
   * 🤖 AI Ingredient Tool Guidance
   */
  private static getAIToolGuidance(msg: string): string {
    return "🤖 **AI Ingredient Tool - Smart Inventory Assistant:**\n\n**What It Does:**\n• 🔍 Automatically identifies ingredients from dish names\n• 📝 Suggests ingredient lists for new menu items\n• 🧮 Calculates optimal quantities and costs\n• 💡 Recommends storage conditions and expiry dates\n• 🔄 Auto-updates inventory when orders are placed\n\n**How to Use:**\n1. Go to **AI Ingredient Tool** in sidebar\n2. Enter dish name or description\n3. AI generates complete ingredient breakdown\n4. Review and adjust quantities\n5. Add directly to inventory\n\n**Smart Features:**\n✅ Recipe cost calculation\n✅ Nutritional information\n✅ Allergen detection\n✅ Supplier recommendations\n\n**Perfect for:** New menu planning, cost optimization, and automated inventory management!";
  }

  /**
   * 📅 Order History Guidance
   */
  private static getOrderHistoryGuidance(msg: string): string {
    return "📅 **Order History - Complete Transaction Records:**\n\n**What You Can Track:**\n• 🕐 All past orders with timestamps\n• 💳 Payment methods and amounts\n• 🍽️ Items ordered by customers\n• 📍 Table assignments and server details\n• ⭐ Customer preferences and notes\n• 📊 Order completion times\n\n**Features:**\n✅ Search by date, customer, or order ID\n✅ Filter by payment status or table\n✅ Export reports for accounting\n✅ Customer loyalty tracking\n✅ Refund and modification history\n\n**How to Access:**\nGo to **Order History** in the sidebar to view all transaction records.\n\n**Business Benefits:** Track customer patterns, identify popular items, and maintain complete audit trails for accounting!";
  }

  /**
   * 💳 Payment Guidance
   */
  private static getPaymentGuidance(msg: string): string {
return "💳 **Payment Processing in IOMS:**\n\n**Supported Methods:**\n 💳 Credit/Debit Cards\n 📲 Mobile payments (Apple Pay, Google Pay)\n 💵 Cash transactions\n 🎟️ Gift cards and vouchers\n";

  }

  /**
   * 🪑 Table Management and Reservation Guidance
   */
  private static getTableManagementGuidance(msg: string): string {
    if (msg.includes('book') || msg.includes('reserve') || msg.includes('reservation')) {
      return "🪑 **Table Reservations in IOMS:**\n\n**How to Book a Table:**\n1. Go to **Table Management** in sidebar\n2. View real-time table availability\n3. Select desired date and time\n4. Choose table size (2, 4, 6, 8+ seats)\n5. Add customer details and special requests\n6. Confirm reservation\n\n**Reservation Features:**\n✅ Real-time availability checking\n✅ Customer preference tracking\n✅ Special occasion notes\n✅ Automatic confirmation emails/SMS\n✅ Waitlist management\n✅ No-show tracking\n\n**Table Status:**\n🟢 Available | 🟡 Reserved | 🔴 Occupied | 🧹 Cleaning\n\n**Pro Tip:** System automatically blocks reserved tables and sends reminders to customers!";
    }
    return "🪑 **Table Management System:**\n\n**Features:**\n• 📅 Real-time table availability\n• 👥 Capacity management (2-12+ seats)\n• ⏰ Time-slot booking system\n• 📱 Customer notification system\n• 🎯 Table assignment optimization\n• 📊 Usage analytics\n\n**Table Operations:**\n✅ Quick table status updates\n✅ Server assignment\n✅ Order linking to tables\n✅ Cleaning schedules\n✅ Revenue per table tracking\n\n**Access:** Use **Table Management** to handle all seating operations and reservations efficiently!";
  }

  /**
   * 📱 Barcode Scanner Guidance
   */
  private static getBarcodeScannerGuidance(msg: string): string {
    return "📱 **Barcode Scanner - Quick Inventory Management:**\n\n**What It Does:**\n• 🔍 Instantly identify products by scanning barcodes\n• ➕ Quick add items to inventory\n• 📦 Receive shipments efficiently\n• ✅ Verify product information\n• 🔄 Update stock levels in real-time\n\n**How to Use:**\n1. Go to **Barcode Scanner** in sidebar\n2. Point camera at product barcode\n3. System automatically identifies item\n4. Confirm details and quantities\n5. Add to inventory instantly\n\n**Smart Features:**\n✅ Product database lookup\n✅ Auto-fill item details\n✅ Batch scanning for multiple items\n✅ Expiry date detection\n✅ Price verification\n\n**Perfect for:** Receiving deliveries, stock takes, and quick inventory updates!";
  }

  private static getDefaultResponse(): string {
    return "🤖 **I'm Smart SAM - Your Complete IOMS Assistant!**\n\n**I can help you with:**\n\n🏪 **Orders:** How to place orders, manage menus\n📊 **Analytics:** Understanding reports and insights  \n🤖 **AI Tools:** Ingredient tool, smart features\n📅 **History:** Order tracking and records\n💳 **Payments:** Processing and methods\n🪑 **Tables:** Reservations and management\n📱 **Scanner:** Barcode scanning features\n📦 **Inventory:** Stock management and storage\n🔍 **Search:** Voice and text search\n📊 **CSV:** Smart uploads and imports\n\n**Just ask me about any IOMS feature!** For example:\n• \"How do I place an order?\"\n• \"What does analytics show?\"\n• \"How do table reservations work?\"\n• \"How does the AI ingredient tool work?\"";
  }
    /**
   * Get initial welcome messages for new chat sessions
   */
  static getWelcomeMessages(): ChatMessage[] {
    return [
      {
        id: '1',
        type: 'sam',
message: "👋 **Welcome to Smart SAM!**\n\nI'm your complete IOMS assistant, ready to help with:\n\n🏪 **Order Management** - Place orders, manage menus\n📊 **Analytics** - Reports and business insights\n🤖 **AI Tools** - Smart ingredient detection\n📅 **Order History** - Track all transactions\n💳 **Payments** - Process all payment types\n🪑 **Table Management** - Reservations and seating\n📱 **Barcode Scanner** - Quick inventory updates\n📦 **Inventory** - Stock management and storage\n\n**Ask me anything about IOMS features!**\nTry: \"How do I place an order?\" or \"How do reservations work?\"",
timestamp: new Date()

      }
    ];
  }

  /**
   * Get quick action suggestions
   */
  static getQuickActions(): Array<{label: string, message: string}> {
    return [
      { label: "How to place orders?", message: "How do I place an order in IOMS?" },
      { label: "Table reservations?", message: "How do table reservations work?" },
      { label: "What does analytics show?", message: "What information does analytics provide?" },
      { label: "AI ingredient tool?", message: "How does the AI ingredient tool work?" },
      { label: "Payment processing?", message: "How does payment processing work?" },
      { label: "Order history tracking?", message: "How does order history work?" },
      { label: "Barcode scanner?", message: "How do I use the barcode scanner?" },
      { label: "CSV upload help?", message: "How does the smart CSV upload work?" }
    ];
  }
}
