import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Table {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  shape: 'round' | 'square' | 'rect';
  capacity: number;
  seats: number;
  zone?: string;
  status?: 'available' | 'occupied' | 'reserved' | 'cleaning';
  childIds?: string[]; // For merged tables
  isVisible?: boolean;
}

export interface Zone {
  id: string;
  name: string;
  color: string;
  isVisible: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  overlappingTables?: string[];
}

interface TableStoreState {
  // Core State
  tables: Table[];
  zones: Zone[];
  selectedTableId: string | null;
  selectedTablesForMerge: string[];
  isDraftMode: boolean;
  isLoading: boolean;
  error: string | null;
  
  // History Management
  history: Array<{ tables: Table[]; zones: Zone[] }>;
  historyIndex: number;
  maxHistorySize: number;
  
  // Validation
  validationErrors: string[];
  
  // Computed Properties
  canUndo: boolean;
  canRedo: boolean;
}

interface TableStoreActions {
  // Table Management
  addTable: (params: { x: number; y: number; shape: Table['shape'] }) => void;
  updateTable: (id: string, updates: Partial<Table>) => void;
  moveTable: (id: string, x: number, y: number) => void;
  resizeTable: (id: string, w: number, h: number) => void;
  deleteTable: (id: string) => void;
  selectTable: (id: string | null) => void;
  
  // Zone Management
  addZone: (zone: Zone) => void;
  updateZone: (id: string, updates: Partial<Zone>) => void;
  deleteZone: (id: string) => void;
  
  // Merge/Split Operations
  mergeTables: (tableIds: string[]) => void;
  splitTable: (tableId: string) => void;
  canMergeTables: (tableIds: string[]) => boolean;
  toggleTableSelection: (id: string) => void;
  clearTableSelection: () => void;
  
  // History
  undo: () => void;
  redo: () => void;
  addToHistory: (tables: Table[], zones: Zone[]) => void;
  
  // Validation
  validateLayout: () => ValidationResult;
  
  // Keyboard Navigation
  nudgeTable: (id: string, direction: 'up' | 'down' | 'left' | 'right') => void;
  
  // Utility
  getVisibleTables: () => Table[];
  getAdjacentTables: (tableId: string) => string[];
  resetStore: () => void;
  
  // API Integration
  saveDraft: (floorId: string) => Promise<void>;
  loadDraft: (floorId: string) => Promise<void>;
  activateLayout: (floorId: string) => Promise<void>;
}

type TableStore = TableStoreState & TableStoreActions;

const GRID_SIZE = 8;
const MIN_TABLE_SIZE = 40;
const DEFAULT_SIZES = {
  round: { w: 60, h: 60 },
  square: { w: 60, h: 60 },
  rect: { w: 100, h: 60 }
};

// Helper Functions
const snapToGrid = (value: number): number => Math.round(value / GRID_SIZE) * GRID_SIZE;

const generateTableId = (existingTables: Table[]): string => {
  const usedNumbers = existingTables
    .map(t => t.label)
    .filter(label => label.match(/^T\d+$/))
    .map(label => parseInt(label.substring(1)))
    .filter(num => !isNaN(num));
  
  const maxNumber = usedNumbers.length > 0 ? Math.max(...usedNumbers) : 0;
  return `T${maxNumber + 1}`;
};

const checkTablesOverlap = (table1: Table, table2: Table): boolean => {
  return !(
    table1.x + table1.w <= table2.x ||
    table2.x + table2.w <= table1.x ||
    table1.y + table1.h <= table2.y ||
    table2.y + table2.h <= table1.y
  );
};

const areTablesAdjacent = (table1: Table, table2: Table): boolean => {
  const threshold = 5; // 5px tolerance
  
  // Check if tables are horizontally adjacent
  const horizontallyAdjacent = (
    Math.abs((table1.x + table1.w) - table2.x) <= threshold ||
    Math.abs((table2.x + table2.w) - table1.x) <= threshold
  ) && !(
    table1.y + table1.h <= table2.y ||
    table2.y + table2.h <= table1.y
  );
  
  // Check if tables are vertically adjacent
  const verticallyAdjacent = (
    Math.abs((table1.y + table1.h) - table2.y) <= threshold ||
    Math.abs((table2.y + table2.h) - table1.y) <= threshold
  ) && !(
    table1.x + table1.w <= table2.x ||
    table2.x + table2.w <= table1.x
  );
  
  return horizontallyAdjacent || verticallyAdjacent;
};

