import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, performance, orderData } = body;

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    // In a real implementation, this would update the database
    // For now, we'll return a success response with updated performance metrics

    const updatedPerformance = {
      reliability: performance?.reliability || 85,
      qualityScore: performance?.qualityScore || 90,
      deliveryTime: performance?.deliveryTime || 88,
      priceCompetitiveness: performance?.priceCompetitiveness || 82,
      responseTime: performance?.responseTime || 87,
      lastUpdated: new Date().toISOString()
    };

    // Calculate overall score
    const overallScore = (
      updatedPerformance.reliability +
      updatedPerformance.qualityScore +
      updatedPerformance.deliveryTime +
      updatedPerformance.priceCompetitiveness +
      updatedPerformance.responseTime
    ) / 5;

    return NextResponse.json({
      success: true,
      data: {
        vendorId,
        performance: updatedPerformance,
        overallScore: Math.round(overallScore * 100) / 100,
        recommendations: generateRecommendations(updatedPerformance)
      },
      message: 'Vendor performance updated successfully'
    });
  } catch (error) {
    console.error('Error updating vendor performance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update vendor performance' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vendorId = searchParams.get('vendorId');
    const period = searchParams.get('period') || '30'; // days

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    // Mock performance history data
    const performanceHistory = [
      {
        date: '2025-07-20',
        reliability: 95,
        qualityScore: 92,
        deliveryTime: 88,
        priceCompetitiveness: 85,
        responseTime: 90,
        orderValue: 425.50
      },
      {
        date: '2025-07-15',
        reliability: 93,
        qualityScore: 94,
        deliveryTime: 85,
        priceCompetitiveness: 87,
        responseTime: 88,
        orderValue: 380.25
      },
      {
        date: '2025-07-10',
        reliability: 97,
        qualityScore: 91,
        deliveryTime: 90,
        priceCompetitiveness: 83,
        responseTime: 92,
        orderValue: 512.75
      }
    ];

    const currentPerformance = {
      reliability: 95,
      qualityScore: 92,
      deliveryTime: 88,
      priceCompetitiveness: 85,
      responseTime: 90
    };

    const analytics = {
      averageOrderValue: 439.50,
      totalOrders: 156,
      onTimeDeliveryRate: 94,
      qualityIssueRate: 3,
      responseTimeHours: 2.5,
      trends: {
        reliability: '+2%',
        quality: '-1%',
        delivery: '+5%',
        pricing: '-3%',
        response: '+1%'
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        vendorId,
        currentPerformance,
        performanceHistory,
        analytics,
        recommendations: generateRecommendations(currentPerformance)
      }
    });
  } catch (error) {
    console.error('Error fetching vendor performance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vendor performance' },
      { status: 500 }
    );
  }
}

function generateRecommendations(performance: any) {
  const recommendations = [];

  if (performance.reliability < 90) {
    recommendations.push({
      type: 'improvement',
      category: 'reliability',
      message: 'Consider discussing delivery consistency with this vendor',
      priority: 'high'
    });
  }

  if (performance.qualityScore < 85) {
    recommendations.push({
      type: 'warning',
      category: 'quality',
      message: 'Quality scores are below average. Review recent orders',
      priority: 'high'
    });
  }

  if (performance.deliveryTime < 80) {
    recommendations.push({
      type: 'improvement',
      category: 'delivery',
      message: 'Delivery times are slow. Consider alternative logistics',
      priority: 'medium'
    });
  }

  if (performance.priceCompetitiveness < 75) {
    recommendations.push({
      type: 'cost',
      category: 'pricing',
      message: 'Pricing is not competitive. Negotiate better rates or find alternatives',
      priority: 'medium'
    });
  }

  if (performance.responseTime < 80) {
    recommendations.push({
      type: 'communication',
      category: 'response',
      message: 'Response times are slow. Establish better communication channels',
      priority: 'low'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'success',
      category: 'overall',
      message: 'Excellent performance across all metrics. Continue current partnership',
      priority: 'info'
    });
  }

  return recommendations;
}
