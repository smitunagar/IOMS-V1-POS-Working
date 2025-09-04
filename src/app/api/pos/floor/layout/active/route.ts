import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'default';

    // Get current active layout
    const activeLayout = await db.prepare(`
      SELECT * FROM FloorLayout 
      WHERE tenantId = ? AND status = 'ACTIVE'
      ORDER BY updatedAt DESC 
      LIMIT 1
    `).get(tenantId) as any;

    if (!activeLayout) {
      return NextResponse.json({
        success: true,
        message: 'No active layout found',
        layout: null,
      });
    }

    // Get current table statuses
    const tableStatuses = await db.prepare(`
      SELECT * FROM TableStatus 
      WHERE tenantId = ?
      ORDER BY updatedAt DESC
    `).all(tenantId) as any[];

    // Parse layout data
    const layoutData = JSON.parse(activeLayout.data);
    const layoutMetadata = JSON.parse(activeLayout.metadata);

    // Map table statuses to a lookup object
    const statusLookup = tableStatuses.reduce((acc, status) => {
      acc[status.tableId] = {
        status: status.status,
        updatedAt: status.updatedAt,
        metadata: status.metadata ? JSON.parse(status.metadata) : null,
      };
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      success: true,
      message: 'Active layout retrieved successfully',
      layout: {
        id: activeLayout.id,
        tables: layoutData.tables,
        zones: layoutData.zones,
        metadata: layoutMetadata,
        tableStatuses: statusLookup,
        createdAt: activeLayout.createdAt,
        updatedAt: activeLayout.updatedAt,
      },
    });

  } catch (error) {
    console.error('Error retrieving active layout:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to retrieve active layout'
      },
      { status: 500 }
    );
  }
}
