// lib/productService.ts
import { parseProductCsv, ParsedProduct } from './parseProductCsv';

let productDb: Record<string, ParsedProduct> | null = null;

export function getProductDatabase(): Record<string, ParsedProduct> {
  if (!productDb) {
    productDb = parseProductCsv();
  }
  return productDb;
}

export function findProductByBarcode(barcode: string): ParsedProduct | null {
  const db = getProductDatabase();
  return db[barcode] || null;
}
