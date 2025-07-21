import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import db, { dbHelpers } from '../lib/database';

class SimpleDataMigration {
  /**
   * Simple categorization without AI
   */
  private categorizeProduct(name: string): string {
    const text = name.toLowerCase();
    
    if (text.includes('tea') || text.includes('chai')) return 'Tea';
    if (text.includes('sweet') || text.includes('chocolate') || text.includes('candy')) return 'Sweets and Snacks';
    if (text.includes('spice') || text.includes('masala') || text.includes('curry')) return 'Spices';
    if (text.includes('mix') || text.includes('premix')) return 'Pre Mix';
    if (text.includes('wine') || text.includes('wein')) return 'Wine';
    if (text.includes('rum') || text.includes('vodka') || text.includes('gin') || text.includes('whisky')) return 'Spirits';
    if (text.includes('beer') || text.includes('bier')) return 'Alcoholic Beverages';
    if (text.includes('coffee') || text.includes('kaffee')) return 'Coffee';
    if (text.includes('juice') || text.includes('saft')) return 'Juices';
    if (text.includes('curry') || text.includes('chicken') || text.includes('lamm') || text.includes('fish')) return 'Main Courses';
    if (text.includes('salad') || text.includes('salat')) return 'Salads';
    if (text.includes('dessert') || text.includes('kuchen')) return 'Desserts';
    if (text.includes('appetizer') || text.includes('starter')) return 'Appetizers';
    
    return 'Beverages'; // Default
  }

  /**
   * Extract price from string
   */
  private extractPrice(priceString: string): number {
    if (!priceString) return 0;
    
    // Remove currency symbols and text
    const cleanPrice = priceString
      .replace(/[€$£]/g, '')
      .replace(/[^\d,.]/g, '')
      .replace(',', '.');
    
    const price = parseFloat(cleanPrice);
    return isNaN(price) ? 0 : price;
  }

  /**
   * Extract weight and unit from string
   */
  private extractWeightAndUnit(weightString: string): { weight?: string; unit?: string } {
    if (!weightString) return {};
    
    // Common patterns
    const patterns = [
      /(\d+(?:\.\d+)?)\s*(g|kg|ml|l|lit|pkt|stk)/i,
      /(\d+(?:\.\d+)?)\s*(gram|kilo|liter|packet|stück)/i
    ];
    
    for (const pattern of patterns) {
      const match = weightString.match(pattern);
      if (match) {
        return {
          weight: match[1],
          unit: match[2].toLowerCase()
        };
      }
    }
    
    return {};
  }

  /**
   * Migrate sample products
   */
  async migrateSampleProducts() {
    console.log('🔄 Migrating sample products...');
    
    const sampleProducts = [
      {
        name: 'Basmati Rice',
        barcode: '4012625530530',
        weight: '500',
        unit: 'g',
        retail_price: 4.49,
        category: 'Pre Mix'
      },
      {
        name: 'Chicken Breast',
        barcode: '4012625530531',
        weight: '250',
        unit: 'g',
        retail_price: 8.99,
        category: 'Main Courses'
      },
      {
        name: 'Black Tea',
        barcode: '4012625530532',
        weight: '100',
        unit: 'g',
        retail_price: 3.99,
        category: 'Tea'
      },
      {
        name: 'Curry Powder',
        barcode: '4012625530533',
        weight: '50',
        unit: 'g',
        retail_price: 2.49,
        category: 'Spices'
      },
      {
        name: 'Chocolate Bar',
        barcode: '4012625530534',
        weight: '100',
        unit: 'g',
        retail_price: 1.99,
        category: 'Sweets and Snacks'
      }
    ];

    let successCount = 0;
    for (const product of sampleProducts) {
      try {
        const categoryId = dbHelpers.upsertCategory(product.category);
        
        const result = dbHelpers.insertProduct({
          barcode: product.barcode,
          name: product.name,
          brand: '',
          category_id: categoryId,
          weight: product.weight,
          unit: product.unit,
          retail_price: product.retail_price,
          cost_price: product.retail_price * 0.7,
          description: '',
          image_url: ''
        });

        if (result.changes > 0) {
          successCount++;
          console.log(`✅ Added: ${product.name}`);
        }
      } catch (error) {
        console.error(`❌ Error adding ${product.name}:`, error);
      }
    }

    console.log(`✅ Sample products migration completed: ${successCount} products added`);
  }

