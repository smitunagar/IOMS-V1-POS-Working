"use client";

import React, { useState, useEffect } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Trash2, Utensils, Loader2, Car, Store, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { recordIngredientUsage } from '@/lib/inventoryService';
import { getDishes, Dish, IngredientQuantity } from '@/lib/menuService'; 
import { addOrder, OrderItem as ServiceOrderItem, DEFAULT_TAX_RATE, setOccupiedTable, OrderType, NewOrderData } from '@/lib/orderService'; 
import { useAuth } from '@/contexts/AuthContext';
import { getIngredientsForDish } from '@/lib/ingredientToolService';

interface CurrentOrderItem extends Dish { 
  orderQuantity: number; 
}

const MOCK_TABLES = Array.from({ length: 10 }, (_, i) => ({
  id: `t${i + 1}`,
  name: `Table ${i + 1}`,
}));

const MOCK_DRIVERS = ["Alice Rider", "Bob Swift", "Charlie Dash", "Diana Zoom"];

export default function OrderEntryPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [menuDishes, setMenuDishes] = useState<Dish[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState<boolean>(true);
  const [currentOrder, setCurrentOrder] = useState<CurrentOrderItem[]>([]);
  const [selectedDishId, setSelectedDishId] = useState<string>("");
  const [quantityToAdd, setQuantityToAdd] = useState<number>(1);
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("");
  const [selectedDriver, setSelectedDriver] = useState<string>("");

  // Add state for menu correction modal and draft
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [menuDraft, setMenuDraft] = useState<ExtendedDish[]>([]);
  const [originalMenuInput, setOriginalMenuInput] = useState<string>("");

  // Ingredients tooltip state
  const [ingredientsCache, setIngredientsCache] = useState<Record<string, (string | IngredientQuantity)[]>>({});
  const [hoveredDishId, setHoveredDishId] = useState<string | null>(null);
  const [loadingIngredients, setLoadingIngredients] = useState<string | null>(null);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (currentUser) {
      setIsLoadingMenu(true);
      // Always try to fetch from /api/menuCsv first
      (async () => {
        try {
          const res = await fetch(`/api/menuCsv?userId=${currentUser.id}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.menu) && data.menu.length > 0) {
              setMenuDishes(data.menu);
              setIsLoadingMenu(false);
              return;
            }
          }
        } catch (e) {
          // Ignore and fallback
        }
        // Fallback: Try to load from localStorage if API fails or menu is empty
        let dishesFromService = getDishes(currentUser.id);
        if ((!dishesFromService || dishesFromService.length === 0) && typeof window !== 'undefined') {
          const localMenu = localStorage.getItem(`restaurantMenu_${currentUser.id}`);
          if (localMenu) {
            try {
              dishesFromService = JSON.parse(localMenu);
            } catch (e) {
              dishesFromService = [];
            }
          }
        }
        setMenuDishes(dishesFromService);
        setIsLoadingMenu(false);
      })();
    } else {
      setMenuDishes([]);
      setIsLoadingMenu(false);
    }
  }, [currentUser]);

  useEffect(() => {
    function handleMenuImported() {
      if (currentUser) {
        let dishesFromService = getDishes(currentUser.id);
        if ((!dishesFromService || dishesFromService.length === 0) && typeof window !== 'undefined') {
          const localMenu = localStorage.getItem(`restaurantMenu_${currentUser.id}`);
          if (localMenu) {
            try {
              dishesFromService = JSON.parse(localMenu);
            } catch (e) {
              dishesFromService = [];
            }
          }
        }
        setMenuDishes(dishesFromService);
      }
    }
    window.addEventListener('menu-imported', handleMenuImported);
    return () => window.removeEventListener('menu-imported', handleMenuImported);
  }, [currentUser]);


  const handleAddDishToOrder = () => {
    if (!selectedDishId || quantityToAdd <= 0) {
      toast({ title: "Error", description: "Please select a dish and specify a valid quantity.", variant: "destructive" });
      return;
    }
    const dish = menuDishes.find(d => d.id === selectedDishId);
    if (!dish) return;

    const existingItemIndex = currentOrder.findIndex(item => item.id === selectedDishId);
    if (existingItemIndex > -1) {
      const updatedOrder = [...currentOrder];
      updatedOrder[existingItemIndex].orderQuantity += quantityToAdd;
      setCurrentOrder(updatedOrder);
    } else {
      setCurrentOrder([...currentOrder, { ...dish, orderQuantity: quantityToAdd }]);
    }
    setSelectedDishId("");
    setQuantityToAdd(1);
    toast({ title: "Success", description: `${dish.name} added to order.` });
  };

  const handleRemoveItem = (itemId: string) => {
    setCurrentOrder(currentOrder.filter(item => item.id !== itemId));
    toast({ title: "Item Removed", description: "Item removed from order." });
  };

  const calculateSubtotal = () => {
    return currentOrder.reduce((sum, item) => {
      let price = 0;
      if (item.price) {
        if (typeof item.price === 'string') {
          price = parseFloat(item.price.replace(/[^0-9.,]/g, '').replace(',', '.'));
        } else if (typeof item.price === 'number') {
          price = item.price;
        }
      }
      return sum + price * item.orderQuantity;
    }, 0);
  };

  const handlePlaceOrder = () => {
    if (!currentUser) {
      toast({ title: "Error", description: "User not logged in.", variant: "destructive" });
      return;
    }
    if (currentOrder.length === 0) {
      toast({ title: "Error", description: "Cannot place an empty order.", variant: "destructive" });
      return;
    }

    let orderSpecifics: Partial<NewOrderData> = {};
    let displayMessageTableName = "";

    if (orderType === 'dine-in') {
      if (!selectedTableId) {
        toast({ title: "Error", description: "Please assign the order to a table.", variant: "destructive" });
        return;
      }
      displayMessageTableName = MOCK_TABLES.find(t => t.id === selectedTableId)?.name || "Unknown Table";
      orderSpecifics = {
        table: displayMessageTableName,
        tableId: selectedTableId,
      };
    } else { // Delivery
      if (!customerName || !customerPhone || !customerAddress || !selectedDriver) {
        toast({ title: "Error", description: "Please fill in all customer and driver details for delivery.", variant: "destructive" });
        return;
      }
      displayMessageTableName = `Delivery to ${customerName}`;
      orderSpecifics = {
        table: displayMessageTableName,
        tableId: `delivery-${Date.now()}`, // Unique ID for delivery "table"
        customerName,
        customerPhone,
        customerAddress,
        driverName: selectedDriver,
      };
    }
    
    currentOrder.forEach(orderItem => {
      if (orderItem.ingredients && orderItem.ingredients.length > 0) {
        orderItem.ingredients.forEach(ingredientSpec => {
          if (typeof ingredientSpec === 'object' && ingredientSpec !== null && 'quantityPerDish' in ingredientSpec) {
            const totalConsumed = ingredientSpec.quantityPerDish * orderItem.orderQuantity;
            recordIngredientUsage(currentUser.id, ingredientSpec.inventoryItemName, totalConsumed, ingredientSpec.unit);
          }
          // If it's a string, skip or handle as needed
        });
      }
    });

    const orderItemsForService: ServiceOrderItem[] = currentOrder.map(item => ({
      dishId: item.id,
      name: item.name,
      quantity: item.orderQuantity,
      unitPrice: item.price,
      totalPrice: item.price * item.orderQuantity,
    }));

    const subtotal = calculateSubtotal();
    
    const newOrderData: NewOrderData = {
      orderType,
      items: orderItemsForService,
      subtotal: subtotal,
      taxRate: DEFAULT_TAX_RATE,
      ...orderSpecifics
    } as NewOrderData;


    const newOrder = addOrder(currentUser.id, newOrderData);

    if (newOrder) {
      if (orderType === 'dine-in' && newOrder.tableId) {
         setOccupiedTable(currentUser.id, newOrder.tableId, newOrder.id); 
      }
      toast({ title: "Order Placed!", description: `Order #${newOrder.id.substring(0,12)}... sent. Total: $${newOrder.totalAmount.toFixed(2)} for ${displayMessageTableName}.` });
      toast({ title: "Inventory Updated", description: "Ingredient usage recorded." });
      setCurrentOrder([]);
      setSelectedTableId("");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setSelectedDriver("");
      // setOrderType('dine-in'); // Optionally reset to default
    } else {
      toast({ title: "Error", description: "Failed to place order. Please try again.", variant: "destructive" });
    }
  };
  
  const categories = Array.from(new Set(menuDishes.map(dish => dish.category || 'Other')));
  
  // Debug: Log categories and menu dishes
  console.log('🔍 Menu dishes loaded:', menuDishes.length);
  console.log('📊 Categories found:', categories);
  console.log('📋 Sample menu items:', menuDishes.slice(0, 3).map(dish => ({
    name: dish.name,
    category: dish.category,
    price: dish.price
  })));

  // Utility: Clear menu for current user
  function clearMenu() {
    if (currentUser?.id) {
      localStorage.removeItem(`restaurantMenu_${currentUser.id}`);
      setMenuDishes([]);
      toast({ title: "Menu Cleared", description: "The menu has been cleared for this user." });
    }
  }

  // Helper to get ingredients for a dish (from dish or AI)
  async function fetchIngredients(dish: Dish) {
    if (dish.ingredients && dish.ingredients.length > 0) {
      setIngredientsCache(prev => ({ ...prev, [dish.id]: dish.ingredients }));
      return;
    }
    if (ingredientsCache[dish.id]) return; // Already cached
    setLoadingIngredients(dish.id);
    try {
      // Pass the full dish object so aiHint is used
      const aiIngredients = await getIngredientsForDish(dish);
      setIngredientsCache(prev => ({ ...prev, [dish.id]: aiIngredients }));
    } catch {
      setIngredientsCache(prev => ({ ...prev, [dish.id]: ["No ingredient data available."] }));
    } finally {
      setLoadingIngredients(null);
    }
  }

  if (!currentUser || isLoadingMenu) {
    return (
      <AppLayout pageTitle="Order Entry">
        <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-xl">{!currentUser ? "Authenticating..." : "Loading menu..."}</p>
        </div>
      </AppLayout>
    );
  }

  const isPlaceOrderDisabled = 
    currentOrder.length === 0 || 
    !currentUser ||
    (orderType === 'dine-in' && !selectedTableId) ||
    (orderType === 'delivery' && (!customerName || !customerPhone || !customerAddress || !selectedDriver));


  // Utility: Check if any item in the order uses euro pricing
  function orderHasEuro(currentOrder: CurrentOrderItem[]) {
    return currentOrder.some(item => {
      let priceStr = item.price ? item.price.toString().trim() : '';
      if (!priceStr) {
        const match = item.name && item.name.match(/(\d+[.,]?\d*)\s*(EUR|€)/i);
        priceStr = match ? match[1] + ' EUR' : '';
      }
      return priceStr && /(\d+[.,]?\d*)\s*(EUR|€)/i.test(priceStr);
    });
  }

  return (
    <AppLayout pageTitle="Order Entry">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center"><Utensils className="mr-2 h-6 w-6" /> Select Dishes</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-20rem)] lg:h-[calc(100vh-22rem)] pr-4">
              {categories.length === 0 && <p className="text-muted-foreground">No dishes available in the menu. Try adding some via the AI Ingredient Tool!</p>}
              {categories.filter(cat => cat && cat.trim()).map((category, catIdx) => (
                <div key={category + '-' + catIdx} className="mb-6">
                  <h3 className="text-xl font-semibold mb-3 font-headline text-primary">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {menuDishes.filter(dish => (dish.category || 'Other') === category).map((dish, dishIdx) => (
                      <Card key={(dish.id || dish.name) + '-' + dishIdx} className="overflow-hidden hover:shadow-lg transition-shadow relative">
                        <Image 
                          src={isValidHttpUrl(dish.image) ? dish.image.trim() : "https://placehold.co/100x100.png"} 
                          alt={dish.name} 
                          width={100} 
                          height={100} 
                          className="w-full h-32 object-cover" 
                          data-ai-hint={dish.aiHint}
                          onError={(e) => (e.currentTarget.src = "https://placehold.co/100x100.png")}
                        />
                        <CardContent className="p-4 flex flex-col gap-2">
                          <div className="flex flex-col items-center justify-center min-h-[2.5rem]">
                            <h4 className="font-semibold text-md mb-1 text-center">
                              {dish.name && dish.name.trim() ? dish.name.replace(/\s*-\s*\d+[.,]?\d*\s*\w*$/i, '') : <span className="text-muted-foreground">Dish Name</span>}
                            </h4>
                          </div>
                          <div className="flex flex-row items-center justify-center min-h-[1.5rem] gap-2">
                            <p className="text-sm text-muted-foreground mb-2 text-center">
                              {dish.price && dish.price.toString().trim() ? dish.price : (() => {
                                const match = dish.name && dish.name.match(/(\d+[.,]?\d*\s*\w*)$/);
                                return match ? match[1] : <span className="text-muted-foreground">$0.00</span>;
                              })()}
                            </p>
                            <span
                              className="ml-2 cursor-pointer relative"
                              onMouseEnter={async () => {
                                setHoveredDishId(dish.id);
                                await fetchIngredients(dish);
                              }}
                              onMouseLeave={() => setHoveredDishId(null)}
                            >
                              <Info className="h-4 w-4 text-blue-500" />
                              {hoveredDishId === dish.id && (
                                <div className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 w-56 bg-white border border-gray-300 rounded shadow-lg p-2 text-xs text-gray-800">
                                  {loadingIngredients === dish.id ? (
                                    <span>Loading ingredients...</span>
                                  ) : (
                                    <ul className="list-disc pl-4">
                                      {(ingredientsCache[dish.id] || ["No ingredient data available."]).map((ing, i) => (
                                        <li key={i}>{typeof ing === 'string' ? ing : ing.inventoryItemName}</li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              )}
                            </span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full"
                            onClick={() => {
                              const tempDish = menuDishes.find(d => d.id === dish.id);
                              if (!tempDish) return;
                              const existingItemIndex = currentOrder.findIndex(item => item.id === dish.id);
                              if (existingItemIndex > -1) {
                                const updatedOrder = [...currentOrder];
                                updatedOrder[existingItemIndex].orderQuantity += 1;
                                setCurrentOrder(updatedOrder);
                              } else {
                                setCurrentOrder([...currentOrder, { ...tempDish, orderQuantity: 1 }]);
                              }
                              toast({ title: "Success", description: `${tempDish.name} added to order.` });
                            }}
                          >
                            <PlusCircle className="mr-2 h-4 w-4"/> Add to Order
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </ScrollArea>
            <Separator className="my-6"/>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <Label htmlFor="dish-select">Or Select Dish Manually</Label>
                <Select value={selectedDishId} onValueChange={setSelectedDishId}>
                  <SelectTrigger id="dish-select">
                    <SelectValue placeholder="Select a dish" />
                  </SelectTrigger>
                  <SelectContent>
                    {menuDishes
                      .filter(dish => dish.id && dish.id !== "")
                      .map((dish, idx) => {
                        let price = (typeof dish.price === 'number' && !isNaN(dish.price)) ? dish.price : parseFloat(dish.price?.toString?.() ?? '') || 0;
                        let priceStr = dish.price?.toString?.() ?? '';
                        let isEuro = /€|eur|euro|EUR/.test(priceStr);
                        let displayPrice = isEuro ? `€${price.toFixed(2)}` : `$${price.toFixed(2)}`;
                        return (
                          <SelectItem key={(dish.id || dish.name) + '-' + idx} value={dish.id}>
                            {dish.name} ({displayPrice})
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
                {menuDishes.length === 0 && (
                  <div style={{ color: 'red', marginTop: 8 }}>No dishes available for this user. Please add menu items.</div>
                )}
              </div>
              <div>
                <Label htmlFor="quantityToAdd">Quantity</Label>
                <Input
                  id="quantityToAdd"
                  type="number"
                  value={quantityToAdd}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    setQuantityToAdd(isNaN(value) ? 1 : Math.max(1, value));
                  }}
                  min="1"
                />
              </div>
              <Button onClick={handleAddDishToOrder} className="w-full sm:w-auto" disabled={!selectedDishId}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Manually
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Current Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
                <Label className="mb-2 block">Order Type</Label>
                <RadioGroup value={orderType} onValueChange={(value) => setOrderType(value as OrderType)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dine-in" id="dine-in" />
                        <Label htmlFor="dine-in" className="flex items-center"><Store className="mr-2 h-4 w-4"/>Dine-In</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="delivery" id="delivery" />
                        <Label htmlFor="delivery" className="flex items-center"><Car className="mr-2 h-4 w-4"/>Delivery</Label>
                    </div>
                </RadioGroup>
            </div>
            <Separator className="my-4" />

            {currentOrder.length === 0 ? (
              <p className="text-muted-foreground">No items in order yet.</p>
            ) : (
              <ScrollArea className="h-[150px] mb-4 pr-3">
                {currentOrder.map((item) => (
                  <div key={item.id} className="flex justify-between items-center mb-2 p-2 rounded-md border">
                    <div>
                      <p className="font-medium">{item.name && item.name.trim() ? item.name.replace(/\s*-\s*\d+[.,]?\d*\s*\w*$/i, '') : <span className="text-muted-foreground">Dish Name</span>}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.orderQuantity} x {item.price && item.price.toString().trim() ? item.price : (() => {
                          // Try to extract trailing price from name if price is missing
                          const match = item.name && item.name.match(/(\d+[.,]?\d*\s*\w*)$/);
                          return match ? match[1] : <span className="text-muted-foreground">€0.00</span>;
                        })()}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            )}
            <Separator className="my-4" />
            
            {orderType === 'dine-in' && (
              <div className="space-y-2">
                <Label htmlFor="table-select">Assign to Table</Label>
                <Select value={selectedTableId} onValueChange={setSelectedTableId}>
                  <SelectTrigger id="table-select">
                    <SelectValue placeholder="Select a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_TABLES.map((table) => (
                      <SelectItem key={table.id} value={table.id}>
                        {table.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {orderType === 'delivery' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="customer-name">Customer Name</Label>
                  <Input id="customer-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g., Jane Doe"/>
                </div>
                <div>
                  <Label htmlFor="customer-phone">Customer Phone</Label>
                  <Input id="customer-phone" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="e.g., 555-1234"/>
                </div>
                <div>
                  <Label htmlFor="customer-address">Delivery Address</Label>
                  <Input id="customer-address" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="e.g., 123 Main St, Anytown"/>
                </div>
                <div>
                  <Label htmlFor="driver-select">Assign Driver</Label>
                  <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                    <SelectTrigger id="driver-select">
                      <SelectValue placeholder="Select a driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_DRIVERS.map((driver) => (
                        <SelectItem key={driver} value={driver}>
                          {driver}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-4">
            <div className="flex justify-between w-full text-lg font-semibold">
              <span>Subtotal:</span>
              <span>{(() => {
                // If order is empty, show €0.00
                if (currentOrder.length === 0) return '€0.00';
                // Sum up euro prices if possible
                let subtotal = 0;
                let hasEuro = false;
                currentOrder.forEach(item => {
                  let priceStr = item.price && item.price.toString().trim() ? item.price : (() => {
                    const match = item.name && item.name.match(/(\d+[.,]?\d*)\s*(EUR|€)/i);
                    return match ? match[1] + ' EUR' : null;
                  })();
                  if (priceStr && /(\d+[.,]?\d*)\s*(EUR|€)/i.test(priceStr.toString())) {
                    // Extract numeric value
                    const match = priceStr.toString().match(/(\d+[.,]?\d*)/);
                    if (match) {
                      hasEuro = true;
                      subtotal += parseFloat(match[1].replace(',', '.')) * (item.orderQuantity || 1);
                    }
                  }
                });
                if (hasEuro) {
                  return `€${subtotal.toFixed(2)}`;
                } else {
                  // fallback to dollar logic if no euro found
                  return `$${calculateSubtotal().toFixed(2)}`;
                }
              })()}</span>
            </div>
            <Button onClick={handlePlaceOrder} className="w-full" size="lg" disabled={isPlaceOrderDisabled}>
              Place Order & Send
            </Button>
          </CardFooter>
        </Card>
      </div>
      <Button onClick={clearMenu} variant="destructive" className="mt-4">Clear Menu</Button>
      <Button
        onClick={() => {
          if (currentUser?.id) {
            const menu = localStorage.getItem(`restaurantMenu_${currentUser.id}`);
            console.warn('DEBUG: localStorage menu for user', currentUser.id, menu);
            alert(menu ? 'Menu found in localStorage. Check console for details.' : 'No menu found in localStorage.');
          } else {
            alert('No current user.');
          }
        }}
        variant="outline"
        className="mt-2"
      >
        Debug: Log Menu from localStorage
      </Button>
      <Button
        onClick={async () => {
          if (!currentUser?.id) {
            alert('No current user.');
            return;
          }
          // Custom upload/parse logic with review modal
          try {
            const res = await fetch('/api/menuCsv');
            if (!res.ok) throw new Error('Failed to fetch menu CSV');
            const data = await res.json();
            if (!Array.isArray(data.menu)) throw new Error('Menu data not found');
            // Show correction modal with parsed menu and original CSV
            const processedMenu = processMenuDraft(data.menu);
            setMenuDraft(processedMenu);
            setOriginalMenuInput(JSON.stringify(data.menu, null, 2));
            setShowCorrectionModal(true);
          } catch (e) {
            alert('Error importing menu: ' + e);
          }
        }}
        variant="secondary"
        className="mt-2"
      >
        Import Menu from CSV (for this user)
      </Button>

      {showCorrectionModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-3xl w-full">
      <h2 className="text-xl font-bold mb-4">Review & Correct Menu</h2>
      <div className="overflow-x-auto max-h-96">
        <table className="min-w-full text-sm border">
          <thead>
            <tr>
              <th className="border px-2 py-1">ID</th>
              <th className="border px-2 py-1">Name</th>
              <th className="border px-2 py-1">Category</th>
              <th className="border px-2 py-1">Quantity</th>
              <th className="border px-2 py-1">Price</th>
              <th className="border px-2 py-1">Image</th>
              <th className="border px-2 py-1">Ingredients</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {menuDraft.map((dish, idx) => {
              // Always use processMenuDraft logic for each dish to ensure correct parsing
              let { quantity, price } = extractQuantityAndPrice(dish.price ? dish.price.toString() : '');
              // Prefer explicit quantity/price if present
              quantity = dish.quantity || quantity;
              price = (dish.price && typeof dish.price === 'string' && (dish.price as string).match(/[0-9]/)) ? dish.price : price;
              return (
                <tr key={dish.id ? `${dish.id}-${idx}` : `${dish.name || ''}-${idx}-${Math.random()}`}> 
                  <td className="border px-2 py-1">
                    <input className="w-full border rounded px-1" value={dish.id || ''} onChange={e => {
                      const newDraft = [...menuDraft];
                      newDraft[idx].id = e.target.value;
                      setMenuDraft(newDraft);
                    }} />
                  </td>
                  <td className="border px-2 py-1">
                    <input className="w-full border rounded px-1" value={dish.name} onChange={e => {
                      // On name change, auto-extract price if present
                      const { cleanName, price } = extractPriceFromName(e.target.value);
                      const updated = [...menuDraft];
                      updated[idx] = {
                        ...updated[idx],
                        name: cleanName,
                        price: updated[idx].price || price // Only auto-fill price if empty
                      };
                      setMenuDraft(updated);
                    }} />
                  </td>
                  <td className="border px-2 py-1">
                    <input className="w-full border rounded px-1" value={dish.category || ''} onChange={e => {
                      const newDraft = [...menuDraft];
                      newDraft[idx].category = e.target.value;
                      setMenuDraft(newDraft);
                    }} />
                  </td>
                  <td className="border px-2 py-1">
                    <input className="w-full border rounded px-1" value={(dish as any).quantity || quantity} onChange={e => {
                      const newDraft = [...menuDraft];
                      (newDraft[idx] as any).quantity = e.target.value;
                      setMenuDraft(newDraft);
                    }} />
                  </td>
                  <td className="border px-2 py-1">
                    <input className="w-full border rounded px-1" value={typeof dish.price === 'string' ? dish.price : (dish.price !== undefined ? dish.price.toString() : '')} onChange={e => {
                      const newDraft = [...menuDraft];
                      newDraft[idx].price = e.target.value;
                      setMenuDraft(newDraft);
                    }} />
                  </td>
                  <td className="border px-2 py-1">
                    <input className="w-full border rounded px-1" value={dish.image || ''} onChange={e => {
                      const newDraft = [...menuDraft];
                      newDraft[idx].image = e.target.value;
                      setMenuDraft(newDraft);
                    }} />
                  </td>
                  <td className="border px-2 py-1">
                    <input className="w-full border rounded px-1" value={Array.isArray(dish.ingredients) ? dish.ingredients.map(ing => typeof ing === 'string' ? ing : (ing as any).name || '').join(', ') : (dish.ingredients || '')} onChange={e => {
                      const newDraft = [...menuDraft];
                      newDraft[idx].ingredients = e.target.value.split(',').map(s => s.trim());
                      setMenuDraft(newDraft);
                    }} />
                  </td>
                  <td className="border px-2 py-1">
                    <Button variant="destructive" size="sm" onClick={() => {
                      setMenuDraft(menuDraft.filter((_, i) => i !== idx));
                    }}>Delete</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between gap-2 mt-4">
        <button
          className="bg-green-500 text-white rounded px-3 py-1 hover:bg-green-600"
          onClick={() => {
            setMenuDraft([
              ...menuDraft,
              { name: '', category: '', price: '', quantity: '', image: '', aiHint: '', ingredients: [] }
            ]);
          }}
        >Add Row</button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCorrectionModal(false)}>Cancel</Button>
          <Button onClick={async () => {
            localStorage.setItem('lastMenuOriginal', originalMenuInput);
            // Convert price to number and also store formatted price string for UI
            const menuToSave = menuDraft.map(dish => {
              let priceNum = (typeof dish.price === 'string') ? parseFloat(dish.price.replace(/[^0-9.,]/g, '').replace(',', '.')) : dish.price;
              let priceStr = priceNum !== undefined && !isNaN(priceNum) ? priceNum.toFixed(2) + ' €' : '';
              return {
                ...dish,
                price: priceStr, // always store as formatted string for UI
                quantity: dish.quantity ? dish.quantity.toString() : '',
              };
            });
            localStorage.setItem('lastMenuCorrected', JSON.stringify(menuToSave));
            setShowCorrectionModal(false);
            setIsLoadingMenu(true);
            try {
              // POST the corrected menu to the backend
              const postRes = await fetch('/api/menuCsv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ menu: menuToSave })
              });
              if (!postRes.ok) {
                const err = await postRes.json().catch(() => ({}));
                alert('Failed to save menu to backend: ' + (err.error || postRes.statusText));
              }
            } catch (e) {
              alert('Error posting menu to backend: ' + e);
            }
            // Always reload from API
            fetch('/api/menuCsv').then(res => res.json()).then(data => {
              if (Array.isArray(data.menu)) setMenuDishes(data.menu as Dish[]);
              setIsLoadingMenu(false);
            }).catch(() => setIsLoadingMenu(false));
          }}>Save Corrections</Button>
        </div>
      </div>
    </div>
  </div>
)}
    </AppLayout>
  );
}

// Extended Dish interface for modal parsing with flexible types
interface ExtendedDish {
  id?: string;
  name: string;
  category?: string;
  price?: string | number;
  quantity?: string;
  image?: string;
  aiHint?: string;
  ingredients?: string[];
}

// Utility to check for valid HTTP(S) URLs
function isValidHttpUrl(url: string): boolean {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Utility: Extract price from name string (e.g., "Chicken Biryani - 12.9 €" -> { name: "Chicken Biryani", price: "12.9 €" })
function extractPriceFromName(name: string): { cleanName: string, price: string } {
  if (!name) return { cleanName: '', price: '' };
  // Match price at end: e.g. "12.9 €", "9.99 EUR", "8,50€", etc.
  const match = name.match(/(.+?)[\s\-:]*([0-9]+[.,]?[0-9]*)\s*(€|EUR|eur|euro)?\s*$/i);
  if (match) {
    return {
      cleanName: match[1].trim(),
      price: `${match[2].replace(',', '.')}${match[3] ? ' €' : ''}`.trim()
    };
  }
  return { cleanName: name, price: '' };
}

// Utility: Extract price and quantity from a string (e.g., "0,3 l 2,50 €")
function extractQuantityAndPrice(str: string): { quantity: string, price: string } {
  let quantity = '';
  let price = '';
  if (!str) return { quantity, price };
  // Try to extract quantity (e.g., 0,3l, 0.3 l, 0,3 liter, etc.)
  const quantityMatch = str.match(/([0-9]+[\.,]?[0-9]*)\s*(l|liter|ml|cl|g|kg|stück|Stück|pcs|piece|glas|Glas|flasche|Flasche)?/i);
  if (quantityMatch) {
    quantity = quantityMatch[0].replace(/\s+/g, ' ').trim();
  }
  // Try to extract price (e.g., 2,50 €, 2.50 €, 2,50 EUR, etc.)
  const priceMatch = str.match(/([0-9]+[\.,]?[0-9]*)\s*(€|eur|euro|EUR)/i);
  if (priceMatch) {
    price = priceMatch[1].replace(',', '.') + ' €';
  }
  // Fallback: if price is not found, use the original field
  if (!price) price = str;
  return { quantity, price };
}

// When importing menu, always extract price and quantity for all rows
function processMenuDraft(rawMenuDraft: any[]): ExtendedDish[] {
  return (rawMenuDraft || [])
    .filter((dish: any) => dish && typeof dish === 'object') // skip null/undefined
    .map((dish: any) => {
      let name = dish.name || '';
      let priceField = (dish.price !== undefined && dish.price !== null) ? dish.price.toString() : '';
      let quantity = dish.quantity || '';
      let price = (typeof dish.price === 'string' ? dish.price : (dish.price !== undefined && dish.price !== null ? dish.price.toString() : ''));
      // If price or quantity missing, try to extract from priceField
      if (!quantity || !price || price === priceField) {
        const extracted = extractQuantityAndPrice(priceField);
        quantity = quantity || extracted.quantity;
        price = extracted.price;
      }
      // If price still missing, try to extract from name
      if ((!price || price === name) && name) {
        const { cleanName, price: extractedPrice } = extractPriceFromName(name);
        name = cleanName;
        if (extractedPrice) price = extractedPrice;
      }
      // --- FIX: Normalize ingredients to string[] for display ---
      let ingredients = dish.ingredients;
      if (Array.isArray(ingredients)) {
        ingredients = ingredients.map((ing: any) => typeof ing === 'string' ? ing : (ing && ing.name ? ing.name : ''));
      } else if (typeof ingredients === 'object' && ingredients !== null) {
        ingredients = [ingredients.name || ''];
      } else if (!ingredients) {
        ingredients = [];
      }
      return {
        ...dish,
        name,
        quantity,
        price,
        ingredients,
      };
    });
}