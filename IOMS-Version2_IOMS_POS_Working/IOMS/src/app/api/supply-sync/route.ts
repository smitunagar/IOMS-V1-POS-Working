import { NextRequest, NextResponse } from 'next/server';
import { supplySyncService } from '@/lib/supplySyncService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'analyze':
        const metrics = await supplySyncService.analyzeSupplyChain();
        return NextResponse.json({
          success: true,
          data: metrics,
          timestamp: new Date().toISOString()
        });

      case 'alerts':
        const analysis = await supplySyncService.analyzeSupplyChain();
        return NextResponse.json({
          success: true,
          data: analysis.inventoryAlerts,
          count: analysis.inventoryAlerts.length
        });

      case 'vendors':
        const fullAnalysis = await supplySyncService.analyzeSupplyChain();
        return NextResponse.json({
          success: true,
          data: fullAnalysis.vendorPerformance
        });

      case 'forecast':
        const forecastData = await supplySyncService.analyzeSupplyChain();
        return NextResponse.json({
          success: true,
          data: forecastData.procurementForecasts
        });

      case 'trends':
        const trendData = await supplySyncService.analyzeSupplyChain();
        return NextResponse.json({
          success: true,
          data: {
            marketTrends: trendData.marketTrends,
            geopoliticalFactors: trendData.geopoliticalFactors
          }
        });

      default:
        // Default: return full analysis
        const completeAnalysis = await supplySyncService.analyzeSupplyChain();
        return NextResponse.json({
          success: true,
          data: completeAnalysis,
          summary: {
            criticalAlerts: completeAnalysis.inventoryAlerts.filter(a => a.urgencyLevel === 'critical').length,
            totalVendors: completeAnalysis.vendorPerformance.length,
            marketRisks: completeAnalysis.geopoliticalFactors.filter(f => f.severity === 'high' || f.severity === 'critical').length
          }
        });
    }
  } catch (error) {
    console.error('[SupplySync API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze supply chain',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'update_inventory':
        const { itemId, newLevel } = data;
        supplySyncService.updateInventoryLevel(itemId, newLevel);
        return NextResponse.json({
          success: true,
          message: `Updated inventory for ${itemId}`
        });

      case 'add_vendor':
        supplySyncService.addVendor(data.vendor);
        return NextResponse.json({
          success: true,
          message: `Added vendor: ${data.vendor.name}`
        });

      case 'update_market_data':
        const { commodity, trend } = data;
        supplySyncService.updateMarketData(commodity, trend);
        return NextResponse.json({
          success: true,
          message: `Updated market data for ${commodity}`
        });

      case 'generate_purchase_order':
        const { alertId, vendorId, quantity, itemName } = data;
        
        // Simulate purchase order generation
        const orderNumber = `PO-${Date.now()}`;
        const estimatedDelivery = new Date();
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 2);

        return NextResponse.json({
          success: true,
          purchaseOrder: {
            orderNumber,
            vendorId,
            itemName,
            quantity,
            status: 'pending',
            estimatedDelivery: estimatedDelivery.toISOString(),
            totalCost: quantity * 8.50 // Simplified calculation
          },
          message: `Purchase order ${orderNumber} generated successfully`
        });

      case 'schedule_restock':
        const { items, scheduledDate } = data;
        
        return NextResponse.json({
          success: true,
          scheduledRestocks: items.map((item: any) => ({
            itemId: item.itemId,
            scheduledDate,
            quantity: item.quantity,
            status: 'scheduled'
          })),
          message: `Scheduled ${items.length} items for restocking`
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[SupplySync API] POST Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, action: alertAction } = body;

    switch (alertAction) {
      case 'acknowledge':
        return NextResponse.json({
          success: true,
          message: `Alert ${alertId} acknowledged`
        });

      case 'snooze':
        const { duration } = body;
        return NextResponse.json({
          success: true,
          message: `Alert ${alertId} snoozed for ${duration}`
        });

      case 'resolve':
        return NextResponse.json({
          success: true,
          message: `Alert ${alertId} marked as resolved`
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid alert action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[SupplySync API] PUT Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update alert',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
