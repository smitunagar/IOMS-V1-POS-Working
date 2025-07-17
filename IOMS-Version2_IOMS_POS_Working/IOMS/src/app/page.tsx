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
import { PlusCircle, Trash2, Utensils, Loader2, Car, Store, Info, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { recordIngredientUsage } from '@/lib/inventoryService';
import { recordIngredientUsageWithValidation, validateDishAvailability } from '@/lib/posInventoryIntegration';
import { getDishes, getDishesWithAvailability, checkDishAvailability, debugDishInventoryAlignment, debugServingsCalculation, Dish as MenuDish } from '@/lib/menuService'; 
import { addOrder, OrderItem as ServiceOrderItem, DEFAULT_TAX_RATE, setOccupiedTable, OrderType, NewOrderData } from '@/lib/orderService'; 
import { useAuth } from '@/contexts/AuthContext';
import { getIngredientsForDish } from '@/lib/ingredientToolService'; // You may need to implement this service if not present

interface CurrentOrderItem extends MenuDish { 
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
  const [menuDishes, setMenuDishes] = useState<MenuDish[]>([]);
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
  
  // 🔍 NEW: Search functionality for menu
  const [menuSearchQuery, setMenuSearchQuery] = useState<string>("");
  
  // 🚫 NEW: Track when menu was intentionally cleared
  const [menuIntentionallyCleared, setMenuIntentionallyCleared] = useState<boolean>(false);

  // Add state for menu correction modal and draft
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [menuDraft, setMenuDraft] = useState<DraftDish[]>([]);
  const [originalMenuInput, setOriginalMenuInput] = useState<string>("");

  // 🔍 NEW: Filter menu dishes based on search query
  const filteredMenuDishes = (Array.isArray(menuDishes) ? menuDishes : []).filter(dish => {
    // Safety check: ensure dish exists and has required properties
    if (!dish || !dish.name || !dish.category) {
      console.warn('Invalid dish object found:', dish);
      return false;
    }
    
    if (!menuSearchQuery.trim()) return true;
    const query = menuSearchQuery.toLowerCase();
    
    try {
      return (
        dish.name.toLowerCase().includes(query) ||
        dish.category.toLowerCase().includes(query) ||
        (dish.aiHint && dish.aiHint.toLowerCase().includes(query))
      );
    } catch (error) {
      console.warn('Error filtering dish:', dish, error);
      return false;
    }
  });

  // Ingredients tooltip state
  const [ingredientsCache, setIngredientsCache] = useState<Record<string, string[]>>({});
  const [hoveredDishId, setHoveredDishId] = useState<string | null>(null);
  const [loadingIngredients, setLoadingIngredients] = useState<string | null>(null);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (currentUser) {
      setIsLoadingMenu(true);
      
      // 🔍 DEBUG: Make debug functions available globally for testing
      if (typeof window !== 'undefined') {
        (window as any).debugChocolava = () => debugServingsCalculation(currentUser.id, 'chocolava');
        (window as any).debugDish = (dishName: string) => debugServingsCalculation(currentUser.id, dishName);
        (window as any).debugInventoryAlignment = (dishName: string) => debugDishInventoryAlignment(currentUser.id, dishName);
        console.log('🔍 Debug functions available:');
        console.log('  - debugChocolava() - Debug Chocolava cake specifically');
        console.log('  - debugDish("dish name") - Debug any dish');
        console.log('  - debugInventoryAlignment("dish name") - Check inventory alignment');
      }
      
      // 🚫 Don't auto-restore menu if it was intentionally cleared
      if (menuIntentionallyCleared) {
        console.log('🚫 Menu was intentionally cleared, skipping auto-restore');
        setMenuDishes([]);
        setIsLoadingMenu(false);
        return;
      }
      
      // Enhanced menu loading with inventory availability
      (async () => {
        try {
          // First try to fetch from API
          const res = await fetch('/api/menuCsv');
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.menu) && data.menu.length > 0) {
              // 🔥 ENHANCED: Apply inventory availability to API menu
              const dishesWithAvailability = getDishesWithAvailability(currentUser.id);
              setMenuDishes(dishesWithAvailability);
              setIsLoadingMenu(false);
              return;
            }
          }
        } catch (e) {
          // Ignore and fallback
        }
        
        // Fallback: Load from localStorage with availability
        let dishesFromService = getDishesWithAvailability(currentUser.id);
        console.log('📋 Loaded dishes with availability:', dishesFromService);
        
        // 🔥 DEBUG: Check first dish if any
        if (dishesFromService.length > 0) {
          console.log('🔍 Debug first dish:', dishesFromService[0]);
          debugDishInventoryAlignment(currentUser.id, dishesFromService[0].name);
        }
        
        if ((!dishesFromService || dishesFromService.length === 0) && typeof window !== 'undefined') {
          const localMenu = localStorage.getItem(`restaurantMenu_${currentUser.id}`);
          if (localMenu) {
            try {
              const parsedMenu = JSON.parse(localMenu);
              // Re-check availability for parsed menu
              dishesFromService = getDishesWithAvailability(currentUser.id);
            } catch (e) {
              dishesFromService = [];
            }
          }
        }
        // Ensure we always set a valid array
        setMenuDishes(Array.isArray(dishesFromService) ? dishesFromService : []);
        setIsLoadingMenu(false);
      })();
    } else {
      setMenuDishes([]);
      setIsLoadingMenu(false);
    }
  }, [currentUser, menuIntentionallyCleared]);

  useEffect(() => {
    function handleMenuImported() {
      if (currentUser) {
        console.log('📥 Menu imported event received');
        setMenuIntentionallyCleared(false); // 🔄 Reset cleared flag when new menu imported
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
        setMenuDishes(Array.isArray(dishesFromService) ? dishesFromService : []);
      }
    }
    
    function handleMenuUpdated() {
      console.log('🔄 Menu updated event received, refreshing menu...');
      if (currentUser) {
        setMenuIntentionallyCleared(false); // 🔄 Reset cleared flag when menu updated
        const freshDishes = getDishes(currentUser.id);
        console.log('📋 Refreshed menu dishes:', freshDishes);
        console.log('📊 Total dishes found:', freshDishes.length);
        setMenuDishes(Array.isArray(freshDishes) ? freshDishes : []);
        
        // Additional debug logging
        if (freshDishes.length > 0) {
          console.log('🍽️ Dish names in menu:', freshDishes.map(d => d.name));
          console.log('🏷️ Categories in menu:', [...new Set(freshDishes.map(d => d.category))]);
        }
      }
    }
    
    window.addEventListener('menu-imported', handleMenuImported);
    window.addEventListener('menu-updated', handleMenuUpdated);
    
    return () => {
      window.removeEventListener('menu-imported', handleMenuImported);
      window.removeEventListener('menu-updated', handleMenuUpdated);
    };
  }, [currentUser]);


  const handleAddDishToOrder = () => {
    if (!selectedDishId || quantityToAdd <= 0) {
      toast({ title: "Error", description: "Please select a dish and specify a valid quantity.", variant: "destructive" });
      return;
    }
    const dish = menuDishes.find(d => d.id === selectedDishId);
    if (!dish) return;

    // 🔥 NEW: Validate inventory before adding to order
    const availabilityCheck = checkDishAvailability(currentUser?.id || null, dish, quantityToAdd);
    
    if (!availabilityCheck.canOrder) {
      toast({ 
        title: "Cannot Add to Order", 
        description: availabilityCheck.message,
        variant: "destructive"
      });
      return;
    }

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
    
    // Show different messages based on availability
    if (availabilityCheck.message.includes("Warning")) {
      toast({ 
        title: "Added to Order", 
        description: `${dish.name} added. ${availabilityCheck.message}`,
        variant: "default"
      });
    } else {
      toast({ title: "Success", description: `${dish.name} added to order.` });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setCurrentOrder(currentOrder.filter(item => item.id !== itemId));
    toast({ title: "Item Removed", description: "Item removed from order." });
  };

  const calculateSubtotal = () => {
    return currentOrder.reduce((sum, item) => sum + item.price * item.orderQuantity, 0);
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
    
    // Update inventory when order is placed with enhanced validation
    console.log('🧾 ===== ORDER PROCESSING STARTED =====');
    console.log('🧾 Order details:', currentOrder.map(item => `${item.orderQuantity}x ${item.name}`));
    const inventoryWarnings: string[] = [];
    const detailedResults: string[] = [];
    
    currentOrder.forEach((orderItem, index) => {
      console.log(`📦 [${index + 1}/${currentOrder.length}] Processing: ${orderItem.orderQuantity}x ${orderItem.name}`);
      detailedResults.push(`\n🍽️ Processing: ${orderItem.orderQuantity}x ${orderItem.name}`);
      
      const result = recordIngredientUsageWithValidation(currentUser.id, orderItem, orderItem.orderQuantity);
      console.log('📊 Inventory update result:', result);
      
      // Add detailed log to results
      if (result.detailedLog) {
        detailedResults.push(...result.detailedLog.map(log => `  ${log}`));
      }
      
      if (!result.success) {
        console.warn('❌ Failed to update inventory for:', orderItem.name, result.warnings);
        inventoryWarnings.push(`${orderItem.name}: ${result.warnings.join(', ')}`);
        detailedResults.push(`  ❌ Failed: ${result.warnings.join(', ')}`);
      } else {
        console.log('✅ Successfully updated inventory for:', orderItem.name);
        detailedResults.push(`  ✅ Success: Inventory updated`);
        if (result.warnings.length > 0) {
          inventoryWarnings.push(...result.warnings);
          detailedResults.push(`  ⚠️ Warnings: ${result.warnings.join(', ')}`);
        }
      }
    });

    // 🎯 ENHANCED: Show detailed inventory deduction results
    console.log('🏁 ===== INVENTORY DEDUCTION SUMMARY =====');
    console.log(detailedResults.join('\n'));
    
    // Show inventory warnings if any
    if (inventoryWarnings.length > 0) {
      toast({ 
        title: "Inventory Warnings", 
        description: inventoryWarnings.join('; '),
        variant: "default" 
      });
    }

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
  
  const categories = Array.from(new Set((Array.isArray(menuDishes) ? menuDishes : []).filter(dish => dish && dish.category).map(dish => dish.category)));

  // Utility: Clear menu for current user
  function clearMenu() {
    if (currentUser?.id) {
      localStorage.removeItem(`restaurantMenu_${currentUser.id}`);
      setMenuDishes([]);
      setMenuIntentionallyCleared(true); // 🚫 Mark as intentionally cleared
      toast({ title: "Menu Cleared", description: "The menu has been cleared for this user. It will stay empty until you import a new menu." });
    }
  }

  // Helper to get ingredients for a dish (from dish or AI)
  async function fetchIngredients(dish: any) {
    if (dish.ingredients && dish.ingredients.length > 0) {
      // 🔥 FIX: Convert ingredient objects to strings for display
      const ingredientStrings = dish.ingredients.map((ing: any) => {
        if (typeof ing === 'string') return ing;
        if (typeof ing === 'object' && ing !== null) {
          if ('inventoryItemName' in ing) {
            return `${ing.inventoryItemName} (${ing.quantityPerDish} ${ing.unit})`;
          }
          if ('name' in ing) {
            return `${ing.name} (${ing.quantity} ${ing.unit})`;
          }
          return JSON.stringify(ing);
        }
        return String(ing);
      });
      setIngredientsCache(prev => ({ ...prev, [dish.id]: ingredientStrings }));
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
  function orderHasEuro(currentOrder: any) {
    return currentOrder.some((item: any) => {
      let priceStr = item.price && item.price.toString().trim() ? item.price : (() => {
        const match = item.name && item.name.match(/(\d+[.,]?\d*)\s*(EUR|€)/i);
        return match ? match[1] + ' EUR' : null;
      })();
      return priceStr && /(\d+[.,]?\d*)\s*(EUR|€)/i.test(priceStr.toString());
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
            {/* 🔍 NEW: Search bar for menu items */}
            <div className="mb-4">
              <Label htmlFor="menu-search" className="flex items-center">
                <Search className="mr-2 h-4 w-4" />
                Search Menu
              </Label>
              <Input
                id="menu-search"
                type="text"
                placeholder="Search dishes by name, category, or ingredient..."
                value={menuSearchQuery}
                onChange={(e) => setMenuSearchQuery(e.target.value)}
                className="mt-1"
              />
              {menuSearchQuery && (
                <p className="text-sm text-muted-foreground mt-1">
                  Showing {filteredMenuDishes.length} of {menuDishes.length} dishes
                </p>
              )}
            </div>
            
            <ScrollArea className="h-[calc(100vh-24rem)] lg:h-[calc(100vh-26rem)] pr-4">
              {filteredMenuDishes.length === 0 && menuDishes.length === 0 && <p className="text-muted-foreground">No dishes available in the menu. Try adding some via the AI Ingredient Tool!</p>}
              {filteredMenuDishes.length === 0 && menuDishes.length > 0 && <p className="text-muted-foreground">No dishes found matching your search. Try a different search term.</p>}
              {Array.from(new Set(filteredMenuDishes.filter(dish => dish && dish.category).map(dish => dish.category))).map((category, catIdx) => (
                <div key={category + '-' + catIdx} className="mb-6">
                  <h3 className="text-xl font-semibold mb-3 font-headline text-primary">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredMenuDishes.filter(dish => dish && dish.category === category).map((dish, dishIdx) => (
                      <Card key={(dish.id || dish.name || 'unknown') + '-' + dishIdx} className="overflow-hidden hover:shadow-lg transition-shadow relative">
                        <Image 
                          src={isValidHttpUrl(dish.image) ? dish.image.trim() : "https://placehold.co/100x100.png"} 
                          alt={dish.name || "Dish image"} 
                          width={100} 
                          height={100} 
                          className="w-full h-32 object-cover" 
                          data-ai-hint={dish.aiHint || ""}
                          onError={(e) => (e.currentTarget.src = "https://placehold.co/100x100.png")}
                        />
                        <CardContent className="p-4 flex flex-col gap-2">
                          <div className="flex flex-col items-center justify-center min-h-[2.5rem]">
                            <h4 className="font-semibold text-md mb-1 text-center">
                              {dish.name && dish.name.trim() ? dish.name.replace(/\s*-\s*\d+[.,]?\d*\s*\w*$/i, '') : <span className="text-muted-foreground">Dish Name</span>}
                            </h4>
                            {/* 🔥 NEW: Inventory Status Badge */}
                            {dish.isAvailable === false && (
                              <div className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium mb-2">
                                Out of Stock
                              </div>
                            )}
                            {dish.isAvailable === true && dish.stockStatus === 'low-stock' && (
                              <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium mb-2">
                                Low Stock
                              </div>
                            )}
                            {dish.isAvailable === true && dish.stockStatus === 'available' && dish.estimatedServings && dish.estimatedServings < 10 && (
                              <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium mb-2">
                                {dish.estimatedServings} servings left
                              </div>
                            )}
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
                                        <li key={i}>{ing}</li>
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
                            className={`w-full ${
                              dish.isAvailable === false 
                                ? 'bg-red-50 border-red-200 text-red-600 cursor-not-allowed' 
                                : dish.stockStatus === 'low-stock'
                                ? 'bg-orange-50 border-orange-200 text-orange-600'
                                : 'hover:bg-blue-50'
                            }`}
                            disabled={dish.isAvailable === false}
                            onClick={() => {
                              const availabilityCheck = checkDishAvailability(currentUser?.id || null, dish, 1);
                              
                              if (!availabilityCheck.canOrder) {
                                toast({ 
                                  title: "Cannot Add to Order", 
                                  description: availabilityCheck.message,
                                  variant: "destructive"
                                });
                                return;
                              }
                              
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
                              
                              // Show different messages based on availability
                              if (availabilityCheck.message.includes("Warning")) {
                                toast({ 
                                  title: "Added to Order", 
                                  description: `${tempDish.name} added. ${availabilityCheck.message}`,
                                  variant: "default"
                                });
                              } else {
                                toast({ title: "Success", description: `${tempDish.name} added to order.` });
                              }
                            }}
                          >
                            <PlusCircle className="mr-2 h-4 w-4"/> 
                            {dish.isAvailable === false ? 'Out of Stock' : 'Add to Order'}
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
                    {filteredMenuDishes
                      .filter(dish => dish && dish.id && dish.id !== "" && dish.name)
                      .map((dish, idx) => {
                        let price = (typeof dish.price === 'number' && !isNaN(dish.price)) ? dish.price : parseFloat(dish.price?.toString?.() ?? '') || 0;
                        let priceStr = dish.price?.toString?.() ?? '';
                        let isEuro = /€|eur|euro|EUR/.test(priceStr);
                        let displayPrice = isEuro ? `€${price.toFixed(2)}` : `$${price.toFixed(2)}`;
                        return (
                          <SelectItem key={(dish.id || dish.name || 'unknown') + '-' + idx} value={dish.id}>
                            {dish.name} ({displayPrice})
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
                {filteredMenuDishes.length === 0 && (
                  <div style={{ color: 'red', marginTop: 8 }}>
                    {menuSearchQuery ? 
                      `No dishes found matching "${menuSearchQuery}". Try a different search term.` : 
                      'No dishes available for this user. Please add menu items.'
                    }
                  </div>
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
        onClick={() => {
          if (currentUser?.id) {
            console.log('🔄 Manual menu refresh triggered');
            setMenuIntentionallyCleared(false); // 🔄 Reset cleared flag on manual refresh
            const freshDishes = getDishes(currentUser.id);
            console.log('📋 Fresh dishes loaded:', freshDishes);
            setMenuDishes(Array.isArray(freshDishes) ? freshDishes : []);
            toast({ title: "Menu Refreshed", description: `Loaded ${Array.isArray(freshDishes) ? freshDishes.length : 0} dishes from storage.` });
          } else {
            alert('No current user.');
          }
        }}
        variant="secondary"
        className="mt-2 ml-2"
      >
        🔄 Refresh Menu
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
              quantity = (dish as any).quantity || quantity;
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
                      const newValue = e.target.value;
                      newDraft[idx] = { ...newDraft[idx], price: newValue };
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
                    <input className="w-full border rounded px-1" value={Array.isArray(dish.ingredients) ? dish.ingredients.map(ing => {
                      if (typeof ing === 'string') return ing;
                      if (typeof ing === 'object' && ing !== null) {
                        return (ing as any).inventoryItemName || 'Unknown ingredient';
                      }
                      return 'Unknown ingredient';
                    }).join(', ') : (dish.ingredients || '')} onChange={e => {
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
              { name: '', category: '', price: '', quantity: '', image: '', aiHint: '', ingredients: [] } as DraftDish
            ]);
          }}
        >Add Row</button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCorrectionModal(false)}>Cancel</Button>
          <Button onClick={async () => {
            localStorage.setItem('lastMenuOriginal', originalMenuInput);
            // Convert price to number and also store formatted price string for UI
            const menuToSave = menuDraft.map(dish => {
              let priceNum = (typeof dish.price === 'string') ? parseFloat((dish.price as string).replace(/[^0-9.,]/g, '').replace(',', '.')) : dish.price as number;
              let priceStr = priceNum !== undefined && !isNaN(priceNum) ? priceNum.toFixed(2) + ' €' : '';
              return {
                ...dish,
                price: priceStr, // always store as formatted string for UI
                quantity: (dish as any).quantity ? (dish as any).quantity.toString() : '',
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
              if (Array.isArray(data.menu)) setMenuDishes(data.menu);
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

// Use draft dish interface for modal parsing
interface DraftDish {
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
function processMenuDraft(rawMenuDraft: any[]): DraftDish[] {
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
        ingredients = ingredients.map((ing: any) => {
          if (typeof ing === 'string') return ing;
          if (typeof ing === 'object' && ing !== null) {
            return (ing as any).inventoryItemName || 'Unknown ingredient';
          }
          return 'Unknown ingredient';
        });
      } else if (typeof ingredients === 'object' && ingredients !== null) {
        ingredients = [(ingredients as any).inventoryItemName || 'Unknown ingredient'];
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