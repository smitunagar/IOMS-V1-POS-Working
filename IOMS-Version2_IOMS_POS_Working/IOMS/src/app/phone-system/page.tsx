'use client';

/**
 * 📞 Phone System Management Interface
 * Manage restaurant phone numbers and call settings with custom phone system
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Phone, 
  PhoneCall, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Copy,
  Plus,
  Edit,
  Trash2,
  Mic,
  Volume2,
  Clock,
  Users,
  Star,
  BarChart3
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface PhoneNumber {
  id: string;
  number: string;
  displayName: string;
  isActive: boolean;
  isPrimary: boolean;
  department: string;
  voiceMailEnabled: boolean;
  autoAttendantEnabled: boolean;
  businessHours: {
    enabled: boolean;
    schedule: Record<string, { open: string; close: string; isOpen: boolean }>;
  };
  createdAt: string;
  updatedAt: string;
}

interface CallStats {
  totalCalls: number;
  successfulCalls: number;
  successRate: number;
  aiHandledCalls: number;
  aiHandlingRate: number;
  averageDuration: number;
  intentBreakdown: Record<string, number>;
}

export default function PhoneSystemManagement() {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [callStats, setCallStats] = useState<CallStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNumber, setEditingNumber] = useState<PhoneNumber | null>(null);

  const [newNumber, setNewNumber] = useState({
    number: '',
    displayName: '',
    department: 'main',
    voiceMailEnabled: true,
    autoAttendantEnabled: true,
    isPrimary: false
  });

  useEffect(() => {
    fetchPhoneNumbers();
    fetchCallStats();
  }, []);

  const fetchPhoneNumbers = async () => {
    try {
      const response = await fetch('/api/phone-system/numbers');
      const data = await response.json();
      if (data.success) {
        setPhoneNumbers(data.phoneNumbers);
      }
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
    }
  };

  const fetchCallStats = async () => {
    try {
      const response = await fetch('/api/phone-system/calls?stats=true');
      const data = await response.json();
      if (data.success) {
        setCallStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching call stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addPhoneNumber = async () => {
    try {
      const response = await fetch('/api/phone-system/numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNumber)
      });
      
      const data = await response.json();
      if (data.success) {
        setPhoneNumbers([...phoneNumbers, data.phoneNumber]);
        setNewNumber({
          number: '',
          displayName: '',
          department: 'main',
          voiceMailEnabled: true,
          autoAttendantEnabled: true,
          isPrimary: false
        });
        setShowAddForm(false);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error adding phone number:', error);
      alert('Failed to add phone number');
    }
  };

  const deletePhoneNumber = async (id: string) => {
    if (!confirm('Are you sure you want to delete this phone number?')) return;
    
    try {
      const response = await fetch(`/api/phone-system/numbers?id=${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        setPhoneNumbers(phoneNumbers.filter(phone => phone.id !== id));
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error deleting phone number:', error);
      alert('Failed to delete phone number');
    }
  };

  const toggleActive = async (phone: PhoneNumber) => {
    try {
      const response = await fetch('/api/phone-system/numbers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: phone.id, isActive: !phone.isActive })
      });
      
      const data = await response.json();
      if (data.success) {
        setPhoneNumbers(phoneNumbers.map(p => 
          p.id === phone.id ? { ...p, isActive: !p.isActive } : p
        ));
      }
    } catch (error) {
      console.error('Error toggling phone number:', error);
    }
  };

  const setPrimary = async (phone: PhoneNumber) => {
    try {
      const response = await fetch('/api/phone-system/numbers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: phone.id, isPrimary: true })
      });
      
      const data = await response.json();
      if (data.success) {
        setPhoneNumbers(phoneNumbers.map(p => ({ 
          ...p, 
          isPrimary: p.id === phone.id 
        })));
      }
    } catch (error) {
      console.error('Error setting primary phone number:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const primaryPhone = phoneNumbers.find(p => p.isPrimary);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Phone System Management</h1>
          <p className="text-gray-600">Manage your restaurant phone numbers and call settings</p>
        </div>
        <Badge 
          variant={phoneNumbers.length > 0 ? "default" : "secondary"}
          className="flex items-center gap-1"
        >
          {phoneNumbers.length > 0 ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <AlertTriangle className="h-3 w-3" />
          )}
          {phoneNumbers.length} Number{phoneNumbers.length !== 1 ? 's' : ''} Active
        </Badge>
      </div>

      <Tabs defaultValue="numbers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="numbers">Phone Numbers</TabsTrigger>
          <TabsTrigger value="analytics">Call Analytics</TabsTrigger>
          <TabsTrigger value="settings">Voice Settings</TabsTrigger>
        </TabsList>

        {/* Phone Numbers Tab */}
        <TabsContent value="numbers" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Restaurant Phone Numbers</h2>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Phone Number
            </Button>
          </div>

          {/* Add Phone Number Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Phone Number</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      placeholder="+1 (555) 123-4567"
                      value={newNumber.number}
                      onChange={(e) => setNewNumber({ ...newNumber, number: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Display Name</Label>
                    <Input
                      placeholder="Main Restaurant Line"
                      value={newNumber.displayName}
                      onChange={(e) => setNewNumber({ ...newNumber, displayName: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select 
                      value={newNumber.department} 
                      onValueChange={(value) => setNewNumber({ ...newNumber, department: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main">Main Line</SelectItem>
                        <SelectItem value="orders">Orders & Takeout</SelectItem>
                        <SelectItem value="reservations">Reservations</SelectItem>
                        <SelectItem value="delivery">Delivery</SelectItem>
                        <SelectItem value="catering">Catering</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Options</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={newNumber.voiceMailEnabled}
                          onCheckedChange={(checked) => setNewNumber({ ...newNumber, voiceMailEnabled: checked })}
                        />
                        <span className="text-sm">Voice Mail Enabled</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={newNumber.autoAttendantEnabled}
                          onCheckedChange={(checked) => setNewNumber({ ...newNumber, autoAttendantEnabled: checked })}
                        />
                        <span className="text-sm">AI Auto Attendant</span>
                      </div>
                      {phoneNumbers.length === 0 && (
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={true}
                            disabled
                          />
                          <span className="text-sm">Primary Number (first number)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button onClick={addPhoneNumber}>Add Phone Number</Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Phone Numbers List */}
          <div className="grid grid-cols-1 gap-4">
            {phoneNumbers.map((phone) => (
              <Card key={phone.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-lg">{phone.number}</span>
                            {phone.isPrimary && (
                              <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                                <Star className="h-3 w-3 mr-1" />
                                Primary
                              </Badge>
                            )}
                            <Badge variant={phone.isActive ? "default" : "secondary"}>
                              {phone.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-gray-600">{phone.displayName}</p>
                          <p className="text-sm text-gray-500 capitalize">{phone.department} Department</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {phone.voiceMailEnabled && (
                          <div className="flex items-center space-x-1">
                            <Volume2 className="h-4 w-4" />
                            <span>Voicemail</span>
                          </div>
                        )}
                        {phone.autoAttendantEnabled && (
                          <div className="flex items-center space-x-1">
                            <Mic className="h-4 w-4" />
                            <span>AI Assistant</span>
                          </div>
                        )}
                        {phone.businessHours.enabled && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>Business Hours</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(phone.number)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      
                      {!phone.isPrimary && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPrimary(phone)}
                        >
                          Set Primary
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleActive(phone)}
                      >
                        {phone.isActive ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => deletePhoneNumber(phone.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {phoneNumbers.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Phone Numbers</h3>
                  <p className="text-gray-600 mb-4">Add your first restaurant phone number to get started.</p>
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Phone Number
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Call Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{callStats?.totalCalls || 0}</div>
                    <div className="text-xs text-green-600">Last 30 days</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{callStats?.successRate.toFixed(1) || 0}%</div>
                    <div className="text-xs text-green-600">
                      {callStats?.successfulCalls || 0} successful
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">AI Handling</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{callStats?.aiHandlingRate.toFixed(1) || 0}%</div>
                    <div className="text-xs text-blue-600">
                      {callStats?.aiHandledCalls || 0} AI handled
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{callStats?.averageDuration || 0}s</div>
                    <div className="text-xs text-blue-600">Per call average</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Call Intent Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {callStats?.intentBreakdown && Object.entries(callStats.intentBreakdown).map(([intent, count]) => (
                      <div key={intent} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{intent}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ 
                                width: `${(count / (callStats.totalCalls || 1)) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <span className="font-medium text-sm w-8">{count}</span>
                        </div>
                      </div>
                    ))}
                    
                    {(!callStats?.intentBreakdown || Object.keys(callStats.intentBreakdown).length === 0) && (
                      <div className="text-center text-gray-500 py-8">
                        No call data available yet
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Customer Satisfaction</span>
                      <span className="font-medium">
                        {callStats && callStats.successRate > 80 ? 'Excellent' : 
                         callStats && callStats.successRate > 60 ? 'Good' : 'Needs Improvement'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">AI Efficiency</span>
                      <span className="font-medium">
                        {callStats && callStats.aiHandlingRate > 70 ? 'High' : 
                         callStats && callStats.aiHandlingRate > 50 ? 'Medium' : 'Low'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Call Volume Trend</span>
                      <span className="font-medium text-green-600">Stable</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Voice Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Voice AI Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Greeting Message</Label>
                  <Input 
                    placeholder="Hello! Welcome to our restaurant. How can I help you today?"
                    defaultValue="Hello! Welcome to our restaurant. How can I help you today?"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Voice Settings</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Speech Rate</Label>
                      <Input type="number" min="0.5" max="2" step="0.1" defaultValue="1.0" />
                    </div>
                    <div>
                      <Label className="text-xs">Volume</Label>
                      <Input type="number" min="0" max="1" step="0.1" defaultValue="0.8" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select defaultValue="en-US">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="en-UK">English (UK)</SelectItem>
                      <SelectItem value="es-ES">Spanish</SelectItem>
                      <SelectItem value="fr-FR">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">AI Auto Attendant</Label>
                      <p className="text-xs text-gray-500">Enable AI to handle calls automatically</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Transfer to Staff</Label>
                      <p className="text-xs text-gray-500">Allow AI to transfer complex calls</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Business Hours Only</Label>
                      <p className="text-xs text-gray-500">Only answer during business hours</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Call Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Maximum Call Duration</Label>
                  <div className="flex items-center space-x-2">
                    <Input type="number" min="1" max="60" defaultValue="10" className="w-20" />
                    <span className="text-sm text-gray-500">minutes</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Call Recording</Label>
                  <Select defaultValue="disabled">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disabled">Disabled</SelectItem>
                      <SelectItem value="enabled">Record All Calls</SelectItem>
                      <SelectItem value="ai-only">AI Calls Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="font-medium">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <PhoneCall className="h-4 w-4 mr-2" />
                      Test Voice AI Response
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Volume2 className="h-4 w-4 mr-2" />
                      Preview Greeting Message
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      Reset to Defaults
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Business Hours Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Enable Business Hours</Label>
                  <Switch />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <div key={day} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Switch defaultChecked={day !== 'Sunday'} />
                        <span className="font-medium">{day}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input 
                          type="time" 
                          defaultValue={day === 'Friday' || day === 'Saturday' ? '10:00' : '11:00'} 
                          className="w-24 text-xs"
                        />
                        <span className="text-xs text-gray-500">to</span>
                        <Input 
                          type="time" 
                          defaultValue={day === 'Friday' || day === 'Saturday' ? '23:00' : day === 'Sunday' ? '21:00' : '22:00'} 
                          className="w-24 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
