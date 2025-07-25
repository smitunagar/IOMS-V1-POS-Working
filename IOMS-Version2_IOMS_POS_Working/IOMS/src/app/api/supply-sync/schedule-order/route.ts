import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      itemName,
      predictedNeed,
      confidence,
      timeframe,
      seasonalFactor,
      trendDirection
    } = body;
    
    if (!itemName || !predictedNeed) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Calculate optimal order timing
    const currentDate = new Date();
    const deliveryLeadTime = 3; // days
    const bufferDays = Math.round(7 * (1 - confidence / 100)); // Lower confidence = more buffer
    
    const recommendedOrderDate = new Date(currentDate);
    recommendedOrderDate.setDate(currentDate.getDate() + deliveryLeadTime + bufferDays);
    
    const requiredDeliveryDate = new Date(currentDate);
    requiredDeliveryDate.setDate(currentDate.getDate() + 7); // Based on timeframe
    
    // Determine urgency based on confidence and trend
    let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (confidence > 90 && trendDirection === 'up') urgencyLevel = 'high';
    if (confidence > 95) urgencyLevel = 'critical';
    if (confidence < 75) urgencyLevel = 'low';
    
    // Calculate recommended quantity with seasonal factor
    const adjustedQuantity = Math.ceil(predictedNeed * seasonalFactor);
    
    // Simulate vendor selection based on item type
    const vendorMapping: { [key: string]: string[] } = {
      'Chicken Breast': ['v1', 'v2'],
      'Basmati Rice': ['v3', 'v4'],
      'Fresh Tomatoes': ['v1', 'v2'],
      'Olive Oil': ['v3', 'v4'],
      'Garam Masala': ['v4']
    };
    
    const recommendedVendors = vendorMapping[itemName] || ['v1', 'v2'];
    
    // Calculate estimated budget
    const pricePerUnit: { [key: string]: number } = {
      'Chicken Breast': 8.50,
      'Basmati Rice': 3.20,
      'Fresh Tomatoes': 2.80,
      'Olive Oil': 15.00,
      'Garam Masala': 25.00
    };
    
    const unitPrice = pricePerUnit[itemName] || 10.00;
    const estimatedBudget = adjustedQuantity * unitPrice;
    
    const scheduledOrder = {
      itemId: itemName.toLowerCase().replace(/\s+/g, '-'),
      itemName,
      recommendedQuantity: adjustedQuantity,
      unit: 'kg',
      urgencyLevel,
      recommendedVendors,
      recommendedOrderDate: recommendedOrderDate.toISOString(),
      requiredDeliveryDate: requiredDeliveryDate.toISOString(),
      specifications: `Forecasted order - ${confidence}% confidence`,
      estimatedBudget,
      daysUntilStockout: Math.round(7 * (confidence / 100)),
      reasoning: {
        baseNeed: predictedNeed,
        seasonalAdjustment: seasonalFactor,
        confidenceBuffer: bufferDays,
        trendImpact: trendDirection,
        finalQuantity: adjustedQuantity
      }
    };
    
    return NextResponse.json({
      success: true,
      data: scheduledOrder,
      message: `Order scheduled for ${itemName} with ${confidence}% confidence`
    });
  } catch (error) {
    console.error('Error scheduling order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to schedule order' },
      { status: 500 }
    );
  }
}
