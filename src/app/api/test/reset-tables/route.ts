import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';

// Test-only API to reset database state
export async function POST(request: NextRequest) {
  // Only allow in test/development environment
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  try {
    // Clean up test data
    db.prepare('DELETE FROM audit_logs WHERE tenant_id = ?').run('test-tenant');
    db.prepare('DELETE FROM pos_reservations WHERE tenant_id = ?').run('test-tenant');
    db.prepare('DELETE FROM table_status WHERE tenant_id = ?').run('test-tenant');
    db.prepare('DELETE FROM floor_layouts WHERE tenant_id = ?').run('test-tenant');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database reset error:', error);
    return NextResponse.json({ error: 'Database reset failed' }, { status: 500 });
  }
}
