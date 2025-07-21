import { NextRequest, NextResponse } from 'next/server';

// In-memory table state (12 tables, all available by default)
let tables = [
  { id: '1', number: '1', capacity: 2, status: 'available' },
  { id: '2', number: '2', capacity: 2, status: 'available' },
  { id: '3', number: '3', capacity: 2, status: 'available' },
  { id: '4', number: '4', capacity: 6, status: 'available' },
  { id: '5', number: '5', capacity: 2, status: 'available' },
  { id: '6', number: '6', capacity: 2, status: 'available' },
  { id: '7', number: '7', capacity: 4, status: 'available' },
  { id: '8', number: '8', capacity: 6, status: 'available' },
  { id: '9', number: '9', capacity: 6, status: 'available' },
  { id: '10', number: '10', capacity: 2, status: 'available' },
  { id: '11', number: '11', capacity: 4, status: 'available' },
  { id: '12', number: '12', capacity: 6, status: 'available' },
];

export async function GET() {
  return NextResponse.json({ tables });
}

export async function POST(request: NextRequest) {
  try {
    const { action, tableId } = await request.json();
    if (!tableId) {
      return NextResponse.json({ error: 'Missing tableId' }, { status: 400 });
    }
    const table = tables.find(t => t.id === tableId);
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }
    if (action === 'occupy') {
      table.status = 'occupied';
    } else if (action === 'free') {
      table.status = 'available';
    }
    return NextResponse.json({ tables });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
} 