const request = require('supertest');
const app = require('../server');

describe('IOMS API Tests', () => {
  describe('GET /health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /', () => {
    test('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      expect(response.body).toHaveProperty('message', 'IOMS Restaurant Management API');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('Menu API', () => {
    test('should get menu items', async () => {
      const response = await request(app)
        .get('/api/menu')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('should filter menu by category', async () => {
      const response = await request(app)
        .get('/api/menu?category=appetizer')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(item => {
        expect(item.category).toBe('appetizer');
      });
    });
  });

  describe('Tables API', () => {
    test('should get table availability', async () => {
      const response = await request(app)
        .get('/api/tables/availability')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should filter tables by capacity', async () => {
      const response = await request(app)
        .get('/api/tables/availability?capacity=4')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(table => {
        expect(table.capacity).toBeGreaterThanOrEqual(4);
      });
    });
  });

  describe('Orders API', () => {
    test('should create a new order', async () => {
      const orderData = {
        customerName: 'John Doe',
        items: [
          { itemId: 'M001', quantity: 2, notes: 'Extra spicy' }
        ],
        tableNumber: 1
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('customerName', 'John Doe');
      expect(response.body).toHaveProperty('status', 'pending');
    });

    test('should validate order data', async () => {
      const invalidOrder = {
        customerName: '', // Invalid: empty name
        items: []         // Invalid: no items
      };

      await request(app)
        .post('/api/orders')
        .send(invalidOrder)
        .expect(400);
    });
  });

  describe('Reservations API', () => {
    test('should create a reservation', async () => {
      const reservationData = {
        customerName: 'Jane Smith',
        customerPhone: '555-123-4567',
        partySize: 4,
        tableId: 'T001',
        reservationTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        specialRequests: 'Window seat preferred'
      };

      const response = await request(app)
        .post('/api/reservations')
        .send(reservationData)
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('customerName', 'Jane Smith');
      expect(response.body).toHaveProperty('status', 'confirmed');
    });
  });

  describe('Inventory API', () => {
    test('should get inventory items', async () => {
      const response = await request(app)
        .get('/api/inventory')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('should update inventory item', async () => {
      const updateData = { currentStock: 50 };

      const response = await request(app)
        .patch('/api/inventory/I001')
        .send(updateData)
        .expect(200);
      
      expect(response.body).toHaveProperty('currentStock', 50);
    });

    test('should get low stock items', async () => {
      const response = await request(app)
        .get('/api/inventory?lowStock=true')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(item => {
        expect(item.quantity).toBeLessThanOrEqual(item.minStock);
      });
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for unknown routes', async () => {
      await request(app)
        .get('/api/nonexistent')
        .expect(404);
    });

    test('should handle invalid JSON', async () => {
      await request(app)
        .post('/api/orders')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });
});
