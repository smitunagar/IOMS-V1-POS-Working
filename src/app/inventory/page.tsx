"use client";
import { useEffect, useState, useLayoutEffect, useCallback, useRef, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getInventory } from '@/lib/inventoryService';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  PaginationState,
} from '@tanstack/react-table';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import Select from 'react-select';
import { PencilIcon } from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import React from 'react';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { matchSorter } from 'match-sorter';

function getStatus(item: any) {
  // Low Stock check
  if (item.lowStockThreshold !== undefined && item.quantity <= item.lowStockThreshold) return 'Low Stock';
  if (!item.expiryDate) return 'Unknown';
  const now = new Date();
  const exp = new Date(item.expiryDate);
  const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'Expired';
  if (diff < 3) return 'Expiring Soon';
  return 'Fresh';
}

const statusStyles: Record<string, string> = {
  'Fresh': 'bg-blue-100 text-blue-700 border-blue-300',
  'Expiring Soon': 'bg-amber-100 text-amber-800 border-amber-400',
  'Expired': 'bg-red-100 text-red-700 border-red-400',
  'Low Stock': 'bg-yellow-50 text-yellow-800 border-yellow-400 border-2',
  'Unknown': 'bg-gray-100 text-gray-600 border-gray-300',
};

const statusIcons: Record<string, JSX.Element> = {
  'Fresh': <CheckCircle className="inline mr-1 h-4 w-4 text-blue-500" />, 
  'Expiring Soon': <Clock className="inline mr-1 h-4 w-4 text-amber-500" />, 
  'Expired': <XCircle className="inline mr-1 h-4 w-4 text-red-500" />, 
  'Low Stock': <AlertTriangle className="inline mr-1 h-4 w-4 text-yellow-500" />, 
  'Unknown': <Clock className="inline mr-1 h-4 w-4 text-gray-400" />
};

