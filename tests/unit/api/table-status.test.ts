import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, PUT, GET, DELETE } from '@/app/api/3d-table-management/table-status/route';
import { createTestTableStatus } from '../../setup';

describe('/api/3d-table-management/table-status', () => {
  describe('POST - Update Table Status', () => {
    it('should update table status successfully', async () => {
      const statusData = {
        tableId: 'table-1',
        status: 'occupied',
        notes: 'Customer seated',
        priority: 'medium',
      };

      const request = new NextRequest('http://localhost:3000/api/3d-table-management/table-status', {
        method: 'POST',
        body: JSON.stringify(statusData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.tableId).toBe('table-1');
      expect(data.data.status).toBe('occupied');
      expect(data.data.notes).toBe('Customer seated');
    });

    it('should validate status enum values', async () => {
      const invalidStatusData = {
        tableId: 'table-1',
        status: 'invalid_status', // Invalid status
        priority: 'medium',
      };

      const request = new NextRequest('http://localhost:3000/api/3d-table-management/table-status', {
        method: 'POST',
        body: JSON.stringify(invalidStatusData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation error');
    });

    it('should create new status if table doesn\'t exist', async () => {
      const statusData = {
        tableId: 'new-table',
        status: 'available',
        priority: 'low',
      };

      const request = new NextRequest('http://localhost:3000/api/3d-table-management/table-status', {
        method: 'POST',
        body: JSON.stringify(statusData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.tableId).toBe('new-table');
      expect(data.data.previousStatus).toBe(null);
    });
  });

  describe('PUT - Bulk Update Table Status', () => {
    beforeEach(async () => {
      await createTestTableStatus('table-1');
      await createTestTableStatus('table-2');
    });

    it('should bulk update table statuses successfully', async () => {
      const bulkUpdateData = {
        updates: [
          {
            tableId: 'table-1',
            status: 'occupied',
            notes: 'Party of 4',
          },
          {
            tableId: 'table-2',
            status: 'cleaning',
            notes: 'Spill cleanup',
          },
        ],
      };

      const request = new NextRequest('http://localhost:3000/api/3d-table-management/table-status', {
        method: 'PUT',
        body: JSON.stringify(bulkUpdateData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.updatedCount).toBe(2);
      expect(data.data.results).toHaveLength(2);
    });

    it('should validate all updates in bulk operation', async () => {
      const invalidBulkData = {
        updates: [
          {
            tableId: 'table-1',
            status: 'occupied',
          },
          {
            tableId: 'table-2',
            status: 'invalid_status', // Invalid status
          },
        ],
      };

      const request = new NextRequest('http://localhost:3000/api/3d-table-management/table-status', {
        method: 'PUT',
        body: JSON.stringify(invalidBulkData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation error');
    });
  });

  describe('GET - Get Table Statuses', () => {
    beforeEach(async () => {
      await createTestTableStatus('table-1');
      await createTestTableStatus('table-2');
    });

    it('should retrieve all table statuses', async () => {
      const request = new NextRequest('http://localhost:3000/api/3d-table-management/table-status');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThanOrEqual(2);
      expect(data.summary).toHaveProperty('available');
    });

    it('should filter by specific table IDs', async () => {
      const request = new NextRequest('http://localhost:3000/api/3d-table-management/table-status?tableIds=table-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].tableId).toBe('table-1');
    });

    it('should filter by status', async () => {
      const request = new NextRequest('http://localhost:3000/api/3d-table-management/table-status?status=available');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.every((status: any) => status.status === 'available')).toBe(true);
    });

    it('should include stale status indicators', async () => {
      const request = new NextRequest('http://localhost:3000/api/3d-table-management/table-status');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data[0]).toHaveProperty('isStale');
      expect(data.data[0]).toHaveProperty('timeSinceUpdate');
    });
  });

  describe('DELETE - Reset Table Status', () => {
    beforeEach(async () => {
      await createTestTableStatus('table-1');
    });

    it('should reset table status to available', async () => {
      const request = new NextRequest('http://localhost:3000/api/3d-table-management/table-status?tableId=table-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('available');
      expect(data.data.tableId).toBe('table-1');
    });

    it('should require tableId parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/3d-table-management/table-status', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Table ID is required');
    });

    it('should return 404 for non-existent table', async () => {
      const request = new NextRequest('http://localhost:3000/api/3d-table-management/table-status?tableId=non-existent', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Table status not found');
    });
  });
});
