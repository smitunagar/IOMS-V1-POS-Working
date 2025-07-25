/**
 * 📞 Call Forwarding Setup Wizard
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Phone, 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Building,
  Wifi,
  Settings,
  Users,
  TestTube
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CallForwardingSetup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState({
    forwardingMethod: '',
    restaurantPhone: '',
    staffPhone: '',
    staffName: '',
    notes: ''
  });

  const forwardingMethods = [
    {
      id: 'landline',
      name: 'Traditional Landline',
      icon: Phone,
      description: 'Forward from existing landline using *72',
      difficulty: 'Easy',
      cost: 'Usually Free',
      reliability: 'High'
    },
    {
      id: 'cellular',
      name: 'Cell Phone',
      icon: Smartphone,
      description: 'Forward from cell phone to staff phone',
      difficulty: 'Easy',
      cost: 'May have charges',
      reliability: 'Medium'
    },
    {
      id: 'voip',
      name: 'VoIP System',
      icon: Wifi,
      description: 'Configure through VoIP provider portal',
      difficulty: 'Medium',
      cost: 'Usually included',
      reliability: 'High'
    },
    {
      id: 'pbx',
      name: 'Business Phone System',
      icon: Building,
      description: 'Configure through PBX system',
      difficulty: 'Hard',
      cost: 'No additional cost',
      reliability: 'Very High'
    }
  ];

  const getMethodInstructions = (method: string) => {
    const instructions = {
      landline: [
        'Pick up your restaurant phone',
        'Listen for dial tone',
        'Dial *72 (or *21 in some areas)',
        'Wait for second dial tone',
        `Dial your staff phone: ${setupData.staffPhone}`,
        'Listen for confirmation message',
        'Hang up - forwarding is now active'
      ],
      cellular: [
        'Open your phone Settings',
        'Go to Phone or Call Settings',
        'Find "Call Forwarding" option',
        'Select "Always Forward" or "Forward When Busy"',
        `Enter staff number: ${setupData.staffPhone}`,
        'Save the settings',
        'Test by calling from another phone'
      ],
      voip: [
        'Log into your VoIP provider portal',
        'Navigate to Phone Settings or Call Management',
        'Find Call Forwarding or Call Routing',
        `Set destination to: ${setupData.staffPhone}`,
        'Configure forwarding rules (all calls or specific times)',
        'Save and activate the configuration',
        'Test the forwarding'
      ],
      pbx: [
        'Access your PBX admin panel (contact IT if needed)',
        'Go to Call Routing or Extensions',
        'Find your main restaurant line',
        `Set forwarding destination to: ${setupData.staffPhone}`,
        'Configure forwarding schedule if needed',
        'Apply changes and test'
      ]
    };

    return instructions[method as keyof typeof instructions] || [];
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeSetup = async () => {
    try {
      const response = await fetch('/api/call-forwarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupData)
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Call forwarding setup completed! You can now handle calls with AI assistance.');
      }
    } catch (error) {
      console.error('Error completing setup:', error);
      alert('Setup completed locally. Contact support if you need additional help.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">📞 Call Forwarding Setup</h1>
        <p className="text-gray-600">Connect your restaurant phone to AI-powered call handling</p>
        
        {/* Progress Indicator */}
        <div className="flex justify-center space-x-2 mt-4">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step <= currentStep 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
            </div>
          ))}
        </div>
        <div className="text-sm text-gray-500">
          Step {currentStep} of 4
        </div>
      </div>

      {/* Step 1: Choose Forwarding Method */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Your Phone System Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {forwardingMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <div
                    key={method.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      setupData.forwardingMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSetupData({ ...setupData, forwardingMethod: method.id })}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <Icon className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="font-medium">{method.name}</h3>
                        <p className="text-sm text-gray-600">{method.description}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-gray-500">Difficulty</div>
                        <Badge variant="outline" className="text-xs">
                          {method.difficulty}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500">Cost</div>
                        <Badge variant="outline" className="text-xs">
                          {method.cost}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500">Reliability</div>
                        <Badge variant="outline" className="text-xs">
                          {method.reliability}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-end mt-6">
              <Button 
                onClick={nextStep} 
                disabled={!setupData.forwardingMethod}
              >
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Phone Numbers */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Phone Numbers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Restaurant Phone Number</Label>
                <Input
                  placeholder="+1 (555) 123-4567"
                  value={setupData.restaurantPhone}
                  onChange={(e) => setSetupData({ ...setupData, restaurantPhone: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  The main number customers call
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Staff Phone Number</Label>
                <Input
                  placeholder="+1 (555) 987-6543"
                  value={setupData.staffPhone}
                  onChange={(e) => setSetupData({ ...setupData, staffPhone: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  Where calls will be forwarded
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Staff Member Name</Label>
              <Input
                placeholder="John Smith"
                value={setupData.staffName}
                onChange={(e) => setSetupData({ ...setupData, staffName: e.target.value })}
              />
            </div>
            
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={prevStep}>
                Back
              </Button>
              <Button 
                onClick={nextStep} 
                disabled={!setupData.restaurantPhone || !setupData.staffPhone}
              >
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Setup Instructions */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">
                  {forwardingMethods.find(m => m.id === setupData.forwardingMethod)?.name} Setup
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
                  {getMethodInstructions(setupData.forwardingMethod).map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-medium text-yellow-800">Important Notes</h3>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                  <li>Test the forwarding before going live</li>
                  <li>Make sure staff phone has good signal</li>
                  <li>Keep this IOMS interface open during calls</li>
                  <li>Have staff trained on the call interface</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <Label>Setup Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any notes about your setup..."
                  value={setupData.notes}
                  onChange={(e) => setSetupData({ ...setupData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={prevStep}>
                Back
              </Button>
              <Button onClick={nextStep}>
                I've Completed Setup <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Testing & Completion */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Test & Complete Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium">Testing Checklist</h3>
                <div className="space-y-2">
                  {[
                    'Call forwarding is active',
                    'Staff phone receives forwarded calls',
                    'IOMS call interface is accessible',
                    'AI assistance is working',
                    'Staff is trained on the system'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium">Quick Test</h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm mb-2">Test your setup:</p>
                  <ol className="list-decimal list-inside text-xs text-gray-600 space-y-1">
                    <li>Call {setupData.restaurantPhone} from another phone</li>
                    <li>Verify it forwards to {setupData.staffPhone}</li>
                    <li>Answer and open the Call Forwarding interface</li>
                    <li>Test AI assistance with a sample request</li>
                  </ol>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-medium text-green-800">Ready to Go Live!</h3>
              </div>
              <p className="text-sm text-green-700">
                Your call forwarding system is configured. Staff can now handle calls with AI assistance 
                using the Call Forwarding interface.
              </p>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                Back
              </Button>
              <Button onClick={completeSetup} className="bg-green-600 hover:bg-green-700">
                Complete Setup <CheckCircle className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
