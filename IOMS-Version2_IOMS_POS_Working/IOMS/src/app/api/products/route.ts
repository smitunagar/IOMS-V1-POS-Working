import { NextRequest, NextResponse } from 'next/server';
import { productDatabase } from '@/lib/productDatabase'; // Cached database

export async function GET(req: NextRequest) {
  try {
    // Correct query parameter key: must be lowercase 'barcode'
    const barcode = req.nextUrl.searchParams.get('barcode'); // <-- fixed here

    // Debugging: Show all query parameters
    console.log('🛠️ API Query Params:', req.nextUrl.searchParams.toString());
    console.log('🔍 Extracted Barcode:', barcode);
    console.log('🗄️ Database size:', Object.keys(productDatabase).length);
    console.log('🔑 Available barcodes (first 10):', Object.keys(productDatabase).slice(0, 10));

    if (!barcode) {
      console.warn('⚠️ Missing barcode parameter in request');
      return NextResponse.json({ error: 'Missing barcode' }, { status: 400 });
    }

    // Check product in the cached database
    const product = productDatabase[barcode];

    if (!product) {
      console.warn('⚠️ Product not found for barcode:', barcode);
      console.log('🔍 Checking if barcode exists in database...');
      const exists = barcode in productDatabase;
      console.log('🔍 Barcode exists in database:', exists);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    console.log('✅ Product found:', product);
    return NextResponse.json(product);

  } catch (err: any) {
    console.error('❌ API ERROR in /api/products:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}