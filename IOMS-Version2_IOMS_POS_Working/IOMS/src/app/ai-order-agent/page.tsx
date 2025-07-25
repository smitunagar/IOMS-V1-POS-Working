'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, 
  Plus, 
  MessageSquareQuote, 
  ShoppingCart,
  Calendar,
  Check,
  AlertCircle,
  Bot,
  Trash2
} from "lucide-react";

// Types
interface PhoneNumber {
  id: string;
  number: string;
  displayName: string;
  isActive: boolean;
  isPrimary: boolean;
  department: 'main' | 'orders' | 'reservations';
  aiEnabled: boolean;
  createdAt: Date;
}

interface CallLog {
  id: string;
  phoneNumberId: string;
  callerNumber: string;
  duration: number;
  timestamp: Date;
  handled: boolean;
  handledBy: 'ai' | 'staff';
  intent: 'order' | 'reservation' | 'inquiry';
  success: boolean;
  orderCreated?: boolean;
  reservationCreated?: boolean;
}

interface AvailablePhoneNumber {
  phoneNumber: string;
  friendlyName: string;
  locality: string;
  region: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
}

interface TwilioStatus {
  configured: boolean;
  webhookUrls?: {
    voice: string;
    status: string;
    transcription: string;
  };
  accountSid?: string;
  baseUrl?: string;
}

