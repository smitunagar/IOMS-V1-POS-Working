// lib/productDatabase.ts
import { parseProductCsv } from './parseProductCsv';
import type { ParsedProduct } from './parseProductCsv';

export const productDatabase: Record<string, ParsedProduct> = parseProductCsv();
