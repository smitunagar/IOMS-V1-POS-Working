import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const item = searchParams.get('item');
    
    // Simulate vendor comparison data
    const vendorComparison = {
      item: item || 'All Items',
      updatedAt: new Date().toISOString(),
      vendors: [
        {
          id: 'v1',
          name: 'Fresh Valley Farms',
          score: 95,
          priceIndex: 0.85,
          deliveryTime: '1-2 days',
          reliability: 95,
          rating: 4.8,
          strengths: ['Best prices', 'High quality', 'Fast delivery'],
          recommendations: 'Ideal for vegetables and dairy products'
        },
        {
          id: 'v2',
          name: 'Hechingen Local Market',
          score: 88,
          priceIndex: 1.15,
          deliveryTime: 'Same day',
          reliability: 88,
          rating: 4.5,
          strengths: ['Local supplier', 'Same day delivery', 'Fresh products'],
          recommendations: 'Best for urgent requirements'
        },
        {
          id: 'v3',
          name: 'Bavaria Premium Foods',
          score: 92,
          priceIndex: 1.25,
          deliveryTime: '2-3 days',
          reliability: 98,
          rating: 4.9,
          strengths: ['Premium quality', 'Highly reliable', 'Organic options'],
          recommendations: 'Perfect for specialty and premium ingredients'
        },
        {
          id: 'v4',
          name: 'Global Spice Trading',
          score: 85,
          priceIndex: 0.75,
          deliveryTime: '3-5 days',
          reliability: 85,
          rating: 4.3,
          strengths: ['Lowest prices', 'Bulk quantities', 'Wide variety'],
          recommendations: 'Best for spices and non-perishable items'
        }
      ],
      metrics: {
        averagePriceIndex: 1.0,
        averageReliability: 91.5,
        averageRating: 4.6,
        totalVendors: 4
      },
      lastUpdated: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: vendorComparison
    });
  } catch (error) {
    console.error('Error in vendor comparison:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vendor comparison' },
      { status: 500 }
    );
  }
}
