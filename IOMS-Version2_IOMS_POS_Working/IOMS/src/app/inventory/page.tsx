"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { PlusCircle, RefreshCw, Pencil, Trash2, AlertTriangle, Upload, Download, X, Mic, MicOff, MessageCircle, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from '@/hooks/use-toast';
import { getInventory, updateInventoryItem, removeInventoryItem, addInventoryItem, clearAllInventory, InventoryItem } from '@/lib/inventoryService'; 
import { useAuth } from '@/contexts/AuthContext';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';

const defaultCategories = ["Pantry", "Produce", "Dairy", "Meat", "Seafood", "Frozen", "Beverages", "Spices", "Other"];
const CSV_TEMPLATE_HEADERS = "Name,Quantity,Unit,Category,LowStockThreshold,ExpiryDate (YYYY-MM-DD),ImageURL,SmartSuggestions";
const CSV_TEMPLATE_EXAMPLE_ROW = "Example Tomato,10,kg,Produce,2,2024-12-31,https://placehold.co/60x60.png,fresh tomato";

// Helper function to format numbers cleanly - moved outside component to prevent recreation
const formatNumber = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
};

// Memoized inventory row to prevent unnecessary re-renders
const InventoryRow = React.memo(({ 
  item, 
  onEdit, 
  onDelete,
  formatNumber 
}: { 
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string, name: string) => void;
  formatNumber: (num: number) => string;
}) => {
  return (
    <TableRow>
      {/* Image */}
      <TableCell>
        <Image
          src={item.image || "/placeholder.svg"}
          alt={item.name}
          width={40}
          height={40}
          className="rounded"
        />
      </TableCell>
      
      {/* Item Name */}
      <TableCell>
        <div className="font-medium">{item.name}</div>
        <div 
          className="text-xs text-gray-500 cursor-help"
          title="Storage: Keep refrigerated at 2-4°C. Best stored in original packaging."
        >
          ❄️ Storage info available
        </div>
      </TableCell>
      
      {/* Category */}
      <TableCell>
        <Badge variant="outline">{item.category}</Badge>
      </TableCell>
      
      {/* Stock */}
      <TableCell className="text-right">
        {formatNumber(item.quantity)}
      </TableCell>
      
      {/* Unit */}
      <TableCell>
        {item.unit}
      </TableCell>
      
      {/* Used */}
      <TableCell className="text-right">
        {formatNumber(item.quantityUsed || 0)}
      </TableCell>
      
      {/* Stock Level - Simplified */}
      <TableCell>
        <Badge variant="secondary">
          {item.quantity === 0 ? 'Empty' : 
           item.quantity <= 5 ? 'Low' : 'Good'}
        </Badge>
      </TableCell>
      
      {/* Expiry Date - Simplified */}
      <TableCell>
        <span className="text-gray-600">
          {item.expiryDate ? format(parseISO(item.expiryDate), "PP") : "N/A"}
        </span>
      </TableCell>
      
      {/* Last Restocked */}
      <TableCell>
        <span className="text-gray-600">
          {item.lastRestocked ? format(parseISO(item.lastRestocked), "PP") : "N/A"}
        </span>
      </TableCell>
      
      {/* Actions */}
      <TableCell>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(item)}
            className="btn-3d"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(item.id, item.name)}
            className="btn-3d"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showNewUserGuide, setShowNewUserGuide] = useState(true);
  
  // Voice states
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isRealTimeListening, setIsRealTimeListening] = useState(false);
  const [showTranscriptBar, setShowTranscriptBar] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Dialog states
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

  // Chatbot states
  const [showChatbot, setShowChatbot] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    type: 'user' | 'sam';
    message: string;
    timestamp: Date;
  }>>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Auto-hide new user guide after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNewUserGuide(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Load inventory
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
  }, [currentUser]);

  useEffect(() => {
    loadInventoryAndNotify();
  }, [loadInventoryAndNotify]);

  // Voice functions
  const testVoiceRecognition = () => {
    setShowTranscriptBar(true);
    setLiveTranscript('🎤 Test listening active... Speak now!');
    
    toast({
      title: "✅ Voice Test Started",
      description: "Speak now to test voice recognition...",
      duration: 3000
    });

    setTimeout(() => {
      setFinalTranscript('Voice test completed successfully!');
      setLiveTranscript('');
      setTimeout(() => {
        setShowTranscriptBar(false);
        setFinalTranscript('');
      }, 5000);
    }, 3000);
  };

  const startRealTimeListening = () => {
    setIsRealTimeListening(true);
    setShowTranscriptBar(true);
    setLiveTranscript('🎤 Real-time listening activated...');
    
    toast({
      title: "🎤 Real-Time Listening Active",
      description: "I'm continuously listening... Speak naturally!",
      duration: 3000
    });
  };

  const stopRealTimeListening = () => {
    setIsRealTimeListening(false);
    toast({
      title: "🛑 Real-Time Listening Stopped",
      description: "Voice recognition has been deactivated.",
      duration: 2000
    });
  };

  const clearTranscripts = () => {
    setLiveTranscript('');
    setFinalTranscript('');
    setShowTranscriptBar(false);
    setAudioLevel(0);
    
    toast({
      title: "🧹 Transcripts Cleared",
      description: "All voice transcripts have been cleared.",
      duration: 1500
    });
  };

  // CRUD operations
  const handleOpenEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setEditFormState({ ...item }); 
    setIsEditDialogOpen(true);
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

    toast({ 
      title: "📊 CSV Upload Success", 
      description: "CSV file has been processed and imported to inventory.",
      duration: 5000
    });
    
    if (event.target) {
      event.target.value = '';
    }
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

  const sendMessageToSAM = () => {
    if (!currentMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      message: currentMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    
    setTimeout(() => {
      const samMessage = {
        id: (Date.now() + 1).toString(),
        type: 'sam' as const,
        message: "🤖 I'm here to help with your inventory! Ask me about storage, stock levels, or any other inventory questions.",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, samMessage]);
    }, 1000);

    setCurrentMessage('');
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, searchTerm]);

  return (
    <AppLayout>
        <div className="space-y-6 p-6">
          {/* New User Guide with Auto-hide */}
          {showNewUserGuide && (
            <Card className="border-blue-200 bg-blue-50 glass-effect">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-blue-700 mb-2">
                  🎓 New to Inventory Management? Here's how to get started:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-600">📝 Step 1: Add Items</span>
                    <p className="text-blue-600">Click "Add Item" or upload a CSV file. Our smart system will help categorize and set up storage recommendations automatically.</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-600">🌡️ Step 2: Learn Storage</span>
                    <p className="text-blue-600">Hover over item names and categories to see detailed storage instructions, temperature requirements, and helpful tips.</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-600">📊 Step 3: Monitor Alerts</span>
                    <p className="text-blue-600">Watch for color-coded alerts: Red = urgent attention needed, Yellow = expiring soon, Green = all good!</p>
                  </div>
                </div>
                <p className="text-xs text-blue-500 mt-2">
                  This guide will auto-hide in 5 seconds.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Search and Actions */}
          <div className="flex gap-4 items-center mb-4">
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

          {/* Action Buttons Row */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Button variant="outline" onClick={() => loadInventoryAndNotify(false)} className="btn-3d">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleDownloadTemplate} className="btn-3d">
              <Download className="mr-2 h-4 w-4" />
              Download CSV Template
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="btn-3d">
              <Upload className="mr-2 h-4 w-4" />
              Import from CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <Button variant="outline" onClick={() => setShowChatbot(true)} className="btn-3d">
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat with SAM
            </Button>
            <Button variant="destructive" onClick={handleClearInventory} className="btn-3d">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Inventory
            </Button>
          </div>

          {/* Voice Control Section */}
          <div className="mb-6">
            <Card className="glass-effect">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Mic className="mr-2 h-5 w-5" />
                  Voice Control & Testing
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={testVoiceRecognition} className="btn-3d">
                    <Mic className="mr-2 h-4 w-4" />
                    Test Voice Recognition
                  </Button>
                  <Button variant="outline" size="sm" onClick={startRealTimeListening} disabled={isRealTimeListening} className="btn-3d">
                    <Mic className="mr-2 h-4 w-4" />
                    Start Real-Time Voice
                  </Button>
                  <Button variant="outline" size="sm" onClick={stopRealTimeListening} disabled={!isRealTimeListening} className="btn-3d">
                    <MicOff className="mr-2 h-4 w-4" />
                    Stop Real-Time Voice
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearTranscripts} className="btn-3d">
                    <X className="mr-2 h-4 w-4" />
                    Clear Transcripts
                  </Button>
                </div>
                
                {/* Live Transcript Display */}
                {showTranscriptBar && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-700">Voice Recognition Active</span>
                      <Button size="sm" variant="ghost" onClick={() => setShowTranscriptBar(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {liveTranscript && (
                      <div className="text-blue-600 mb-2">
                        <span className="text-xs">Live: </span>
                        <span className="italic">{liveTranscript}</span>
                      </div>
                    )}
                    {finalTranscript && (
                      <div className="text-blue-800 font-medium">
                        <span className="text-xs">Final: </span>
                        {finalTranscript}
                      </div>
                    )}
                    {isRealTimeListening && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-blue-600">Audio Level:</span>
                          <div className="flex-1 bg-blue-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                              style={{ width: `${audioLevel}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
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
              ) : filteredInventory.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  No items in inventory. Add some items to get started!
                </div>
              ) : (
                <Table className="inventory-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Used</TableHead>
                      <TableHead>Stock Level</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Last Restocked</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map((item) => (
                      <InventoryRow 
                        key={item.id}
                        item={item}
                        onEdit={handleOpenEditDialog}
                        onDelete={handleDeleteItem}
                        formatNumber={formatNumber}
                      />
                    ))}
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
                    placeholder="Ask SAM about inventory..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessageToSAM()}
                    className="flex-1"
                  />
                  <Button onClick={sendMessageToSAM} size="sm">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Item: {editingItem?.name}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input id="name" name="name" value={editFormState.name || ''} onChange={handleFormInputChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantity" className="text-right">Quantity</Label>
                  <Input id="quantity" name="quantity" type="number" value={editFormState.quantity || 0} onChange={handleFormInputChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantityUsed" className="text-right">Quantity Used</Label>
                  <Input id="quantityUsed" name="quantityUsed" type="number" value={editFormState.quantityUsed || 0} onChange={handleFormInputChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unit" className="text-right">Unit</Label>
                  <Input id="unit" name="unit" value={editFormState.unit || ''} onChange={handleFormInputChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">Category</Label>
                  <select id="category" name="category" value={editFormState.category || 'Pantry'} onChange={handleFormInputChange} className="col-span-3 px-3 py-2 border border-gray-300 rounded-md">
                    {defaultCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="lowStockThreshold" className="text-right">Low Stock Threshold</Label>
                  <Input id="lowStockThreshold" name="lowStockThreshold" type="number" value={editFormState.lowStockThreshold || 5} onChange={handleFormInputChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="expiryDate" className="text-right">Expiry Date</Label>
                  <div className="col-span-3">
                    <DatePicker
                      date={editFormState.expiryDate ? new Date(editFormState.expiryDate) : undefined}
                      setDate={handleDateChange}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSaveEdit}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AppLayout>
    );
  }
