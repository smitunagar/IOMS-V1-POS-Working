
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { Bell, AlertTriangle, ShoppingBasket, Utensils, Sparkles, Loader2, Tag, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getInventory, 
  InventoryItem, 
  getInventoryAlerts, 
  acknowledgeAlert, 
  updateInventoryAlerts,
  InventoryAlert 
} from '@/lib/inventoryService';
import { getDishes, Dish, IngredientQuantity } from '@/lib/menuService';
import { suggestDiscountedDishes, SuggestDiscountedDishesInput, SuggestDiscountedDishesOutput } from '@/ai/flows/suggest-discounted-dishes';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';

interface AIDiscountSuggestion {
  dishName: string;
  reason: string;
  suggestedDiscountPercentage?: number;
}

export function NotificationBell() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AIDiscountSuggestion[] | null>(null);
  const [isGeneratingSuggestions, startGeneratingSuggestionsTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const expiringSoonThresholdDays = 7;
  const expiringCriticalThresholdDays = 3;

  // Load alerts when component mounts or user changes
  useEffect(() => {
    if (currentUser) {
      loadAlerts();
    }
  }, [currentUser]);

  // Listen for inventory alert events
  useEffect(() => {
    const handleInventoryAlert = (event: CustomEvent) => {
      const newAlert = event.detail;
      setAlerts(prev => [newAlert, ...prev]);
      
      // Show toast notification for critical alerts
      if (newAlert.severity === 'critical') {
        toast({
          title: "Critical Inventory Alert",
          description: newAlert.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Inventory Alert",
          description: newAlert.message,
        });
      }
    };

    const handleInventoryUpdate = () => {
      // Refresh alerts when inventory is updated
      if (currentUser) {
        loadAlerts();
      }
    };

    window.addEventListener('inventory-alert', handleInventoryAlert as EventListener);
    window.addEventListener('inventory-updated', handleInventoryUpdate);

    return () => {
      window.removeEventListener('inventory-alert', handleInventoryAlert as EventListener);
      window.removeEventListener('inventory-updated', handleInventoryUpdate);
    };
  }, [currentUser, toast]);

  const loadAlerts = async () => {
    if (!currentUser) return;
    
    setIsRefreshing(true);
    try {
      // Update alerts first to catch any new ones
      const newAlerts = updateInventoryAlerts(currentUser.id);
      
      // Get all alerts
      const allAlerts = getInventoryAlerts(currentUser.id);
      
      // Filter out acknowledged alerts older than 24 hours
      const recentAlerts = allAlerts.filter(alert => {
        if (!alert.acknowledged) return true;
        const alertDate = new Date(alert.timestamp);
        const hoursSince = (Date.now() - alertDate.getTime()) / (1000 * 60 * 60);
        return hoursSince < 24;
      });
      
      setAlerts(recentAlerts);
      
      // Show toast for new critical alerts
      newAlerts.forEach(alert => {
        if (alert.severity === 'critical') {
          toast({
            title: "Critical Inventory Alert",
            description: alert.message,
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    if (!currentUser) return;
    
    acknowledgeAlert(alertId, currentUser.id);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    
    toast({
      title: "Alert Acknowledged",
      description: "The alert has been marked as read.",
    });
  };

  const handleGetAISuggestions = () => {
    if (!currentUser) return;
    setAiSuggestions(null);

    startGeneratingSuggestionsTransition(async () => {
      try {
        const inventory = getInventory(currentUser.id);
        const menu = getDishes(currentUser.id);

        const expiringIngredientsForAI = inventory
          .map(item => {
            if (!item.expiryDate) return null;
            const expiry = parseISO(item.expiryDate);
            if (!isValid(expiry)) return null;
            const daysUntil = differenceInDays(expiry, new Date());
            if (daysUntil <= expiringSoonThresholdDays && daysUntil >= 0) {
              return {
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                daysUntilExpiry: daysUntil,
              };
            }
            return null;
          })
          .filter(item => item !== null) as SuggestDiscountedDishesInput['expiringIngredients'];

        if (expiringIngredientsForAI.length === 0) {
          toast({ title: "No Soon-to-Expire Items", description: "No ingredients are expiring soon enough to generate discount suggestions." });
          setAiSuggestions([]);
          return;
        }
        
        const menuDishesForAI = menu.map(dish => ({
          name: dish.name,
          ingredients: Array.isArray(dish.ingredients) 
            ? dish.ingredients
                .filter(ing => typeof ing === 'object' && ing !== null)
                .map(ing => {
                  const ingredient = ing as IngredientQuantity;
                  return {
                    name: ingredient.inventoryItemName,
                    quantityPerDish: ingredient.quantityPerDish,
                    unit: ingredient.unit,
                  };
                })
            : [],
        }));

        const input: SuggestDiscountedDishesInput = {
          expiringIngredients: expiringIngredientsForAI,
          menuDishes: menuDishesForAI,
        };
        
        const result: SuggestDiscountedDishesOutput = await suggestDiscountedDishes(input);
        
        if (result && result.suggestions) {
          setAiSuggestions(result.suggestions);
          toast({ title: "AI Suggestions Generated!", description: "Discount ideas are ready." });
        } else {
          throw new Error("AI did not return valid suggestions.");
        }
      } catch (error) {
        console.error("Error generating AI discount suggestions:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ title: "Suggestion Failed", description: errorMessage, variant: "destructive" });
        setAiSuggestions(null);
      }
    });
  };

  const criticalAlertCount = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;
  const warningAlertCount = alerts.filter(a => a.severity === 'warning' && !a.acknowledged).length;
  const totalAlertCount = criticalAlertCount + warningAlertCount;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'expiry':
        return <AlertTriangle className="h-5 w-5 mt-0.5" />;
      case 'low_stock':
        return <ShoppingBasket className="h-5 w-5 mt-0.5" />;
      case 'out_of_stock':
        return <X className="h-5 w-5 mt-0.5" />;
      default:
        return <AlertTriangle className="h-5 w-5 mt-0.5" />;
    }
  };

  const getAlertColor = (severity: string) => {
    return severity === 'critical' 
      ? 'bg-destructive/10 border-destructive text-destructive' 
      : 'bg-yellow-400/10 border-yellow-500 text-yellow-700 dark:text-yellow-400';
  };

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalAlertCount > 0 && (
            <Badge
              variant={criticalAlertCount > 0 ? "destructive" : "default"}
              className="absolute -top-1 -right-1 h-4 w-4 min-w-4 p-0 flex items-center justify-center text-xs rounded-full"
            >
              {totalAlertCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        <div className="p-4 flex justify-between items-center">
          <h3 className="font-medium text-lg">Notifications</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadAlerts}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Utensils className="h-4 w-4" />
            )}
          </Button>
        </div>
        <ScrollArea className="h-[300px] sm:h-[400px]">
          <div className="p-4 space-y-3">
            {alerts.length === 0 && !isGeneratingSuggestions && (!aiSuggestions || aiSuggestions.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No active alerts or suggestions.</p>
            )}
            
            {alerts.map(alert => (
              <div key={alert.id} className={`p-3 rounded-md border ${getAlertColor(alert.severity)}`}>
                <div className="flex items-start gap-2">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{alert.itemName}</p>
                    <p className="text-xs">{alert.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {format(new Date(alert.timestamp), "MMM dd, HH:mm")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                    className="h-6 w-6 p-0"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Separator className="my-4" />

            <div>
              <h4 className="font-medium text-md mb-2 flex items-center">
                <Tag className="mr-2 h-5 w-5 text-primary"/>
                Discount Suggestions
              </h4>
              {!currentUser ? (
                <p className="text-sm text-muted-foreground">Log in to get suggestions.</p>
              ) : (
                <Button onClick={handleGetAISuggestions} disabled={isGeneratingSuggestions} className="w-full text-sm">
                  {isGeneratingSuggestions ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Generate AI Discount Ideas
                </Button>
              )}

              {isGeneratingSuggestions && (
                <div className="flex justify-center items-center h-20">
                   <Loader2 className="h-6 w-6 animate-spin text-primary" />
                   <p className="ml-2 text-sm text-muted-foreground">AI is thinking...</p>
                 </div>
              )}

              {aiSuggestions && aiSuggestions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {aiSuggestions.map((suggestion, index) => (
                    <div key={index} className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                      <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                        {suggestion.dishName}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        {suggestion.reason}
                      </p>
                      {suggestion.suggestedDiscountPercentage && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Suggested discount: {suggestion.suggestedDiscountPercentage}%
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

    