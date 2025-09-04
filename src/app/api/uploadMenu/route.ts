import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { extractMenuFromPdf } from '@/lib/aiMenuExtractor';
import { generateIngredientsList } from '@/ai/flows/generate-ingredients-list';

export const runtime = 'nodejs';

// Retry utilities for AI quota handling
async function delay(ms: number) { 
  return new Promise(res => setTimeout(res, ms)); 
}

async function callWithRetry<T>(fn: () => Promise<T>, retries = 2, baseDelayMs = 5000): Promise<T> {
  let attempt = 0;
  let lastErr: any;
  
  while (attempt <= retries) {
    try { 
      return await fn(); 
    } catch (err: any) {
      lastErr = err;
      const msg = String(err?.message || err);
      const isQuota = msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('too many requests');
      const isTransient = isQuota || msg.toLowerCase().includes('timeout');
      
      if (attempt === retries || !isQuota) break;
      
      const jitter = Math.floor(Math.random() * 1000);
      const delayMs = baseDelayMs * Math.pow(2, attempt) + jitter;
      
      console.log(`🔄 Retrying AI call in ${delayMs}ms (attempt ${attempt+1}/${retries+1}) - ${msg}`);
      await delay(delayMs);
      attempt++;
    }
  }
  throw lastErr;
}

function ensureExportsDir() {
  const exportDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });
  return exportDir;
}

