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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Phone, 
  Settings, 
  Cloud, 
  Check, 
  AlertCircle, 
  Plus,
  Search,
  PhoneCall,
  Bot,
  Shield,
  Zap
} from 'lucide-react';

interface VoIPProvider {
  id: string;
  name: string;
  type: 'twilio' | 'vonage' | 'plivo' | 'bandwidth';
  isActive: boolean;
  credentials: {
    accountSid?: string;
    authToken?: string;
    apiKey?: string;
    apiSecret?: string;
    applicationId?: string;
    privateKey?: string;
  };
  webhookUrls: {
    incomingCall: string;
    callStatus: string;
    recording: string;
  };
  settings: {
    recordCalls: boolean;
    transcribeVoice: boolean;
    enableAI: boolean;
    maxCallDuration: number;
    callForwarding?: string;
  };
}

interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  country: string;
  region: string;
  locality: string;
  postalCode: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
    fax: boolean;
  };
  monthlyPrice: number;
  setupFee: number;
  providerId: string;
}

export default function PhoneProviderSetup() {
  const [providers, setProviders] = useState<VoIPProvider[]>([]);
  const [activeTab, setActiveTab] = useState('providers');
  const [isLoading, setIsLoading] = useState(false);
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
  const [searchCriteria, setSearchCriteria] = useState({
    areaCode: '',
    country: 'US',
    state: '',
    city: '',
    type: 'local' as 'local' | 'toll-free' | 'mobile'
  });

  // New provider form
  const [newProvider, setNewProvider] = useState({
    name: '',
    type: 'twilio' as 'twilio' | 'vonage' | 'plivo' | 'bandwidth',
    credentials: {},
    settings: {
      recordCalls: true,
      transcribeVoice: true,
      enableAI: true,
      maxCallDuration: 1800,
      callForwarding: ''
    }
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/phone/providers');
      const data = await response.json();
      setProviders(data.providers || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const saveProvider = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/phone/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProvider)
      });

      if (response.ok) {
        await fetchProviders();
        setNewProvider({
          name: '',
          type: 'twilio',
          credentials: {},
          settings: {
            recordCalls: true,
            transcribeVoice: true,
            enableAI: true,
            maxCallDuration: 1800,
            callForwarding: ''
          }
        });
      }
    } catch (error) {
      console.error('Error saving provider:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProviderActive = async (providerId: string, isActive: boolean) => {
    try {
      await fetch('/api/phone/providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: providerId, isActive })
      });
      await fetchProviders();
    } catch (error) {
      console.error('Error updating provider:', error);
    }
  };

  const searchNumbers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        ...searchCriteria,
        quantity: '20'
      });
      
      const response = await fetch(`/api/phone/provision?${params}`);
      const data = await response.json();
      setAvailableNumbers(data.numbers || []);
    } catch (error) {
      console.error('Error searching numbers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const provisionNumber = async (phoneNumber: string, config: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/phone/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          ...config
        })
      });

      if (response.ok) {
        // Refresh available numbers
        await searchNumbers();
      }
    } catch (error) {
      console.error('Error provisioning number:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderProviderCredentials = (type: string) => {
    switch (type) {
      case 'twilio':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="accountSid">Account SID</Label>
              <Input
                id="accountSid"
                placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={newProvider.credentials.accountSid || ''}
                onChange={(e) => setNewProvider({
                  ...newProvider,
                  credentials: { ...newProvider.credentials, accountSid: e.target.value }
                })}
              />
            </div>
            <div>
              <Label htmlFor="authToken">Auth Token</Label>
              <Input
                id="authToken"
                type="password"
                placeholder="Your Twilio Auth Token"
                value={newProvider.credentials.authToken || ''}
                onChange={(e) => setNewProvider({
                  ...newProvider,
                  credentials: { ...newProvider.credentials, authToken: e.target.value }
                })}
              />
            </div>
          </div>
        );

      case 'vonage':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                placeholder="Your Vonage API Key"
                value={newProvider.credentials.apiKey || ''}
                onChange={(e) => setNewProvider({
                  ...newProvider,
                  credentials: { ...newProvider.credentials, apiKey: e.target.value }
                })}
              />
            </div>
            <div>
              <Label htmlFor="apiSecret">API Secret</Label>
              <Input
                id="apiSecret"
                type="password"
                placeholder="Your Vonage API Secret"
                value={newProvider.credentials.apiSecret || ''}
                onChange={(e) => setNewProvider({
                  ...newProvider,
                  credentials: { ...newProvider.credentials, apiSecret: e.target.value }
                })}
              />
            </div>
          </div>
        );

      case 'plivo':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="authId">Auth ID</Label>
              <Input
                id="authId"
                placeholder="Your Plivo Auth ID"
                value={newProvider.credentials.accountSid || ''}
                onChange={(e) => setNewProvider({
                  ...newProvider,
                  credentials: { ...newProvider.credentials, accountSid: e.target.value }
                })}
              />
            </div>
            <div>
              <Label htmlFor="authToken">Auth Token</Label>
              <Input
                id="authToken"
                type="password"
                placeholder="Your Plivo Auth Token"
                value={newProvider.credentials.authToken || ''}
                onChange={(e) => setNewProvider({
                  ...newProvider,
                  credentials: { ...newProvider.credentials, authToken: e.target.value }
                })}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Phone className="h-8 w-8 text-blue-600" />
          Phone System Setup
        </h1>
        <p className="text-gray-600 mt-2">
          Configure your VoIP provider and phone numbers for AI-powered order taking and reservations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            VoIP Providers
          </TabsTrigger>
          <TabsTrigger value="numbers" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Get Phone Numbers
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <PhoneCall className="h-4 w-4" />
            Test Setup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6">
          {/* Current Providers */}
          <Card>
            <CardHeader>
              <CardTitle>Your VoIP Providers</CardTitle>
              <CardDescription>
                Manage your telephony service providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {providers.length === 0 ? (
                <div className="text-center py-8">
                  <Cloud className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No VoIP providers configured yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {providers.map((provider) => (
                    <div 
                      key={provider.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Phone className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{provider.name}</h3>
                          <p className="text-sm text-gray-500 capitalize">{provider.type}</p>
                        </div>
                        <div className="flex gap-2">
                          {provider.isActive && (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <Check className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                          {provider.settings.enableAI && (
                            <Badge variant="secondary">
                              <Bot className="h-3 w-3 mr-1" />
                              AI Enabled
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Switch
                        checked={provider.isActive}
                        onCheckedChange={(checked) => toggleProviderActive(provider.id, checked)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add New Provider */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add VoIP Provider
              </CardTitle>
              <CardDescription>
                Connect a new telephony service provider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="providerName">Provider Name</Label>
                  <Input
                    id="providerName"
                    placeholder="e.g., Main Restaurant Line"
                    value={newProvider.name}
                    onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="providerType">Provider Type</Label>
                  <Select 
                    value={newProvider.type} 
                    onValueChange={(value: any) => setNewProvider({ ...newProvider, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twilio">Twilio</SelectItem>
                      <SelectItem value="vonage">Vonage (Nexmo)</SelectItem>
                      <SelectItem value="plivo">Plivo</SelectItem>
                      <SelectItem value="bandwidth">Bandwidth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Provider-specific credentials */}
              <div>
                <Label className="text-base font-semibold">API Credentials</Label>
                <div className="mt-3">
                  {renderProviderCredentials(newProvider.type)}
                </div>
              </div>

              {/* Settings */}
              <div>
                <Label className="text-base font-semibold">Settings</Label>
                <div className="mt-3 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="recordCalls">Record Calls</Label>
                      <p className="text-sm text-gray-500">Automatically record all incoming calls</p>
                    </div>
                    <Switch
                      id="recordCalls"
                      checked={newProvider.settings.recordCalls}
                      onCheckedChange={(checked) => setNewProvider({
                        ...newProvider,
                        settings: { ...newProvider.settings, recordCalls: checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="transcribeVoice">Voice Transcription</Label>
                      <p className="text-sm text-gray-500">Convert speech to text automatically</p>
                    </div>
                    <Switch
                      id="transcribeVoice"
                      checked={newProvider.settings.transcribeVoice}
                      onCheckedChange={(checked) => setNewProvider({
                        ...newProvider,
                        settings: { ...newProvider.settings, transcribeVoice: checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enableAI">AI Agent</Label>
                      <p className="text-sm text-gray-500">Enable AI-powered call handling</p>
                    </div>
                    <Switch
                      id="enableAI"
                      checked={newProvider.settings.enableAI}
                      onCheckedChange={(checked) => setNewProvider({
                        ...newProvider,
                        settings: { ...newProvider.settings, enableAI: checked }
                      })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxDuration">Max Call Duration (seconds)</Label>
                    <Input
                      id="maxDuration"
                      type="number"
                      placeholder="1800"
                      value={newProvider.settings.maxCallDuration}
                      onChange={(e) => setNewProvider({
                        ...newProvider,
                        settings: { ...newProvider.settings, maxCallDuration: parseInt(e.target.value) || 1800 }
                      })}
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={saveProvider}
                disabled={isLoading || !newProvider.name || !newProvider.type}
                className="w-full"
              >
                {isLoading ? 'Saving...' : 'Add Provider'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="numbers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Available Phone Numbers</CardTitle>
              <CardDescription>
                Find and provision phone numbers for your restaurant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="areaCode">Area Code</Label>
                  <Input
                    id="areaCode"
                    placeholder="e.g., 415"
                    value={searchCriteria.areaCode}
                    onChange={(e) => setSearchCriteria({ ...searchCriteria, areaCode: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="e.g., CA"
                    value={searchCriteria.state}
                    onChange={(e) => setSearchCriteria({ ...searchCriteria, state: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="e.g., San Francisco"
                    value={searchCriteria.city}
                    onChange={(e) => setSearchCriteria({ ...searchCriteria, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="numberType">Type</Label>
                  <Select 
                    value={searchCriteria.type} 
                    onValueChange={(value: any) => setSearchCriteria({ ...searchCriteria, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="toll-free">Toll-Free</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={searchNumbers} disabled={isLoading} className="w-full">
                {isLoading ? 'Searching...' : 'Search Numbers'}
              </Button>

              {availableNumbers.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Available Numbers</h3>
                  <div className="grid gap-4">
                    {availableNumbers.map((number) => (
                      <div 
                        key={number.phoneNumber} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h4 className="font-semibold">{number.phoneNumber}</h4>
                          <p className="text-sm text-gray-500">
                            {number.locality}, {number.region} • ${number.monthlyPrice}/month
                          </p>
                          <div className="flex gap-2 mt-2">
                            {number.capabilities.voice && (
                              <Badge variant="secondary">
                                <PhoneCall className="h-3 w-3 mr-1" />
                                Voice
                              </Badge>
                            )}
                            {number.capabilities.sms && (
                              <Badge variant="secondary">SMS</Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => provisionNumber(number.phoneNumber, {
                            department: 'general',
                            displayName: 'Restaurant Main Line',
                            enableAI: true
                          })}
                          disabled={isLoading}
                        >
                          Provision
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Test Your Setup
              </CardTitle>
              <CardDescription>
                Verify your phone system configuration is working correctly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Make sure you have at least one active VoIP provider and one provisioned phone number before testing.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Webhook Endpoints
                  </h3>
                  <div className="space-y-2 text-sm font-mono">
                    <div>Twilio: <code className="bg-gray-100 px-2 py-1 rounded">/api/phone/webhooks/twilio</code></div>
                    <div>Vonage: <code className="bg-gray-100 px-2 py-1 rounded">/api/phone/webhooks/vonage</code></div>
                    <div>AI Agent: <code className="bg-gray-100 px-2 py-1 rounded">/api/phone/webhooks/twilio/ai-agent</code></div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    AI Features
                  </h3>
                  <ul className="space-y-1 text-sm">
                    <li>✓ Automatic call answering</li>
                    <li>✓ Speech-to-text transcription</li>
                    <li>✓ Order processing</li>
                    <li>✓ Reservation booking</li>
                    <li>✓ Call recording</li>
                    <li>✓ Business hours handling</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" className="flex-1">
                  Test Webhook Connection
                </Button>
                <Button variant="outline" className="flex-1">
                  Simulate Incoming Call
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
