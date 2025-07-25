# IOMS Backend API Testing Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the server:**
   ```bash
   npm run dev
   ```

3. **Test the API:**
   ```bash
   npm test
   ```

## Manual API Testing

### Health Check
```bash
curl http://localhost:3001/health
```

### Menu Operations
```bash
# Get all menu items
curl http://localhost:3001/api/menu

# Get menu by category
curl http://localhost:3001/api/menu?category=appetizer

# Add new menu item
curl -X POST http://localhost:3001/api/menu \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Dish",
    "description": "Delicious new dish",
    "price": 15.99,
    "category": "main",
    "ingredients": ["ingredient1", "ingredient2"],
    "allergens": ["gluten"],
    "isAvailable": true
  }'
```

### Order Operations
```bash
# Create new order
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "items": [
      {
        "menuItemId": 1,
        "quantity": 2,
        "notes": "Extra spicy"
      }
    ],
    "tableId": 1
  }'

# Get all orders
curl http://localhost:3001/api/orders

# Update order status
curl -X PATCH http://localhost:3001/api/orders/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "preparing"}'
```

### Table Operations
```bash
# Get table availability
curl http://localhost:3001/api/tables/availability

# Get tables with minimum capacity
curl http://localhost:3001/api/tables/availability?capacity=4

# Update table status
curl -X PATCH http://localhost:3001/api/tables/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "occupied"}'
```

### Reservation Operations
```bash
# Create reservation
curl -X POST http://localhost:3001/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Jane Smith",
    "partySize": 4,
    "dateTime": "2024-01-15T19:00:00.000Z",
    "contactInfo": "jane@example.com"
  }'

# Get all reservations
curl http://localhost:3001/api/reservations

# Update reservation
curl -X PATCH http://localhost:3001/api/reservations/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

### Inventory Operations
```bash
# Get all inventory
curl http://localhost:3001/api/inventory

# Get low stock items
curl http://localhost:3001/api/inventory?lowStock=true

# Update inventory quantity
curl -X PATCH http://localhost:3001/api/inventory/1 \
  -H "Content-Type: application/json" \
  -d '{"quantity": 50}'

# Add new inventory item
curl -X POST http://localhost:3001/api/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Ingredient",
    "unit": "kg",
    "quantity": 10,
    "minStock": 5,
    "supplier": "Local Supplier",
    "costPerUnit": 5.99
  }'
```

## Using Postman

Import the following collection:

```json
{
  "info": {
    "name": "IOMS API Collection",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3001/health",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["health"]
        }
      }
    },
    {
      "name": "Get Menu",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3001/api/menu",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["api", "menu"]
        }
      }
    },
    {
      "name": "Create Order",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"customerName\": \"Test Customer\",\n  \"items\": [\n    {\n      \"menuItemId\": 1,\n      \"quantity\": 2\n    }\n  ],\n  \"tableId\": 1\n}"
        },
        "url": {
          "raw": "http://localhost:3001/api/orders",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["api", "orders"]
        }
      }
    }
  ]
}
```

## Testing Checklist

- [ ] Server starts without errors
- [ ] Health endpoint returns 200
- [ ] All menu operations work
- [ ] Order creation and management work
- [ ] Table availability functions correctly
- [ ] Reservation system works
- [ ] Inventory management functions
- [ ] Error handling works for invalid requests
- [ ] Rate limiting is functional
- [ ] CORS is properly configured
