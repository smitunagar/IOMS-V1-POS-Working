import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/lib/database';

// Request validation schema
const ActivateLayoutSchema = z.object({
  tables: z.array(z.object({
    id: z.string(),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
    shape: z.enum(['round', 'square', 'rect']),
    capacity: z.number().min(1).max(20),
    seats: z.number().min(1).max(20),
    label: z.string().optional(),
    zoneId: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  })),
  zones: z.array(z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
    visible: z.boolean(),
  })),
  metadata: z.object({
    version: z.string(),
    activatedAt: z.string(),
    activatedBy: z.string(),
    tableCount: z.number(),
    zoneCount: z.number(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'default';
    const body = await request.json();
    
    // Validate request data
    const validatedData = ActivateLayoutSchema.parse(body);

    // Check for overlapping tables
    const tables = validatedData.tables;
    for (let i = 0; i < tables.length; i++) {
      for (let j = i + 1; j < tables.length; j++) {
        const table1 = tables[i];
        const table2 = tables[j];
        
        // Simple overlap detection
        const overlap = !(
          table1.x + table1.w <= table2.x ||
          table2.x + table2.w <= table1.x ||
          table1.y + table1.h <= table2.y ||
          table2.y + table2.h <= table1.y
        );
        
        if (overlap) {
          return NextResponse.json(
            { 
              error: 'Validation Error',
              message: `Tables ${table1.label || table1.id} and ${table2.label || table2.id} overlap`,
              code: 'TABLES_OVERLAP'
            },
            { status: 400 }
          );
        }
      }
    }

    // Validate minimum table count
    if (tables.length === 0) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Layout must contain at least one table',
          code: 'NO_TABLES'
        },
        { status: 400 }
      );
    }

    // Start transaction
    const transaction = db.transaction(() => {
      // Archive current active layout
      db.prepare(`
        UPDATE FloorLayout 
        SET status = 'ARCHIVED', updatedAt = ?
        WHERE tenantId = ? AND status = 'ACTIVE'
      `).run(new Date().toISOString(), tenantId);

      // Create new active layout
      const layoutData = {
        id: crypto.randomUUID(),
        tenantId,
        status: 'ACTIVE',
        data: JSON.stringify(validatedData),
        metadata: JSON.stringify(validatedData.metadata),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.prepare(`
        INSERT INTO FloorLayout (
          id, tenantId, status, data, metadata, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        layoutData.id,
        layoutData.tenantId,
        layoutData.status,
        layoutData.data,
        layoutData.metadata,
        layoutData.createdAt,
        layoutData.updatedAt
      );

      // Initialize table status records for all tables
      const deleteExistingStatuses = db.prepare(`
        DELETE FROM TableStatus WHERE tenantId = ?
      `);
      deleteExistingStatuses.run(tenantId);

      const insertTableStatus = db.prepare(`
        INSERT INTO TableStatus (
          id, tableId, tenantId, status, updatedAt, metadata
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      tables.forEach(table => {
        insertTableStatus.run(
          crypto.randomUUID(),
          table.id,
          tenantId,
          'FREE', // Default status
          new Date().toISOString(),
          JSON.stringify({
            capacity: table.capacity || table.seats || 4,
            label: table.label || `Table ${table.id}`,
            shape: table.shape,
            zoneId: table.zoneId,
          })
        );
      });

      // Remove draft layout if exists
      db.prepare(`
        DELETE FROM FloorLayout 
        WHERE tenantId = ? AND status = 'DRAFT'
      `).run(tenantId);

      return layoutData;
    });

    const result = transaction();

    return NextResponse.json({
      success: true,
      message: 'Layout activated successfully',
      layoutId: result.id,
      tableCount: tables.length,
      zoneCount: validatedData.zones.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error activating layout:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid layout data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to activate layout'
      },
      { status: 500 }
    );
  }
}
