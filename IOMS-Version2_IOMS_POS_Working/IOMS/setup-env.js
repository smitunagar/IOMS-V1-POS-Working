#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up IOMS Environment Configuration...\n');

const envContent = `# Gemini AI API Configuration
# Get your API key from: https://makersuite.google.com/app/apikey
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here

# Database Configuration
DATABASE_URL=./database/ioms.db

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:9003

# AI Configuration
AI_MODEL=gemini-1.5-flash
AI_MAX_TOKENS=4096
AI_TEMPERATURE=0.3

# Menu Processing Configuration
ENABLE_ADVANCED_CATEGORIZATION=true
ENABLE_INGREDIENT_EXTRACTION=true
ENABLE_PRICE_OPTIMIZATION=true
`;

const envPath = path.join(__dirname, '.env.local');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Environment file created successfully!');
  console.log('📁 File location:', envPath);
  console.log('\n📝 Next steps:');
  console.log('1. Get your Gemini AI API key from: https://makersuite.google.com/app/apikey');
  console.log('2. Replace "your_gemini_api_key_here" with your actual API key');
  console.log('3. Save the file');
  console.log('4. Restart your development server');
  console.log('\n🚀 Advanced menu categorization will be available once the API key is set!');
} catch (error) {
  console.error('❌ Error creating environment file:', error.message);
  console.log('\n📝 Manual setup:');
  console.log('1. Create a file named ".env.local" in the IOMS directory');
  console.log('2. Copy the content above into the file');
  console.log('3. Replace "your_gemini_api_key_here" with your actual API key');
} 