  /**
   * Migrate sample menu items
   */
  async migrateSampleMenuItems() {
    console.log('🔄 Migrating sample menu items...');
    
    const sampleMenuItems = [
      {
        name: 'Chicken Curry',
        price: 10.00,
        category: 'Main Courses',
        ingredients: ['Chicken', 'Onions', 'Spices', 'Tomatoes'],
        description: 'Traditional Indian chicken curry',
        preparation_time: 20,
        is_vegetarian: false,
        is_vegan: false,
        is_gluten_free: true
      },
      {
        name: 'Vegetable Biryani',
        price: 9.50,
        category: 'Main Courses',
        ingredients: ['Rice', 'Vegetables', 'Spices', 'Saffron'],
        description: 'Aromatic vegetable biryani',
        preparation_time: 25,
        is_vegetarian: true,
        is_vegan: true,
        is_gluten_free: true
      },
      {
        name: 'Masala Chai',
        price: 3.50,
        category: 'Tea',
        ingredients: ['Tea', 'Milk', 'Spices', 'Sugar'],
        description: 'Spiced Indian tea',
        preparation_time: 5,
        is_vegetarian: true,
        is_vegan: false,
        is_gluten_free: true
      },
      {
        name: 'Gulab Jamun',
        price: 4.00,
        category: 'Desserts',
        ingredients: ['Milk', 'Sugar', 'Cardamom', 'Rose Water'],
        description: 'Sweet Indian dessert',
        preparation_time: 10,
        is_vegetarian: true,
        is_vegan: false,
        is_gluten_free: false
      },
      {
        name: 'Mango Lassi',
        price: 4.50,
        category: 'Beverages',
        ingredients: ['Mango', 'Yogurt', 'Sugar', 'Cardamom'],
        description: 'Refreshing mango yogurt drink',
        preparation_time: 3,
        is_vegetarian: true,
        is_vegan: false,
        is_gluten_free: true
      }
    ];

    let successCount = 0;
    for (const item of sampleMenuItems) {
      try {
        const categoryId = dbHelpers.upsertCategory(item.category);
        
        const result = dbHelpers.insertMenuItem({
          name: item.name,
          description: item.description,
          price: item.price,
          category_id: categoryId,
          ingredients: item.ingredients.join(';'),
          preparation_time: item.preparation_time,
          is_vegetarian: item.is_vegetarian,
          is_vegan: item.is_vegan,
          is_gluten_free: item.is_gluten_free
        });

        if (result.changes > 0) {
          successCount++;
          console.log(`✅ Added: ${item.name}`);
        }
      } catch (error) {
        console.error(`❌ Error adding ${item.name}:`, error);
      }
    }

    console.log(`✅ Sample menu items migration completed: ${successCount} items added`);
  }

  /**
   * Create sample user
   */
  async createSampleUser() {
    console.log('👤 Creating sample user...');
    
    try {
      const result = db.prepare(`
        INSERT OR IGNORE INTO users (username, email, password_hash, full_name, role)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        'admin',
        'admin@ioms.com',
        '$2b$10$dummy.hash.for.demo',
        'System Administrator',
        'admin'
      );

      if (result.changes > 0) {
        console.log('✅ Sample user created successfully');
      } else {
        console.log('ℹ️ Sample user already exists');
      }
    } catch (error) {
      console.error('❌ Error creating sample user:', error);
    }
  }

  /**
   * Run complete simple migration
   */
  async runMigration() {
    console.log('🚀 Starting simple IOMS data migration...');
    
    try {
      // Create sample user
      await this.createSampleUser();
      
      // Migrate sample products
      await this.migrateSampleProducts();
      
      // Migrate sample menu items
      await this.migrateSampleMenuItems();
      
      console.log('🎉 Simple migration completed successfully!');
      
      // Print summary
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
    }
  }

  /**
   * Print migration summary
   */
  private printSummary() {
    console.log('\n📊 Migration Summary:');
    console.log('====================');
    
    const categories = dbHelpers.getCategories();
    const products = dbHelpers.getProducts();
    const menuItems = dbHelpers.getMenuItems();
    const users = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    
    console.log(`📁 Categories: ${categories.length}`);
    console.log(`📦 Products: ${products.length}`);
    console.log(`🍽️ Menu Items: ${menuItems.length}`);
    console.log(`👥 Users: ${users.count}`);
    
    console.log('\n📋 Categories with items:');
    categories.forEach((cat: any) => {
      const productCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?').get(cat.id) as { count: number };
      const menuCount = db.prepare('SELECT COUNT(*) as count FROM menu_items WHERE category_id = ?').get(cat.id) as { count: number };
      if (productCount.count > 0 || menuCount.count > 0) {
        console.log(`  - ${cat.name}: ${productCount.count} products, ${menuCount.count} menu items`);
      }
    });
  }
}

// Run migration if called directly
if (require.main === module) {
  const migration = new SimpleDataMigration();
  migration.runMigration();
}

export default SimpleDataMigration; 