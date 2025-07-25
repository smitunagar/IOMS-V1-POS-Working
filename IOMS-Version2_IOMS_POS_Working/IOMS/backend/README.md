# IOMS Backend API

## 🏪 Inventory & Order Management System

A RESTful API backend for a restaurant Point of Sale (POS) system that manages menu items, orders, table reservations, and inventory.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Or start production server:**
   ```bash
   npm start
   ```

The server will run on `http://localhost:3001` by default.

## 📋 API Endpoints

### 🍽️ Menu Management

#### Get Menu Items
```http
GET /api/menu
GET /api/menu?category=Pizza
GET /api/menu?available=true
```

#### Get Specific Menu Item
```http
GET /api/menu/:itemId
```

#### Add Menu Item (Admin)
```http
POST /api/menu
Content-Type: application/json

{
  "name": "New Dish",
  "price": 12.99,
  "category": "Main Course",
  "description": "Delicious dish",
  "preparationTime": 15,
  "ingredients": ["ingredient1", "ingredient2"]
}
```

#### Update Menu Item
```http
PATCH /api/menu/:itemId
Content-Type: application/json

{
  "availability": false,
  "price": 13.99
}
```

### 📝 Order Management

#### Create Order
```http
POST /api/orders
Content-Type: application/json

{
  "tableNumber": 5,
  "customerName": "John Doe",
  "items": [
    {
      "itemId": "M001",
      "quantity": 2
    },
    {
      "itemId": "M003",
      "quantity": 1
    }
  ],
  "specialInstructions": "No onions please"
}
```

#### Get Orders
```http
GET /api/orders
GET /api/orders?status=pending
GET /api/orders?tableNumber=5
GET /api/orders?date=2024-01-15
```

#### Get Specific Order
```http
GET /api/orders/:orderId
```

#### Update Order Status
```http
PATCH /api/orders/:orderId
Content-Type: application/json

{
  "status": "preparing"
}
```

### 🪑 Table Management

#### Get Table Availability
```http
GET /api/tables/availability
GET /api/tables/availability?capacity=4
```

#### Get All Tables
```http
GET /api/tables
```

#### Get Specific Table
```http
GET /api/tables/:tableId
```

#### Update Table Status
```http
PATCH /api/tables/:tableId
Content-Type: application/json

{
  "isAvailable": false,
  "reservedUntil": "2024-01-15T19:00:00.000Z"
}
```

### 📅 Reservation Management

#### Create Reservation
```http
POST /api/reservations
Content-Type: application/json

{
  "customerName": "Jane Smith",
  "customerPhone": "+1234567890",
  "tableId": "T001",
  "reservationTime": "2024-01-15T19:00:00.000Z",
  "partySize": 4,
  "specialRequests": "Birthday celebration"
}
```

#### Get Reservations
```http
GET /api/reservations
GET /api/reservations?date=2024-01-15
GET /api/reservations?status=confirmed
GET /api/reservations?customerPhone=1234567890
```

#### Get Specific Reservation
```http
GET /api/reservations/:reservationId
```

#### Update Reservation
```http
PATCH /api/reservations/:reservationId
Content-Type: application/json

{
  "status": "cancelled"
}
```

#### Cancel Reservation
```http
DELETE /api/reservations/:reservationId
```

### 📦 Inventory Management

#### Get Inventory
```http
GET /api/inventory
GET /api/inventory?lowStock=true
GET /api/inventory?itemName=flour
```

#### Get Specific Inventory Item
```http
GET /api/inventory/:itemId
```

#### Update Inventory Item
```http
PATCH /api/inventory/:itemId
Content-Type: application/json

{
  "currentStock": 25,
  "minimumThreshold": 10
}
```

#### Update with Operations
```http
PATCH /api/inventory/:itemId
Content-Type: application/json

{
  "operation": "subtract",
  "quantity": 5
}
```

#### Add New Inventory Item
```http
POST /api/inventory
Content-Type: application/json

{
  "itemName": "New Ingredient",
  "currentStock": 50,
  "unit": "kg",
  "minimumThreshold": 10,
  "supplier": "Local Supplier",
  "unitPrice": 5.99
}
```

#### Get Stock Alerts
```http
GET /api/inventory/alerts/stock
```

## 📊 Response Format

All API responses follow this structure:

```json
{
  "status": "success" | "error",
  "message": "Human readable message",
  "data": { /* Response data */ },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🔧 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## 🗂️ Project Structure

```
backend/
├── server.js                 # Main server file
├── package.json              # Dependencies and scripts
├── data/
│   └── mockData.js          # In-memory data store
└── routes/
    ├── menu.js              # Menu endpoints
    ├── orders.js            # Order endpoints
    ├── tables.js            # Table endpoints
    ├── reservations.js      # Reservation endpoints
    └── inventory.js         # Inventory endpoints
```

## 🛠️ Development

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

### Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=3001
NODE_ENV=development
```

## 🧪 Testing

You can test the API using tools like:

- **Postman** - Import the endpoints and test manually
- **curl** - Command line testing
- **Thunder Client** - VS Code extension
- **Insomnia** - API testing tool

### Example curl commands:

```bash
# Get menu
curl http://localhost:3001/api/menu

# Create order
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "tableNumber": 1,
    "items": [{"itemId": "M001", "quantity": 2}]
  }'

# Check table availability
curl http://localhost:3001/api/tables/availability

# Get inventory
curl http://localhost:3001/api/inventory
```

## 🔒 Security Features

- CORS enabled for cross-origin requests
- Input validation on all endpoints
- Error handling middleware
- Request logging with Morgan
- Security headers with Helmet

## 📈 Future Enhancements

- Database integration (PostgreSQL/MongoDB)
- User authentication and authorization
- Real-time updates with WebSockets
- Payment processing integration
- Advanced analytics and reporting
- Rate limiting
- API documentation with Swagger

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
