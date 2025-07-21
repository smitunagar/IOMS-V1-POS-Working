import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database configuration
const DB_PATH = path.join(process.cwd(), 'database', 'ioms.db');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Database schema
const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user',
  phone VARCHAR(20),
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  barcode VARCHAR(50) UNIQUE,
  name VARCHAR(200) NOT NULL,
  brand VARCHAR(100),
  category_id INTEGER NOT NULL,
  weight VARCHAR(50),
  unit VARCHAR(20),
  retail_price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  description TEXT,
  image_url VARCHAR(255),
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id INTEGER NOT NULL,
  ingredients TEXT,
  image VARCHAR(255),
  ai_hint TEXT,
  preparation_time INTEGER,
  is_vegetarian BOOLEAN DEFAULT 0,
  is_vegan BOOLEAN DEFAULT 0,
  is_gluten_free BOOLEAN DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
  unit VARCHAR(20),
  min_stock_level DECIMAL(10,3) DEFAULT 0,
  max_stock_level DECIMAL(10,3),
  location VARCHAR(100),
  expiry_date DATE,
  batch_number VARCHAR(50),
  supplier VARCHAR(100),
  cost_per_unit DECIMAL(10,2),
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(100),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(100),
  table_number INTEGER,
  order_type VARCHAR(20) DEFAULT 'dine_in',
  status VARCHAR(20) DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20),
  payment_status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER,
  menu_item_id INTEGER,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER,
  transaction_type VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20),
  reference_number VARCHAR(100),
  status VARCHAR(20) DEFAULT 'completed',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
`;

// Initialize database with schema
db.exec(schema);

// Insert default categories with detailed restaurant menu categories
const defaultCategories = [
  // Product categories
  { name: 'Tea', description: 'Various types of tea products' },
  { name: 'Sweets and Snacks', description: 'Candies, cookies, and snack items' },
  { name: 'Spices', description: 'Cooking spices and seasonings' },
  { name: 'Pre Mix', description: 'Pre-mixed food products' },
  { name: 'Coffee', description: 'Coffee products' },
  { name: 'Juices', description: 'Fruit and vegetable juices' },
  
  // Alcoholic Beverages
  { name: 'Cocktails', description: 'Mixed alcoholic drinks and cocktails' },
  { name: 'Wines', description: 'Red, white, and rose wines' },
  { name: 'German Wines', description: 'German wine varieties' },
  { name: 'International Wines', description: 'Italian, French, and other international wines' },
  { name: 'Spirits', description: 'Vodka, Rum, Gin, Whiskey, etc.' },
  { name: 'Liqueurs', description: 'Sweet alcoholic beverages' },
  { name: 'Digestifs', description: 'After-dinner drinks' },
  
  // Non-Alcoholic Beverages
  { name: 'Soft Drinks', description: 'Cola, lemonade, and carbonated drinks' },
  { name: 'Fresh Juices', description: 'Fresh fruit and vegetable juices' },
  { name: 'Mocktails', description: 'Non-alcoholic cocktails' },
  { name: 'Hot Beverages', description: 'Tea, coffee, and hot drinks' },
  { name: 'Non-Alcoholic Wine/Sekt', description: 'Non-alcoholic wine and sparkling drinks' },
  
  // Indian Cuisine
  { name: 'Chicken Dishes', description: 'Chicken curry and chicken-based dishes' },
  { name: 'Lamb Dishes', description: 'Lamb curry and lamb-based dishes' },
  { name: 'Fish Dishes', description: 'Fish curry and fish-based dishes' },
  { name: 'Vegetarian Dishes', description: 'Vegetable curry and vegetarian dishes' },
  { name: 'Rice Dishes', description: 'Basmati rice and rice-based dishes' },
  { name: 'Breads', description: 'Naan, roti, and Indian breads' },
  
  // Other Categories
  { name: 'Appetizers', description: 'Starter dishes and appetizers' },
  { name: 'Salads', description: 'Fresh salads and vegetable dishes' },
  { name: 'Desserts', description: 'Sweet dessert items' },
  { name: 'Side Dishes', description: 'Rice, bread, and side accompaniments' }
];

const insertCategory = db.prepare(`
  INSERT OR IGNORE INTO categories (name, description) 
  VALUES (?, ?)
`);

defaultCategories.forEach(category => {
  insertCategory.run(category.name, category.description);
});

export default db;

// Helper functions
export const dbHelpers = {
  // Get all categories
  getCategories: () => {
    return db.prepare('SELECT * FROM categories ORDER BY name').all();
  },

  // Get category by name
  getCategoryByName: (name: string) => {
    return db.prepare('SELECT * FROM categories WHERE name = ?').get(name);
  },

  // Insert or update category
  upsertCategory: (name: string, description?: string) => {
    const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(name) as { id: number } | undefined;
    if (existing) {
      return existing.id;
    } else {
      const result = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)').run(name, description);
      return result.lastInsertRowid as number;
    }
  },

  // Get all products
  getProducts: () => {
    return db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      JOIN categories c ON p.category_id = c.id 
      ORDER BY p.name
    `).all();
  },

  // Get product by barcode
  getProductByBarcode: (barcode: string) => {
    return db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      JOIN categories c ON p.category_id = c.id 
      WHERE p.barcode = ?
    `).get(barcode);
  },

  // Insert product
  insertProduct: (product: any) => {
    return db.prepare(`
      INSERT INTO products (barcode, name, brand, category_id, weight, unit, retail_price, cost_price, description, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      product.barcode,
      product.name,
      product.brand,
      product.category_id,
      product.weight,
      product.unit,
      product.retail_price,
      product.cost_price,
      product.description,
      product.image_url
    );
  },

  // Get all menu items
  getMenuItems: () => {
    return db.prepare(`
      SELECT m.*, c.name as category_name 
      FROM menu_items m 
      JOIN categories c ON m.category_id = c.id 
      WHERE m.is_active = 1
      ORDER BY m.name
    `).all();
  },

  // Insert menu item
  insertMenuItem: (item: any) => {
    return db.prepare(`
      INSERT INTO menu_items (name, description, price, category_id, ingredients, preparation_time, is_vegetarian, is_vegan, is_gluten_free)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      item.name,
      item.description,
      item.price,
      item.category_id,
      item.ingredients,
      item.preparation_time,
      item.is_vegetarian ? 1 : 0,
      item.is_vegan ? 1 : 0,
      item.is_gluten_free ? 1 : 0
    );
  },

  // Get inventory for product
  getInventory: (productId: number) => {
    return db.prepare('SELECT * FROM inventory WHERE product_id = ?').get(productId);
  },

  // Update inventory
  updateInventory: (productId: number, quantity: number, unit?: string) => {
    const existing = db.prepare('SELECT id FROM inventory WHERE product_id = ?').get(productId);
    if (existing) {
      return db.prepare('UPDATE inventory SET quantity = ?, unit = ?, last_updated = CURRENT_TIMESTAMP WHERE product_id = ?').run(quantity, unit, productId);
    } else {
      return db.prepare('INSERT INTO inventory (product_id, quantity, unit) VALUES (?, ?, ?)').run(productId, quantity, unit);
    }
  }
}; 