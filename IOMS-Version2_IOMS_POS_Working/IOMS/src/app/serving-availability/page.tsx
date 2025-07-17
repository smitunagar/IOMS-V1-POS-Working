"use client";

import React, { useState, useEffect } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, Info, RotateCcw, ShoppingCart, Users } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { getDishes } from '@/lib/menuService';
import { getInventory } from '@/lib/inventoryService';
import { 
  checkDishServingAvailability, 
  checkOrderAvailability, 
  processOrderWithAvailabilityCheck,
  getMenuServingCapacity,
  resetIngredientUsage,
  DishAvailabilityResult 
} from '@/lib/servingAvailabilityService';
import { useToast } from "@/hooks/use-toast";

export default function ServingAvailabilityPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [selectedDish, setSelectedDish] = useState<string>('');
  const [requestedServings, setRequestedServings] = useState<number>(1);
  const [availabilityResult, setAvailabilityResult] = useState<DishAvailabilityResult | null>(null);
  const [menuCapacity, setMenuCapacity] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<Array<{ dishId: string; dishName: string; quantity: number }>>([]);
  const [currentInventory, setCurrentInventory] = useState<any[]>([]);

  // Load data
  const dishes = currentUser ? getDishes(currentUser.id) : [];

  useEffect(() => {
    if (currentUser) {
      loadMenuCapacity();
      loadInventory();
    }
  }, [currentUser]);

  const loadMenuCapacity = () => {
    if (!currentUser) return;
    const capacity = getMenuServingCapacity(currentUser.id);
    setMenuCapacity(capacity);
  };

  const loadInventory = () => {
    if (!currentUser) return;
    const inventory = getInventory(currentUser.id);
    setCurrentInventory(inventory);
  };

  // Check single dish availability
  const checkSingleDish = () => {
    if (!currentUser || !selectedDish) {
      toast({
        title: "⚠️ Missing Information",
        description: "Please select a dish first",
        variant: "destructive"
      });
      return;
    }

    const dish = dishes.find(d => d.id === selectedDish);
    if (!dish) {
      toast({
        title: "❌ Dish Not Found",
        description: "Selected dish not found in menu",
        variant: "destructive"
      });
      return;
    }

    const result = checkDishServingAvailability(currentUser.id, dish, requestedServings);
    setAvailabilityResult(result);

    // Show toast with result
    toast({
      title: result.canServe ? "✅ Available" : "❌ Not Available",
      description: result.availabilityMessage,
      variant: result.canServe ? "default" : "destructive"
    });
  };

  // Add item to order
  const addToOrder = () => {
    if (!selectedDish) return;

    const dish = dishes.find(d => d.id === selectedDish);
    if (!dish) return;

    const existingItem = orderItems.find(item => item.dishId === selectedDish);
    if (existingItem) {
      setOrderItems(prev => prev.map(item => 
        item.dishId === selectedDish 
          ? { ...item, quantity: item.quantity + requestedServings }
          : item
      ));
    } else {
      setOrderItems(prev => [...prev, {
        dishId: selectedDish,
        dishName: dish.name,
        quantity: requestedServings
      }]);
    }

    toast({
      title: "🛒 Added to Order",
      description: `Added ${requestedServings}x ${dish.name}`,
    });
  };

  // Check entire order availability
  const checkOrderAvailability = async () => {
    if (!currentUser || orderItems.length === 0) {
      toast({
        title: "⚠️ Empty Order",
        description: "Please add items to your order first",
        variant: "destructive"
      });
      return;
    }

    const orderCheck = await import('@/lib/servingAvailabilityService').then(module => 
      module.checkOrderAvailability(currentUser.id, orderItems.map(item => ({
        dishId: item.dishId,
        quantity: item.quantity
      })))
    );

    // Show results
    const message = `${orderCheck.totalMessage}\n\nAvailable: ${orderCheck.availableDishes.length} dishes\nUnavailable: ${orderCheck.unavailableDishes.length} dishes`;
    
    toast({
      title: orderCheck.canCompleteOrder ? "✅ Order Available" : "❌ Order Issues",
      description: orderCheck.totalMessage,
      variant: orderCheck.canCompleteOrder ? "default" : "destructive"
    });

    // Update UI with detailed results
    console.log('Order availability check:', orderCheck);
  };

  // Process order with consumption
  const processOrder = async () => {
    if (!currentUser || orderItems.length === 0) return;

    const result = await processOrderWithAvailabilityCheck(
      currentUser.id,
      orderItems.map(item => ({ dishId: item.dishId, quantity: item.quantity })),
      { tableId: 'demo-table', tableName: 'Demo Table' }
    );

    toast({
      title: result.success ? "✅ Order Processed" : "❌ Order Failed",
      description: result.message,
      variant: result.success ? "default" : "destructive"
    });

    if (result.success) {
      // Clear order and refresh data
      setOrderItems([]);
      loadMenuCapacity();
      loadInventory();
    }
  };

  // Reset usage counters
  const resetUsage = () => {
    if (!currentUser) return;

    resetIngredientUsage(currentUser.id);
    loadMenuCapacity();
    loadInventory();

    toast({
      title: "🔄 Usage Reset",
      description: "All ingredient usage counters have been reset to 0",
    });
  };

  return (
    <AppLayout pageTitle="🍽️ Serving Availability System">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with explanation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Understanding the "2300" Value & Serving Limits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-green-600">📊 What is the "2300" value?</h3>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li><strong>2300</strong> = Total amount consumed (unit depends on inventory)</li>
                  <li>If unit is "l" (liters): 2300 = 2.3 liters = 2300ml</li>
                  <li>If unit is "ml": 2300 = 2300 milliliters</li>
                  <li>This tracks cumulative usage across all orders</li>
                  <li>Helps with inventory planning and cost analysis</li>
                  <li>Updates automatically when orders are processed</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-red-600">🛑 Serving Limit Logic</h3>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>System calculates max servings based on available ingredients</li>
                  <li>If ingredients can make 10 servings, 11th order will be rejected</li>
                  <li>Shows exactly which ingredient is limiting</li>
                  <li>Provides alternative suggestions when possible</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Inventory Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📦 Current Inventory Status
              <Button onClick={loadInventory} size="sm" variant="outline">
                <RotateCcw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentInventory.slice(0, 6).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-gray-500">
                      Available: {item.quantity} {item.unit}
                      {item.unit === 'l' && ` (${item.quantity * 1000}ml)`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-red-600">
                      Used: {item.quantityUsed || 0} {item.unit}
                      {item.unit === 'l' && item.quantityUsed && ` (${(item.quantityUsed * 1000).toFixed(0)}ml)`}
                    </div>
                    <div className={`text-xs ${item.quantity <= item.lowStockThreshold ? 'text-red-500' : 'text-green-500'}`}>
                      {item.quantity <= item.lowStockThreshold ? '🔴 Low Stock' : '🟢 Good'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={resetUsage} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset Usage Counters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Menu Serving Capacity Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🍽️ Menu Serving Capacity
              <Button onClick={loadMenuCapacity} size="sm" variant="outline">
                <RotateCcw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuCapacity.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.dishName}</div>
                    {item.limitingIngredient && (
                      <div className="text-xs text-gray-500">
                        Limited by: {item.limitingIngredient}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        item.status === 'available' ? 'default' : 
                        item.status === 'limited' ? 'secondary' : 'destructive'
                      }
                      className="text-xs"
                    >
                      {item.maxServings === 999 ? '∞' : item.maxServings} servings
                    </Badge>
                    {item.status === 'unavailable' && <XCircle className="w-4 h-4 text-red-500" />}
                    {item.status === 'limited' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                    {item.status === 'available' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Single Dish Availability Checker */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔍 Check Single Dish Availability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="dish-select">Select Dish</Label>
                <select
                  id="dish-select"
                  value={selectedDish}
                  onChange={(e) => setSelectedDish(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Choose a dish...</option>
                  {dishes.map(dish => (
                    <option key={dish.id} value={dish.id}>
                      {dish.name} - {dish.price}€
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="servings">Requested Servings</Label>
                <Input
                  id="servings"
                  type="number"
                  value={requestedServings}
                  onChange={(e) => setRequestedServings(parseInt(e.target.value) || 1)}
                  min="1"
                  max="50"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={checkSingleDish} disabled={!selectedDish}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Check Availability
                </Button>
                <Button onClick={addToOrder} disabled={!selectedDish} variant="outline">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Order
                </Button>
              </div>
            </div>

            {/* Results */}
            {availabilityResult && (
              <div className="mt-6 p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">Availability Result:</h3>
                <div className="space-y-2">
                  <div className={`text-lg font-medium ${availabilityResult.canServe ? 'text-green-600' : 'text-red-600'}`}>
                    {availabilityResult.availabilityMessage}
                  </div>
                  <div className="text-sm text-gray-600">
                    Max possible servings: {availabilityResult.maxServings === 999 ? '∞' : availabilityResult.maxServings}
                  </div>
                  {availabilityResult.limitingIngredient && (
                    <div className="text-sm text-orange-600">
                      Limiting ingredient: {availabilityResult.limitingIngredient}
                    </div>
                  )}
                  
                  {/* Ingredient breakdown */}
                  {availabilityResult.ingredientChecks.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Ingredient Breakdown:</h4>
                      <div className="space-y-1">
                        {availabilityResult.ingredientChecks.map((check, index) => (
                          <div key={index} className={`text-sm p-2 rounded ${check.isAvailable ? 'bg-green-50' : 'bg-red-50'}`}>
                            <span className={check.isAvailable ? 'text-green-700' : 'text-red-700'}>
                              {check.isAvailable ? '✅' : '❌'} {check.ingredientName}: 
                              Need {check.required} {check.unit}, Have {check.available} {check.unit}
                              {!check.isAvailable && ` (Short by ${check.shortage} ${check.unit})`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Management */}
        {orderItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🛒 Current Order ({orderItems.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orderItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{item.dishName}</div>
                      <div className="text-sm text-gray-500">Quantity: {item.quantity}</div>
                    </div>
                    <Button
                      onClick={() => setOrderItems(prev => prev.filter((_, i) => i !== index))}
                      variant="outline"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={checkOrderAvailability}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Check Order Availability
                  </Button>
                  <Button onClick={processOrder} variant="default">
                    <Users className="w-4 h-4 mr-2" />
                    Process Order (Consume Ingredients)
                  </Button>
                  <Button onClick={() => setOrderItems([])} variant="outline">
                    Clear Order
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Usage Examples */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 How the Serving Limit System Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Example Scenario:</h4>
                <ul className="text-sm space-y-1 list-disc list-inside text-blue-700">
                  <li><strong>Chicken Biryani</strong> needs 0.015L (15ml) olive oil per serving</li>
                  <li>You have 0.1L (100ml) olive oil in inventory</li>
                  <li>System calculates: <strong>6 servings possible</strong> (0.1L ÷ 0.015L = 6.67)</li>
                  <li>Orders 1-6: ✅ <span className="text-green-600">Accepted</span></li>
                  <li>Order 7: ❌ <span className="text-red-600">"Cannot serve - Insufficient olive oil"</span></li>
                  <li>Used counter shows: 2.3L = 2300ml already consumed</li>
                </ul>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Smart Features:</h4>
                <ul className="text-sm space-y-1 list-disc list-inside text-green-700">
                  <li>Automatic ingredient consumption when orders are processed</li>
                  <li>Real-time availability updates</li>
                  <li>Multi-ingredient dishes check ALL required ingredients</li>
                  <li>Shows which ingredient is the limiting factor</li>
                  <li>Handles unit conversions (kg ↔ g, l ↔ ml)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