export default function SimpleAIOrderAgent() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'transcript' | 'phone' | 'calls'>('transcript');
  
  // Phone management state
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Twilio integration state
  const [twilioStatus, setTwilioStatus] = useState<TwilioStatus | null>(null);
  const [availableNumbers, setAvailableNumbers] = useState<AvailablePhoneNumber[]>([]);
  const [searchParams, setSearchParams] = useState({
    areaCode: '',
    contains: '',
    nearNumber: ''
  });
  const [isSearching, setIsSearching] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // New phone form
  const [newPhone, setNewPhone] = useState({
    number: '',
    displayName: '',
    department: 'main' as 'main' | 'orders' | 'reservations',
    aiEnabled: true
  });

  // Transcript processing state
  const [transcript, setTranscript] = useState('');
  const [processedOrder, setProcessedOrder] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchPhoneNumbers();
    fetchCallLogs();
    fetchTwilioStatus();
  }, []);

  const fetchTwilioStatus = async () => {
    try {
      const response = await fetch('/api/phone-system/numbers?action=twilio-status');
      const data = await response.json();
      if (data.success) {
        setTwilioStatus(data.twilio);
      }
    } catch (error) {
      console.error('Error fetching Twilio status:', error);
    }
  };

  const searchPhoneNumbers = async () => {
    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      params.append('action', 'search');
      if (searchParams.areaCode) params.append('areaCode', searchParams.areaCode);
      if (searchParams.contains) params.append('contains', searchParams.contains);
      if (searchParams.nearNumber) params.append('nearNumber', searchParams.nearNumber);

      const response = await fetch(`/api/phone-system/numbers?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableNumbers(data.availableNumbers || []);
        toast({
          title: "Search Complete",
          description: `Found ${data.availableNumbers?.length || 0} available numbers`,
        });
      } else {
        toast({
          title: "Search Failed",
          description: data.error || "Failed to search for phone numbers",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to search for phone numbers",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const purchasePhoneNumber = async (phoneNumber: string, displayName: string, department: string) => {
    setIsPurchasing(true);
    try {
      const response = await fetch('/api/phone-system/numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'purchase',
          phoneNumber,
          displayName,
          department
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Phone Number Purchased!",
          description: `Successfully purchased ${phoneNumber}`,
        });
        fetchPhoneNumbers(); // Refresh the list
        setAvailableNumbers([]); // Clear search results
      } else {
        toast({
          title: "Purchase Failed",
          description: data.error || "Failed to purchase phone number",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Purchase Error",
        description: "Failed to purchase phone number",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const fetchPhoneNumbers = async () => {
    try {
      const response = await fetch('/api/phone-system/numbers');
      const data = await response.json();
      if (data.success) {
        setPhoneNumbers(data.phoneNumbers || []);
      }
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
    }
  };

  const fetchCallLogs = async () => {
    try {
      const response = await fetch('/api/phone-system/call-logs');
      const data = await response.json();
      if (data.success) {
        setCallLogs(data.callLogs || []);
      }
    } catch (error) {
      console.error('Error fetching call logs:', error);
    }
  };

  const addPhoneNumber = async () => {
    if (!newPhone.number || !newPhone.displayName) {
      toast({
        title: "Error",
        description: "Please fill in phone number and display name",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/phone-system/numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPhone)
      });

      const data = await response.json();
      if (data.success) {
        await fetchPhoneNumbers();
        setNewPhone({
          number: '',
          displayName: '',
          department: 'main',
          aiEnabled: true
        });
        toast({
          title: "Success",
          description: "Phone number added successfully"
        });
      } else {
        toast({
          title: "Error",
          description: data.error || 'Failed to add phone number',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add phone number",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAI = async (phoneId: string, enabled: boolean) => {
    try {
      await fetch('/api/phone-system/numbers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: phoneId, aiEnabled: enabled })
      });
      await fetchPhoneNumbers();
      toast({
        title: "Updated",
        description: `AI ${enabled ? 'enabled' : 'disabled'} for phone number`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update phone number",
        variant: "destructive"
      });
    }
  };

  const deletePhone = async (phoneId: string) => {
    if (!confirm('Are you sure you want to delete this phone number?')) return;

    try {
      await fetch(`/api/phone-system/numbers?id=${phoneId}`, {
        method: 'DELETE'
      });
      await fetchPhoneNumbers();
      toast({
        title: "Deleted",
        description: "Phone number deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete phone number",
        variant: "destructive"
      });
    }
  };

  const processTranscript = async () => {
    if (!transcript.trim()) {
      toast({
        title: "Error",
        description: "Please enter a call transcript",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Mock AI processing - replace with actual AI service
      const mockOrder = {
        items: [
          { name: "Large Pepperoni Pizza", quantity: 1, price: 18.99 },
          { name: "Coca Cola", quantity: 2, price: 2.50 }
        ],
        customerName: "John Doe",
        customerPhone: "+1 555-123-4567",
        orderType: "delivery",
        total: 23.99
      };

      setProcessedOrder(mockOrder);
      toast({
        title: "Success",
        description: "Order extracted from transcript successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process transcript",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const createOrder = async () => {
    if (!processedOrder) return;

    try {
      // Mock order creation - replace with actual order service
      toast({
        title: "Order Created",
        description: `Order for ${processedOrder.customerName} has been created successfully`
      });
      setProcessedOrder(null);
      setTranscript('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive"
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'order':
        return 'bg-green-100 text-green-800';
      case 'reservation':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageSquareQuote className="h-8 w-8 text-blue-600" />
            AI Order Agent
          </h1>
          <p className="text-gray-600 mt-2">
            Process call transcripts and manage phone system for AI-powered ordering
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'transcript' ? 'default' : 'outline'}
            onClick={() => setActiveTab('transcript')}
            className="flex items-center gap-2"
          >
            <MessageSquareQuote className="h-4 w-4" />
            Call Transcript
          </Button>
          <Button
            variant={activeTab === 'phone' ? 'default' : 'outline'}
            onClick={() => setActiveTab('phone')}
            className="flex items-center gap-2"
          >
            <Phone className="h-4 w-4" />
            Phone Setup
          </Button>
          <Button
            variant={activeTab === 'calls' ? 'default' : 'outline'}
            onClick={() => setActiveTab('calls')}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Call History
          </Button>
        </div>

        {/* Content */}
        <div className="grid gap-6">
          
          {/* Call Transcript Processing */}
          {activeTab === 'transcript' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquareQuote className="h-5 w-5 text-blue-600" />
                    Call Transcript Input
                  </CardTitle>
                  <CardDescription>
                    Paste the customer call transcript to extract order details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="transcript">Call Transcript</Label>
                    <Textarea
                      id="transcript"
                      placeholder="e.g., 'Hello, I'd like to order one large pepperoni pizza and two cokes for delivery to 123 Main Street... My name is John Doe...'"
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      rows={8}
                      className="mt-2"
                    />
                  </div>
                  <Button 
                    onClick={processTranscript}
                    disabled={isProcessing || !transcript.trim()}
                    className="w-full"
                  >
                    {isProcessing ? 'Processing...' : 'Process with AI'}
                  </Button>
                </CardContent>
              </Card>

              {/* Output Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-green-600" />
                    Order Review
                  </CardTitle>
                  <CardDescription>
                    Review and confirm AI-extracted order details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!processedOrder ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No Order Extracted</p>
                      <p className="text-sm text-gray-400">
                        Please paste a call transcript and click "Process with AI" to extract order details.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Customer Info */}
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">Customer Information</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Name: <strong>{processedOrder.customerName}</strong></div>
                          <div>Phone: <strong>{processedOrder.customerPhone}</strong></div>
                          <div>Type: <strong>{processedOrder.orderType}</strong></div>
                          <div>Total: <strong>${processedOrder.total}</strong></div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">Order Items</h3>
                        <div className="space-y-2">
                          {processedOrder.items.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between items-center">
                              <span>{item.quantity}x {item.name}</span>
                              <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button onClick={createOrder} className="w-full">
                        Create Order
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Phone Setup */}
          {activeTab === 'phone' && (
            <div className="space-y-6">
              
              {/* Current Phone Numbers */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Phone Numbers</CardTitle>
                  <CardDescription>
                    Phone numbers configured for AI call handling
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {phoneNumbers.length === 0 ? (
                    <div className="text-center py-8">
                      <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No phone numbers configured yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {phoneNumbers.map((phone) => (
                        <div 
                          key={phone.id} 
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Phone className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{phone.displayName}</h3>
                              <p className="text-sm text-gray-500">{phone.number}</p>
                              <div className="flex gap-2 mt-1">
                                {phone.isPrimary && (
                                  <Badge variant="default" className="bg-green-100 text-green-800">
                                    <Check className="h-3 w-3 mr-1" />
                                    Primary
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="capitalize">
                                  {phone.department}
                                </Badge>
                                {phone.aiEnabled && (
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                    <Bot className="h-3 w-3 mr-1" />
                                    AI Enabled
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`ai-${phone.id}`} className="text-sm">AI</Label>
                              <Switch
                                id={`ai-${phone.id}`}
                                checked={phone.aiEnabled}
                                onCheckedChange={(checked) => toggleAI(phone.id, checked)}
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deletePhone(phone.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Twilio Phone Number Search */}
              {twilioStatus?.configured ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      Purchase Real Phone Numbers
                    </CardTitle>
                    <CardDescription>
                      Search and purchase phone numbers through Twilio for real call handling
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Search Parameters */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="areaCode">Area Code</Label>
                        <Input
                          id="areaCode"
                          placeholder="e.g., 415"
                          value={searchParams.areaCode}
                          onChange={(e) => setSearchParams({ ...searchParams, areaCode: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="contains">Contains</Label>
                        <Input
                          id="contains"
                          placeholder="e.g., 1234"
                          value={searchParams.contains}
                          onChange={(e) => setSearchParams({ ...searchParams, contains: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="nearNumber">Near Number</Label>
                        <Input
                          id="nearNumber"
                          placeholder="e.g., +14155551234"
                          value={searchParams.nearNumber}
                          onChange={(e) => setSearchParams({ ...searchParams, nearNumber: e.target.value })}
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={searchPhoneNumbers} 
                      disabled={isSearching}
                      className="w-full"
                    >
                      {isSearching ? 'Searching...' : 'Search Available Numbers'}
                    </Button>

                    {/* Search Results */}
                    {availableNumbers.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Available Numbers</h4>
                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {availableNumbers.map((number) => (
                            <div 
                              key={number.phoneNumber}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div>
                                <p className="font-medium">{number.phoneNumber}</p>
                                <p className="text-sm text-gray-500">
                                  {number.locality}, {number.region}
                                </p>
                                <div className="flex gap-1 mt-1">
                                  {number.capabilities.voice && (
                                    <Badge variant="secondary" className="text-xs">Voice</Badge>
                                  )}
                                  {number.capabilities.sms && (
                                    <Badge variant="secondary" className="text-xs">SMS</Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => {
                                  const displayName = `${number.locality} ${number.region} Line`;
                                  purchasePhoneNumber(number.phoneNumber, displayName, 'main');
                                }}
                                disabled={isPurchasing}
                              >
                                {isPurchasing ? 'Purchasing...' : 'Purchase'}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                      Twilio Not Configured
                    </CardTitle>
                    <CardDescription>
                      To use real phone numbers, configure Twilio credentials
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <h4 className="font-medium text-orange-800 mb-2">Setup Required</h4>
                      <p className="text-sm text-orange-700 mb-3">
                        Add these environment variables to your .env.local file:
                      </p>
                      <div className="bg-orange-100 p-3 rounded text-sm font-mono text-orange-900">
                        TWILIO_ACCOUNT_SID=your_account_sid<br/>
                        TWILIO_AUTH_TOKEN=your_auth_token<br/>
                        NEXT_PUBLIC_BASE_URL=your_app_url
                      </div>
                      <p className="text-sm text-orange-700 mt-2">
                        Get credentials from <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="underline">Twilio Console</a>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Add New Phone Number */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add Phone Number
                  </CardTitle>
                  <CardDescription>
                    Add a new phone number for AI call handling
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        placeholder="(555) 123-4567"
                        value={newPhone.number}
                        onChange={(e) => setNewPhone({ ...newPhone, number: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        placeholder="e.g., Main Restaurant Line"
                        value={newPhone.displayName}
                        onChange={(e) => setNewPhone({ ...newPhone, displayName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Select 
                        value={newPhone.department} 
                        onValueChange={(value: any) => setNewPhone({ ...newPhone, department: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="main">Main Line</SelectItem>
                          <SelectItem value="orders">Orders</SelectItem>
                          <SelectItem value="reservations">Reservations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="aiEnabled">Enable AI</Label>
                        <p className="text-sm text-gray-500">AI will handle calls automatically</p>
                      </div>
                      <Switch
                        id="aiEnabled"
                        checked={newPhone.aiEnabled}
                        onCheckedChange={(checked) => setNewPhone({ ...newPhone, aiEnabled: checked })}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={addPhoneNumber}
                    disabled={isLoading || !newPhone.number || !newPhone.displayName}
                    className="w-full"
                  >
                    {isLoading ? 'Adding...' : 'Add Phone Number'}
                  </Button>

                  {/* Setup Instructions */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Webhook Setup</h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Configure your Twilio webhook URL:
                    </p>
                    <code className="block p-2 bg-white rounded text-xs border">
                      https://your-domain.com/api/phone/simple-webhook
                    </code>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Call History */}
          {activeTab === 'calls' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Recent Calls
                </CardTitle>
                <CardDescription>
                  Calls handled by your AI system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {callLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No call logs yet</p>
                    <p className="text-sm text-gray-400">Calls will appear here when customers call your AI system</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {callLogs.slice(0, 10).map((call) => (
                      <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Phone className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{call.callerNumber}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(call.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={getIntentColor(call.intent)}>
                            {call.intent}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatDuration(call.duration)}
                          </span>
                          {call.orderCreated && (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <ShoppingCart className="h-3 w-3 mr-1" />
                              Order
                            </Badge>
                          )}
                          {call.reservationCreated && (
                            <Badge variant="default" className="bg-blue-100 text-blue-800">
                              <Calendar className="h-3 w-3 mr-1" />
                              Table
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </AppLayout>
  );
}
