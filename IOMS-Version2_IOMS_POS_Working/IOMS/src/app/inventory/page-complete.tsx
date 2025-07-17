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
  
  // 🎓 Auto-hide "New to inventory" section after 5 seconds
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

  // ✅ REQUIREMENT 1: Auto-hide new user guide after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNewUserGuide(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Load inventory and notifications
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

  // 🤖 Smart SAM Chatbot Functions
  const sendMessageToSAM = () => {
    if (!currentMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      message: currentMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    
    // Generate SAM's response
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
  };

  const generateSAMResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();
    
    // Storage and temperature questions
    if (msg.includes('storage') || msg.includes('store') || msg.includes('temperature') || msg.includes('temp')) {
      if (msg.includes('meat') || msg.includes('chicken') || msg.includes('beef') || msg.includes('fish')) {
        return "🥩 For meat & seafood: Store at 32°F (0°C) or below. Keep on bottom shelf to prevent dripping. Use FIFO rotation and check dates daily. Fresh meat should be used within 1-3 days.";
      } else if (msg.includes('dairy') || msg.includes('milk') || msg.includes('cheese')) {
        return "🥛 For dairy products: Maintain 32-40°F (0-4°C). Store milk on middle/bottom shelves (door is too warm). Check expiry dates regularly. Hard cheeses last longer than soft ones.";
      } else if (msg.includes('vegetable') || msg.includes('fruit')) {
        return "🥬 For fresh produce: Most vegetables need refrigeration (32-40°F). Some fruits ripen better at room temp first. Keep ethylene producers (bananas, apples) separate. Check daily for spoilage.";
      } else {
        return "🌡️ Storage depends on the food type! Refrigerated items: 32-40°F, Frozen: 0°F (-18°C), Pantry: cool & dry. What specific item do you need storage info for?";
      }
    }
    
    // Expiry and shelf life questions
    if (msg.includes('expiry') || msg.includes('expire') || msg.includes('shelf life') || msg.includes('fresh')) {
      return "📅 I predict expiry dates automatically! Fresh meat: 1-3 days, Dairy: 5-7 days, Fresh produce: 3-7 days, Frozen items: 3-6 months. Always check for signs of spoilage regardless of dates.";
    }
    
    // Inventory management questions
    if (msg.includes('add item') || msg.includes('new item') || msg.includes('add inventory')) {
      return "➕ To add items: Click 'Add New Item' button, fill in details (I'll auto-suggest categories!), or upload a CSV file and I'll intelligently process it. Want me to guide you through it?";
    }
    
    if (msg.includes('csv') || msg.includes('upload') || msg.includes('import')) {
      return "📊 For CSV upload: Click 'Upload CSV', select your file (any format works!), I'll analyze and map fields automatically. I can detect categories, standardize units, and predict expiry dates. Try it!";
    }
    
    // Categories questions
    if (msg.includes('categor') || msg.includes('type') || msg.includes('classify')) {
      return "🏷️ I use 11 professional categories: Fresh Vegetables, Fresh Fruits, Meat & Seafood, Plant Proteins, Dairy, Grains & Cereals, Cooking Oils, Herbs & Spices, Frozen Foods, Beverages, and Baking Essentials. I auto-detect these when you add items!";
    }
    
    // Stock management
    if (msg.includes('stock') || msg.includes('quantity') || msg.includes('alert') || msg.includes('low')) {
      return "📊 Stock management: Set low stock thresholds for each item. I'll show color-coded alerts: 🔴 Red = critical/expired, 🟡 Yellow = low stock/expiring soon, 🟢 Green = all good. Check the progress bars for stock levels!";
    }
    
    // Search and navigation
    if (msg.includes('search') || msg.includes('find')) {
      return "🔍 To search: Use the search bar (supports voice search with the mic button!), filter by categories, or look for color-coded alerts. You can search by item name or category. Try saying 'search for tomatoes'!";
    }
    
    // Voice commands
    if (msg.includes('voice') || msg.includes('mic') || msg.includes('speak')) {
      return "🎤 Voice search: Click the microphone icon next to the search bar and speak your search term. I'll automatically search for what you say. Works great for hands-free searching while cooking!";
    }
    
    // FIFO and rotation
    if (msg.includes('fifo') || msg.includes('rotation') || msg.includes('first in')) {
      return "🔄 FIFO (First In, First Out): Always use older items first! I sort by expiry dates and show alerts. For perishables like meat and dairy, this prevents waste and ensures food safety.";
    }
    
    // Food safety
    if (msg.includes('safe') || msg.includes('spoil') || msg.includes('bad')) {
      return "🛡️ Food safety tips: Check temperatures regularly, follow FIFO rotation, watch for spoilage signs (smell, texture, color), and trust your senses. When in doubt, throw it out! I help track all this automatically.";
    }
    
    // Units and measurements
    if (msg.includes('unit') || msg.includes('measure') || msg.includes('convert')) {
      return "📏 I standardize units automatically! I convert to: kg (weight), liters (volume), pieces (count). When you upload CSV, I'll detect and convert different units like lbs→kg, ml→l, etc.";
    }
    
    // Getting started
    if (msg.includes('help') || msg.includes('start') || msg.includes('how') || msg.includes('tutorial')) {
      return "🎓 Getting started: 1) Add items manually or upload CSV, 2) I'll categorize and set storage recommendations, 3) Monitor color-coded alerts, 4) Use tooltips (hover over items) for detailed info. What specifically would you like help with?";
    }
    
    // Greetings
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      return "👋 Hello! I'm Smart SAM, your IOMS assistant! I can help with inventory management, storage guidelines, expiry tracking, CSV imports, food categorization, stock alerts, and best practices. What can I help you with today?";
    }
    
    // Default response
    return "🤖 I'm here to help with your IOMS system! I can assist with storage temperatures, expiry dates, inventory management, CSV uploads, food categorization, stock alerts, and best practices. Could you be more specific about what you need help with?";
  };

  // Inventory Management Functions
  const handleRefresh = () => {
    loadInventoryAndNotify(false);
  };

  const handleAddNewItem = () => {
    setIsAddDialogOpen(true);
    setAddFormState({
      name: '',
      quantity: 0,
      unit: '',
      category: 'Pantry',
      lowStockThreshold: 5,
      expiryDate: '',
      image: '',
      aiHint: ''
    });
  };

  const handleAddSubmit = () => {
    if (!currentUser) {
      toast({ title: "Error", description: "User not logged in.", variant: "destructive" });
      return;
    }

    if (!addFormState.name || !addFormState.unit || addFormState.quantity === undefined || addFormState.quantity < 0) {
      toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    try {
      const newItem = addInventoryItem(currentUser.id, {
        name: addFormState.name,
        quantity: addFormState.quantity || 0,
        unit: addFormState.unit,
        category: addFormState.category || 'Pantry',
        lowStockThreshold: addFormState.lowStockThreshold || 5,
        expiryDate: addFormState.expiryDate,
        image: addFormState.image,
        aiHint: addFormState.aiHint
      });

      if (newItem) {
        toast({ title: "Success", description: `Added "${newItem.name}" to inventory.` });
        loadInventoryAndNotify(false);
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to add item.", 
        variant: "destructive" 
      });
    }
  };

  const handleClearInventory = () => {
    if (!currentUser) {
      toast({ title: "Error", description: "User not logged in.", variant: "destructive" });
      return;
    }
    
    if (confirm(`⚠️ WARNING: This will permanently delete ALL inventory items for your account.\n\nThis action cannot be undone. Are you absolutely sure you want to clear the entire inventory?`)) {
      const success = clearAllInventory(currentUser.id);
      if (success) {
        toast({ 
          title: "Inventory Cleared", 
          description: "All inventory items have been permanently deleted.",
          variant: "destructive" 
        });
        loadInventoryAndNotify(false);
      } else {
        toast({ 
          title: "Error", 
          description: "Failed to clear inventory. Please try again.", 
          variant: "destructive" 
        });
      }
    }
  };

  const handleOpenEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setEditFormState({ ...item }); 
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!currentUser || !editingItem || !editFormState) return;

    const quantity = parseFloat(String(editFormState.quantity));
    const lowStockThreshold = parseFloat(String(editFormState.lowStockThreshold));
    const quantityUsed = parseFloat(String(editFormState.quantityUsed || 0));

    if (isNaN(quantity) || isNaN(lowStockThreshold) || isNaN(quantityUsed)) {
        toast({ title: "Error", description: "Quantity, threshold, and used quantity must be valid numbers.", variant: "destructive" });
        return;
    }
    
    const updatedDetails: Partial<InventoryItem> = {
      ...editFormState,
      quantity,
      lowStockThreshold,
      quantityUsed,
      aiHint: editFormState.aiHint || undefined,
      expiryDate: editFormState.expiryDate ? editFormState.expiryDate : undefined,
    };
    
    const result = updateInventoryItem(currentUser.id, editingItem.id, updatedDetails);
    if (result) {
      toast({ title: "Success", description: `${result.name} updated successfully.` });
      loadInventoryAndNotify(false); 
    } else {
      toast({ title: "Error", description: "Failed to update item.", variant: "destructive" });
    }
    setIsEditDialogOpen(false);
    setEditingItem(null);
  };
  
  const handleDeleteItem = (itemId: string, itemName: string) => {
    if (!currentUser) return;
    if (confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
      const success = removeInventoryItem(currentUser.id, itemId);
      if (success) {
        toast({ title: "Item Deleted", description: `"${itemName}" has been removed from inventory.` });
        loadInventoryAndNotify(false);
      } else {
        toast({ title: "Error", description: `Failed to delete "${itemName}".`, variant: "destructive" });
      }
    }
  };

  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "number" || name === "quantity" || name === "lowStockThreshold" || name === "quantityUsed") {
      const numValue = parseFloat(value);
      setEditFormState(prev => ({ ...prev, [name]: isNaN(numValue) ? 0 : numValue }));
    } else {
      setEditFormState(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    setEditFormState(prev => ({ ...prev, expiryDate: date ? date.toISOString().split('T')[0] : undefined }));
  };

  // CSV Template and Upload Functions
  const handleDownloadTemplate = () => {
    const csvContent = `${CSV_TEMPLATE_HEADERS}\n${CSV_TEMPLATE_EXAMPLE_ROW}\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "inventory_template.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    toast({title: "Template Downloading", description: "inventory_template.csv should start downloading."})
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) {
        toast({ title: "Error", description: "Please log in to import inventory.", variant: "destructive" });
        return;
    }
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        toast({ title: "Error", description: "Could not read file content.", variant: "destructive"});
        return;
      }
      
      // 🧠 SMART CSV ANALYSIS
      try {
        console.log('🧠 Starting smart CSV analysis...');
        const analysis = analyzeCSV(text, 'inventory');
        
        if (analysis.confidence < 0.3) {
          toast({ 
            title: "🤔 CSV Format Not Recognized", 
            description: "I'll help you map the fields manually. Please check the mapping dialog.", 
            variant: "destructive" 
          });
        } else {
          toast({ 
            title: "🧠 Smart CSV Analysis Complete", 
            description: `Detected format with ${(analysis.confidence * 100).toFixed(0)}% confidence. Review mappings before import.`,
            duration: 5000
          });
        }
        
        // Store analysis results and show mapping dialog
        setCsvAnalysis(analysis);
        setCsvContent(text);
        
        // Pre-populate mappings from analysis
        const initialMappings: Record<string, string> = {};
        analysis.suggestedMappings.forEach(mapping => {
          initialMappings[mapping.originalName] = mapping.suggestedMapping;
        });
        setFieldMappings(initialMappings);
        
        setShowMappingDialog(true);
        
      } catch (error: any) {
        console.error('❌ CSV analysis failed:', error);
        toast({ 
          title: "❌ CSV Analysis Failed", 
          description: error.message || "Could not analyze CSV format. Please check file format.",
          variant: "destructive" 
        });
      }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };

  // 🧠 SMART CSV CONVERTER FUNCTIONS
  const handleConfirmMapping = async () => {
    if (!csvAnalysis || !csvContent || !currentUser) return;
    
    setIsConverting(true);
    try {
      console.log('🔄 Converting CSV with mappings:', fieldMappings);
      
      const conversionResult = convertCSV(csvContent, fieldMappings, 'inventory');
      
      if (!conversionResult.success) {
        throw new Error('Conversion failed');
      }
      
      // Convert to system format and import
      const itemsToProcess: ProcessedCSVItem[] = conversionResult.convertedData.map(item => ({
        name: item.Name || 'Unknown Item',
        quantity: parseFloat(item.Quantity) || 0,
        unit: item.Unit || 'pcs',
        category: item.Category || 'General',
        lowStockThreshold: parseFloat(item.LowStockThreshold) || 10,
        expiryDate: item['ExpiryDate (YYYY-MM-DD)'] || undefined,
        imageURL: item.ImageURL || undefined,
        aiHint: item.SmartSuggestions || undefined
      }));
      
      // Import the converted data
      const result = batchAddOrUpdateInventoryItems(currentUser.id, itemsToProcess);
      
      // Show results with intelligence summary
      const totalIntelligence = Object.values(conversionResult.intelligenceApplied).reduce((a, b) => a + b, 0);
      toast({ 
        title: "🎉 Smart Import Successful!", 
        description: `Imported ${result.added + result.updated} items (${result.added} new, ${result.updated} updated). Applied ${totalIntelligence} smart enhancements!`,
        duration: 8000
      });
      
      if (conversionResult.warnings.length > 0) {
        console.log('⚠️ Import warnings:', conversionResult.warnings);
        toast({
          title: "⚠️ Import Warnings",
          description: `${conversionResult.warnings.length} warnings detected. Check console for details.`,
          variant: "default"
        });
      }
      
      // Refresh inventory and close dialogs
      loadInventoryAndNotify(false);
      setShowMappingDialog(false);
      setCsvAnalysis(null);
      setCsvContent('');
      setFieldMappings({});
      
    } catch (error: any) {
      console.error('❌ Smart import failed:', error);
      toast({
        title: "❌ Import Failed",
        description: error.message || "Failed to import CSV. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsConverting(false);
    }
  };
  
  const handleMappingChange = (originalField: string, targetField: string) => {
    setFieldMappings(prev => ({
      ...prev,
      [originalField]: targetField
    }));
  };
  
  const downloadSmartTemplate = () => {
    const templateContent = generateTemplateCSV('inventory');
    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'inventory_smart_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast({title: "📥 Smart Template Downloaded", description: "Use this template for guaranteed compatibility!"});
  };

  // Filter inventory based on search
  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <TooltipProvider>
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          
          {/* ✅ REQUIREMENT 1: Auto-hide "New to inventory" guide after 5 seconds */}
          {showNewUserGuide && (
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg btn-3d">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg text-blue-800">New to Inventory Management?</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewUserGuide(false)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-blue-700">
                  🎓 <strong>Quick Start:</strong> Add items manually, upload CSV files, or use voice search. 
                  Smart SAM will help with storage recommendations and expiry tracking!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="flex items-center space-x-2 text-blue-600">
                    <PlusCircle className="h-4 w-4" />
                    <span>Click "Add New Item" to start</span>
                  </div>
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Upload className="h-4 w-4" />
                    <span>Upload CSV for bulk import</span>
                  </div>
                  <div className="flex items-center space-x-2 text-blue-600">
                    <MessageCircle className="h-4 w-4" />
                    <span>Chat with Smart SAM for help</span>
                  </div>
                </div>
                <div className="text-xs text-blue-500 mt-2">
                  💡 This guide will disappear automatically in 5 seconds, or click X to close now.
                </div>
              </CardContent>
            </Card>
          )}

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-gray-600 mt-1">Track stock levels, expiry dates, and storage recommendations</p>
            </div>
            
            {/* ✅ REQUIREMENT 5: Streamlined Quick Access - only Chat with SAM and Upload CSV */}
            <div className="flex items-center space-x-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setShowChatbot(true)}
                    className="btn-3d bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat with SAM
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Get help from Smart SAM assistant</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-3d bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Upload CSV file with smart mapping</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Search and Voice Controls */}
          <Card className="shadow-lg card-3d">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Input
                      placeholder="Search inventory items or categories..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-4 pr-12"
                    />
                    {voiceSupported && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
                        onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                        disabled={isProcessingVoice}
                      >
                        {isListening ? (
                          <MicOff className="h-4 w-4 text-red-500" />
                        ) : (
                          <Mic className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {/* Voice feedback */}
                  {(isListening || isProcessingVoice || voiceTranscript) && (
                    <div className="mt-2 text-sm">
                      {isListening && (
                        <span className="text-blue-600">🎤 Listening... Speak now!</span>
                      )}
                      {isProcessingVoice && (
                        <span className="text-green-600">✅ Processing: "{voiceTranscript}"</span>
                      )}
                      {liveTranscript && (
                        <span className="text-gray-500">Live: {liveTranscript}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleRefresh} variant="outline" className="btn-3d">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button onClick={handleAddNewItem} className="btn-3d bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add New Item
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="card-3d">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Items</p>
                    <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-lg">📦</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-3d">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Low Stock</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {inventory.filter(item => getStockLevel(item) === 'low').length}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 text-lg">⚠️</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-3d">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Critical Stock</p>
                    <p className="text-2xl font-bold text-red-600">
                      {inventory.filter(item => getStockLevel(item) === 'critical').length}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 text-lg">🚨</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-3d">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {inventory.filter(item => {
                        const expiry = getExpiryStatus(item.expiryDate);
                        return expiry.status === 'soon' || expiry.status === 'expired';
                      }).length}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 text-lg">⏰</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Inventory Table */}
          <Card className="shadow-lg card-3d">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Inventory Items ({filteredInventory.length})</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleDownloadTemplate}
                    variant="outline"
                    size="sm"
                    className="btn-3d"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Template
                  </Button>
                  <Button
                    onClick={handleClearInventory}
                    variant="destructive"
                    size="sm"
                    className="btn-3d"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading inventory...</span>
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📦</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? `No items match "${searchTerm}"` : "Start by adding your first inventory item or uploading a CSV file"}
                  </p>
                  <Button onClick={handleAddNewItem} className="btn-3d">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add First Item
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Image</TableHead>
                        <TableHead>Item Details</TableHead>
                        <TableHead>Stock Level</TableHead>
                        <TableHead>✅ Storage Info</TableHead>
                        <TableHead>Expiry Status</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.map((item) => {
                        const stockLevel = getStockLevel(item);
                        const progressValue = calculateProgressValue(item);
                        const expiryStatus = getExpiryStatus(item.expiryDate);
                        const storageInfo = getSmartStorageInfo(item);

                        return (
                          <TableRow key={item.id} className="hover:bg-gray-50/50">
                            {/* Item Image */}
                            <TableCell>
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                {item.image ? (
                                  <Image 
                                    src={item.image} 
                                    alt={item.name}
                                    width={40}
                                    height={40}
                                    className="object-cover"
                                  />
                                ) : (
                                  <span className="text-gray-400 text-xs">No img</span>
                                )}
                              </div>
                            </TableCell>

                            {/* Item Details */}
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium text-gray-900">{item.name}</div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {item.category}
                                  </Badge>
                                  <span className="text-sm text-gray-600">
                                    {formatNumber(item.quantity)} {item.unit}
                                  </span>
                                </div>
                                {item.aiHint && (
                                  <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    💡 {item.aiHint}
                                  </div>
                                )}
                              </div>
                            </TableCell>

                            {/* Stock Level */}
                            <TableCell>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">
                                    {formatNumber(item.quantity)} / {formatNumber(item.lowStockThreshold)} min
                                  </span>
                                  <Badge
                                    variant={
                                      stockLevel === 'critical' ? 'destructive' :
                                      stockLevel === 'low' ? 'default' :
                                      stockLevel === 'medium' ? 'secondary' : 'outline'
                                    }
                                    className={`text-xs ${
                                      stockLevel === 'high' ? 'bg-green-100 text-green-800' : ''
                                    }`}
                                  >
                                    {stockLevel.toUpperCase()}
                                  </Badge>
                                </div>
                                <Progress 
                                  value={progressValue} 
                                  className={`h-2 ${
                                    stockLevel === 'critical' ? 'bg-red-100' :
                                    stockLevel === 'low' ? 'bg-orange-100' :
                                    stockLevel === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                                  }`}
                                />
                              </div>
                            </TableCell>

                            {/* ✅ REQUIREMENT 6: Enhanced Storage Recommendations */}
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="space-y-1 cursor-help">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-lg">{storageInfo.icon}</span>
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs font-medium ${
                                          storageInfo.type === 'cold' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                                          storageInfo.type === 'frozen' ? 'border-purple-200 bg-purple-50 text-purple-700' :
                                          storageInfo.type === 'room' ? 'border-green-200 bg-green-50 text-green-700' :
                                          'border-orange-200 bg-orange-50 text-orange-700'
                                        }`}
                                      >
                                        {storageInfo.storage}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-gray-600 font-medium">
                                      {storageInfo.temperature.split(':')[1]?.trim() || 'See tooltip'}
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs p-3">
                                  <div className="space-y-2">
                                    <div className="font-medium text-sm">{storageInfo.temperature}</div>
                                    <div className="text-xs text-gray-600">{storageInfo.tips}</div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>

                            {/* Expiry Status */}
                            <TableCell>
                              {expiryStatus.status === 'none' ? (
                                <Badge variant="outline" className="text-xs">No expiry set</Badge>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="space-y-1 cursor-help">
                                      <Badge
                                        variant={
                                          expiryStatus.status === 'expired' ? 'destructive' :
                                          expiryStatus.status === 'soon' ? 'default' : 'outline'
                                        }
                                        className={`text-xs ${
                                          expiryStatus.status === 'ok' ? 'bg-green-100 text-green-800' : ''
                                        }`}
                                      >
                                        {expiryStatus.status === 'expired' ? '❌ EXPIRED' :
                                         expiryStatus.status === 'soon' ? '⚠️ EXPIRES SOON' : '✅ FRESH'}
                                      </Badge>
                                      {expiryStatus.days !== undefined && (
                                        <div className="text-xs text-gray-600">
                                          {expiryStatus.days < 0 ? 
                                            `${Math.abs(expiryStatus.days)} days ago` :
                                            `${expiryStatus.days} days left`
                                          }
                                        </div>
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Expires: {expiryStatus.formattedDate}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </TableCell>

                            {/* Actions */}
                            <TableCell>
                              <div className="flex space-x-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleOpenEditDialog(item)}
                                      className="p-2"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit item</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteItem(item.id, item.name)}
                                      className="p-2 text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete item</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hidden file input for CSV upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.txt"
            style={{ display: 'none' }}
          />

          {/* Continue with dialogs in next batch... */}
          
        </div>
      </TooltipProvider>
    </AppLayout>
  );
}
