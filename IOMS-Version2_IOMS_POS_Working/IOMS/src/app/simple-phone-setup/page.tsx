'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Phone, 
  Plus,
  Check,
  AlertCircle,
  Bot,
  Clock
} from 'lucide-react';

interface PhoneNumber {
  id: string;
  number: string;
  displayName: string;
  isActive: boolean;
  isPrimary: boolean;
  department: 'main' | 'orders' | 'reservations';
  aiEnabled: boolean;
  businessHours: {
    enabled: boolean;
    schedule: {
      [key: string]: {
        open: string;
        close: string;
        isOpen: boolean;
      }
    }
  };
  createdAt: Date;
}

export default function SimplePhoneSetup() {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New phone number form
  const [newPhone, setNewPhone] = useState({
    number: '',
    displayName: '',
    department: 'main' as 'main' | 'orders' | 'reservations',
    aiEnabled: true
  });

  useEffect(() => {
    fetchPhoneNumbers();
  }, []);

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

  const addPhoneNumber = async () => {
    if (!newPhone.number || !newPhone.displayName) return;

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
      } else {
        alert(data.error || 'Failed to add phone number');
      }
    } catch (error) {
      console.error('Error adding phone number:', error);
      alert('Failed to add phone number');
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
    } catch (error) {
      console.error('Error updating phone number:', error);
    }
  };

  const deletePhone = async (phoneId: string) => {
    if (!confirm('Are you sure you want to delete this phone number?')) return;

    try {
      await fetch(`/api/phone-system/numbers?id=${phoneId}`, {
        method: 'DELETE'
      });
      await fetchPhoneNumbers();
    } catch (error) {
      console.error('Error deleting phone number:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Phone className="h-8 w-8 text-blue-600" />
          Simple Phone Setup
        </h1>
        <p className="text-gray-600 mt-2">
          Add phone numbers for AI-powered order taking and reservations
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl">
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
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Setup Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <strong>For Twilio users:</strong> Set your webhook URL to:
                <code className="block mt-2 p-2 bg-gray-100 rounded">
                  https://your-domain.com/api/phone/simple-webhook
                </code>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="font-semibold">How it works:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Customers call your phone number</li>
                <li>• AI greets them and asks how to help</li>
                <li>• For orders: AI collects order details and confirms</li>
                <li>• For reservations: AI checks availability and books table</li>
                <li>• Orders and reservations are automatically created in your system</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800">AI Features:</h4>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-blue-700">
                <div>✓ Order taking</div>
                <div>✓ Reservation booking</div>
                <div>✓ Business hours handling</div>
                <div>✓ Voicemail for after hours</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
