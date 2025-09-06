export const runtime = "nodejs";
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { extractMenuFromPdf } from '@/lib/aiMenuExtractor';

export async function POST(req: NextRequest) {
  try {
    console.log('📄 Upload Menu API called');
    
    const body = await req.json();
    console.log('📋 Request body keys:', Object.keys(body));
    
    const { file, manualMenuData } = body;
    
    // Validate PDF file if provided
    if (file && typeof file === 'string') {
      console.log('📄 File data length:', file.length);
      
      // Check if it's a valid base64 PDF
      if (!file.startsWith('JVBERi0') && !file.startsWith('JVBER')) {
        console.log('⚠️ File might not be a valid PDF (base64 check failed)');
        return new Response(JSON.stringify({ 
          message: 'Invalid PDF file format. Please ensure you uploaded a valid PDF document.',
          success: false,
          error: 'INVALID_PDF_FORMAT'
        }), { status: 400 });
      }
      
      console.log('✅ PDF format validation passed');
    }
    
    let menuItems: any[] = [];
    
    // If manual menu data is provided, use it directly
    if (manualMenuData && Array.isArray(manualMenuData)) {
      console.log('✅ Using manual menu data, items count:', manualMenuData.length);
      menuItems = manualMenuData;
    } else if (file) {
      console.log('📄 Processing PDF file with AI menu extractor, size:', file.length);
      
      try {
        // Use the proper AI menu extractor
        const pdfDataUri = `data:application/pdf;base64,${file}`;
        console.log('🤖 Calling AI menu extractor...');
        
        const extractedMenu = await extractMenuFromPdf({ pdfDataUri });
        console.log('🤖 AI extraction completed, raw result type:', typeof extractedMenu);
        console.log('🤖 AI extraction completed, is array:', Array.isArray(extractedMenu));
        console.log('🤖 AI extraction result structure:', Array.isArray(extractedMenu) ? `Array with ${extractedMenu.length} elements` : 'Not an array');
        
        if (Array.isArray(extractedMenu) && extractedMenu.length > 0) {
          menuItems = extractedMenu;
          console.log('✅ AI extracted', menuItems.length, 'menu items directly');
          
          // Validate extracted items
          menuItems = menuItems.filter((item: any) => {
            const isValid = item && typeof item.name === 'string' && item.name.length > 0;
            if (!isValid) {
              console.log('⚠️ Filtered out invalid item:', item);
            }
            return isValid;
          });
          
          // If we have valid items, proceed with them
          if (menuItems.length > 0) {
            console.log('🎉 Successfully extracted menu with', menuItems.length, 'items');
          } else {
            console.log('⚠️ All extracted items were invalid, will try fallback');
            throw new Error('No valid menu items found in AI extraction');
          }
          
        } else if (extractedMenu && extractedMenu.items && Array.isArray(extractedMenu.items)) {
          menuItems = extractedMenu.items;
          console.log('✅ AI extracted', menuItems.length, 'menu items from .items property');
        } else if (extractedMenu && typeof extractedMenu === 'object') {
          // Try to find any array property that might contain menu items
          const possibleArrays = Object.values(extractedMenu).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            menuItems = possibleArrays[0] as any[];
            console.log('✅ AI extracted', menuItems.length, 'menu items from object property');
            
            // Clean up array - remove any non-object elements
            menuItems = menuItems.filter((item: any) => {
              return item && typeof item === 'object' && typeof item.name === 'string';
            });
            console.log('✅ After cleanup:', menuItems.length, 'valid menu items');
            
          } else {
            console.log('⚠️ AI extraction returned object but no recognizable menu structure found');
            throw new Error('No menu array found in AI extraction result');
          }
        } else {
          console.log('⚠️ AI extraction returned unexpected format:', extractedMenu);
          throw new Error('AI extraction returned invalid format');
        }
        
        console.log('🍽️ Final menu items count after AI extraction:', menuItems.length);
        
        // Log first item for debugging
        if (menuItems.length > 0) {
          console.log('🔍 First extracted item:', JSON.stringify(menuItems[0], null, 2));
        }
        
      } catch (error) {
        console.error('❌ AI extraction error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        
        // Fallback: Try to extract basic text from PDF and create basic menu items
        console.log('🔄 Attempting fallback text extraction from PDF');
        try {
          // Convert base64 to buffer for text extraction
          const pdfBuffer = Buffer.from(file, 'base64');
          
          // Try basic PDF text extraction (if pdf-parse is available)
          const PDFParse = require('pdf-parse');
          const pdfData = await PDFParse(pdfBuffer);
          const pdfText = pdfData.text;
          
          console.log('📄 Extracted PDF text length:', pdfText.length);
          console.log('📄 First 500 chars of PDF text:', pdfText.substring(0, 500));
          
          if (pdfText.length < 100) {
            throw new Error(`PDF text too short (${pdfText.length} chars), likely extraction failed or PDF is mostly images`);
          }
          
          // Check if PDF contains price patterns
          const pricePattern = /\d+[,\.]\d+\s*€?|€?\s*\d+[,\.]\d+/g;
          const priceMatches = pdfText.match(pricePattern);
          
          if (!priceMatches || priceMatches.length < 3) {
            throw new Error(`Too few price patterns found (${priceMatches?.length || 0}), likely not a menu PDF`);
          }
          
          console.log('💰 Found', priceMatches.length, 'price patterns in PDF');
          
          // Enhanced regex to find potential menu items with categories
          const menuItemRegex = /([A-Za-zÄÖÜäöüß\s\-,\.\'\"]+?)\s*[\.\-\s]*\s*(\d+[,\.]\d+\s*€?|€?\s*\d+[,\.]\d+)/gm;
          const matches = [...pdfText.matchAll(menuItemRegex)];
          
          console.log('🔍 Found', matches.length, 'potential menu items in PDF text');
          
          if (matches.length < 3) {
            throw new Error(`Only found ${matches.length} menu items in PDF text, likely not a valid menu`);
          }
          
          // Try to detect categories by looking for section headers
          const lines = pdfText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
          let currentCategory = "Main Dishes";
          const categoriesFound: string[] = [];
          
          // Look for category indicators
          for (const line of lines) {
            if (line.length < 50 && !(/\d+[,\.]\d+/.test(line)) && (line.includes(':') || line.toUpperCase() === line)) {
              // Potential category header
              let cleanCategory = line.replace(':', '').trim();
              if (cleanCategory.length > 2 && cleanCategory.length < 30) {
                currentCategory = cleanCategory;
                categoriesFound.push(currentCategory);
              }
            }
          }
          
          console.log('📂 Detected categories:', categoriesFound);
          
          menuItems = matches.slice(0, 100).map((match, idx) => {
            const rawName = match[1].trim().replace(/\s+/g, ' ');
            const price = match[2].trim();
            
            // Try to determine category based on position in text
            let category = "Main Dishes";
            if (categoriesFound.length > 0) {
              const categoryIndex = Math.floor((idx / matches.length) * categoriesFound.length);
              category = categoriesFound[categoryIndex] || categoriesFound[0];
            }
            
            // Clean up the name
            const cleanName = rawName
              .replace(/[€$]\s*\d+[,\.]\d+/g, '') // Remove any remaining prices
              .replace(/\s+/g, ' ')
              .trim();
            
            return {
              id: `extracted-item-${idx + 1}`,
              name: cleanName.length > 3 ? cleanName : `Menu Item ${idx + 1}`,
              price: price,
              category: category,
              image: "",
              aiHint: "Extracted from PDF text - please verify",
              ingredients: []
            };
          });
          
          console.log('✅ Text extraction found', menuItems.length, 'menu items');
          
          // Filter out items with very short or invalid names
          menuItems = menuItems.filter(item => 
            item.name.length > 3 && 
            !item.name.match(/^\d+$/) && // Not just numbers
            item.name.toLowerCase() !== 'menu item' &&
            !item.name.match(/^[\.\-\s]+$/) // Not just punctuation
          );
          
          console.log('✅ After filtering:', menuItems.length, 'valid menu items');
          
          if (menuItems.length < 2) {
            throw new Error(`After filtering, only ${menuItems.length} valid menu items found - likely extraction failed`);
          }
          
        } catch (textExtractionError) {
          console.error('❌ Fallback text extraction also failed:', textExtractionError);
          
          // Return an error instead of sample data
          return new Response(JSON.stringify({ 
            message: 'Failed to extract menu from PDF. The AI extraction failed and text extraction also failed. Please ensure the PDF is readable, not password-protected, and contains clear menu text with item names and prices.',
            success: false,
            error: 'PDF_EXTRACTION_COMPLETELY_FAILED',
            details: {
              aiError: error instanceof Error ? error.message : 'Unknown AI error',
              textError: textExtractionError instanceof Error ? textExtractionError.message : 'Unknown text extraction error'
            }
          }), { status: 400 });
        }
      }
    } else {
      console.log('❌ No file or manual data provided');
      return new Response(JSON.stringify({ 
        message: 'Missing PDF file or manual menu data',
        success: false 
      }), { status: 400 });
    }

    // Ensure all menu items have required fields
    const processedMenuItems: any[] = menuItems
      .filter((item: any) => {
        const isValid = item && typeof item.name === 'string' && item.name.length > 0;
        if (!isValid) {
          console.log('⚠️ Filtered out invalid item:', item);
        }
        return isValid;
      })
      .map((item: any, index: number) => ({
        id: item.id || `menu-item-${index + 1}`,
        name: String(item.name || '').trim(),
        price: String(item.price || '0.00 EUR'),
        category: String(item.category || 'Main Dishes'),
        image: String(item.image || ''),
        aiHint: String(item.aiHint || 'AI generated'),
        ingredients: Array.isArray(item.ingredients) ? item.ingredients : []
      }));

    console.log('🍽️ Total processed menu items:', processedMenuItems.length);

    // Helper function for CSV field escaping
    function escapeCsvField(field: string): string {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return '"' + field.replace(/"/g, '""') + '"';
      }
      return field;
    }

    // Always resolve from project root
    const csvDir = path.resolve(process.cwd(), 'download', 'Copy');
    const csvPath = path.join(csvDir, 'menu.csv');
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
      console.log('📁 Created directory:', csvDir);
    }

    // Create enhanced CSV with combined rows and size selection (your requested format)
    const csvHeaders = 'id,name,category,basePrice,sizes,ingredients,image,aiHint';
    const csvRows: string[] = [];
    
    for (const item of processedMenuItems) {
      // Detect if item should have size variants (beverages, etc.)
      let sizes = '[]';
      let basePrice = item.price;
      let cleanName = item.name;
      let ingredients = item.ingredients || [];
      
      // Enhanced ingredient detection from item name if not already present
      if (!ingredients.length && item.name) {
        const nameWords = item.name.toLowerCase().split(/\s+/);
        const commonIngredients: string[] = [];
        
        // Detect common ingredients from dish names
        if (nameWords.some(w => ['chicken', 'hähnchen', 'huhn'].includes(w))) {
          commonIngredients.push('Chicken');
        }
        if (nameWords.some(w => ['beef', 'rind', 'rindfleisch'].includes(w))) {
          commonIngredients.push('Beef');
        }
        if (nameWords.some(w => ['fish', 'fisch', 'salmon', 'lachs'].includes(w))) {
          commonIngredients.push('Fish');
        }
        if (nameWords.some(w => ['cheese', 'käse', 'mozzarella', 'parmesan'].includes(w))) {
          commonIngredients.push('Cheese');
        }
        if (nameWords.some(w => ['tomato', 'tomate', 'tomaten'].includes(w))) {
          commonIngredients.push('Tomato');
        }
        if (nameWords.some(w => ['pasta', 'nudeln', 'spaghetti', 'linguine'].includes(w))) {
          commonIngredients.push('Pasta');
        }
        if (nameWords.some(w => ['rice', 'reis', 'risotto'].includes(w))) {
          commonIngredients.push('Rice');
        }
        if (nameWords.some(w => ['pizza'].includes(w))) {
          commonIngredients.push('Dough', 'Tomato Sauce');
        }
        
        ingredients = commonIngredients;
      }
      
      // Check if item should have size variants (beverages)
      const itemNameLower = item.name.toLowerCase();
      const isBeverage = itemNameLower.includes('cola') || itemNameLower.includes('water') || 
                        itemNameLower.includes('juice') || itemNameLower.includes('beer') ||
                        itemNameLower.includes('coffee') || itemNameLower.includes('tea') ||
                        itemNameLower.includes('saft') || itemNameLower.includes('wasser') ||
                        itemNameLower.includes('bier') || itemNameLower.includes('kaffee');
      
      if (isBeverage) {
        // Remove size information from name for clean display
        cleanName = item.name.replace(/\s*\d+(?:\.\d+)?\s*(ml|l|cl)/i, '').trim();
        
        // Extract base price number for calculations
        const priceNumber = parseFloat(item.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 3.50;
        
        // Create size variants with proper pricing
        sizes = JSON.stringify([
          { size: '0.25L', price: priceNumber.toFixed(2) + ' €', label: 'Small (0.25L)' },
          { size: '0.33L', price: (priceNumber * 1.15).toFixed(2) + ' €', label: 'Regular (0.33L)' },
          { size: '0.5L', price: (priceNumber * 1.6).toFixed(2) + ' €', label: 'Large (0.5L)' },
          { size: '1L', price: (priceNumber * 2.8).toFixed(2) + ' €', label: 'Extra Large (1L)' }
        ]);
        
        basePrice = priceNumber.toFixed(2) + ' €';
      }
      
      // Create CSV row with combined format
      const csvRow = [
        escapeCsvField(item.id),
        escapeCsvField(cleanName),
        escapeCsvField(item.category),
        escapeCsvField(basePrice),
        escapeCsvField(sizes),
        escapeCsvField(JSON.stringify(ingredients)),
        escapeCsvField(item.image || ''),
        escapeCsvField(item.aiHint || 'AI extracted and verified')
      ].join(',');
      csvRows.push(csvRow);
    }
    
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    fs.writeFileSync(csvPath, csvContent, 'utf-8');
    console.log('💾 Saved enhanced CSV to:', csvPath);
    console.log('📊 CSV contains', csvRows.length, 'rows with size/quantity data');

    // Enhance menu items with size information and ingredients for order system
    const enhancedMenuItems = processedMenuItems.map((item: any) => {
      const itemNameLower = item.name.toLowerCase();
      const isBeverage = itemNameLower.includes('cola') || itemNameLower.includes('water') || 
                        itemNameLower.includes('juice') || itemNameLower.includes('beer') ||
                        itemNameLower.includes('coffee') || itemNameLower.includes('tea') ||
                        itemNameLower.includes('saft') || itemNameLower.includes('wasser') ||
                        itemNameLower.includes('bier') || itemNameLower.includes('kaffee');
      
      let enhancedItem = { ...item };
      
      // Add ingredients if not present
      if (!enhancedItem.ingredients || enhancedItem.ingredients.length === 0) {
        const nameWords = item.name.toLowerCase().split(/\s+/);
        const detectedIngredients: string[] = [];
        
        // Ingredient detection logic
        if (nameWords.some(w => ['chicken', 'hähnchen', 'huhn'].includes(w))) {
          detectedIngredients.push('Chicken');
        }
        if (nameWords.some(w => ['beef', 'rind', 'rindfleisch'].includes(w))) {
          detectedIngredients.push('Beef');
        }
        if (nameWords.some(w => ['fish', 'fisch', 'salmon', 'lachs'].includes(w))) {
          detectedIngredients.push('Fish');
        }
        if (nameWords.some(w => ['cheese', 'käse', 'mozzarella', 'parmesan'].includes(w))) {
          detectedIngredients.push('Cheese');
        }
        if (nameWords.some(w => ['tomato', 'tomate', 'tomaten'].includes(w))) {
          detectedIngredients.push('Tomato');
        }
        if (nameWords.some(w => ['pasta', 'nudeln', 'spaghetti', 'linguine'].includes(w))) {
          detectedIngredients.push('Pasta');
        }
        if (nameWords.some(w => ['rice', 'reis', 'risotto'].includes(w))) {
          detectedIngredients.push('Rice');
        }
        if (nameWords.some(w => ['pizza'].includes(w))) {
          detectedIngredients.push('Dough', 'Tomato Sauce');
        }
        
        enhancedItem.ingredients = detectedIngredients;
      }
      
      // Add size options for beverages
      if (isBeverage) {
        const priceNumber = parseFloat(item.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 3.50;
        enhancedItem.hasSizes = true;
        enhancedItem.sizeOptions = [
          { size: '0.25L', price: priceNumber.toFixed(2) + ' €', label: 'Small (0.25L)' },
          { size: '0.33L', price: (priceNumber * 1.15).toFixed(2) + ' €', label: 'Regular (0.33L)' },
          { size: '0.5L', price: (priceNumber * 1.6).toFixed(2) + ' €', label: 'Large (0.5L)' },
          { size: '1L', price: (priceNumber * 2.8).toFixed(2) + ' €', label: 'Extra Large (1L)' }
        ];
        enhancedItem.basePrice = priceNumber.toFixed(2) + ' €';
        enhancedItem.name = item.name.replace(/\s*\d+(?:\.\d+)?\s*(ml|l|cl)/i, '').trim();
      } else {
        enhancedItem.hasSizes = false;
        enhancedItem.sizeOptions = [];
        enhancedItem.basePrice = item.price;
      }
      
      return enhancedItem;
    });

    // Save enhanced menu data for order entry system
    const menuDataPath = path.resolve(process.cwd(), 'menu-data.json');
    fs.writeFileSync(menuDataPath, JSON.stringify(enhancedMenuItems, null, 2), 'utf-8');
    console.log('💾 Saved enhanced JSON to:', menuDataPath);

    // Calculate accuracy metrics
    const totalItems = enhancedMenuItems.length;
    const itemsWithIngredients = enhancedMenuItems.filter(item => item.ingredients && item.ingredients.length > 0).length;
    const itemsWithValidPrices = enhancedMenuItems.filter(item => {
      const priceMatch = item.price.match(/\d+[,\.]\d+/);
      return priceMatch && parseFloat(priceMatch[0].replace(',', '.')) > 0;
    }).length;
    const itemsWithCategories = enhancedMenuItems.filter(item => item.category && item.category !== 'Extracted Items').length;
    const beveragesWithSizes = enhancedMenuItems.filter(item => item.hasSizes).length;
    
    const accuracyMetrics = {
      totalItems: totalItems,
      ingredientAccuracy: totalItems > 0 ? Math.round((itemsWithIngredients / totalItems) * 100) : 0,
      priceAccuracy: totalItems > 0 ? Math.round((itemsWithValidPrices / totalItems) * 100) : 0,
      categoryAccuracy: totalItems > 0 ? Math.round((itemsWithCategories / totalItems) * 100) : 0,
      beveragesWithSizes: beveragesWithSizes,
      overallAccuracy: totalItems > 0 ? Math.round(((itemsWithIngredients + itemsWithValidPrices + itemsWithCategories) / (totalItems * 3)) * 100) : 0
    };
    
    console.log('📊 Extraction Accuracy Metrics:', accuracyMetrics);

    console.log('✅ Menu upload completed successfully');
    
    return new Response(JSON.stringify({ 
      success: true, 
      count: enhancedMenuItems.length, 
      menu: enhancedMenuItems,
      accuracy: accuracyMetrics,
      message: `AI successfully extracted ${enhancedMenuItems.length} menu items with ${accuracyMetrics.overallAccuracy}% accuracy`
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Error processing menu upload:', error);
    return new Response(JSON.stringify({ 
      message: 'Internal Server Error', 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
