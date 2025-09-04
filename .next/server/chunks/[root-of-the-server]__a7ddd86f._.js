module.exports = [
"[project]/.next-internal/server/app/api/pos/floor/layout/activate/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/better-sqlite3 [external] (better-sqlite3, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("better-sqlite3", () => require("better-sqlite3"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[project]/src/lib/database.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dbHelpers",
    ()=>dbHelpers,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$better$2d$sqlite3__$5b$external$5d$__$28$better$2d$sqlite3$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/better-sqlite3 [external] (better-sqlite3, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
;
;
;
// Database configuration
const DB_PATH = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), 'database', 'ioms.db');
// Ensure database directory exists
const dbDir = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].dirname(DB_PATH);
if (!__TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].existsSync(dbDir)) {
    __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].mkdirSync(dbDir, {
        recursive: true
    });
}
// Initialize database
const db = new __TURBOPACK__imported__module__$5b$externals$5d2f$better$2d$sqlite3__$5b$external$5d$__$28$better$2d$sqlite3$2c$__cjs$29$__["default"](DB_PATH);
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
    {
        name: 'Tea',
        description: 'Various types of tea products'
    },
    {
        name: 'Sweets and Snacks',
        description: 'Candies, cookies, and snack items'
    },
    {
        name: 'Spices',
        description: 'Cooking spices and seasonings'
    },
    {
        name: 'Pre Mix',
        description: 'Pre-mixed food products'
    },
    {
        name: 'Coffee',
        description: 'Coffee products'
    },
    {
        name: 'Juices',
        description: 'Fruit and vegetable juices'
    },
    // Alcoholic Beverages
    {
        name: 'Cocktails',
        description: 'Mixed alcoholic drinks and cocktails'
    },
    {
        name: 'Wines',
        description: 'Red, white, and rose wines'
    },
    {
        name: 'German Wines',
        description: 'German wine varieties'
    },
    {
        name: 'International Wines',
        description: 'Italian, French, and other international wines'
    },
    {
        name: 'Spirits',
        description: 'Vodka, Rum, Gin, Whiskey, etc.'
    },
    {
        name: 'Liqueurs',
        description: 'Sweet alcoholic beverages'
    },
    {
        name: 'Digestifs',
        description: 'After-dinner drinks'
    },
    // Non-Alcoholic Beverages
    {
        name: 'Soft Drinks',
        description: 'Cola, lemonade, and carbonated drinks'
    },
    {
        name: 'Fresh Juices',
        description: 'Fresh fruit and vegetable juices'
    },
    {
        name: 'Mocktails',
        description: 'Non-alcoholic cocktails'
    },
    {
        name: 'Hot Beverages',
        description: 'Tea, coffee, and hot drinks'
    },
    {
        name: 'Non-Alcoholic Wine/Sekt',
        description: 'Non-alcoholic wine and sparkling drinks'
    },
    // Indian Cuisine
    {
        name: 'Chicken Dishes',
        description: 'Chicken curry and chicken-based dishes'
    },
    {
        name: 'Lamb Dishes',
        description: 'Lamb curry and lamb-based dishes'
    },
    {
        name: 'Fish Dishes',
        description: 'Fish curry and fish-based dishes'
    },
    {
        name: 'Vegetarian Dishes',
        description: 'Vegetable curry and vegetarian dishes'
    },
    {
        name: 'Rice Dishes',
        description: 'Basmati rice and rice-based dishes'
    },
    {
        name: 'Breads',
        description: 'Naan, roti, and Indian breads'
    },
    // Other Categories
    {
        name: 'Appetizers',
        description: 'Starter dishes and appetizers'
    },
    {
        name: 'Salads',
        description: 'Fresh salads and vegetable dishes'
    },
    {
        name: 'Desserts',
        description: 'Sweet dessert items'
    },
    {
        name: 'Side Dishes',
        description: 'Rice, bread, and side accompaniments'
    }
];
const insertCategory = db.prepare(`
  INSERT OR IGNORE INTO categories (name, description) 
  VALUES (?, ?)
`);
defaultCategories.forEach((category)=>{
    insertCategory.run(category.name, category.description);
});
const __TURBOPACK__default__export__ = db;
const dbHelpers = {
    // Get all categories
    getCategories: ()=>{
        return db.prepare('SELECT * FROM categories ORDER BY name').all();
    },
    // Get category by name
    getCategoryByName: (name)=>{
        return db.prepare('SELECT * FROM categories WHERE name = ?').get(name);
    },
    // Insert or update category
    upsertCategory: (name, description)=>{
        const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(name);
        if (existing) {
            return existing.id;
        } else {
            const result = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)').run(name, description);
            return result.lastInsertRowid;
        }
    },
    // Get all products
    getProducts: ()=>{
        return db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      JOIN categories c ON p.category_id = c.id 
      ORDER BY p.name
    `).all();
    },
    // Get product by barcode
    getProductByBarcode: (barcode)=>{
        return db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      JOIN categories c ON p.category_id = c.id 
      WHERE p.barcode = ?
    `).get(barcode);
    },
    // Insert product
    insertProduct: (product)=>{
        return db.prepare(`
      INSERT INTO products (barcode, name, brand, category_id, weight, unit, retail_price, cost_price, description, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(product.barcode, product.name, product.brand, product.category_id, product.weight, product.unit, product.retail_price, product.cost_price, product.description, product.image_url);
    },
    // Get all menu items
    getMenuItems: ()=>{
        return db.prepare(`
      SELECT m.*, c.name as category_name 
      FROM menu_items m 
      JOIN categories c ON m.category_id = c.id 
      WHERE m.is_active = 1
      ORDER BY m.name
    `).all();
    },
    // Insert menu item
    insertMenuItem: (item)=>{
        return db.prepare(`
      INSERT INTO menu_items (name, description, price, category_id, ingredients, preparation_time, is_vegetarian, is_vegan, is_gluten_free)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(item.name, item.description, item.price, item.category_id, item.ingredients, item.preparation_time, item.is_vegetarian ? 1 : 0, item.is_vegan ? 1 : 0, item.is_gluten_free ? 1 : 0);
    },
    // Get inventory for product
    getInventory: (productId)=>{
        return db.prepare('SELECT * FROM inventory WHERE product_id = ?').get(productId);
    },
    // Update inventory
    updateInventory: (productId, quantity, unit)=>{
        const existing = db.prepare('SELECT id FROM inventory WHERE product_id = ?').get(productId);
        if (existing) {
            return db.prepare('UPDATE inventory SET quantity = ?, unit = ?, last_updated = CURRENT_TIMESTAMP WHERE product_id = ?').run(quantity, unit, productId);
        } else {
            return db.prepare('INSERT INTO inventory (product_id, quantity, unit) VALUES (?, ?, ?)').run(productId, quantity, unit);
        }
    }
};
}),
"[project]/src/app/api/pos/floor/layout/activate/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-route] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$database$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/database.ts [app-route] (ecmascript)");
;
;
;
// Request validation schema
const ActivateLayoutSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    tables: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        x: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
        y: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
        w: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
        h: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
        shape: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'round',
            'square',
            'rect'
        ]),
        capacity: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(1).max(20),
        seats: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(1).max(20),
        label: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        zoneId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        metadata: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].any()).optional()
    })),
    zones: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        color: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        visible: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean()
    })),
    metadata: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        version: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        activatedAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        activatedBy: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        tableCount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
        zoneCount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number()
    })
});
async function POST(request) {
    try {
        const tenantId = request.headers.get('x-tenant-id') || 'default';
        const body = await request.json();
        // Validate request data
        const validatedData = ActivateLayoutSchema.parse(body);
        // Check for overlapping tables
        const tables = validatedData.tables;
        for(let i = 0; i < tables.length; i++){
            for(let j = i + 1; j < tables.length; j++){
                const table1 = tables[i];
                const table2 = tables[j];
                // Simple overlap detection
                const overlap = !(table1.x + table1.w <= table2.x || table2.x + table2.w <= table1.x || table1.y + table1.h <= table2.y || table2.y + table2.h <= table1.y);
                if (overlap) {
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        error: 'Validation Error',
                        message: `Tables ${table1.label || table1.id} and ${table2.label || table2.id} overlap`,
                        code: 'TABLES_OVERLAP'
                    }, {
                        status: 400
                    });
                }
            }
        }
        // Validate minimum table count
        if (tables.length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Validation Error',
                message: 'Layout must contain at least one table',
                code: 'NO_TABLES'
            }, {
                status: 400
            });
        }
        // Start transaction
        const transaction = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$database$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].transaction(()=>{
            // Archive current active layout
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$database$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].prepare(`
        UPDATE FloorLayout 
        SET status = 'ARCHIVED', updatedAt = ?
        WHERE tenantId = ? AND status = 'ACTIVE'
      `).run(new Date().toISOString(), tenantId);
            // Create new active layout
            const layoutData = {
                id: crypto.randomUUID(),
                tenantId,
                status: 'ACTIVE',
                data: JSON.stringify(validatedData),
                metadata: JSON.stringify(validatedData.metadata),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$database$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].prepare(`
        INSERT INTO FloorLayout (
          id, tenantId, status, data, metadata, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(layoutData.id, layoutData.tenantId, layoutData.status, layoutData.data, layoutData.metadata, layoutData.createdAt, layoutData.updatedAt);
            // Initialize table status records for all tables
            const deleteExistingStatuses = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$database$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].prepare(`
        DELETE FROM TableStatus WHERE tenantId = ?
      `);
            deleteExistingStatuses.run(tenantId);
            const insertTableStatus = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$database$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].prepare(`
        INSERT INTO TableStatus (
          id, tableId, tenantId, status, updatedAt, metadata
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);
            tables.forEach((table)=>{
                insertTableStatus.run(crypto.randomUUID(), table.id, tenantId, 'FREE', new Date().toISOString(), JSON.stringify({
                    capacity: table.capacity || table.seats || 4,
                    label: table.label || `Table ${table.id}`,
                    shape: table.shape,
                    zoneId: table.zoneId
                }));
            });
            // Remove draft layout if exists
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$database$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].prepare(`
        DELETE FROM FloorLayout 
        WHERE tenantId = ? AND status = 'DRAFT'
      `).run(tenantId);
            return layoutData;
        });
        const result = transaction();
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            message: 'Layout activated successfully',
            layoutId: result.id,
            tableCount: tables.length,
            zoneCount: validatedData.zones.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error activating layout:', error);
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].ZodError) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Validation Error',
                message: 'Invalid layout data',
                details: error.errors
            }, {
                status: 400
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal Server Error',
            message: 'Failed to activate layout'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__a7ddd86f._.js.map