'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import TableGrid from '@/components/table-management/TableGrid';
import TableSidePanel from '@/components/table-management/TableSidePanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDiningSetup } from '@/lib/diningSetupStorage';

// Global polling guard to prevent multiple intervals
declare global {
  interface Window {
    __tableManagementPollingActive?: boolean;
    __tableManagementIntervalId?: NodeJS.Timeout;
  }
}

interface Table {
  id: string;
  number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  area?: string;
  waiter?: string;
  occupiedSince?: string;
  shape?: string;
  location?: string;
  bookingRules?: string;
  accessibility?: string;
  seasonalAvailability?: string;
}

interface Order {
  id: string;
  tableId: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export default function TableManagementPage() {
  console.log('[DEBUG] TableManagementPage component rendering at', new Date().toISOString());
  
  const pathname = usePathname();
  console.log('[DEBUG] Current pathname:', pathname);
  
  const [areas, setAreas] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  
  console.log('[DEBUG] Component state - areas count:', areas.length, 'selectedTable:', selectedTable?.id, 'isDialogOpen:', isDialogOpen);

  // Load dining setup data
  useEffect(() => {
    console.log('[DEBUG] Loading dining setup data...');
    const diningSetup = getDiningSetup();
    if (diningSetup && diningSetup.areas) {
      const allTables = diningSetup.areas.flatMap(area => 
        area.tables.map(table => ({
          id: table.id,
          number: table.name,
          capacity: table.occupancy,
          status: 'available' as const,
          area: area.name
        }))
      );
      console.log('[DEBUG] Loaded tables from dining setup:', allTables.length);
      setAreas(allTables);
    }
  }, []);

  // Fetch orders data
  useEffect(() => {
    console.log('[DEBUG] Fetching orders data...');
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders');
        if (response.ok) {
          const data = await response.json();
          console.log('[DEBUG] Orders fetched:', data.orders?.length || 0);
          setOrders(data.orders || []);
        }
      } catch (error) {
        console.error('[DEBUG] Error fetching orders:', error);
      }
    };
    fetchOrders();
  }, []);

  // REMOVED: All polling logic to prevent persistent API calls
  // Data will be loaded once on mount and can be refreshed manually if needed

  // Handle storage events for dining setup sync
  useEffect(() => {
    console.log('[DEBUG] Setting up storage event listener');
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'diningSetup') {
        console.log('[DEBUG] Dining setup changed in storage, reloading...');
        const diningSetup = getDiningSetup();
        if (diningSetup && diningSetup.areas) {
          const allTables = diningSetup.areas.flatMap(area => 
            area.tables.map(table => ({
              id: table.id,
              number: table.name,
              capacity: table.occupancy,
              status: 'available' as const,
              area: area.name
            }))
          );
          setAreas(allTables);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      console.log('[DEBUG] Removing storage event listener');
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Global cleanup effect - ensures polling is cleared on unmount
  useEffect(() => {
    console.log('[DEBUG] Setting up global cleanup effect');
    return () => {
      console.log('[DEBUG] Component unmounting - clearing all polling');
      if (window.__tableManagementIntervalId) {
        clearInterval(window.__tableManagementIntervalId);
        window.__tableManagementIntervalId = undefined;
        window.__tableManagementPollingActive = false;
      }
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, []);

  const handleTableClick = (table: Table) => {
    console.log('[DEBUG] Table clicked:', table.id);
    setSelectedTable(table);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    console.log('[DEBUG] Closing dialog');
    setIsDialogOpen(false);
    setSelectedTable(null);
  };

  const getTableOrders = (tableId: string) => {
    return orders.filter(order => order.tableId === tableId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'occupied': return 'bg-blue-100 text-blue-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'cleaning': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  console.log('[DEBUG] Rendering table management page with', areas.length, 'tables');

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Table Management</h1>
          <p className="text-sm text-gray-500 mt-1">by IOMS team</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Available
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Occupied
            </Badge>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Reserved
            </Badge>
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
              Cleaning
            </Badge>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <TableGrid 
            tables={areas} 
            setTables={setAreas}
            onTableClick={handleTableClick}
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Table Details</DialogTitle>
            </DialogHeader>
            {selectedTable && (
              <TableSidePanel
                tableNumber={selectedTable.number}
                status={selectedTable.status}
                capacity={selectedTable.capacity}
                waiter={selectedTable.waiter}
                onClose={handleCloseDialog}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
} 