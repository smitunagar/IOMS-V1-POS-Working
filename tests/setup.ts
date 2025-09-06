import '@testing-library/jest-dom/vitest';
import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { setupZustandTests } from './mocks/zustand';

// Setup Zustand testing utilities
setupZustandTests();

// Prisma client for testing
const prisma = new PrismaClient();

beforeAll(async () => {
  // Setup test database
  await prisma.$connect();
});

afterAll(async () => {
  // Cleanup test database
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up data before each test
  try {
    await prisma.auditLog.deleteMany();
    await prisma.tableStatus.deleteMany();
    await prisma.scanningSession.deleteMany();
    await prisma.floorLayout.deleteMany();
  } catch (error) {
    console.warn('Test cleanup error:', error);
  }
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      pathname: '/test',
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/test';
  },
}));

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Test helper functions
export const createTestLayout = async () => {
  return await prisma.floorLayout.create({
    data: {
      floorId: 'test-floor-1',
      name: 'Test Floor Layout',
      description: 'Test layout for unit tests',
      version: 1,
      isActive: true,
      layout: JSON.stringify({
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
      }),
      tenantId: 'test-tenant',
    },
  });
};

export const createTestTableStatus = async (tableId: string = 'table-1') => {
  return await prisma.tableStatus.create({
    data: {
      tableId,
      status: 'available',
      tenantId: 'test-tenant',
    },
  });
};

export const createTestScanningSession = async (floorId: string = 'test-floor-1') => {
  return await prisma.scanningSession.create({
    data: {
      floorId,
      status: 'in_progress',
      progress: 50,
      scanType: 'full',
      tenantId: 'test-tenant',
    },
  });
};
