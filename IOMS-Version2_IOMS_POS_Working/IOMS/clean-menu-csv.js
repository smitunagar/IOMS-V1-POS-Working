// Clean existing menu.csv file to remove price information from names
// This script will update the CSV file with cleaned names

const fs = require('fs');
const path = require('path');

// Function to clean menu item names
function cleanMenuItemName(name) {
  if (!name) return name;
  
  // Remove price patterns like "- 12.90 EUR", "- $12.90", "- 12.90", "- €12.90"
  return name
    .replace(/\s*-\s*\d+[\.,]\d+\s*(EUR|USD|GBP|€|\$|£)\s*$/i, '') // Remove "- 12.90 EUR" patterns
    .replace(/\s*-\s*\d+[\.,]\d+\s*$/i, '') // Remove "- 12.90" patterns  
    .replace(/\s*\(\d+[\.,]\d+\s*(EUR|USD|GBP|€|\$|£)\)\s*$/i, '') // Remove "(12.90 EUR)" patterns
    .replace(/\s*\$\d+[\.,]\d+\s*$/i, '') // Remove "$12.90" patterns
    .replace(/\s*€\d+[\.,]\d+\s*$/i, '') // Remove "€12.90" patterns
    .replace(/\s*£\d+[\.,]\d+\s*$/i, '') // Remove "£12.90" patterns
    .trim();
}

// Path to the menu CSV file
const csvPath = path.join(__dirname, 'download', 'Copy', 'menu.csv');

console.log('🧹 Cleaning menu.csv file...');
console.log('📂 File path:', csvPath);

try {
  // Check if file exists
  if (!fs.existsSync(csvPath)) {
    console.error('❌ Menu CSV file not found at:', csvPath);
    process.exit(1);
  }

  // Read the CSV file
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.trim().split('\n');
  const [header, ...rows] = lines;

  console.log('📄 Original header:', header);
  console.log('📊 Found', rows.length, 'menu items');

  // Process each row
  const cleanedRows = rows.map((row, index) => {
    const [id, name, price, category, image, aiHint, ingredients] = row.split(',');
    const originalName = name;
    const cleanedName = cleanMenuItemName(name);
    
    if (originalName !== cleanedName) {
      console.log(`✅ ${index + 1}. "${originalName}" → "${cleanedName}"`);
    } else {
      console.log(`➡️ ${index + 1}. "${originalName}" (no change needed)`);
    }
    
    // Reconstruct the row with cleaned name
    return `${id},${cleanedName},${price},${category},${image},${aiHint},${ingredients}`;
  });

  // Create the cleaned CSV content
  const cleanedCsvContent = [header, ...cleanedRows].join('\n');

  // Write back to file
  fs.writeFileSync(csvPath, cleanedCsvContent, 'utf-8');

  console.log('\n✅ Menu CSV file has been cleaned successfully!');
  console.log('🎯 All menu item names now have price information removed');
  console.log('🔗 This should fix inventory-menu matching issues');
  
  // Show a few examples of the changes
  console.log('\n📋 Sample cleaned items:');
  cleanedRows.slice(0, 5).forEach((row, index) => {
    const [id, name] = row.split(',');
    console.log(`  ${index + 1}. ${name}`);
  });

} catch (error) {
  console.error('❌ Error cleaning menu CSV:', error.message);
  process.exit(1);
}

console.log('\n💡 Next steps:');
console.log('1. Restart your application');
console.log('2. Re-import the menu to load the cleaned names');
console.log('3. Test order placement to verify inventory deduction works');
console.log('4. Use the Debug page to verify alignment');
