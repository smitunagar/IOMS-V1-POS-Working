import React from 'react';
import SupplySyncBot from '../components/SupplySyncBot';

// Example 1: Full Page Integration
export function SupplyChainPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Supply Chain Management</h1>
      <SupplySyncBot />
    </div>
  );
}

// Example 2: Modal Integration
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

export function SupplyChainModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[95vw] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>SupplySync - Smart Vendor & Supply Chain Management</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto">
          <SupplySyncBot />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Example 3: Widget Integration (extract specific features)
export function VendorOverviewWidget() {
  // Extract just the vendor overview functionality
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2">Vendor Overview</h3>
      {/* Use specific parts of SupplySyncBot */}
    </div>
  );
}