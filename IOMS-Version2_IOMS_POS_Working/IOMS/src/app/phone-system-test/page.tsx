/**
 * 📞 Phone System Test Interface
 * Test your custom phone system with simulated calls
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  Play, 
  Square, 
  Volume2, 
  CheckCircle,
  Clock,
  User
} from 'lucide-react';

export default function PhoneSystemTester() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [testCall, setTestCall] = useState({
    callerNumber: '+1 (555) 987-6543',
    message: '',
    phoneNumberId: ''
  });

  const [quickTests] = useState([
    {
      name: 'Reservation Request',
      message: 'Hi, I\'d like to make a reservation for 4 people tonight at 7pm. The name is John Smith.',
      expected: 'Should create reservation and provide confirmation number'
    },
    {
      name: 'Food Order',
      message: 'I want to order 2 large pizzas and 3 salads for delivery to 123 Main Street.',
      expected: 'Should process order and calculate total price'
    },
    {
      name: 'Hours Inquiry',
      message: 'What are your hours today? Are you open right now?',
      expected: 'Should provide business hours information'
    },
    {
      name: 'Complex Request',
      message: 'I need to modify an existing reservation and also add some dietary restrictions for allergies.',
      expected: 'Should transfer to human staff'
    }
  ]);

  const simulateCall = async (message = testCall.message) => {
    setIsSimulating(true);
    setSimulationResult(null);

    try {
      const response = await fetch('/api/voice-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerNumber: testCall.callerNumber,
          message: message,
          phoneNumberId: testCall.phoneNumberId || undefined
        })
      });

      const data = await response.json();
      setSimulationResult(data);
    } catch (error) {
      console.error('Error simulating call:', error);
      setSimulationResult({
        success: false,
        error: 'Failed to simulate call'
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const runQuickTest = (test) => {
    setTestCall({ ...testCall, message: test.message });
    simulateCall(test.message);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">📞 Phone System Tester</h2>
        <p className="text-gray-600">
          Test your custom phone system with simulated customer calls
        </p>
        <Badge variant="outline" className="bg-blue-50">
          <Phone className="h-3 w-3 mr-1" />
          Simulates real phone call interactions
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manual Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Custom Test Call
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Caller Number</Label>
              <Input
                placeholder="+1 (555) 987-6543"
                value={testCall.callerNumber}
                onChange={(e) => setTestCall({ ...testCall, callerNumber: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Customer Message</Label>
              <Textarea
                placeholder="Hi, I'd like to make a reservation for 4 people tonight at 7pm..."
                value={testCall.message}
                onChange={(e) => setTestCall({ ...testCall, message: e.target.value })}
                rows={3}
              />
            </div>

            <Button 
              onClick={() => simulateCall()}
              disabled={isSimulating || !testCall.message.trim()}
              className="w-full"
            >
              {isSimulating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing Call...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Simulate Phone Call
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Quick Test Scenarios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickTests.map((test, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{test.name}</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runQuickTest(test)}
                    disabled={isSimulating}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Test
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mb-2">"{test.message}"</p>
                <p className="text-xs text-blue-600">Expected: {test.expected}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {simulationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {simulationResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Square className="h-5 w-5 text-red-500" />
              )}
              Call Simulation Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {simulationResult.success ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <User className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                    <div className="text-sm font-medium">Intent</div>
                    <div className="text-xs text-gray-600 capitalize">
                      {simulationResult.response.intent}
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-6 w-6 mx-auto mb-1 text-green-600" />
                    <div className="text-sm font-medium">Handled By</div>
                    <div className="text-xs text-gray-600 capitalize">
                      {simulationResult.response.handledBy}
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <Clock className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                    <div className="text-sm font-medium">Duration</div>
                    <div className="text-xs text-gray-600">
                      {simulationResult.response.estimatedDuration}s
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>AI Response to Customer:</Label>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm">"{simulationResult.response.message}"</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span>Success: {simulationResult.response.success ? '✅ Yes' : '❌ No'}</span>
                  <span>Action: {simulationResult.response.action}</span>
                  <span>Transfer: {simulationResult.response.shouldTransfer ? '📞 Yes' : '🤖 AI Only'}</span>
                </div>

                {simulationResult.response.notes && (
                  <div className="text-xs text-gray-600 p-2 bg-gray-100 rounded">
                    Notes: {simulationResult.response.notes}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-600">
                Error: {simulationResult.error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>📞 Real Phone Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
              <div>
                <div className="font-medium text-yellow-800">Phone System Ready</div>
                <div className="text-sm text-yellow-600">
                  Voice AI works perfectly, but needs phone line connection
                </div>
              </div>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                Web Only
              </Badge>
            </div>

            <div className="text-sm text-gray-600">
              <strong>To connect real phone calls:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Option 1: Integrate with VoIP service (Zoom Phone, RingCentral)</li>
                <li>Option 2: Connect to existing business phone system via SIP</li>
                <li>Option 3: Use call forwarding + web interface for staff</li>
              </ul>
            </div>

            <Button variant="outline" className="w-full">
              <Phone className="h-4 w-4 mr-2" />
              Request Phone Integration Setup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
