// Mock data store for the IOMS system
// In production, this would be replaced with a proper database

// Menu Items
const menuItems = [
  {
    id: 'M001',
    name: 'Margherita Pizza',
    price: 12.99,
    category: 'Pizza',
    availability: true,
    description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
    preparationTime: 15,
    ingredients: ['flour', 'tomato_sauce', 'mozzarella', 'basil']
  },
  {
    id: 'M002',
    name: 'Chicken Biryani',
    price: 15.99,
    category: 'Main Course',
    availability: true,
    description: 'Aromatic basmati rice with spiced chicken and herbs',
    preparationTime: 25,
    ingredients: ['basmati_rice', 'chicken', 'spices', 'yogurt']
  },
  {
    id: 'M003',
    name: 'Caesar Salad',
    price: 8.99,
    category: 'Salad',
    availability: true,
    description: 'Fresh romaine lettuce with caesar dressing and croutons',
    preparationTime: 10,
    ingredients: ['romaine_lettuce', 'caesar_dressing', 'croutons', 'parmesan']
  },
  {
    id: 'M004',
    name: 'Chocolate Lava Cake',
    price: 6.99,
    category: 'Dessert',
    availability: true,
    description: 'Warm chocolate cake with molten chocolate center',
    preparationTime: 12,
    ingredients: ['chocolate', 'flour', 'eggs', 'butter']
  },
  {
    id: 'M005',
    name: 'Pepperoni Pizza',
    price: 14.99,
    category: 'Pizza',
    availability: false,
    description: 'Pizza with pepperoni and mozzarella cheese',
    preparationTime: 15,
    ingredients: ['flour', 'tomato_sauce', 'mozzarella', 'pepperoni']
  },
  {
    id: 'M006',
    name: 'Grilled Salmon',
    price: 18.99,
    category: 'Main Course',
    availability: true,
    description: 'Fresh salmon grilled with herbs and lemon',
    preparationTime: 20,
    ingredients: ['salmon', 'herbs', 'lemon', 'olive_oil']
  }
];

// Tables
const tables = [
  {
    id: 'T001',
    number: 1,
    capacity: 2,
    isAvailable: true,
    location: 'Window Side',
    reservedUntil: null
  },
  {
    id: 'T002',
    number: 2,
    capacity: 4,
    isAvailable: true,
    location: 'Center',
    reservedUntil: null
  },
  {
    id: 'T003',
    number: 3,
    capacity: 6,
    isAvailable: false,
    location: 'Private Corner',
    reservedUntil: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
  },
  {
    id: 'T004',
    number: 4,
    capacity: 2,
    isAvailable: true,
    location: 'Balcony',
    reservedUntil: null
  },
  {
    id: 'T005',
    number: 5,
    capacity: 8,
    isAvailable: true,
    location: 'Main Hall',
    reservedUntil: null
  }
];

// Reservations
const reservations = [
  {
    id: 'R001',
    customerName: 'John Doe',
    customerPhone: '+1234567890',
    tableId: 'T003',
    tableNumber: 3,
    reservationTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    partySize: 4,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    specialRequests: 'Vegetarian options preferred'
  }
];

// Orders
const orders = [
  {
    id: 'O001',
    tableNumber: 1,
    items: [
      { itemId: 'M001', quantity: 2, unitPrice: 12.99 },
      { itemId: 'M003', quantity: 1, unitPrice: 8.99 }
    ],
    totalAmount: 34.97,
    status: 'preparing',
    orderTime: new Date().toISOString(),
    estimatedReadyTime: new Date(Date.now() + 20 * 60 * 1000).toISOString()
  }
];

// Inventory
const inventory = [
  {
    id: 'I001',
    itemName: 'Flour',
    currentStock: 50,
    unit: 'kg',
    minimumThreshold: 10,
    lastUpdated: new Date().toISOString(),
    supplier: 'Local Bakery Supply'
  },
  {
    id: 'I002',
    itemName: 'Tomato Sauce',
    currentStock: 25,
    unit: 'liters',
    minimumThreshold: 5,
    lastUpdated: new Date().toISOString(),
    supplier: 'Fresh Foods Inc'
  },
  {
    id: 'I003',
    itemName: 'Mozzarella Cheese',
    currentStock: 15,
    unit: 'kg',
    minimumThreshold: 3,
    lastUpdated: new Date().toISOString(),
    supplier: 'Dairy Fresh'
  },
  {
    id: 'I004',
    itemName: 'Chicken Breast',
    currentStock: 20,
    unit: 'kg',
    minimumThreshold: 5,
    lastUpdated: new Date().toISOString(),
    supplier: 'Premium Meats'
  },
  {
    id: 'I005',
    itemName: 'Basmati Rice',
    currentStock: 30,
    unit: 'kg',
    minimumThreshold: 8,
    lastUpdated: new Date().toISOString(),
    supplier: 'Grain Merchants'
  },
  {
    id: 'I006',
    itemName: 'Romaine Lettuce',
    currentStock: 12,
    unit: 'heads',
    minimumThreshold: 5,
    lastUpdated: new Date().toISOString(),
    supplier: 'Fresh Greens Co'
  },
  {
    id: 'I007',
    itemName: 'Salmon Fillet',
    currentStock: 8,
    unit: 'kg',
    minimumThreshold: 2,
    lastUpdated: new Date().toISOString(),
    supplier: 'Ocean Fresh Seafood'
  }
];

module.exports = {
  menuItems,
  tables,
  reservations,
  orders,
  inventory
};
