/**
 * 📞 Real Phone Setup Component - Functional Twilio integration
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, 
  Search, 
  Plus, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  Trash2,
  Edit
} from "lucide-react";

interface PhoneNumber {
  id: string;
  number: string;
  displayName: string;
  department: 'main' | 'orders' | 'reservations';
  status: 'active' | 'inactive';
  twilioSid?: string;
}

interface TwilioStatus {
  configured: boolean;
  accountSid?: string;
  baseUrl?: string;
  webhookUrls?: any;
}

interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  locality?: string;
  region?: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
}

export default function RealPhoneSetup() {
  const { toast } = useToast();
  const [twilioStatus, setTwilioStatus] = useState<TwilioStatus | null>(null);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [searchParams, setSearchParams] = useState({
    areaCode: '',
    contains: '',
    nearNumber: ''
  });

  useEffect(() => {
    checkTwilioStatus();
    loadPhoneNumbers();
  }, []);

  const checkTwilioStatus = async () => {
    try {
      const response = await fetch('/api/phone-system/numbers?action=twilio-status');
      const data = await response.json();
      if (data.success) {
        setTwilioStatus(data.twilio);
      }
    } catch (error) {
      console.error('Error checking Twilio status:', error);
    }
  };

  const loadPhoneNumbers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/phone-system/numbers');
      const data = await response.json();
      if (data.success) {
        setPhoneNumbers(data.phoneNumbers || []);
      }
    } catch (error) {
      console.error('Error loading phone numbers:', error);
      toast({
        title: "Error",
        description: "Failed to load phone numbers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const searchAvailableNumbers = async () => {
    if (!twilioStatus?.configured) {
      toast({
        title: "Twilio Not Configured",
        description: "Please configure Twilio credentials first",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        action: 'search',
        ...(searchParams.areaCode && { areaCode: searchParams.areaCode }),
        ...(searchParams.contains && { contains: searchParams.contains }),
        ...(searchParams.nearNumber && { nearNumber: searchParams.nearNumber })
      });

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
          description: data.error || "Failed to search for numbers",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error searching numbers:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for available numbers",
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
          title: "Number Purchased",
          description: `Successfully purchased ${phoneNumber}`,
        });
        loadPhoneNumbers(); // Refresh the list
        setAvailableNumbers([]); // Clear search results
      } else {
        toast({
          title: "Purchase Failed",
          description: data.error || "Failed to purchase number",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error purchasing number:', error);
      toast({
        title: "Purchase Error",
        description: "Failed to purchase phone number",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const deletePhoneNumber = async (id: string) => {
    try {
      const response = await fetch(`/api/phone-system/numbers?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Number Deleted",
          description: "Phone number deleted successfully",
        });
        loadPhoneNumbers(); // Refresh the list
      } else {
        toast({
          title: "Delete Failed",
          description: data.error || "Failed to delete number",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting number:', error);
      toast({
        title: "Delete Error",
        description: "Failed to delete phone number",
        variant: "destructive",
      });
    }
  };

  const PurchaseDialog = ({ number }: { number: AvailableNumber }) => {
    const [displayName, setDisplayName] = useState('');
    const [department, setDepartment] = useState<string>('');

    const handlePurchase = () => {
      if (!displayName || !department) {
        toast({
          title: "Missing Information",
          description: "Please provide display name and department",
          variant: "destructive",
        });
        return;
      }
      purchasePhoneNumber(number.phoneNumber, displayName, department);
    };

    return (
      <div className="border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold">{number.phoneNumber}</h4>
            <p className="text-sm text-gray-600">
              {number.locality}, {number.region}
            </p>
          </div>
          <div className="flex gap-1">
            {number.capabilities.voice && <Badge variant="secondary">Voice</Badge>}
            {number.capabilities.sms && <Badge variant="secondary">SMS</Badge>}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="e.g., Main Restaurant Line"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="department">Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">Main Reception</SelectItem>
                <SelectItem value="orders">Orders & Takeout</SelectItem>
                <SelectItem value="reservations">Reservations</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button 
          onClick={handlePurchase}
          disabled={isPurchasing || !displayName || !department}
          className="w-full"
        >
          {isPurchasing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Purchasing...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Purchase Number
            </>
          )}
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Twilio Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Twilio Configuration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {twilioStatus?.configured ? (
              <>
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="font-semibold text-green-700">Twilio Connected</p>
                  <p className="text-sm text-gray-600">
                    Account: {twilioStatus.accountSid}
                  </p>
                  <p className="text-sm text-gray-600">
                    Base URL: {twilioStatus.baseUrl}
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="font-semibold text-red-700">Twilio Not Configured</p>
                  <p className="text-sm text-gray-600">
                    Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and NEXT_PUBLIC_BASE_URL to environment variables
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Phone Numbers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Active Phone Numbers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : phoneNumbers.length > 0 ? (
            <div className="space-y-4">
              {phoneNumbers.map((number) => (
                <div key={number.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{number.number}</h4>
                      <p className="text-sm text-gray-600">{number.displayName}</p>
                      <Badge variant="outline" className="mt-1">
                        {number.department}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={number.status === 'active' ? 'default' : 'secondary'}
                      >
                        {number.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePhoneNumber(number.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Phone className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No phone numbers configured</p>
              <p className="text-sm text-gray-500">Search and purchase numbers below</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search for Numbers */}
      {twilioStatus?.configured && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Available Numbers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="areaCode">Area Code</Label>
                <Input
                  id="areaCode"
                  placeholder="e.g., 555"
                  value={searchParams.areaCode}
                  onChange={(e) => setSearchParams({...searchParams, areaCode: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="contains">Contains</Label>
                <Input
                  id="contains"
                  placeholder="e.g., 1234"
                  value={searchParams.contains}
                  onChange={(e) => setSearchParams({...searchParams, contains: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="nearNumber">Near Number</Label>
                <Input
                  id="nearNumber"
                  placeholder="e.g., +15551234567"
                  value={searchParams.nearNumber}
                  onChange={(e) => setSearchParams({...searchParams, nearNumber: e.target.value})}
                />
              </div>
            </div>
            
            <Button 
              onClick={searchAvailableNumbers}
              disabled={isSearching}
              className="w-full"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search Available Numbers
                </>
              )}
            </Button>

            {/* Search Results */}
            {availableNumbers.length > 0 && (
              <div className="space-y-4 mt-6">
                <h4 className="font-semibold">Available Numbers ({availableNumbers.length})</h4>
                {availableNumbers.map((number) => (
                  <PurchaseDialog key={number.phoneNumber} number={number} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
