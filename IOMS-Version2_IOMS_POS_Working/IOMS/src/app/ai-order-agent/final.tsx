"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  Loader2, 
  MessageSquareQuote, 
  CheckCircle, 
  AlertCircle, 
  ShoppingCart, 
  XCircle,
  Phone,
  PhoneCall,
  PhoneIncoming,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Timer,
  BarChart3,
  Activity,
  MessageSquare,
  Zap
} from "lucide-react";
import { extractOrderFromText, ExtractOrderInput, ExtractedOrderOutput } from '@/ai/flows/extract-order-from-text';
import { useAuth } from '@/contexts/AuthContext';
import { getDishes, Dish } from '@/lib/menuService';
import { addOrder, OrderItem as ServiceOrderItem, OrderType, NewOrderData } from '@/lib/orderService';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from "@/components/ui/badge";

// Mock data
const MOCK_TABLES = Array.from({ length: 10 }, (_, i) => ({ id: `t${i + 1}`, name: `Table ${i + 1}` }));
const MOCK_DRIVERS = ["Driver A", "Driver B", "Driver C"];

// Types
interface MatchedOrderItem {
  menuDish: Dish | null;
  aiExtractedName: string;
  quantity: number;
  isMatched: boolean;
}

interface Call {
  id: string;
  number: string;
  name: string;
  type: 'incoming' | 'outgoing';
  status: 'ringing' | 'active' | 'hold' | 'ended';
  startTime: Date;
  duration: number;
  intent?: string;
  notes?: string;
}

interface SystemStats {
  totalCalls: number;
  activeCall: boolean;
  callsToday: number;
  avgDuration: number;
  successRate: number;
  systemHealth: 'excellent' | 'good' | 'fair' | 'poor';
}

type AgentOrderType = 'dine-in' | 'delivery' | 'pickup' | 'unknown';

