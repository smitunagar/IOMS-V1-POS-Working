import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export type ParsedProduct = {
  barcode: string;
  name: string;
  brand?: string;
  weight?: string;
  category?: string;
  price: string;
  imageUrl?: string;
};

export function parseProductCsv(): Record<string, ParsedProduct> {
  const filePath = path.join(process.cwd(), 'data', 'product-data.csv');
  
  const content = fs.readFileSync(filePath, 'utf-8');

  const records: Record<string, string>[] = parse(content, {
    columns: (headers: string[]) => headers.map((col: string) => col.trim()), // Normalize headers
    skip_empty_lines: true,
    trim: true,
  });

  const db: Record<string, ParsedProduct> = {};

  for (const row of records) {
    const barcode = row['Barcode']?.trim();
    if (!barcode) continue;

    db[barcode] = {
      barcode,
      name: row['Product Name']?.trim() || 'Unnamed Product',
      brand: row['Brand']?.trim() || undefined,
      weight: row['Weight']?.trim() || undefined,
      category: row['Category']?.trim() || undefined,
      price: `$${parseFloat(row['Retail Price'] || '0').toFixed(2)}`,
      imageUrl: row['Product Picture in Shopify']?.trim() || undefined,
    };
  }

   console.log('✅ Final Product Database Keys:', Object.keys(db)); // 🔍 Show all barcodes loaded
   console.log('✅ Example Product Entry:', db[Object.keys(db)[0]]); // 🔍 Show example product entry

  return db;
}

  