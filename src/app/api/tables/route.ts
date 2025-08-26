import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const TABLES_FILE = path.resolve(process.cwd(), 'src/lib/tables.json');

function readTables() {
  try {
    const data = fs.readFileSync(TABLES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeTables(tables: any[]) {
  fs.writeFileSync(TABLES_FILE, JSON.stringify(tables, null, 2), 'utf-8');
}

export async function GET(req: NextRequest) {
  console.log('[API] /api/tables GET called at', new Date().toISOString(), '\nStack:', new Error().stack);
  const tables = readTables();
  return NextResponse.json({ tables });
}

export async function POST(req: NextRequest) {
  console.log('[API] /api/tables POST called at', new Date().toISOString(), '\nStack:', new Error().stack);
  try {
    const body = await req.json();
    const { action, tableId, number, capacity } = body;
    const tables = readTables();

    if (action === 'add') {
      if (!number || !capacity) {
        return NextResponse.json({ error: 'Missing number or capacity' }, { status: 400 });
      }
      const newTable = {
        id: Date.now().toString(),
        number: String(number),
        capacity: Number(capacity),
        status: 'available',
        waiter: null,
        occupiedSince: null
      };
      tables.push(newTable);
      writeTables(tables);
      return NextResponse.json({ tables });
    }

    if (!tableId) {
      return NextResponse.json({ error: 'Missing tableId' }, { status: 400 });
    }
    const table = tables.find((t: any) => t.id === tableId);
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }
    if (action === 'occupy') {
      table.status = 'occupied';
      table.occupiedSince = new Date().toISOString();
      if (body.waiter) table.waiter = body.waiter;
    } else if (action === 'free') {
      table.status = 'available';
      table.occupiedSince = null;
      table.waiter = null;
    }
    if (action === 'edit') {
      if (!number || !capacity) {
        return NextResponse.json({ error: 'Missing number or capacity' }, { status: 400 });
      }
      table.number = String(number);
      table.capacity = Number(capacity);
      if ('waiter' in body) table.waiter = body.waiter;
      if ('occupiedSince' in body) table.occupiedSince = body.occupiedSince;
      writeTables(tables);
      return NextResponse.json({ tables });
    }
    if (action === 'delete') {
      const idx = tables.findIndex((t: any) => t.id === tableId);
      if (idx === -1) {
        return NextResponse.json({ error: 'Table not found' }, { status: 404 });
      }
      tables.splice(idx, 1);
      writeTables(tables);
      return NextResponse.json({ tables });
    }
    writeTables(tables);
    return NextResponse.json({ tables });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
} 