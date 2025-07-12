import { NextRequest, NextResponse } from 'next/server';
import { productDatabase } from '@/lib/productDatabase'; // Cached database

export async function GET(req: NextRequest) {
  try {
    // Correct query parameter key: must be lowercase 'barcode'
    const barcode = req.nextUrl.searchParams.get('barcode'); // <-- fixed here

    // Debugging: Show all query parameters
    console.log('🛠️ API Query Params:', req.nextUrl.searchParams.toString());
    console.log('🔍 Extracted Barcode:', barcode);

    if (!barcode) {
      console.warn('⚠️ Missing barcode parameter in request');
      return NextResponse.json({ error: 'Missing barcode' }, { status: 400 });
    }

    // Check product in the cached database
    const product = productDatabase[barcode];

    if (!product) {
      console.warn('⚠️ Product not found for barcode:', barcode);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    console.log('✅ Product found:', product);
    return NextResponse.json(product);

  } catch (err: any) {
    console.error('❌ API ERROR in /api/products:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}