export default function AiOrderAgentPage() {
  // Core hooks
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  // Transcript processing state
  const [transcript, setTranscript] = useState<string>("");
  const [aiExtractedOrder, setAiExtractedOrder] = useState<ExtractedOrderOutput | null>(null);
  const [processedOrderItems, setProcessedOrderItems] = useState<MatchedOrderItem[]>([]);
  
  // Phone system state
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [callHistory, setCallHistory] = useState<Call[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [customerMessage, setCustomerMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  
  // System stats
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalCalls: 127,
    activeCall: false,
    callsToday: 15,
    avgDuration: 185,
    successRate: 94,
    systemHealth: 'excellent'
  });

  // UI state
  const [activeSection, setActiveSection] = useState<'call' | 'transcript' | 'analytics'>('transcript');
  const [menuDishes, setMenuDishes] = useState<Dish[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Order form state
  const [confirmedOrderType, setConfirmedOrderType] = useState<AgentOrderType>('unknown');
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("");
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [orderNotes, setOrderNotes] = useState<string>("");

  // Transitions
  const [isProcessingTranscript, startProcessingTranscript] = useTransition();
  const [isCreatingOrder, startCreatingOrder] = useTransition();

  // Initialize menu dishes
  useEffect(() => {
    setIsClient(true);
    if (!currentUser || !currentUser.id) return;
    
    const userKey = `restaurantMenu_${currentUser.id}`;
    let dishes: Dish[] = [];
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(userKey) : null;
      if (stored) {
        dishes = JSON.parse(stored);
      }
    } catch (e) { 
      dishes = []; 
    }
    
    if (!dishes || dishes.length === 0) {
      fetch('/api/menuCsv')
        .then(res => res.json())
        .then(data => {
          if (data.menu && Array.isArray(data.menu) && data.menu.length > 0) {
            setMenuDishes(data.menu);
            if (typeof window !== 'undefined') {
              localStorage.setItem(userKey, JSON.stringify(data.menu));
            }
          }
        })
        .catch(console.error);
    } else {
      setMenuDishes(dishes);
    }
  }, [currentUser]);

  // Voice functions
  const speak = (text: string) => {
    if ('speechSynthesis' in window && voiceEnabled) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setCustomerMessage(transcript);
      };
      
      recognition.start();
    }
  };

  // Call management
  const simulateCall = () => {
    const newCall: Call = {
      id: Date.now().toString(),
      number: '+1 (555) 999-8888',
      name: 'Demo Customer',
      type: 'incoming',
      status: 'ringing',
      startTime: new Date(),
      duration: 0
    };
    setCurrentCall(newCall);
    setSystemStats(prev => ({ ...prev, activeCall: true }));
  };

  const answerCall = () => {
    if (currentCall) {
      setCurrentCall({ ...currentCall, status: 'active' });
      if (voiceEnabled) {
        speak("Hello! Thank you for calling. How can I help you today?");
      }
    }
  };

  const endCall = () => {
    if (currentCall) {
      const endedCall = { ...currentCall, status: 'ended' as const };
      setCallHistory(prev => [endedCall, ...prev]);
      setCurrentCall(null);
      setSystemStats(prev => ({ ...prev, activeCall: false }));
      setCustomerMessage('');
      setAiResponse('');
    }
  };

  // Utility functions
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // AI Processing
  const handleProcessTranscript = () => {
    if (!transcript.trim()) {
      toast({ 
        title: "No Transcript", 
        description: "Please enter a transcript to process.", 
        variant: "destructive" 
      });
      return;
    }

    startProcessingTranscript(async () => {
      try {
        const input: ExtractOrderInput = { transcript };
        const result = await extractOrderFromText(input);
        
        if (result.success && result.data) {
          setAiExtractedOrder(result.data);
          const mapped = result.data.items.map(item => ({
            menuDish: null,
            aiExtractedName: item.name,
            quantity: item.quantity,
            isMatched: false,
          }));
          setProcessedOrderItems(mapped);
          
          if (result.data.orderType) {
            setConfirmedOrderType(result.data.orderType as AgentOrderType);
          }
          
          toast({ 
            title: "Success", 
            description: "Order extracted successfully!" 
          });
        } else {
          toast({ 
            title: "Processing Failed", 
            description: result.error || "Unable to extract order.", 
            variant: "destructive" 
          });
        }
      } catch (error) {
        console.error('Error processing transcript:', error);
        toast({ 
          title: "Error", 
          description: "Something went wrong.", 
          variant: "destructive" 
        });
      }
    });
  };

  const handleConfirmAndCreateOrder = () => {
    if (!aiExtractedOrder) {
      toast({ 
        title: "No Order", 
        description: "Please process a transcript first.", 
        variant: "destructive" 
      });
      return;
    }

    const validOrderType: OrderType = confirmedOrderType === 'pickup' ? 'delivery' : 
                                      confirmedOrderType === 'unknown' ? 'dine-in' : 
                                      confirmedOrderType as OrderType;

    const orderItems: ServiceOrderItem[] = processedOrderItems.map(item => ({
      dishId: item.menuDish?.id || 'unknown',
      dishName: item.menuDish?.name || item.aiExtractedName,
      quantity: item.quantity,
      unitPrice: item.menuDish?.price || 0,
      totalPrice: (item.menuDish?.price || 0) * item.quantity,
      notes: item.menuDish ? undefined : `AI Extracted: ${item.aiExtractedName}`,
    }));

    if (orderItems.length === 0) {
      toast({ 
        title: "Empty Order", 
        description: "Please add items to the order.", 
        variant: "destructive" 
      });
      return;
    }

    startCreatingOrder(async () => {
      try {
        const newOrder: NewOrderData = {
          type: validOrderType,
          items: orderItems,
          tableId: validOrderType === 'dine-in' ? selectedTableId : undefined,
          customerName: validOrderType !== 'dine-in' ? customerName : undefined,
          customerPhone: validOrderType !== 'dine-in' ? customerPhone : undefined,
          customerAddress: validOrderType === 'delivery' ? customerAddress : undefined,
          driver: validOrderType === 'delivery' ? selectedDriver : undefined,
          notes: orderNotes || undefined,
        };

        const result = await addOrder(newOrder, currentUser?.id || null);
        if (result.success && result.data) {
          toast({ 
            title: "Order Created", 
            description: `Order #${result.data.orderNumber} created successfully!` 
          });
          
          // Reset form
          setTranscript("");
          setAiExtractedOrder(null);
          setProcessedOrderItems([]);
          setConfirmedOrderType('unknown');
          setSelectedTableId("");
          setCustomerName("");
          setCustomerPhone("");
          setCustomerAddress("");
          setSelectedDriver("");
          setOrderNotes("");
        } else {
          toast({ 
            title: "Order Failed", 
            description: result.error || "Failed to create order.", 
            variant: "destructive" 
          });
        }
      } catch (error) {
        console.error('Error creating order:', error);
        toast({ 
          title: "Error", 
          description: "Something went wrong.", 
          variant: "destructive" 
        });
      }
    });
  };

  return (
    <AppLayout pageTitle="AI Order Agent with Phone System">
      <div className="space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-blue-600 rounded-full">
              <MessageSquareQuote className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Order Agent & Phone System
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Complete AI-powered order processing with integrated phone management</p>
        </div>

        {/* Section Navigation */}
        <div className="flex justify-center space-x-4">
          <Button
            variant={activeSection === 'call' ? 'default' : 'outline'}
            onClick={() => setActiveSection('call')}
            className="flex items-center gap-2"
          >
            <Phone className="h-4 w-4" />
            Live Calls
          </Button>
          <Button
            variant={activeSection === 'transcript' ? 'default' : 'outline'}
            onClick={() => setActiveSection('transcript')}
            className="flex items-center gap-2"
          >
            <MessageSquareQuote className="h-4 w-4" />
            Transcript Processing
          </Button>
          <Button
            variant={activeSection === 'analytics' ? 'default' : 'outline'}
            onClick={() => setActiveSection('analytics')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{systemStats.totalCalls}</div>
              <div className="text-sm text-gray-600">Total Calls</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{systemStats.callsToday}</div>
              <div className="text-sm text-gray-600">Today</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{formatDuration(systemStats.avgDuration)}</div>
              <div className="text-sm text-gray-600">Avg Call</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{systemStats.successRate}%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <Badge className={getStatusColor(systemStats.systemHealth)}>
                {systemStats.systemHealth}
              </Badge>
              <div className="text-sm text-gray-600 mt-1">System Health</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        {activeSection === 'call' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Live Call Control */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PhoneCall className="h-5 w-5 text-green-600" />
                  Live Call Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!currentCall ? (
                  <div className="text-center space-y-4">
                    <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No active call</p>
                    </div>
                    <Button onClick={simulateCall} className="w-full">
                      <PhoneIncoming className="h-4 w-4 mr-2" />
                      Simulate Incoming Call
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{currentCall.name}</p>
                          <p className="text-sm text-gray-600">{currentCall.number}</p>
                        </div>
                        <Badge className={
                          currentCall.status === 'ringing' ? 'bg-yellow-500' :
                          currentCall.status === 'active' ? 'bg-green-500' :
                          'bg-gray-500'
                        }>
                          {currentCall.status}
                        </Badge>
                      </div>
                      {currentCall.status === 'active' && (
                        <div className="mt-2 flex items-center gap-2">
                          <Timer className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{formatDuration(currentCall.duration)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {currentCall.status === 'ringing' && (
                        <Button onClick={answerCall} className="flex-1">
                          <Phone className="h-4 w-4 mr-2" />
                          Answer
                        </Button>
                      )}
                      <Button 
                        onClick={endCall}
                        variant="destructive" 
                        className="flex-1"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        End Call
                      </Button>
                    </div>

                    {currentCall.status === 'active' && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Button
                            onClick={startListening}
                            variant={isListening ? "destructive" : "default"}
                            size="sm"
                            className="flex-1"
                          >
                            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                            {isListening ? "Stop" : "Listen"}
                          </Button>
                          <Button
                            onClick={() => setVoiceEnabled(!voiceEnabled)}
                            variant={voiceEnabled ? "default" : "outline"}
                            size="sm"
                            className="flex-1"
                          >
                            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                            Voice
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Voice Recognition */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Voice Recognition
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customer-message">Customer Message</Label>
                  <Textarea
                    id="customer-message"
                    value={customerMessage}
                    onChange={(e) => setCustomerMessage(e.target.value)}
                    placeholder="Customer speech will appear here..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div>
                  <Label htmlFor="ai-response">AI Response</Label>
                  <Textarea
                    id="ai-response"
                    value={aiResponse}
                    onChange={(e) => setAiResponse(e.target.value)}
                    placeholder="AI-generated response..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (customerMessage.trim()) {
                        const response = `Thank you for your order. Let me help you with that. ${customerMessage.includes('pizza') ? 'I can see you want pizza.' : 'What would you like to order today?'}`;
                        setAiResponse(response);
                        if (voiceEnabled) {
                          speak(response);
                        }
                      }
                    }}
                    className="flex-1"
                    disabled={!customerMessage.trim()}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Generate AI Response
                  </Button>
                  <Button
                    onClick={() => {
                      if (aiResponse.trim()) {
                        speak(aiResponse);
                      }
                    }}
                    variant="outline"
                    disabled={!aiResponse.trim()}
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Call History */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  Recent Calls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {callHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No recent calls</p>
                  ) : (
                    callHistory.map((call) => (
                      <div key={call.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{call.name}</p>
                            <p className="text-sm text-gray-600">{call.number}</p>
                            {call.intent && (
                              <Badge variant="outline" className="mt-1">
                                {call.intent}
                              </Badge>
                            )}
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p>{formatDuration(call.duration)}</p>
                            <p>{call.startTime.toLocaleTimeString()}</p>
                          </div>
                        </div>
                        {call.notes && (
                          <p className="text-sm text-gray-600 mt-2">{call.notes}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'transcript' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Transcript Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquareQuote className="mr-2 h-6 w-6 text-primary" />
                  Call Transcript Input
                </CardTitle>
                <CardDescription>
                  Paste the full text transcript of the customer's call here. The AI will extract order details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Label htmlFor="transcript-input">Call Transcript</Label>
                <Textarea
                  id="transcript-input"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="e.g., 'Hello, I'd like to order one large pepperoni pizza and two cokes for delivery to 123 Main Street... My name is John Doe...'"
                  rows={10}
                  className="min-h-[200px]"
                  disabled={isProcessingTranscript || isCreatingOrder}
                />
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleProcessTranscript}
                  disabled={isProcessingTranscript || !transcript.trim() || isCreatingOrder}
                  className="w-full"
                >
                  {isProcessingTranscript ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Process with AI
                </Button>
              </CardFooter>
            </Card>

            {/* Order Review */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                  Order Review
                </CardTitle>
                <CardDescription>
                  Review and confirm AI-extracted order details.
                </CardDescription>
              </CardHeader>
              {!aiExtractedOrder ? (
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Order Extracted</h3>
                    <p className="text-muted-foreground">
                      Please paste a call transcript and click "Process with AI" to extract order details.
                    </p>
                  </div>
                </CardContent>
              ) : (
                <>
                  <CardContent className="space-y-4">
                    {/* Order Items */}
                    <div>
                      <Label>Order Items</Label>
                      <div className="space-y-2">
                        {processedOrderItems.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 border rounded-md">
                            <div className="flex-1">
                              <p className="font-semibold">{item.aiExtractedName}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={e => {
                                  const newQty = Math.max(1, parseInt(e.target.value, 10) || 1);
                                  setProcessedOrderItems(items => {
                                    const updated = [...items];
                                    updated[idx].quantity = newQty;
                                    return updated;
                                  });
                                }}
                                className="w-16"
                                disabled={isCreatingOrder}
                              />
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setProcessedOrderItems(items => items.filter((_, i) => i !== idx));
                                }}
                                disabled={isCreatingOrder}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="space-y-2">
                      <div>
                        <Label>Order Type</Label>
                        <Select value={confirmedOrderType} onValueChange={v => setConfirmedOrderType(v as AgentOrderType)} disabled={isCreatingOrder}>
                          <SelectTrigger><SelectValue placeholder="Select order type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dine-in">Dine-In</SelectItem>
                            <SelectItem value="delivery">Delivery</SelectItem>
                            <SelectItem value="pickup">Pickup</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {confirmedOrderType === 'dine-in' && (
                        <div>
                          <Label>Table</Label>
                          <Select value={selectedTableId} onValueChange={setSelectedTableId} disabled={isCreatingOrder}>
                            <SelectTrigger><SelectValue placeholder="Select a table" /></SelectTrigger>
                            <SelectContent>
                              {MOCK_TABLES.map(table => (
                                <SelectItem key={table.id} value={table.id}>{table.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {(['delivery', 'pickup'] as AgentOrderType[]).includes(confirmedOrderType) && (
                        <>
                          <div>
                            <Label>Customer Name</Label>
                            <Input
                              value={customerName}
                              onChange={e => setCustomerName(e.target.value)}
                              placeholder="Enter customer name"
                              disabled={isCreatingOrder}
                            />
                          </div>
                          <div>
                            <Label>Customer Phone</Label>
                            <Input
                              value={customerPhone}
                              onChange={e => setCustomerPhone(e.target.value)}
                              placeholder="Enter customer phone"
                              disabled={isCreatingOrder}
                            />
                          </div>
                        </>
                      )}

                      {confirmedOrderType === 'delivery' && (
                        <>
                          <div>
                            <Label>Customer Address</Label>
                            <Input
                              value={customerAddress}
                              onChange={e => setCustomerAddress(e.target.value)}
                              placeholder="Enter delivery address"
                              disabled={isCreatingOrder}
                            />
                          </div>
                          <div>
                            <Label>Driver</Label>
                            <Select value={selectedDriver} onValueChange={setSelectedDriver} disabled={isCreatingOrder}>
                              <SelectTrigger><SelectValue placeholder="Select a driver" /></SelectTrigger>
                              <SelectContent>
                                {MOCK_DRIVERS.map(driver => (
                                  <SelectItem key={driver} value={driver}>{driver}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}

                      <div>
                        <Label>Order Notes</Label>
                        <Textarea
                          value={orderNotes}
                          onChange={e => setOrderNotes(e.target.value)}
                          placeholder="Any special instructions..."
                          rows={3}
                          disabled={isCreatingOrder}
                        />
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Button
                      onClick={handleConfirmAndCreateOrder}
                      disabled={isCreatingOrder || !aiExtractedOrder || processedOrderItems.length === 0}
                      className="w-full"
                    >
                      {isCreatingOrder ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Confirm & Create Order
                    </Button>
                  </CardFooter>
                </>
              )}
            </Card>
          </div>
        )}

        {activeSection === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Call Analytics */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-blue-600" />
                  Call Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Calls:</span>
                    <span className="font-semibold">{systemStats.totalCalls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Today:</span>
                    <span className="font-semibold">{systemStats.callsToday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Duration:</span>
                    <span className="font-semibold">{formatDuration(systemStats.avgDuration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="font-semibold">{systemStats.successRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Analytics */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  Order Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processed Orders:</span>
                    <span className="font-semibold">{processedOrderItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Menu Items:</span>
                    <span className="font-semibold">{menuDishes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Order Type:</span>
                    <span className="font-semibold">{confirmedOrderType}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Overall Status:</span>
                    <Badge className={getStatusColor(systemStats.systemHealth)}>
                      {systemStats.systemHealth}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Call:</span>
                    <span className="font-semibold">
                      {systemStats.activeCall ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Voice Enabled:</span>
                    <span className="font-semibold">
                      {voiceEnabled ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Listening:</span>
                    <span className="font-semibold">
                      {isListening ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
      </div>
    </AppLayout>
  );
}