function Chip({ label, selected, onClick, icon }: { label: string, selected: boolean, onClick: () => void, icon?: JSX.Element }) {
  return (
    <button
      className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold mr-2 mb-2 transition ${selected ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-100'}`}
      onClick={onClick}
      type="button"
    >
      {icon && <span className="mr-1">{icon}</span>}
      {label}
    </button>
  );
}

function IndeterminateCheckbox({ checked, indeterminate, ...rest }: { checked: boolean, indeterminate: boolean, [key: string]: any }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return <input ref={ref} type="checkbox" checked={checked} {...rest} />;
}

export default function InventoryPage() {
  // All useState hooks - moved to top to prevent hooks order issues
  const { currentUser, isLoading } = useAuth();
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'expiry' | 'name' | 'stock' | 'status'>('expiry');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dishFilter, setDishFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [expiryFilter, setExpiryFilter] = useState<string[]>([]);
  const [stockFilter, setStockFilter] = useState<string>('');
  const [expiryColFilter, setExpiryColFilter] = useState<string>('');
  const [unitColFilter, setUnitColFilter] = useState<string>('');
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({});
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [columnSizing, setColumnSizing] = useState<Record<string, number>>({});
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [updatedRowId, setUpdatedRowId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });

  // Safe localStorage functions with error handling
  function safeGetInventory(userId: string) {
    try {
      if (typeof window === 'undefined') return [];
      const stored = localStorage.getItem(`inventory_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[InventoryPage] Error reading inventory:', error);
      return [];
    }
  }

  function safeSetInventory(userId: string, items: any[]) {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(`inventory_${userId}`, JSON.stringify(items));
    } catch (error) {
      console.error('[InventoryPage] Error writing inventory:', error);
    }
  }

  // COMPLETELY CLEAN: Single useEffect for loading inventory
  useEffect(() => {
    if (!currentUser) {
      console.log('[InventoryPage] No currentUser, skipping inventory load');
      setLoading(false);
      return;
    }
  
    console.log('[InventoryPage] Loading inventory for user:', currentUser.id);
    setLoading(true);
    
    try {
      const inv = safeGetInventory(currentUser.id);
      setItems(inv);
      console.log('[InventoryPage] Inventory loaded successfully:', inv.length, 'items');
    } catch (error) {
      console.error('[InventoryPage] Error loading inventory:', error);
      setInventoryError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]); // Only depend on currentUser.id, not the entire object
  
  // Reset selected rows when items change
  useLayoutEffect(() => { 
    setSelectedRowIds({}); 
  }, [items]);

  // Memoized filtered and sorted data to prevent expensive recalculations
  const filteredData = useMemo(() => {
    let filtered = items;

    // Apply search filter
    if (search) {
      filtered = matchSorter(filtered, search, {
        keys: ['name', 'associatedDish', 'unit'],
        threshold: matchSorter.rankings.CONTAINS,
      });
    }

    // Apply status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter(item => statusFilter.includes(getStatus(item)));
    }

    // Apply dish filter
    if (dishFilter.length > 0) {
      filtered = filtered.filter(item => dishFilter.includes(item.associatedDish || 'Unknown'));
    }

    // Apply type filter
    if (typeFilter.length > 0) {
      filtered = filtered.filter(item => typeFilter.includes(inferType(item.name)));
    }

    return filtered;
  }, [items, search, statusFilter, dishFilter, typeFilter]);

  // Memoized columns to prevent recreation on every render
  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <IndeterminateCheckbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <IndeterminateCheckbox
          checked={row.getIsSelected()}
          indeterminate={row.getIsSomeSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: 'name',
      header: 'Ingredient',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
      size: 200,
    },
    {
      accessorKey: 'quantity',
      header: 'Stock Available',
      cell: ({ row }) => (
        <div className="font-semibold">{row.getValue('quantity')}</div>
      ),
      size: 120,
    },
    {
      accessorKey: 'unit',
      header: 'Unit',
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue('unit')}</div>
      ),
      size: 80,
    },
    {
      accessorKey: 'quantityUsed',
      header: 'Stock Used',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">{row.getValue('quantityUsed') || 0}</div>
      ),
      size: 100,
    },
    {
      accessorKey: 'totalUsed',
      header: 'Total Used',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">{row.getValue('totalUsed') || 0}</div>
      ),
      size: 100,
    },
    {
      accessorKey: 'expiryDate',
      header: 'Expiry Date',
      cell: ({ row }) => {
        const date = row.getValue('expiryDate') as string;
        return (
          <div className="text-sm">
            {date ? new Date(date).toLocaleDateString() : 'N/A'}
          </div>
        );
      },
      size: 120,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = getStatus(row.original);
        return (
          <Badge className={statusStyles[status]}>
            {statusIcons[status]}
            {status}
          </Badge>
        );
      },
      size: 140,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditPanel(row.original)}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => openDeleteDialog(row.original)}
            className="p-1 text-red-600 hover:text-red-800"
            title="Delete"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ),
      enableSorting: false,
      size: 100,
    },
  ], []);

  // Memoized table instance to prevent recreation
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: setSelectedRowIds,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    state: {
      sorting,
      pagination,
      rowSelection: selectedRowIds,
      columnVisibility,
      columnSizing,
    },
    enableRowSelection: true,
    enableSorting: true,
    enableColumnResizing: true,
  });

  // Memoized filter options to prevent recreation
  const statusOptions = useMemo(() => {
    const statuses = [...new Set(items.map(item => getStatus(item)))];
    return statuses.map(status => ({ value: status, label: status }));
  }, [items]);

  const typeOptions = useMemo(() => {
    const types = [...new Set(items.map(item => inferType(item.name)))];
    return types.map(type => ({ value: type, label: type }));
  }, [items]);

  function inferType(name: string | undefined | null) {
    if (!name) return 'Other';
    const lower = name.toLowerCase();
    if (lower.includes('meat') || lower.includes('chicken') || lower.includes('beef') || lower.includes('pork')) return 'Meat';
    if (lower.includes('vegetable') || lower.includes('carrot') || lower.includes('onion') || lower.includes('tomato')) return 'Vegetable';
    if (lower.includes('spice') || lower.includes('salt') || lower.includes('pepper') || lower.includes('herb')) return 'Spice';
    if (lower.includes('dairy') || lower.includes('milk') || lower.includes('cheese') || lower.includes('cream')) return 'Dairy';
    if (lower.includes('grain') || lower.includes('rice') || lower.includes('pasta') || lower.includes('flour')) return 'Grain';
    return 'Other';
  }

  // Optimized button handlers with debouncing
  const openEditPanel = useCallback((item: any) => {
    console.log('[InventoryPage] openEditPanel called with:', item);
    setSelectedItem(item);
    setEditForm({ ...item });
    setEditPanelOpen(true);
  }, []);

  const saveEditPanel = useCallback(() => {
    const userId = currentUser?.id;
    if (!userId || !selectedItem) return;
    
    const inventory = safeGetInventory(userId);
    const idx = inventory.findIndex((i: any) => String(i.id) === String(selectedItem.id));
    if (idx === -1) return;
    
    inventory[idx] = { ...inventory[idx], ...editForm };
    safeSetInventory(userId, inventory);
    setEditPanelOpen(false);
    setUpdatedRowId(selectedItem.id);
    setTimeout(() => setUpdatedRowId(null), 1200);
    
    // Update items state directly
    setItems([...inventory]);
  }, [currentUser?.id, selectedItem, editForm]);

  const openDeleteDialog = useCallback((item: any) => {
    console.log('[InventoryPage] openDeleteDialog called with:', item);
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    const userId = currentUser?.id;
    if (!userId || !selectedItem) return;
    
    const inventory = safeGetInventory(userId);
    const newInventory = inventory.filter((i: any) => String(i.id) !== String(selectedItem.id));
    safeSetInventory(userId, newInventory);
    setDeleteDialogOpen(false);
    setSelectedItem(null);
    
    // Update items state directly
    setItems([...newInventory]);
  }, [currentUser?.id, selectedItem]);

  const batchDeleteSelected = useCallback(() => {
    const userId = currentUser?.id;
    if (!userId) return;
    
    const inventory = safeGetInventory(userId);
    const newInventory = inventory.filter((i: any) => !selectedRowIds[i.id]);
    safeSetInventory(userId, newInventory);
    setSelectedRowIds({});
    
    // Update items state directly
    setItems([...newInventory]);
  }, [currentUser?.id, selectedRowIds]);

  // Export functions
  const exportCSV = useCallback(() => {
    const visibleCols = table.getAllLeafColumns().filter(col => col.getIsVisible());
    const headers = visibleCols.map(col => col.columnDef.header as string);
    const rows = table.getRowModel().rows.map(row =>
      visibleCols.map(col => {
        const val = row.getValue(col.id);
        return typeof val === 'string' ? val.replace(/\n/g, ' ') : val;
      })
    );
    let csv = '';
    csv += headers.join(',') + '\n';
    rows.forEach(r => {
      csv += r.map(cell => `"${cell ?? ''}"`).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'inventory.csv');
  }, [table]);

  const exportPDF = useCallback(() => {
    const doc = new jsPDF();
    const visibleCols = table.getAllLeafColumns().filter(col => col.getIsVisible());
    const headers = visibleCols.map(col => col.columnDef.header as string);
    const rows = table.getRowModel().rows.map(row =>
      visibleCols.map(col => row.getValue(col.id))
    );
    // @ts-ignore
    doc.autoTable({ head: [headers], body: rows });
    doc.save('inventory.pdf');
  }, [table]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearch('');
    setStatusFilter([]);
    setDishFilter([]);
    setTypeFilter([]);
    setExpiryFilter([]);
    setStockFilter('');
    setExpiryColFilter('');
    setUnitColFilter('');
  }, []);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!currentUser) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Please log in to view inventory.</p>
        </div>
      </MainLayout>
    );
  }

  if (inventoryError) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{inventoryError}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Inventory Management</h1>
          <p className="text-sm text-gray-500 mt-1">by IOMS team</p>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Stock Available: {items.reduce((sum, item) => sum + (item.quantity || 0), 0)}</span>
            <span>Stock Used: {items.reduce((sum, item) => sum + (item.quantityUsed || 0), 0)}</span>
            <span>Total Used: {items.reduce((sum, item) => sum + (item.totalUsed || 0), 0)}</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow p-6 mb-6 sticky top-0 z-30" style={{marginBottom: '24px'}}>
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="w-full max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search ingredients, dishes, or units..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ minWidth: 300 }}
              />
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700 mr-2">Filters:</span>
              {statusOptions.map(option => (
                <Chip
                  key={option.value}
                  label={option.value}
                  selected={statusFilter.includes(option.value)}
                  onClick={() => setStatusFilter(prev => 
                    prev.includes(option.value) 
                      ? prev.filter(s => s !== option.value)
                      : [...prev, option.value]
                  )}
                  icon={statusIcons[option.value]}
                />
              ))}
              {typeOptions.map(option => (
                <Chip
                  key={option.value}
                  label={option.value}
                  selected={typeFilter.includes(option.value)}
                  onClick={() => setTypeFilter(prev => 
                    prev.includes(option.value) 
                      ? prev.filter(t => t !== option.value)
                      : [...prev, option.value]
                  )}
                />
              ))}
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear Filters
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="expiry">Expiry Date</option>
                <option value="name">Name</option>
                <option value="stock">Stock (Low to High)</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-x-auto" style={{ minHeight: 400, marginTop: 24 }}>
          <div className="overflow-x-auto" style={{ minWidth: 1200 }}>
            <table className="w-full min-w-[1200px] table-fixed">
              <thead className="bg-gray-50 sticky top-0 z-10">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                        style={{ width: header.getSize(), minWidth: header.id === 'inventoryItemName' ? 220 : header.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {table.getRowModel().rows.map((row, idx) => (
                  <tr
                    key={`${row.original.id || ''}_${idx}`}
                    className={`hover:bg-gray-50 ${updatedRowId === row.original.id ? 'bg-green-50' : ''}`}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100"
                        style={{ width: cell.column.id === 'inventoryItemName' ? 220 : cell.column.getSize(), minWidth: cell.column.id === 'inventoryItemName' ? 220 : cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.href = '/inventory-import'}
              className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Import CSV
            </button>
            <button
              onClick={exportCSV}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Export CSV
            </button>
            <button
              onClick={exportPDF}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Export PDF
            </button>
            {Object.keys(selectedRowIds).length > 0 && (
              <button
                onClick={batchDeleteSelected}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete Selected ({Object.keys(selectedRowIds).length})
              </button>
            )}
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editPanelOpen} onOpenChange={setEditPanelOpen}>
          <DialogContent className="max-w-md">
            <DialogTitle>Edit Item</DialogTitle>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  value={editForm.quantity || ''}
                  onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={editForm.expiryDate ? new Date(editForm.expiryDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditPanelOpen(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveEditPanel}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogTitle>Delete Item</DialogTitle>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{selectedItem?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
} 