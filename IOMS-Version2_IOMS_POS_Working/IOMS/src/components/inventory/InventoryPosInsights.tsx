"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getMenuAvailability, 
  getExpiringIngredientDishes,
  MenuAvailability 
} from '@/lib/posInventoryIntegration';
import { getInventory, InventoryItem } from '@/lib/inventoryService';
import { getDishes, Dish } from '@/lib/menuService';
import { getOrders } from '@/lib/orderService';

interface InventoryInsights {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  expiringItems: number;
  availableMenuItems: number;
  unavailableMenuItems: number;
  totalInventoryValue: number;
  averageStockLevel: number;
}

export function InventoryPosInsights() {
  const { currentUser } = useAuth();
  const [insights, setInsights] = useState<InventoryInsights>({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    expiringItems: 0,
    availableMenuItems: 0,
    unavailableMenuItems: 0,
    totalInventoryValue: 0,
    averageStockLevel: 0
  });
  const [menuAvailability, setMenuAvailability] = useState<MenuAvailability[]>([]);
  const [expiringDishes, setExpiringDishes] = useState<ReturnType<typeof getExpiringIngredientDishes>>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<string[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    const calculateInsights = () => {
      const inventory = getInventory(currentUser.id);
      const dishes = getDishes(currentUser.id);
      const orders = getOrders(currentUser.id);

      // Calculate inventory insights
      const totalItems = inventory.length;
      const lowStockItems = inventory.filter(item => 
        item.quantity <= item.lowStockThreshold && item.quantity > 0
      ).length;
      const outOfStockItems = inventory.filter(item => item.quantity === 0).length;
      
      // Calculate expiring items (within 3 days)
      const today = new Date();
      const expiringItems = inventory.filter(item => {
        if (!item.expiryDate) return false;
        const expiry = new Date(item.expiryDate);
        const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
      }).length;

      // Menu availability
      const availability = getMenuAvailability(currentUser.id, dishes);
      const availableMenuItems = availability.filter(a => a.isAvailable).length;
      const unavailableMenuItems = availability.filter(a => !a.isAvailable).length;

      // Expiring dishes
      const expiring = getExpiringIngredientDishes(currentUser.id, dishes);

      // Estimate inventory value (placeholder calculation)
      const totalInventoryValue = inventory.reduce((sum, item) => 
        sum + (item.quantity * 2.5), 0 // $2.5 average cost per unit
      );

      // Average stock level percentage
      const averageStockLevel = inventory.length > 0 
        ? inventory.reduce((sum, item) => {
            const stockPercentage = item.lowStockThreshold > 0 
              ? Math.min(100, (item.quantity / (item.lowStockThreshold * 2)) * 100)
              : 100;
            return sum + stockPercentage;
          }, 0) / inventory.length
        : 0;

      // Generate critical alerts
      const alerts: string[] = [];
      if (outOfStockItems > 0) {
        alerts.push(`${outOfStockItems} items are out of stock`);
      }
      if (unavailableMenuItems > 0) {
        alerts.push(`${unavailableMenuItems} menu items are unavailable`);
      }
      if (expiringItems > 0) {
        alerts.push(`${expiringItems} items expiring within 3 days`);
      }
      if (expiring.length > 0) {
        alerts.push(`${expiring.length} dishes have expiring ingredients`);
      }

      setInsights({
        totalItems,
        lowStockItems,
        outOfStockItems,
        expiringItems,
        availableMenuItems,
        unavailableMenuItems,
        totalInventoryValue,
        averageStockLevel
      });

      setMenuAvailability(availability);
      setExpiringDishes(expiring);
      setCriticalAlerts(alerts);
    };

    calculateInsights();
    
    // Refresh insights every 30 seconds
    const interval = setInterval(calculateInsights, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  if (!currentUser) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Please log in to view inventory insights</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical Issues:</strong>
            <ul className="list-disc list-inside mt-1">
              {criticalAlerts.map((alert, index) => (
                <li key={index}>{alert}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              {insights.lowStockItems} low stock, {insights.outOfStockItems} out of stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menu Availability</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.availableMenuItems}</div>
            <p className="text-xs text-muted-foreground">
              {insights.unavailableMenuItems} unavailable dishes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${insights.totalInventoryValue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Estimated total value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Level</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.averageStockLevel.toFixed(0)}%</div>
            <Progress value={insights.averageStockLevel} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Average stock level
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Menu Status Overview */}
      {menuAvailability.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Menu Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {menuAvailability.slice(0, 10).map((item) => (
                <div key={item.dishId} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.dishName}</span>
                  <div className="flex items-center gap-2">
                    {item.estimatedServings < 999 && (
                      <span className="text-xs text-muted-foreground">
                        {item.estimatedServings} servings
                      </span>
                    )}
                    <Badge 
                      variant={
                        item.stockStatus === 'out-of-stock' ? 'destructive' :
                        item.stockStatus === 'low-stock' ? 'secondary' : 'outline'
                      }
                      className={
                        item.stockStatus === 'low-stock' ? 'bg-yellow-500 text-white' : ''
                      }
                    >
                      {item.stockStatus.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
              {menuAvailability.length > 10 && (
                <p className="text-xs text-muted-foreground text-center">
                  ... and {menuAvailability.length - 10} more items
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expiring Dishes */}
      {expiringDishes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dishes with Expiring Ingredients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringDishes.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.dish.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {item.expiringIngredients.join(', ')}
                    </span>
                    <Badge variant="secondary" className="bg-orange-500 text-white">
                      {item.daysUntilExpiry} day(s)
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
