# IOMS Database Setup Guide

## Overview

The IOMS system now includes a comprehensive SQLite database alongside the existing CSV file structure. This provides better data organization, improved categorization, and enhanced functionality while maintaining backward compatibility.

## Key Improvements

### 1. **Better Categorization**
- Uses Gemini AI for intelligent product and menu categorization
- Properly separates categories like "Tea", "Sweets and Snacks", "Spices", "Pre Mix", etc.
- No more everything being lumped into "Beverages" and "Main Courses"

### 2. **Correct Field Mapping**
- **Quantity Field**: Now stores actual quantities (e.g., "500g", "1 lit") instead of prices
- **Price Field**: Stores only numeric prices without currency symbols
- **Weight/Unit Separation**: Properly extracts weight and unit separately
- **Ingredients**: Extracts and stores ingredients as structured data

### 3. **Database Structure**
- **Users**: User management with roles and authentication
- **Categories**: Hierarchical category system
- **Products**: Inventory products with barcodes, weights, and pricing
- **Menu Items**: Restaurant menu with ingredients and dietary info
- **Inventory**: Stock management with expiry dates and locations
- **Orders**: Complete order management system
- **Transactions**: Payment and transaction tracking

## Installation

### 1. Install Dependencies
```bash
cd IOMS-Version2_IOMS_POS_Working/IOMS
npm run install-db
```

### 2. Set Up Environment Variables
Create a `.env` file in the IOMS directory:
```env
GOOGLE_AI_API_KEY=your_gemini_api_key_here
```

### 3. Initialize Database
```bash
npm run migrate
```

### 4. Test Database Setup
```bash
npx tsx scripts/testDatabase.ts
```

## Database Schema

### Tables Overview

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User management | username, email, role, password_hash |
| `categories` | Product/menu categorization | name, description, parent_id |
| `products` | Inventory products | barcode, name, category_id, weight, unit, retail_price |
| `menu_items` | Restaurant menu | name, price, category_id, ingredients, dietary_info |
| `inventory` | Stock management | product_id, quantity, unit, expiry_date, location |
| `orders` | Order management | order_number, customer_info, status, total_amount |
| `order_items` | Order line items | order_id, product_id, menu_item_id, quantity, price |
| `transactions` | Payment tracking | order_id, amount, payment_method, status |

### Key Relationships
- Products and Menu Items belong to Categories
- Inventory tracks stock for Products
- Orders contain Order Items (Products or Menu Items)
- Transactions are linked to Orders

## Data Migration

### From CSV to Database

The migration script (`scripts/migrateData.ts`) automatically:

1. **Reads existing CSV files** from `data/` and `download/Copy/`
2. **Uses AI for intelligent extraction**:
   - Proper categorization using Gemini AI
   - Correct field mapping (price vs quantity)
   - Ingredient extraction
   - Dietary restriction detection
3. **Inserts data into database** with proper relationships
4. **Provides detailed reporting** of migration results

### Running Migration
```bash
npm run migrate
```

## API Endpoints

### Improved Menu Upload
- **POST** `/api/improvedMenuUpload` - Upload menu with AI processing
- **GET** `/api/improvedMenuUpload` - Get all menu items with categories

### Database Operations
- **GET** `/api/products` - Get all products with categories
- **GET** `/api/categories` - Get all categories
- **GET** `/api/inventory` - Get inventory status

## Usage Examples

### 1. Upload Menu with AI Processing
```javascript
const formData = new FormData();
formData.append('file', menuFile);

const response = await fetch('/api/improvedMenuUpload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Processed items:', result.data.results);
console.log('Category breakdown:', result.data.categoryBreakdown);
```

### 2. Get Menu Items by Category
```javascript
const response = await fetch('/api/improvedMenuUpload');
const data = await response.json();

// Filter by category
const mainCourses = data.data.menuItems.filter(item => 
  item.category_name === 'Main Courses'
);
```

### 3. Database Helper Functions
```javascript
import { dbHelpers } from '../lib/database';

// Get all categories
const categories = dbHelpers.getCategories();

// Get products by category
const products = dbHelpers.getProducts();

// Insert new product
const result = dbHelpers.insertProduct({
  name: 'New Product',
  category_id: 1,
  retail_price: 9.99,
  weight: '500',
  unit: 'g'
});
```

## Benefits of New System

### 1. **Accurate Categorization**
- AI-powered categorization eliminates manual errors
- Proper separation of product types
- Hierarchical category system

### 2. **Correct Data Fields**
- Quantity field stores actual quantities (500g, 1 lit)
- Price field stores clean numeric values
- Weight and unit properly separated

### 3. **Enhanced Functionality**
- User management and authentication
- Inventory tracking with expiry dates
- Order management system
- Payment tracking
- Dietary restriction support

### 4. **Backward Compatibility**
- Existing CSV files remain unchanged
- Gradual migration possible
- Both systems can coexist

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure `better-sqlite3` is installed
   - Check file permissions for database directory

2. **AI Processing Errors**
   - Verify `GOOGLE_AI_API_KEY` is set
   - Check API quota and limits

3. **Migration Failures**
   - Ensure CSV files exist in expected locations
   - Check file formats and encoding

### Debug Commands
```bash
# Test database connection
npx tsx scripts/testDatabase.ts

# Check database file
ls -la database/ioms.db

# View database schema
sqlite3 database/ioms.db ".schema"
```

## Next Steps

1. **Set up Gemini API key** for AI-powered categorization
2. **Run migration** to import existing data
3. **Test the system** with sample data
4. **Update frontend** to use new API endpoints
5. **Gradually migrate** from CSV to database storage

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review database logs
3. Test with sample data
4. Verify API key configuration 