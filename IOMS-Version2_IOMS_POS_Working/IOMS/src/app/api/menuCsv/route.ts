import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

// Function to clean menu item names by removing price information
function cleanMenuItemName(name: string): string {
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

