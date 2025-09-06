import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET, DELETE } from '@/app/api/3d-table-management/layouts/route';
import { createTestLayout } from '../../setup';

describe('/api/3d-table-management/layouts', () => {
  describe('POST - Save Layout', () => {
    it('should create a new layout successfully', async () => {
      const layoutData = {
        name: 'Test Layout',
        description: 'A test layout',
        floorId: 'floor-1',
        isActive: true,
        tables: [
          {
            id: 'table-1',
            name: 'Table 1',
            x: 10,
            y: 10,
            z: 0,
            rotation: 0,
            shape: 'circle',
            width: 2,
            height: 2,
            seats: 4,
            status: 'available',
          }
        ],
        fixtures: [],
        walls: [],
      };

      const request = new NextRequest('http://localhost:3000/api/3d-table-management/layouts', {
        method: 'POST',
        body: JSON.stringify(layoutData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data.floorId).toBe('floor-1');
      expect(data.data.name).toBe('Test Layout');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: '', // Empty name should fail
        floorId: 'floor-1',
        tables: [],
        fixtures: [],
        walls: [],
      };

      const request = new NextRequest('http://localhost:3000/api/3d-table-management/layouts', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation error');
    });

    it('should update existing layout version', async () => {
      // Create initial layout
      await createTestLayout();

      const updateData = {
        name: 'Updated Test Layout',
        description: 'Updated description',
        floorId: 'test-floor-1',
        isActive: true,
        tables: [
          {
            id: 'table-2',
            name: 'Table 2',
            x: 20,
            y: 20,
            z: 0,
            rotation: 45,
            shape: 'rectangle',
            width: 3,
            height: 1.5,
            seats: 6,
            status: 'available',
          }
        ],
        fixtures: [],
        walls: [],
      };

      const request = new NextRequest('http://localhost:3000/api/3d-table-management/layouts', {
        method: 'POST',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Updated Test Layout');
      expect(data.data.version).toBe(2); // Should increment version
    });
  });

  describe('GET - Get Layouts', () => {
    beforeEach(async () => {
      await createTestLayout();
    });

    it('should retrieve layouts successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/3d-table-management/layouts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.data[0]).toHaveProperty('layout');
    });

    it('should filter by floorId', async () => {
      const request = new NextRequest('http://localhost:3000/api/3d-table-management/layouts?floorId=test-floor-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.every((layout: any) => layout.floorId === 'test-floor-1')).toBe(true);
    });

    it('should respect pagination parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/3d-table-management/layouts?limit=1&offset=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.pagination.limit).toBe(1);
      expect(data.pagination.offset).toBe(0);
    });
  });

  describe('DELETE - Delete Layout', () => {
    beforeEach(async () => {
      await createTestLayout();
    });

    it('should delete layout successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/3d-table-management/layouts?floorId=test-floor-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('deleted successfully');
    });

    it('should return 404 for non-existent layout', async () => {
      const request = new NextRequest('http://localhost:3000/api/3d-table-management/layouts?floorId=non-existent', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Layout not found');
    });

    it('should require floorId parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/3d-table-management/layouts', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Floor ID is required');
    });
  });
});
