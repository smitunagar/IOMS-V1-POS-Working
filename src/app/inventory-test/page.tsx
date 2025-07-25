"use client";

import React, { useState, useEffect } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from '@/contexts/AuthContext';
import { 
  getInventory, 
  addInventoryItem, 
  updateInventoryItem,
  getInventoryAlertsDetailed,
  updateInventoryAlerts,
  InventoryItem,
  InventoryAlert
} from '@/lib/inventoryService';
import { addDishToMenu, getDishes } from '@/lib/menuService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Plus, 
  AlertTriangle, 
  ShoppingBasket, 
  X, 
  RefreshCw, 
  Package,
  TrendingUp,
  Clock
} from 'lucide-react';

export default function InventoryTestPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadInventory();
      loadAlerts();
    }
  }, [currentUser]);

  const loadInventory = () => {
    if (!currentUser) return;
    const items = getInventory(currentUser.id);
    setInventory(items);
  };

  const loadAlerts = () => {
    if (!currentUser) return;
    const currentAlerts = getInventoryAlertsDetailed(currentUser.id);
    setAlerts(currentAlerts);
  };

  const addSampleInventory = () => {
    if (!currentUser) return;
    
    const sampleItems = [
      {
        name: 'Chicken Breast',
        quantity: 5,
        unit: 'kg',
        category: 'Meat',
        lowStockThreshold: 2,
        expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
      },
      {
        name: 'Rice',
        quantity: 1,
        unit: 'kg',
        category: 'Grains',
        lowStockThreshold: 5,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      },
      {
        name: 'Tomatoes',
        quantity: 0,
        unit: 'kg',
        category: 'Vegetables',
        lowStockThreshold: 3,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      },
      {
        name: 'Milk',
        quantity: 2,
        unit: 'l',
        category: 'Dairy',
        lowStockThreshold: 5,
        expiryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Expired yesterday
      }
    ];

    sampleItems.forEach(item => {
      addInventoryItem(currentUser.id, {
        ...item,
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        quantityUsed: 0,
        totalUsed: 0,
      });
    });

    loadInventory();
    updateInventoryAlerts(currentUser.id);
    loadAlerts();
    
    toast({
      title: "Sample Inventory Added",
      description: "Added sample inventory items with various stock levels and expiry dates.",
    });
  };

  const addSampleDish = () => {
    if (!currentUser) return;
    
    const sampleIngredients = [
      { name: 'Chicken Breast', quantity: 0.5, unit: 'kg' },
      { name: 'Rice', quantity: 0.2, unit: 'kg' },
      { name: 'Tomatoes', quantity: 0.1, unit: 'kg' }
    ];

    addDishToMenu(currentUser.id, {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      name: 'Chicken Curry',
      price: 0,
      ingredients: sampleIngredients.map(ing => ({
        inventoryItemName: ing.name,
        quantityPerDish: ing.quantity,
        unit: ing.unit,
      })),
    });
    
    toast({
      title: "Sample Dish Added",
      description: "Added Chicken Curry with ingredients that match inventory items.",
    });
  };

  const simulateOrder = () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    
    // Simulate processing an order that uses inventory
    setTimeout(() => {
      const updatedInventory = inventory.map(item => {
        if (item.name === 'Chicken Breast') {
          return {
            ...item,
            quantity: Math.max(0, item.quantity - 0.5),
            quantityUsed: (item.quantityUsed || 0) + 0.5,
            totalUsed: (item.totalUsed || 0) + 0.5
          };
        }
        if (item.name === 'Rice') {
          return {
            ...item,
            quantity: Math.max(0, item.quantity - 0.2),
            quantityUsed: (item.quantityUsed || 0) + 0.2,
            totalUsed: (item.totalUsed || 0) + 0.2
          };
        }
        return item;
      });

      // Save updated inventory
      if (typeof window !== 'undefined') {
        const inventoryStorageKey = `restaurantInventory_${currentUser.id}`;
        localStorage.setItem(inventoryStorageKey, JSON.stringify(updatedInventory));
      }

      // Update alerts
      updateInventoryAlerts(currentUser.id);
      
      loadInventory();
      loadAlerts();
      setIsLoading(false);
      
      toast({
        title: "Order Simulated",
        description: "Processed a sample order that consumed inventory items.",
      });
    }, 1000);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'expiry':
        return <Clock className="h-4 w-4" />;
      case 'low_stock':
        return <ShoppingBasket className="h-4 w-4" />;
      case 'out_of_stock':
        return <X className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= 0) return { status: 'Out of Stock', color: 'destructive' };
    if (item.quantity <= (item.lowStockThreshold ?? 0)) return { status: 'Low Stock', color: 'secondary' };
    return { status: 'In Stock', color: 'default' };
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Inventory Tracking Test</h1>
          <div className="flex gap-2">
            <Button onClick={addSampleInventory} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Sample Inventory
            </Button>
            <Button onClick={addSampleDish} variant="outline">
              <Package className="h-4 w-4 mr-2" />
              Add Sample Dish
            </Button>
            <Button onClick={simulateOrder} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4 mr-2" />
              )}
              Simulate Order
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Items ({inventory.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => {
                    const stockStatus = getStockStatus(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">
                              Used: {(item.quantityUsed || 0)} {item.unit}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Total: {(item.totalUsed || 0)} {item.unit}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={stockStatus.color as any}>
                            {stockStatus.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.expiryDate ? (
                            <span className={`text-sm ${
                              new Date(item.expiryDate) < new Date() ? 'text-red-600' : 
                              new Date(item.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'text-yellow-600' : 
                              'text-green-600'
                            }`}>
                              {format(new Date(item.expiryDate), 'MMM dd, yyyy')}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">No expiry</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Inventory Alerts ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No active alerts</p>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.itemId}
                      className="p-3 rounded-md border bg-yellow-400/10 border-yellow-500 text-yellow-700 dark:text-yellow-400"
                    >
                      <div className="flex items-start gap-2">
                        {/* No type property in InventoryAlert, so just show a warning icon */}
                        <AlertTriangle className="h-4 w-4" />
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{alert.itemName}</p>
                          <p className="text-xs">{alert.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test the System</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>1. <strong>Add Sample Inventory:</strong> Creates inventory items with various stock levels and expiry dates</p>
              <p>2. <strong>Add Sample Dish:</strong> Creates a dish with ingredients that match inventory items</p>
              <p>3. <strong>Simulate Order:</strong> Processes an order that consumes inventory and triggers alerts</p>
              <p>4. <strong>Watch Alerts:</strong> The notification bell will show alerts for low stock and expiring items</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
} 