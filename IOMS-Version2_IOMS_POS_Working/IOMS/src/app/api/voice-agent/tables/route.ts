import { NextRequest, NextResponse } from 'next/server';

// Define the table structure based on the existing table management
interface Table {
  id: string;
  name: string;
  capacity: number;
  status: 'Available' | 'Occupied' | 'Reserved' | 'Needs Cleaning';
  orderId?: string;
}

// Mock table data - in a real system this would come from a database
const generateTables = (): Table[] => {
  return Array.from({ length: 20 }, (_, i) => ({
    id: `t${i + 1}`,
    name: `Table ${i + 1}`,
    capacity: i < 4 ? 2 : i < 12 ? 4 : i < 16 ? 6 : 8, // Mix of table sizes
    status: 'Available' as const,
    orderId: undefined
  }));
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const partySize = searchParams.get('partySize');
    const action = searchParams.get('action'); // 'available', 'all', or 'find'

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('[Voice Agent Tables API] Fetching tables for user:', userId, 'action:', action);

    // Get base tables
    let tables = generateTables();

    // Check for occupied tables from localStorage (this would be done server-side in a real system)
    // For now, we'll return the base tables with mock occupation

    if (action === 'available') {
      // Return only available tables
      const availableTables = tables.filter(table => table.status === 'Available');
      
      if (partySize) {
        const partySizeNum = parseInt(partySize);
        const suitableTables = availableTables.filter(table => table.capacity >= partySizeNum);
        
        return NextResponse.json({
          success: true,
          tables: suitableTables,
          message: `Found ${suitableTables.length} available tables for ${partySizeNum} people`
        });
      }

      return NextResponse.json({
        success: true,
        tables: availableTables,
        message: `Found ${availableTables.length} available tables`
      });
    }

    if (action === 'find' && partySize) {
      const partySizeNum = parseInt(partySize);
      const availableTables = tables.filter(table => 
        table.status === 'Available' && table.capacity >= partySizeNum
      );
      
      // Find the best fitting table (smallest that can accommodate the party)
      const bestTable = availableTables
        .sort((a, b) => a.capacity - b.capacity)
        .find(table => table.capacity >= partySizeNum);

      if (bestTable) {
        return NextResponse.json({
          success: true,
          table: bestTable,
          alternatives: availableTables.slice(0, 3), // Show up to 3 alternatives
          message: `Best table found: ${bestTable.name} (capacity ${bestTable.capacity})`
        });
      } else {
        return NextResponse.json({
          success: false,
          message: `No available tables for ${partySizeNum} people`,
          alternatives: []
        });
      }
    }

    // Return all tables with status summary
    const statusSummary = {
      available: tables.filter(t => t.status === 'Available').length,
      occupied: tables.filter(t => t.status === 'Occupied').length,
      reserved: tables.filter(t => t.status === 'Reserved').length,
      cleaning: tables.filter(t => t.status === 'Needs Cleaning').length,
      total: tables.length
    };

    return NextResponse.json({
      success: true,
      tables,
      summary: statusSummary,
      message: `Retrieved ${tables.length} tables`
    });

  } catch (error) {
    console.error('[Voice Agent Tables API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table information' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, tableId, action, reservationDetails } = body;

    if (!userId || !tableId || !action) {
      return NextResponse.json({ 
        error: 'User ID, table ID, and action are required' 
      }, { status: 400 });
    }

    console.log('[Voice Agent Tables API] Table action:', action, 'for table:', tableId);

    if (action === 'reserve') {
      // Handle table reservation
      const { customerName, partySize, dateTime, specialRequests } = reservationDetails || {};
      
      if (!customerName || !partySize || !dateTime) {
        return NextResponse.json({ 
          error: 'Customer name, party size, and date/time are required for reservations' 
        }, { status: 400 });
      }

      // In a real system, this would update the database
      // For now, we'll return a success response with reservation details
      const reservationId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      return NextResponse.json({
        success: true,
        reservationId,
        tableId,
        message: `Table ${tableId} reserved successfully for ${customerName}`,
        details: {
          reservationId,
          tableId,
          customerName,
          partySize,
          dateTime,
          specialRequests: specialRequests || '',
          status: 'confirmed'
        }
      });
    }

    if (action === 'check_availability') {
      // Check if a specific table is available
      const tables = generateTables();
      const table = tables.find(t => t.id === tableId);
      
      if (!table) {
        return NextResponse.json({ 
          error: 'Table not found' 
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        table,
        available: table.status === 'Available',
        message: `Table ${table.name} is ${table.status.toLowerCase()}`
      });
    }

    return NextResponse.json({ 
      error: 'Invalid action' 
    }, { status: 400 });

  } catch (error) {
    console.error('[Voice Agent Tables API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process table request' },
      { status: 500 }
    );
  }
}
