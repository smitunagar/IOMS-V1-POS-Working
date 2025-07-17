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
const CSV_TEMPLATE_HEADERS = "Name,Quantity,Unit,Category,LowStockThreshold,ExpiryDate (YYYY-MM-DD),ImageURL,SmartSuggestions";
const CSV_TEMPLATE_EXAMPLE_ROW = "Example Tomato,10,kg,Produce,2,2024-12-31,https://placehold.co/60x60.png,fresh tomato";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // 🔢 Helper function to format numbers cleanly
  const formatNumber = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    // Remove unnecessary decimals (5.00 -> 5, but keep 5.50 -> 5.5)
    return num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
  };

  // 🎤 Voice Search States
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [isRealTimeListening, setIsRealTimeListening] = useState(false);
  const [showTranscriptBar, setShowTranscriptBar] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // 🤖 Smart SAM Chatbot States
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(SmartSAMService.getWelcomeMessages());
  const [currentMessage, setCurrentMessage] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasNewSuggestion, setHasNewSuggestion] = useState(true);
  
  // 🎤 Smart SAM Voice Assistant States
  const [isSamListening, setIsSamListening] = useState(false);
  const [samVoiceSupported, setSamVoiceSupported] = useState(false);
  const [samRecognition, setSamRecognition] = useState<any>(null);
  const [samLiveTranscript, setSamLiveTranscript] = useState('');
  const [samAudioLevel, setSamAudioLevel] = useState(0);
  const [showSamTranscript, setShowSamTranscript] = useState(false);
  
  // 🔔 Unified Notification System
  const [showUnifiedNotifications, setShowUnifiedNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // 🎓 Auto-hide "New to inventory" section
  const [showNewUserGuide, setShowNewUserGuide] = useState(true);
  
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editFormState, setEditFormState] = useState<Partial<InventoryItem>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addFormState, setAddFormState] = useState<Partial<InventoryItem>>({
    name: '',
    quantity: 0,
    unit: '',
    category: 'Pantry',
    lowStockThreshold: 5,
    expiryDate: '',
    image: '',
    aiHint: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🧠 Smart CSV Converter States
  const [csvAnalysis, setCsvAnalysis] = useState<CSVAnalysis | null>(null);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [csvContent, setCsvContent] = useState<string>('');
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [isConverting, setIsConverting] = useState(false);

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

      if (showToasts) {
        currentInventory.forEach(item => {
          const stockStatus = getStockLevel(item);
          if (stockStatus === 'critical') {
            toast({
              title: `Critical Stock Alert: ${item.name}`,
              description: `Only ${item.quantity} ${item.unit} left. This is below the critical threshold.`,
              variant: "destructive",
            });
          }

          if (item.expiryDate) {
            const expiry = parseISO(item.expiryDate);
            if (isValid(expiry)) {
              const daysUntilExpiry = differenceInDays(expiry, new Date());
              if (daysUntilExpiry <= 0) {
                toast({
                  title: `Expired Item: ${item.name}`,
                  description: `This item expired on ${format(expiry, "PPP")}. Remove or check immediately.`,
                  variant: "destructive",
                });
              } else if (daysUntilExpiry <= 3) {
                toast({
                  title: `Expiry Alert: ${item.name}`,
                  description: `Expires in ${daysUntilExpiry} day(s) on ${format(expiry, "PPP")}.`,
                  variant: "destructive",
                  action: <AlertTriangle className="h-5 w-5 text-destructive-foreground" />
                });
              }
            }
          }
        });
      }
  }, [currentUser, toast]);

  useEffect(() => {
    loadInventoryAndNotify();
  }, [loadInventoryAndNotify]);

  return (
    <AppLayout>
      <TooltipProvider>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <div className="flex gap-2">
              <Button onClick={() => setShowChatbot(!showChatbot)} variant="outline" className="btn-3d">
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat with SAM
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="btn-3d">
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV
              </Button>
            </div>
          </div>

          {/* 🎓 New User Guide - Auto-hide after 5 seconds */}
          {showNewUserGuide && (
            <Card className="border-blue-200 bg-blue-50 card-3d">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2" />
                  New to Inventory Management?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-700">
                  🎉 Welcome! Start by adding items, uploading a CSV, or chatting with Smart SAM for help.
                  This guide will auto-hide in 5 seconds.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Search and Actions */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Input
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
              <Mic className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="btn-3d">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {/* Storage Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-effect">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="text-2xl">🧊</div>
                  <div>
                    <p className="font-semibold">Cold Storage</p>
                    <p className="text-sm text-gray-600">0-4°C (32-40°F)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-effect">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="text-2xl">🌡️</div>
                  <div>
                    <p className="font-semibold">Room Temperature</p>
                    <p className="text-sm text-gray-600">18-25°C (64-77°F)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-effect">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="text-2xl">🔥</div>
                  <div>
                    <p className="font-semibold">Hot Storage</p>
                    <p className="text-sm text-gray-600">Above 60°C (140°F)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Table */}
          <Card className="card-3d">
            <CardHeader>
              <CardTitle>Current Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center p-8">Loading inventory...</div>
              ) : inventory.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  No items in inventory. Add some items to get started!
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stock Level</TableHead>
                      <TableHead>Storage</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((item) => {
                      const stockLevel = getStockLevel(item);
                      const storageInfo = getSmartStorageInfo(item);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Image
                                src={item.image || "/placeholder.svg"}
                                alt={item.name}
                                width={40}
                                height={40}
                                className="rounded"
                              />
                              <span className="font-medium">{item.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatNumber(item.quantity)} {item.unit}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${
                                stockLevel === 'critical' ? 'bg-red-500' :
                                stockLevel === 'low' ? 'bg-yellow-500' :
                                stockLevel === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                              }`}></div>
                              <span className={`text-sm ${
                                stockLevel === 'critical' ? 'text-red-600' :
                                stockLevel === 'low' ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {stockLevel}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex items-center space-x-1">
                                  <span>{storageInfo.icon}</span>
                                  <span className="text-sm">{storageInfo.type}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div>
                                  <p className="font-semibold">{storageInfo.temperature}</p>
                                  <p className="text-sm">{storageInfo.tips}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditDialog(item)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteItem(item.id, item.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Smart SAM Chatbot */}
          {showChatbot && (
            <Card className="fixed bottom-4 right-4 w-96 h-96 shadow-3xl z-50">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">🤖 Smart SAM Assistant</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChatbot(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <ScrollArea className="h-64 mb-4">
                  <div className="space-y-3">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg ${
                          msg.type === 'user'
                            ? 'bg-blue-100 ml-8'
                            : 'bg-gray-100 mr-8'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(msg.timestamp, 'HH:mm')}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Ask SAM anything..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessageToSAM()}
                  />
                  <Button onClick={sendMessageToSAM} size="sm">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            style={{ display: 'none' }}
          />
        </div>
      </TooltipProvider>
    </AppLayout>
  );

  // Helper functions
  function getStockLevel(item: InventoryItem): 'critical' | 'low' | 'medium' | 'high' {
    const threshold = item.lowStockThreshold || 5;
    const current = item.quantity || 0;
    
    if (current === 0) return 'critical';
    if (current <= threshold * 0.5) return 'critical';
    if (current <= threshold) return 'low';
    if (current <= threshold * 2) return 'medium';
    return 'high';
  }

  function getSmartStorageInfo(item: InventoryItem) {
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
        temperature: '🧊 Cold Storage: 0-4°C (32-40°F)',
        tips: 'Keep refrigerated. Check expiry dates regularly.',
        type: 'cold',
        icon: '🧊'
      };
    }
    
    if (category.includes('frozen')) {
      return {
        temperature: '❄️ Frozen: -18°C (0°F)',
        tips: 'Keep frozen until ready to use.',
        type: 'frozen',
        icon: '❄️'
      };
    }
    
    // Default room temperature
    return {
      temperature: '🌡️ Room Temperature: 18-25°C (64-77°F)',
      tips: 'Store in cool, dry place away from direct sunlight.',
      type: 'room',
      icon: '🌡️'
    };
  }

  function handleOpenEditDialog(item: InventoryItem) {
    setEditingItem(item);
    setEditFormState({ ...item });
    setIsEditDialogOpen(true);
  }

  function handleDeleteItem(itemId: string, itemName: string) {
    if (!currentUser) return;
    if (confirm(`Are you sure you want to delete "${itemName}"?`)) {
      const success = removeInventoryItem(currentUser.id, itemId);
      if (success) {
        toast({ title: "Item Deleted", description: `"${itemName}" has been removed.` });
        loadInventoryAndNotify(false);
      }
    }
  }

  function sendMessageToSAM() {
    if (!currentMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      message: currentMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    
    setTimeout(() => {
      const samResponse = generateSAMResponse(currentMessage);
      const samMessage = {
        id: (Date.now() + 1).toString(),
        type: 'sam' as const,
        message: samResponse,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, samMessage]);
    }, 1000);

    setCurrentMessage('');
  }

  function generateSAMResponse(userMessage: string): string {
    const msg = userMessage.toLowerCase();
    
    if (msg.includes('storage') || msg.includes('temperature')) {
      return "🌡️ Storage depends on the food type! Cold storage (0-4°C) for meat/dairy, room temperature (18-25°C) for pantry items, and frozen (-18°C) for frozen goods.";
    }
    
    if (msg.includes('help')) {
      return "🎓 I can help with inventory management, storage guidelines, stock alerts, and CSV imports. What would you like to know?";
    }
    
    return "🤖 I'm here to help with your inventory! Ask me about storage, stock levels, or any other inventory questions.";
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      console.log('CSV uploaded:', text);
      toast({ title: "CSV Upload", description: "CSV processing functionality will be implemented." });
    };
    reader.readAsText(file);
  }
}
