"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { Bell, AlertTriangle, ShoppingBasket, Utensils, Sparkles, Loader2, Tag } from 'lucide-react';
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
import { getInventory, InventoryItem } from '@/lib/inventoryService';
import { getDishes, Dish } from '@/lib/menuService';
import { suggestDiscountedDishes, SuggestDiscountedDishesInput, SuggestDiscountedDishesOutput } from '@/ai/flows/suggest-discounted-dishes';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';

export function NotificationBell() {
  return (
    <Button variant="ghost" size="icon" aria-label="Notifications">
      <Bell className="h-5 w-5" />
    </Button>
  );
} 