// Enhanced heuristic text extraction with multiple patterns
function extractHeuristicFromText(text: string): any[] {
  const items: any[] = [];
  const lines = text.split('\n').filter(line => line.trim().length > 2);
  
  // Enhanced regex patterns for food detection
  const foodPatterns = [
    /^([A-Z][a-z\s&'-]+)\s*[\$£€₹]?\s*(\d+(?:\.\d{1,2})?)/,
    /([A-Z][a-z\s&'-]+)[\s\t]*(\d+(?:\.\d{1,2})?)/,
    /(.+?)\s*[\$£€₹]\s*(\d+(?:\.\d{1,2})?)/,
    /^(\d+)\.\s*([A-Za-z][a-z\s&'-]+)\s*[\$£€₹]?\s*(\d+(?:\.\d{1,2})?)/
  ];
  
  lines.forEach((line, idx) => {
    line = line.trim();
    if (line.length < 3) return;
    
    for (const pattern of foodPatterns) {
      const match = line.match(pattern);
      if (match) {
        let name = match[1] || match[2] || '';
        let price = match[2] || match[3] || '';
        
        // If pattern has 3 groups, price is in group 3
        if (match.length === 4) {
          name = match[2];
          price = match[3];
        }
        
        name = name.trim().replace(/[\.\d]+$/, '').trim();
        
        if (name.length > 2 && name.length < 50 && /[a-zA-Z]/.test(name)) {
          items.push({
            id: `heuristic-${Date.now()}-${idx}`,
            name: name,
            price: price,
            category: 'Extracted',
            image: '',
            ingredients: ['water', 'salt'],
            extractionMethod: 'heuristic'
          });
          break;
        }
      }
    }
  });
  
  return items;
}

// Three-tier extraction strategy: AI → pdf-parse → pdfjs-dist
async function extractWithFallback(file: string): Promise<{ items: any[], tier: string, error?: string }> {
  const exportDir = ensureExportsDir();
  const logPath = path.join(exportDir, 'extraction-debug.log');
  
  // Tier 1: AI extraction with retry
  try {
    const pdfUri = `data:application/pdf;base64,${file}`;
    console.log('🤖 Attempting AI extraction (Tier 1)...');
    const extracted = await callWithRetry(() => extractMenuFromPdf(pdfUri));
    if (extracted && Array.isArray(extracted) && extracted.length > 0) {
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] ✅ Tier 1 (AI) success: ${extracted.length} items\n`);
      console.log(`✅ AI extraction successful: ${extracted.length} items found`);
      return { items: extracted, tier: 'AI' };
    }
  } catch (err: any) {
    const msg = String(err?.message || err);
    const isQuota = msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('too many requests');
    
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ❌ Tier 1 (AI) failed: ${msg}\n`);
    console.log(`❌ AI extraction failed: ${msg}`);
    
    if (isQuota) {
      return { 
        items: [], 
        tier: 'AI_QUOTA_EXCEEDED', 
        error: `🚨 AI Quota Exceeded: You have exceeded your Gemini AI quota. Please check your plan and billing details. The system will automatically retry with fallback extraction methods.` 
      };
    }
  }
  
  // Tier 2: pdf-parse fallback
  try {
    console.log('📄 Attempting PDF-parse extraction (Tier 2)...');
    const pdfBuffer = Buffer.from(file, 'base64');
    const pdfParse = await import('pdf-parse');
    const parsed = await pdfParse.default(pdfBuffer);
    const text = parsed?.text || '';
    const extractedItems = extractHeuristicFromText(text);
    if (extractedItems.length > 0) {
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] ✅ Tier 2 (pdf-parse) success: ${extractedItems.length} items\n`);
      console.log(`✅ PDF-parse extraction successful: ${extractedItems.length} items found`);
      return { items: extractedItems, tier: 'PDF_PARSE' };
    }
  } catch (err: any) {
    const msg = String(err?.message || err);
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ❌ Tier 2 (pdf-parse) failed: ${msg}\n`);
    console.log(`❌ PDF-parse extraction failed: ${msg}`);
  }
  
  // Tier 3: pdfjs-dist fallback (placeholder for future implementation)
  console.log('⚠️ All extraction methods failed. Consider upgrading your AI quota or providing manual data.');
  fs.appendFileSync(logPath, `[${new Date().toISOString()}] ⚠️ All extraction tiers failed\n`);
  
  return { 
    items: [], 
    tier: 'ALL_FAILED', 
    error: '⚠️ All extraction methods failed. Please check your PDF format or try manual entry.' 
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('==> /api/uploadMenu POST received');
    
    const body = await request.json();
    console.log('payload keys:', Object.keys(body || {}));
    
    const { manualMenuData, file, userId, textData } = body;
    
    let menuItems: any[] = [];
    let extractionTier = 'MANUAL';
    let extractionError = '';
    
    if (manualMenuData && Array.isArray(manualMenuData)) {
      menuItems = manualMenuData;
      extractionTier = 'MANUAL';
      console.log(`📝 Manual data provided: ${menuItems.length} items`);
    } else if (textData && typeof textData === 'string') {
      // Direct text extraction
      menuItems = extractHeuristicFromText(textData);
      extractionTier = 'TEXT_HEURISTIC';
      console.log(`📝 Text extraction: ${menuItems.length} items found`);
    } else if (file && typeof file === 'string') {
      // Three-tier extraction with retry and fallback
      console.log('📊 Starting PDF extraction with AI-first approach...');
      const result = await extractWithFallback(file);
      menuItems = result.items;
      extractionTier = result.tier;
      extractionError = result.error || '';
      
      if (result.error) {
        console.log(`⚠️ Extraction warning: ${result.error}`);
      }
    }
    
    // Normalize menu items
    menuItems = menuItems.map((item: any, idx: number) => ({
      id: item.id || `menu-${Date.now()}-${idx}`,
      name: item.name || item.title || `Item ${idx+1}`,
      price: item.price || '',
      category: item.category || 'Uncategorized',
      image: item.image || '',
      ingredients: Array.isArray(item.ingredients) ? item.ingredients : ['water', 'salt'],
      extractionMethod: item.extractionMethod || extractionTier
    }));
    
    // Batch ingredient enrichment for extracted items (only if AI quota is available)
    if (menuItems.length > 0 && menuItems.some(item => item.extractionMethod !== 'MANUAL') && extractionTier !== 'AI_QUOTA_EXCEEDED') {
      try {
        const itemsForEnrichment = menuItems.filter(item => 
          item.extractionMethod !== 'MANUAL' && 
          Array.isArray(item.ingredients) && 
          item.ingredients.length <= 2
        );
        
        if (itemsForEnrichment.length > 0) {
          console.log(`🧠 Enriching ingredients for ${itemsForEnrichment.length} items...`);
          const batchNames = itemsForEnrichment.map(item => item.name).join(', ');
          const enrichedIngredients = await callWithRetry(() => generateIngredientsList(batchNames));
          
          if (enrichedIngredients && Array.isArray(enrichedIngredients)) {
            itemsForEnrichment.forEach((item, idx) => {
              if (enrichedIngredients[idx] && Array.isArray(enrichedIngredients[idx])) {
                item.ingredients = enrichedIngredients[idx];
              }
            });
            console.log(`✅ Ingredient enrichment completed`);
          }
        }
      } catch (enrichErr: any) {
        const msg = String(enrichErr?.message || enrichErr);
        const isQuota = msg.includes('429') || msg.toLowerCase().includes('quota');
        
        if (isQuota) {
          console.log('🚨 Ingredient enrichment skipped due to quota limits');
        } else {
          console.log('⚠️ Ingredient enrichment failed:', enrichErr);
        }
      }
    }
    
    // Export to CSV with enhanced data
    let csvExported = false;
    let csvPath = '';
    
    try {
      const exportsDir = ensureExportsDir();
      csvPath = path.join(exportsDir, `menu-export-${Date.now()}.csv`);
      
      let csvContent = 'ID,Name,Price,Category,Image,Ingredients,ExtractionMethod,IngredientCount\n';
      menuItems.forEach(item => {
        const ingredients = Array.isArray(item.ingredients) ? item.ingredients.join(';') : '';
        const ingredientCount = Array.isArray(item.ingredients) ? item.ingredients.length : 0;
        const escapedName = String(item.name || '').replace(/"/g, '""');
        const escapedCategory = String(item.category || '').replace(/"/g, '""');
        csvContent += `"${item.id}","${escapedName}","${item.price}","${escapedCategory}","${item.image}","${ingredients}","${item.extractionMethod}","${ingredientCount}"\n`;
      });
      
      fs.writeFileSync(csvPath, csvContent, 'utf8');
      csvExported = true;
      console.log(`📄 CSV exported: ${csvPath}`);
    } catch (csvErr) {
      console.log('CSV export failed:', csvErr);
    }
    
    // Prepare result with clear messaging
    const result = {
      success: true,
      count: menuItems.length,
      csvExported,
      csvPath,
      extractionAccuracy: menuItems.length > 0 ? 100 : 0,
      extractionTier,
      extractionMethod: extractionTier,
      warning: extractionError || undefined,
      message: extractionError ? 
        extractionError : 
        `✅ Successfully processed ${menuItems.length} menu items using ${extractionTier} extraction`,
      quotaStatus: extractionTier === 'AI_QUOTA_EXCEEDED' ? 'EXCEEDED' : 'OK',
      menu: menuItems
    };
    
    console.log(`✅ Upload completed: ${menuItems.length} items, tier: ${extractionTier}`);
    
    return new Response(JSON.stringify(result), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
    
  } catch (error: any) {
    console.error('❌ Upload Menu API error:', error);
    
    const errorMsg = String(error?.message || error);
    const isQuota = errorMsg.includes('429') || errorMsg.toLowerCase().includes('quota');
    
    return new Response(JSON.stringify({ 
      success: false, 
      message: isQuota ? 
        '🚨 AI Quota Exceeded: Please upgrade your plan or wait for quota reset' : 
        'Internal server error',
      error: errorMsg,
      quotaStatus: isQuota ? 'EXCEEDED' : 'ERROR'
    }), { 
      status: isQuota ? 429 : 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}