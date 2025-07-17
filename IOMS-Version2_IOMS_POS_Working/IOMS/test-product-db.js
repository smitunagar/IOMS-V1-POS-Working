const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

function testProductDatabase() {
  const filePath = path.join(process.cwd(), 'data', 'product-data.csv');
  
  console.log('📁 Checking if CSV file exists...');
  if (!fs.existsSync(filePath)) {
    console.error('❌ CSV file not found at:', filePath);
    return;
  }
  console.log('✅ CSV file found');
  
  const content = fs.readFileSync(filePath, 'utf-8');
  console.log('📄 CSV content length:', content.length, 'characters');
  
  const records = parse(content, {
    columns: (headers) => headers.map((col) => col.trim()),
    skip_empty_lines: true,
    trim: true,
  });
  
  console.log('📊 Total records parsed:', records.length);
  
  const db = {};
  let validBarcodes = 0;
  
  for (const row of records) {
    const barcode = row['Barcode']?.trim();
    if (barcode && barcode !== '-') {
      db[barcode] = {
        barcode,
        name: row['Product Name']?.trim() || 'Unnamed Product',
        brand: row['Brand']?.trim() || undefined,
        weight: row['Weight']?.trim() || undefined,
        category: row['Category']?.trim() || undefined,
        price: `$${parseFloat(row['Retail Price'] || '0').toFixed(2)}`,
        imageUrl: row['Product Picture in Shopify']?.trim() || undefined,
      };
      validBarcodes++;
    }
  }
  
  console.log('🔢 Valid barcodes found:', validBarcodes);
  console.log('🗄️ Database size:', Object.keys(db).length);
  
  // Test a few specific barcodes
  const testBarcodes = ['4012625530530', '8690804027659', '4260467593040'];
  
  console.log('\n🧪 Testing specific barcodes:');
  testBarcodes.forEach(barcode => {
    const product = db[barcode];
    if (product) {
      console.log(`✅ Found: ${barcode} -> ${product.name} (${product.price})`);
    } else {
      console.log(`❌ Not found: ${barcode}`);
    }
  });
  
  // Show first few entries
  console.log('\n📋 First 3 database entries:');
  const firstKeys = Object.keys(db).slice(0, 3);
  firstKeys.forEach(key => {
    console.log(`${key}: ${db[key].name} - ${db[key].price}`);
  });
}

testProductDatabase(); 