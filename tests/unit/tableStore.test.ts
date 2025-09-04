import { renderHook, act } from '@testing-library/react';
import { useTableStore } from '@/contexts/tableStore';
import { Table, Zone } from '@/types/table-management';

// Mock Zustand
jest.mock('zustand');

describe('Table Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useTableStore.getState().resetStore();
  });

  describe('Table Management', () => {
    test('should add table with auto-incremented label', () => {
      const { result } = renderHook(() => useTableStore());

      act(() => {
        result.current.addTable({ x: 0, y: 0, shape: 'round' });
      });

      expect(result.current.tables).toHaveLength(1);
      expect(result.current.tables[0].label).toBe('T1');
      expect(result.current.tables[0].shape).toBe('round');
      expect(result.current.tables[0].capacity).toBe(4);
    });

    test('should auto-increment table labels correctly', () => {
      const { result } = renderHook(() => useTableStore());

      act(() => {
        result.current.addTable({ x: 0, y: 0, shape: 'round' });
        result.current.addTable({ x: 100, y: 0, shape: 'square' });
        result.current.addTable({ x: 200, y: 0, shape: 'rect' });
      });

      expect(result.current.tables[0].label).toBe('T1');
      expect(result.current.tables[1].label).toBe('T2');
      expect(result.current.tables[2].label).toBe('T3');
    });

    test('should move table with snap-to-grid', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.addTable({ x: 0, y: 0, shape: 'round' });
      });

      const tableId = result.current.tables[0].id;

      act(() => {
        result.current.moveTable(tableId, 33, 27); // Non-grid positions
      });

      // Should snap to nearest 8px grid
      expect(result.current.tables[0].x).toBe(32);
      expect(result.current.tables[0].y).toBe(24);
    });

    test('should resize table with minimum size constraints', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.addTable({ x: 0, y: 0, shape: 'round' });
      });

      const tableId = result.current.tables[0].id;

      // Try to resize below minimum
      act(() => {
        result.current.resizeTable(tableId, 20, 20);
      });

      // Should enforce minimum size (40px)
      expect(result.current.tables[0].w).toBe(40);
      expect(result.current.tables[0].h).toBe(40);

      // Valid resize
      act(() => {
        result.current.resizeTable(tableId, 80, 80);
      });

      expect(result.current.tables[0].w).toBe(80);
      expect(result.current.tables[0].h).toBe(80);
    });

    test('should delete table', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.addTable({ x: 0, y: 0, shape: 'round' });
        result.current.addTable({ x: 100, y: 0, shape: 'square' });
      });

      expect(result.current.tables).toHaveLength(2);

      const tableId = result.current.tables[0].id;

      act(() => {
        result.current.deleteTable(tableId);
      });

      expect(result.current.tables).toHaveLength(1);
      expect(result.current.tables[0].label).toBe('T2');
    });

    test('should update table properties', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.addTable({ x: 0, y: 0, shape: 'round' });
      });

      const tableId = result.current.tables[0].id;

      act(() => {
        result.current.updateTable(tableId, {
          label: 'VIP-1',
          capacity: 6,
          shape: 'square',
          zone: 'vip-zone'
        });
      });

      const table = result.current.tables[0];
      expect(table.label).toBe('VIP-1');
      expect(table.capacity).toBe(6);
      expect(table.shape).toBe('square');
      expect(table.zone).toBe('vip-zone');
    });
  });

  describe('Validation', () => {
    test('should detect overlapping tables', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.addTable({ x: 0, y: 0, shape: 'round' }); // 60x60 table
        result.current.addTable({ x: 30, y: 30, shape: 'round' }); // Overlapping
      });

      const validationResult = result.current.validateLayout();
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toContain('TABLES_OVERLAP');
      expect(validationResult.overlappingTables).toHaveLength(2);
    });

    test('should detect duplicate table IDs', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.addTable({ x: 0, y: 0, shape: 'round' });
        result.current.addTable({ x: 100, y: 0, shape: 'square' });
      });

      const table2Id = result.current.tables[1].id;

      // Try to set duplicate label
      act(() => {
        result.current.updateTable(table2Id, { label: 'T1' });
      });

      const validationResult = result.current.validateLayout();
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toContain('DUPLICATE_TABLE_ID');
    });

    test('should validate table capacity minimum', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.addTable({ x: 0, y: 0, shape: 'round' });
      });

      const tableId = result.current.tables[0].id;

      act(() => {
        result.current.updateTable(tableId, { capacity: 0 });
      });

      const validationResult = result.current.validateLayout();
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toContain('INVALID_CAPACITY');
    });

    test('should validate table bounds', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.addTable({ x: -10, y: -10, shape: 'round' }); // Negative position
      });

      const validationResult = result.current.validateLayout();
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toContain('TABLE_OUT_OF_BOUNDS');
    });
  });

  describe('Merge and Split Operations', () => {
    test('should merge adjacent tables', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.addTable({ x: 0, y: 0, shape: 'square' }); // 60x60
        result.current.addTable({ x: 60, y: 0, shape: 'square' }); // Adjacent
      });

      const table1Id = result.current.tables[0].id;
      const table2Id = result.current.tables[1].id;

      act(() => {
        result.current.mergeTables([table1Id, table2Id]);
      });

      expect(result.current.tables).toHaveLength(1);
      const mergedTable = result.current.tables[0];
      expect(mergedTable.label).toBe('T1+T2');
      expect(mergedTable.capacity).toBe(8); // Combined capacity
      expect(mergedTable.w).toBe(120); // Combined width
      expect(mergedTable.childIds).toEqual([table1Id, table2Id]);
    });

    test('should not merge non-adjacent tables', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.addTable({ x: 0, y: 0, shape: 'square' });
        result.current.addTable({ x: 200, y: 200, shape: 'square' }); // Far apart
      });

      const table1Id = result.current.tables[0].id;
      const table2Id = result.current.tables[1].id;

      const canMerge = result.current.canMergeTables([table1Id, table2Id]);
      expect(canMerge).toBe(false);
    });

    test('should split merged table back to original components', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.addTable({ x: 0, y: 0, shape: 'square' });
        result.current.addTable({ x: 60, y: 0, shape: 'square' });
      });

      const table1Id = result.current.tables[0].id;
      const table2Id = result.current.tables[1].id;

      // Merge tables
      act(() => {
        result.current.mergeTables([table1Id, table2Id]);
      });

      expect(result.current.tables).toHaveLength(1);
      const mergedTableId = result.current.tables[0].id;

      // Split table
      act(() => {
        result.current.splitTable(mergedTableId);
      });

      expect(result.current.tables).toHaveLength(2);
      
      // Verify original tables restored
      const restoredTable1 = result.current.tables.find(t => t.id === table1Id);
      const restoredTable2 = result.current.tables.find(t => t.id === table2Id);
      
      expect(restoredTable1).toBeDefined();
      expect(restoredTable2).toBeDefined();
      expect(restoredTable1!.x).toBe(0);
      expect(restoredTable1!.y).toBe(0);
      expect(restoredTable2!.x).toBe(60);
      expect(restoredTable2!.y).toBe(0);
    });
  });

  describe('Undo/Redo Functionality', () => {
    test('should undo table addition', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.addTable({ x: 0, y: 0, shape: 'round' });
      });

      expect(result.current.tables).toHaveLength(1);

      act(() => {
        result.current.undo();
      });

      expect(result.current.tables).toHaveLength(0);
    });

    test('should redo table addition', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.addTable({ x: 0, y: 0, shape: 'round' });
        result.current.undo();
      });

      expect(result.current.tables).toHaveLength(0);

      act(() => {
        result.current.redo();
      });

      expect(result.current.tables).toHaveLength(1);
    });

    test('should maintain undo history limit', () => {
      const { result } = renderHook(() => useTableStore());
      
      // Add 25 tables (beyond 20 limit)
      act(() => {
        for (let i = 0; i < 25; i++) {
          result.current.addTable({ x: i * 70, y: 0, shape: 'round' });
        }
      });

      // Should only be able to undo 20 times
      let undoCount = 0;
      while (result.current.canUndo && undoCount < 30) {
        act(() => {
          result.current.undo();
        });
        undoCount++;
      }

      expect(undoCount).toBeLessThanOrEqual(20);
    });
  });

  describe('Zone Management', () => {
    test('should add zone', () => {
      const { result } = renderHook(() => useTableStore());
      
      const zone: Zone = {
        id: 'vip-zone',
        name: 'VIP Section',
        color: '#ff0000',
        isVisible: true
      };

      act(() => {
        result.current.addZone(zone);
      });

      expect(result.current.zones).toHaveLength(1);
      expect(result.current.zones[0]).toEqual(zone);
    });

    test('should filter tables by zone visibility', () => {
      const { result } = renderHook(() => useTableStore());
      
      // Add zone
      act(() => {
        result.current.addZone({
          id: 'vip-zone',
          name: 'VIP Section',
          color: '#ff0000',
          isVisible: false
        });
      });

      // Add table in zone
      act(() => {
        result.current.addTable({ x: 0, y: 0, shape: 'round' });
        result.current.updateTable(result.current.tables[0].id, { zone: 'vip-zone' });
      });

      const visibleTables = result.current.getVisibleTables();
      expect(visibleTables).toHaveLength(0); // Table hidden because zone is not visible
    });
  });

  describe('Keyboard Navigation', () => {
    test('should nudge table with arrow keys', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.addTable({ x: 80, y: 80, shape: 'round' });
        result.current.selectTable(result.current.tables[0].id);
      });

      const tableId = result.current.selectedTableId!;

      act(() => {
        result.current.nudgeTable(tableId, 'right');
      });

      expect(result.current.tables[0].x).toBe(88); // Moved 8px right

      act(() => {
        result.current.nudgeTable(tableId, 'down');
      });

      expect(result.current.tables[0].y).toBe(88); // Moved 8px down
    });

    test('should not move table out of bounds', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.addTable({ x: 0, y: 0, shape: 'round' });
        result.current.selectTable(result.current.tables[0].id);
      });

      const tableId = result.current.selectedTableId!;

      act(() => {
        result.current.nudgeTable(tableId, 'left');
        result.current.nudgeTable(tableId, 'up');
      });

      // Should stay at bounds
      expect(result.current.tables[0].x).toBe(0);
      expect(result.current.tables[0].y).toBe(0);
    });
  });

  describe('Selection Management', () => {
    test('should select and deselect tables', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.addTable({ x: 0, y: 0, shape: 'round' });
      });

      const tableId = result.current.tables[0].id;

      act(() => {
        result.current.selectTable(tableId);
      });

      expect(result.current.selectedTableId).toBe(tableId);

      act(() => {
        result.current.selectTable(null);
      });

      expect(result.current.selectedTableId).toBeNull();
    });

    test('should track multi-selection for merge operations', () => {
      const { result } = renderHook(() => useTableStore());
      
      act(() => {
        result.current.addTable({ x: 0, y: 0, shape: 'round' });
        result.current.addTable({ x: 60, y: 0, shape: 'round' });
      });

      const table1Id = result.current.tables[0].id;
      const table2Id = result.current.tables[1].id;

      act(() => {
        result.current.toggleTableSelection(table1Id);
        result.current.toggleTableSelection(table2Id);
      });

      expect(result.current.selectedTablesForMerge).toContain(table1Id);
      expect(result.current.selectedTablesForMerge).toContain(table2Id);
    });
  });
});
