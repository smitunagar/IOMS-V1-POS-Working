"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { PlusCircle, RefreshCw, Pencil, Trash2, AlertTriangle, Upload, Download, X, Mic, MicOff, MessageCircle, Send, Bell, Lightbulb } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from '@/hooks/use-toast';
import { getInventory, updateInventoryItem, removeInventoryItem, addInventoryItem, clearAllInventory, InventoryItem, batchAddOrUpdateInventoryItems, ProcessedCSVItem } from '@/lib/inventoryService'; 
import { analyzeCSV, convertCSV, generateTemplateCSV, CSVAnalysis, CSVField } from '@/lib/smartCSVConverter';
import { SmartSAMService, ChatMessage } from '@/lib/smartSAMService';
import { useAuth } from '@/contexts/AuthContext';
import { format, differenceInDays, parseISO, isValid, parse as parseDateFns } from 'date-fns';

const defaultCategories = ["Pantry", "Produce", "Dairy", "Meat", "Seafood", "Frozen", "Beverages", "Spices", "Other"];

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showNewUserGuide, setShowNewUserGuide] = useState(true);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Auto-hide new user guide after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNewUserGuide(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const loadInventoryAndNotify = useCallback((showToasts = true) => {
    if (!currentUser) {
      setIsLoading(false);
      setInventory([]);
      return;
    }
    setIsLoading(true);
    const currentInventory = getInventory(currentUser.id);
    setInventory(currentInventory);
    setIsLoading(false);
  }, [currentUser, toast]);

  useEffect(() => {
    loadInventoryAndNotify();
  }, [loadInventoryAndNotify]);

  // Helper functions
  const getStockLevel = (item: InventoryItem): 'critical' | 'low' | 'medium' | 'high' => {
    const threshold = item.lowStockThreshold || 5;
    const current = item.quantity || 0;
    
    if (current === 0) return 'critical';
    if (current <= threshold * 0.5) return 'critical';
    if (current <= threshold) return 'low';
    if (current <= threshold * 2) return 'medium';
    return 'high';
  };

  const getSmartStorageInfo = (item: InventoryItem) => {
    const category = item.category?.toLowerCase() || '';
    const name = item.name?.toLowerCase() || '';
    
    if (category.includes('meat') || name.includes('chicken') || name.includes('beef')) {
      return {
        temperature: '🧊 Cold Storage: 0-4°C (32-40°F)',
        tips: 'Store in refrigerator. Use within 1-2 days for fresh meat.',
        type: 'cold',
        icon: '🧊'
      };
    }
    
    if (category.includes('dairy') || name.includes('milk') || name.includes('cheese')) {
      return {
        temperature: '🧊 Cold Storage: 1-4°C (34-40°F)',
        tips: 'Keep refrigerated at all times. Check expiry dates regularly.',
        type: 'cold',
        icon: '🧊'
      };
    }
    
    if (category.includes('frozen')) {
      return {
        temperature: '❄️ Freezer Storage: -18°C (0°F) or below',
        tips: 'Keep frozen until ready to use.',
        type: 'frozen',
        icon: '❄️'
      };
    }
    
    if (category.includes('produce') || name.includes('tomato')) {
      return {
        temperature: '🧊 Cool Storage: 7-10°C (45-50°F)',
        tips: 'Store in refrigerator crisper drawer.',
        type: 'cool',
        icon: '🧊'
      };
    }
    
    return {
      temperature: '🌡️ Room Temperature: 18-24°C (65-75°F)',
      tips: 'Store in cool, dry place away from direct sunlight.',
      type: 'room',
      icon: '🌡️'
    };
  };

  const formatNumber = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefresh = () => {
    loadInventoryAndNotify(true);
  };

  const handleClearInventory = () => {
    if (!currentUser || inventory.length === 0) return;
    
    if (window.confirm('⚠️ Are you sure you want to clear all inventory items? This action cannot be undone.')) {
      clearAllInventory(currentUser.id);
      setInventory([]);
      toast({
        title: "✅ Inventory Cleared",
        description: "All inventory items have been removed.",
      });
    }
  };

  return (
    <TooltipProvider>
      <AppLayout pageTitle="Inventory Management">
        <Card className="shadow-2xl border-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-sm transform transition-all duration-300 hover:shadow-3xl">
          <CardHeader className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-t-lg">
            {/* Auto-hide guidance section */}
            {showNewUserGuide && (
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 mb-6 shadow-lg transform transition-all duration-500 hover:shadow-xl hover:scale-[1.02]">
                <div className="flex items-start gap-4">
                  <div className="text-blue-600 text-2xl animate-bounce">🎓</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-blue-900 text-lg">New to Inventory Management? Here's how to get started:</h3>
                      <Button
                        onClick={() => setShowNewUserGuide(false)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-100"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-blue-200 shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                        <div className="font-bold text-blue-800 mb-2 flex items-center">
                          <span className="text-lg mr-2">📥</span>
                          Step 1: Add Items
                        </div>
                        <p className="text-blue-700">Click "Add New Item" or upload a CSV file. Our smart system will help categorize and set up storage recommendations automatically.</p>
                      </div>
                      <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-blue-200 shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                        <div className="font-bold text-blue-800 mb-2 flex items-center">
                          <span className="text-lg mr-2">🏷️</span>
                          Step 2: Learn Storage
                        </div>
                        <p className="text-blue-700">Hover over item names and categories to see detailed storage instructions, temperature requirements, and helpful tips.</p>
                      </div>
                      <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-blue-200 shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                        <div className="font-bold text-blue-800 mb-2 flex items-center">
                          <span className="text-lg mr-2">📊</span>
                          Step 3: Monitor Alerts
                        </div>
                        <p className="text-blue-700">Watch for color-coded alerts: Red = urgent attention needed, Yellow = expiring soon, Green = all good!</p>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-blue-600 flex items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-2"></div>
                      This guide will auto-hide in a few seconds...
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Current Stock Levels</CardTitle>
                <CardDescription>View, manage, and get alerts for your inventory. Data is stored locally per user.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleRefresh} disabled={isLoading || !currentUser} className="shadow-md hover:shadow-lg transition-all duration-300">
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button 
                  onClick={handleClearInventory} 
                  disabled={!currentUser || filteredInventory.length === 0} 
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Clear Inventory
                </Button>
              </div>
            </div>
            
            <div className="mt-4">
              <Input
                type="search"
                placeholder="Search ingredients or categories..."
                className="w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={!currentUser}
              />
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading && currentUser ? (
              <div className="flex justify-center items-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading inventory...</p>
              </div>
            ) : !currentUser ? (
              <p className="text-center text-muted-foreground py-8">Please log in to view inventory.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableCaption>A list of your current inventory items. Last updated: {new Date().toLocaleTimeString()}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead className="min-w-[150px]">Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Stock Level</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map((item) => {
                      const stockStatus = getStockLevel(item);
                      
                      let rowClass = "";
                      if (stockStatus === 'critical') rowClass = 'bg-destructive/20 hover:bg-destructive/30';
                      else if (stockStatus === 'low') rowClass = 'bg-yellow-400/20 hover:bg-yellow-400/30';

                      return (
                        <TableRow key={item.id} className={rowClass}>
                          <TableCell>
                            <Image
                              src={item.image || "https://placehold.co/60x60.png"}
                              alt={item.name}
                              width={40}
                              height={40}
                              className="rounded object-cover"
                              onError={(e) => (e.currentTarget.src = "https://placehold.co/60x60.png")}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  {item.name}
                                  {(() => {
                                    const smartStorage = getSmartStorageInfo(item);
                                    return (
                                      <div className="text-xs text-muted-foreground mt-1 flex items-center">
                                        <span className="mr-1">{smartStorage.icon}</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          smartStorage.type === 'cold' || smartStorage.type === 'frozen' ? 'bg-blue-100 text-blue-800' :
                                          smartStorage.type === 'cool' ? 'bg-cyan-100 text-cyan-800' :
                                          'bg-orange-100 text-orange-800'
                                        }`}>
                                          {smartStorage.type === 'cold' ? 'Cold Storage' :
                                           smartStorage.type === 'frozen' ? 'Frozen' :
                                           smartStorage.type === 'cool' ? 'Cool Storage' :
                                           'Room Temp'}
                                        </span>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm p-4" side="right">
                                <div className="space-y-3">
                                  <div className="font-semibold text-sm flex items-center">
                                    <span className="mr-2">🏷️</span>
                                    {item.name} - Storage Guide
                                  </div>
                                  {(() => {
                                    const smartStorage = getSmartStorageInfo(item);
                                    return (
                                      <>
                                        <div className="text-xs bg-gradient-to-r from-blue-50 to-cyan-50 p-3 rounded-lg border border-blue-200">
                                          <div className="flex items-center mb-2">
                                            <span className="text-lg mr-2">{smartStorage.icon}</span>
                                            <span className="font-medium text-blue-900">Temperature Requirements</span>
                                          </div>
                                          <div className="text-blue-800">{smartStorage.temperature}</div>
                                        </div>
                                        
                                        <div className="text-xs bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                                          <div className="flex items-center mb-2">
                                            <span className="text-lg mr-2">💡</span>
                                            <span className="font-medium text-green-900">Storage Tips</span>
                                          </div>
                                          <div className="text-green-800">{smartStorage.tips}</div>
                                        </div>

                                        <div className="text-xs text-muted-foreground border-t pt-2 mt-2 bg-gray-50 p-2 rounded">
                                          <span className="font-medium">📦 Category:</span> {item.category}
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.category}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatNumber(item.quantity)}
                          </TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>
                            <Badge variant={
                              stockStatus === 'critical' ? 'destructive' :
                              stockStatus === 'low' ? 'default' :
                              stockStatus === 'medium' ? 'secondary' : 'outline'
                            }>
                              {stockStatus === 'critical' ? '🔴 Critical' :
                               stockStatus === 'low' ? '🟡 Low' :
                               stockStatus === 'medium' ? '🟠 Medium' : '🟢 High'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (window.confirm(`Delete ${item.name}?`)) {
                                  removeInventoryItem(currentUser!.id, item.id);
                                  loadInventoryAndNotify(false);
                                  toast({
                                    title: "Item Deleted",
                                    description: `${item.name} has been removed from inventory.`,
                                  });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {filteredInventory.length === 0 && !isLoading && currentUser && (
              <p className="text-center text-muted-foreground py-8">No items match your search, or inventory is empty.</p>
            )}
          </CardContent>
        </Card>
      </AppLayout>
    </TooltipProvider>
  );
}