export const useTableStore = create<TableStore>()(
  persist(
    (set, get) => ({
      // Initial State
      tables: [],
      zones: [],
      selectedTableId: null,
      selectedTablesForMerge: [],
      isDraftMode: true,
      isLoading: false,
      error: null,
      history: [],
      historyIndex: -1,
      maxHistorySize: 20,
      validationErrors: [],
      canUndo: false,
      canRedo: false,

      // Table Management
      addTable: ({ x, y, shape }) => {
        const state = get();
        const newTable: Table = {
          id: crypto.randomUUID(),
          label: generateTableId(state.tables),
          x: snapToGrid(x),
          y: snapToGrid(y),
          w: DEFAULT_SIZES[shape].w,
          h: DEFAULT_SIZES[shape].h,
          shape,
          capacity: 4,
          seats: 4,
          status: 'available',
          isVisible: true
        };

        const newTables = [...state.tables, newTable];
        set({ tables: newTables });
        get().addToHistory(newTables, state.zones);
        get().validateLayout();
      },

      updateTable: (id, updates) => {
        const state = get();
        const newTables = state.tables.map(table =>
          table.id === id ? { ...table, ...updates } : table
        );
        set({ tables: newTables });
        get().addToHistory(newTables, state.zones);
        get().validateLayout();
      },

      moveTable: (id, x, y) => {
        const state = get();
        const newTables = state.tables.map(table =>
          table.id === id 
            ? { ...table, x: snapToGrid(Math.max(0, x)), y: snapToGrid(Math.max(0, y)) }
            : table
        );
        set({ tables: newTables });
        get().validateLayout();
      },

      resizeTable: (id, w, h) => {
        const state = get();
        const newTables = state.tables.map(table =>
          table.id === id 
            ? { 
                ...table, 
                w: Math.max(MIN_TABLE_SIZE, snapToGrid(w)), 
                h: Math.max(MIN_TABLE_SIZE, snapToGrid(h))
              }
            : table
        );
        set({ tables: newTables });
        get().validateLayout();
      },

      deleteTable: (id) => {
        const state = get();
        const newTables = state.tables.filter(table => table.id !== id);
        set({ 
          tables: newTables,
          selectedTableId: state.selectedTableId === id ? null : state.selectedTableId
        });
        get().addToHistory(newTables, state.zones);
        get().validateLayout();
      },

      selectTable: (id) => {
        set({ selectedTableId: id });
      },

      // Zone Management
      addZone: (zone) => {
        const state = get();
        const newZones = [...state.zones, zone];
        set({ zones: newZones });
        get().addToHistory(state.tables, newZones);
      },

      updateZone: (id, updates) => {
        const state = get();
        const newZones = state.zones.map(zone =>
          zone.id === id ? { ...zone, ...updates } : zone
        );
        set({ zones: newZones });
        get().addToHistory(state.tables, newZones);
      },

      deleteZone: (id) => {
        const state = get();
        const newZones = state.zones.filter(zone => zone.id !== id);
        const newTables = state.tables.map(table =>
          table.zone === id ? { ...table, zone: undefined } : table
        );
        set({ zones: newZones, tables: newTables });
        get().addToHistory(newTables, newZones);
      },

      // Merge/Split Operations
      mergeTables: (tableIds) => {
        const state = get();
        const tablesToMerge = state.tables.filter(t => tableIds.includes(t.id));
        
        if (tablesToMerge.length < 2) return;
        
        // Calculate merged table properties
        const minX = Math.min(...tablesToMerge.map(t => t.x));
        const minY = Math.min(...tablesToMerge.map(t => t.y));
        const maxX = Math.max(...tablesToMerge.map(t => t.x + t.w));
        const maxY = Math.max(...tablesToMerge.map(t => t.y + t.h));
        
        const mergedTable: Table = {
          id: crypto.randomUUID(),
          label: tablesToMerge.map(t => t.label).join('+'),
          x: minX,
          y: minY,
          w: maxX - minX,
          h: maxY - minY,
          shape: 'rect',
          capacity: tablesToMerge.reduce((sum, t) => sum + t.capacity, 0),
          seats: tablesToMerge.reduce((sum, t) => sum + t.seats, 0),
          childIds: tableIds,
          status: 'available',
          isVisible: true
        };

        const newTables = [
          ...state.tables.filter(t => !tableIds.includes(t.id)),
          mergedTable
        ];

        set({ 
          tables: newTables, 
          selectedTablesForMerge: [],
          selectedTableId: mergedTable.id
        });
        get().addToHistory(newTables, state.zones);
      },

      splitTable: (tableId) => {
        const state = get();
        const tableToSplit = state.tables.find(t => t.id === tableId);
        
        if (!tableToSplit || !tableToSplit.childIds) return;
        
        // Restore original tables (simplified - in real app, store original positions)
        const restoredTables = tableToSplit.childIds.map((childId, index) => ({
          id: childId,
          label: `T${Date.now()}_${index}`, // Generate new labels
          x: tableToSplit.x + (index * 60),
          y: tableToSplit.y,
          w: 60,
          h: 60,
          shape: 'square' as const,
          capacity: Math.floor(tableToSplit.capacity / tableToSplit.childIds!.length),
          seats: Math.floor(tableToSplit.seats / tableToSplit.childIds!.length),
          status: 'available' as const,
          isVisible: true
        }));

        const newTables = [
          ...state.tables.filter(t => t.id !== tableId),
          ...restoredTables
        ];

        set({ 
          tables: newTables,
          selectedTableId: null
        });
        get().addToHistory(newTables, state.zones);
      },

      canMergeTables: (tableIds) => {
        const state = get();
        const tables = state.tables.filter(t => tableIds.includes(t.id));
        
        if (tables.length < 2) return false;
        
        // Check if all tables are adjacent to at least one other
        return tables.every(table1 => 
          tables.some(table2 => 
            table1.id !== table2.id && areTablesAdjacent(table1, table2)
          )
        );
      },

      toggleTableSelection: (id) => {
        const state = get();
        const isSelected = state.selectedTablesForMerge.includes(id);
        const newSelection = isSelected
          ? state.selectedTablesForMerge.filter(tableId => tableId !== id)
          : [...state.selectedTablesForMerge, id];
        
        set({ selectedTablesForMerge: newSelection });
      },

      clearTableSelection: () => {
        set({ selectedTablesForMerge: [] });
      },

      // History Management
      undo: () => {
        const state = get();
        if (state.historyIndex > 0) {
          const newIndex = state.historyIndex - 1;
          const historyState = state.history[newIndex];
          set({
            tables: historyState.tables,
            zones: historyState.zones,
            historyIndex: newIndex,
            canUndo: newIndex > 0,
            canRedo: true
          });
        }
      },

      redo: () => {
        const state = get();
        if (state.historyIndex < state.history.length - 1) {
          const newIndex = state.historyIndex + 1;
          const historyState = state.history[newIndex];
          set({
            tables: historyState.tables,
            zones: historyState.zones,
            historyIndex: newIndex,
            canUndo: true,
            canRedo: newIndex < state.history.length - 1
          });
        }
      },

      addToHistory: (tables, zones) => {
        const state = get();
        const newHistoryEntry = { tables: [...tables], zones: [...zones] };
        
        // Remove entries after current index
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(newHistoryEntry);
        
        // Limit history size
        const trimmedHistory = newHistory.slice(-state.maxHistorySize);
        const newIndex = trimmedHistory.length - 1;
        
        set({
          history: trimmedHistory,
          historyIndex: newIndex,
          canUndo: newIndex > 0,
          canRedo: false
        });
      },

      // Validation
      validateLayout: () => {
        const state = get();
        const errors: string[] = [];
        const overlappingTables: string[] = [];

        // Check for overlapping tables
        for (let i = 0; i < state.tables.length; i++) {
          for (let j = i + 1; j < state.tables.length; j++) {
            if (checkTablesOverlap(state.tables[i], state.tables[j])) {
              errors.push('TABLES_OVERLAP');
              overlappingTables.push(state.tables[i].id, state.tables[j].id);
            }
          }
        }

        // Check for duplicate IDs
        const labels = state.tables.map(t => t.label);
        const duplicateLabels = labels.filter((label, index) => labels.indexOf(label) !== index);
        if (duplicateLabels.length > 0) {
          errors.push('DUPLICATE_TABLE_ID');
        }

        // Check capacity constraints
        const invalidCapacity = state.tables.some(t => t.capacity < 1);
        if (invalidCapacity) {
          errors.push('INVALID_CAPACITY');
        }

        // Check bounds
        const outOfBounds = state.tables.some(t => t.x < 0 || t.y < 0);
        if (outOfBounds) {
          errors.push('TABLE_OUT_OF_BOUNDS');
        }

        const result: ValidationResult = {
          isValid: errors.length === 0,
          errors: [...new Set(errors)],
          overlappingTables: [...new Set(overlappingTables)]
        };

        set({ validationErrors: result.errors });
        return result;
      },

      // Keyboard Navigation
      nudgeTable: (id, direction) => {
        const state = get();
        const table = state.tables.find(t => t.id === id);
        if (!table) return;

        let newX = table.x;
        let newY = table.y;

        switch (direction) {
          case 'up':
            newY = Math.max(0, table.y - GRID_SIZE);
            break;
          case 'down':
            newY = table.y + GRID_SIZE;
            break;
          case 'left':
            newX = Math.max(0, table.x - GRID_SIZE);
            break;
          case 'right':
            newX = table.x + GRID_SIZE;
            break;
        }

        get().moveTable(id, newX, newY);
      },

      // Utility Functions
      getVisibleTables: () => {
        const state = get();
        return state.tables.filter(table => {
          if (!table.zone) return true;
          const zone = state.zones.find(z => z.id === table.zone);
          return zone ? zone.isVisible : true;
        });
      },

      getAdjacentTables: (tableId) => {
        const state = get();
        const table = state.tables.find(t => t.id === tableId);
        if (!table) return [];

        return state.tables
          .filter(t => t.id !== tableId && areTablesAdjacent(table, t))
          .map(t => t.id);
      },

      resetStore: () => {
        set({
          tables: [],
          zones: [],
          selectedTableId: null,
          selectedTablesForMerge: [],
          isDraftMode: true,
          isLoading: false,
          error: null,
          history: [],
          historyIndex: -1,
          validationErrors: [],
          canUndo: false,
          canRedo: false
        });
      },

      // API Integration
      saveDraft: async (floorId) => {
        const state = get();
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/pos/floor/layout/draft', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-id': 'default'
            },
            body: JSON.stringify({
              floorId,
              layoutDraft: {
                tables: state.tables,
                zones: state.zones
              }
            })
          });

          if (!response.ok) {
            throw new Error('Failed to save draft');
          }

          set({ isLoading: false });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      },

      loadDraft: async (floorId) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`/api/pos/floor/layout/draft?floorId=${floorId}`, {
            headers: {
              'x-tenant-id': 'default'
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.layoutDraft) {
              set({
                tables: data.layoutDraft.tables || [],
                zones: data.layoutDraft.zones || [],
                isLoading: false
              });
              get().addToHistory(data.layoutDraft.tables || [], data.layoutDraft.zones || []);
            }
          } else {
            // No existing draft, start fresh
            set({ isLoading: false });
          }
        } catch (error) {
          set({ 
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load draft'
          });
        }
      },

      activateLayout: async (floorId) => {
        const state = get();
        const validation = get().validateLayout();
        
        if (!validation.isValid) {
          set({ error: 'Cannot activate layout with validation errors' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/pos/floor/layout/activate', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-id': 'default'
            },
            body: JSON.stringify({
              floorId,
              expectVersion: 1
            })
          });

          if (!response.ok) {
            throw new Error('Failed to activate layout');
          }

          set({ isLoading: false, isDraftMode: false });
        } catch (error) {
          set({ 
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to activate layout'
          });
        }
      }
    }),
    {
      name: 'table-store',
      partialize: (state) => ({
        tables: state.tables,
        zones: state.zones,
        isDraftMode: state.isDraftMode
      })
    }
  )
);
