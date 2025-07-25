/**
 * 📞 Call Forwarding Interface - Handle real phone calls with AI assistance
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Phone, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  User,
  Clock,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Zap,
  Headphones
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface IncomingCall {
  id: string;
  callerNumber: string;
  callerName?: string;
  phoneNumberId: string;
  startTime: Date;
  duration: number;
  status: 'ringing' | 'active' | 'on-hold' | 'ended';
}

interface AIAssistance {
  isEnabled: boolean;
  suggestion: string;
  confidence: number;
  intent: string;
  extractedData: any;
}

export default function CallForwardingInterface() {
  const [currentCall, setCurrentCall] = useState<IncomingCall | null>(null);
  const [incomingCalls, setIncomingCalls] = useState<IncomingCall[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [customerMessage, setCustomerMessage] = useState('');
  const [staffNotes, setStaffNotes] = useState('');
  const [aiAssistance, setAiAssistance] = useState<AIAssistance>({
    isEnabled: true,
    suggestion: '',
    confidence: 0,
    intent: '',
    extractedData: null
  });

  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'active' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);

  // Simulate incoming calls for demo
  useEffect(() => {
    const simulateIncomingCall = () => {
      const newCall: IncomingCall = {
        id: `call_${Date.now()}`,
        callerNumber: '+1 (555) ' + Math.floor(Math.random() * 900 + 100) + '-' + Math.floor(Math.random() * 9000 + 1000),
        callerName: ['John Smith', 'Sarah Johnson', 'Mike Wilson', 'Lisa Brown'][Math.floor(Math.random() * 4)],
        phoneNumberId: 'main_line',
        startTime: new Date(),
        duration: 0,
        status: 'ringing'
      };

      setIncomingCalls(prev => [...prev, newCall]);
      setCallStatus('ringing');

      // Auto-remove after 30 seconds if not answered
      setTimeout(() => {
        if (callStatus === 'ringing') {
          setIncomingCalls(prev => prev.filter(call => call.id !== newCall.id));
          setCallStatus('idle');
        }
      }, 30000);
    };

    // Simulate random incoming calls
    const interval = setInterval(() => {
      if (Math.random() > 0.7 && callStatus === 'idle') {
        simulateIncomingCall();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [callStatus]);

  // Update call duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === 'active') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const answerCall = (call: IncomingCall) => {
    setCurrentCall({ ...call, status: 'active' });
    setCallStatus('active');
    setCallDuration(0);
    setIncomingCalls(prev => prev.filter(c => c.id !== call.id));
    
    // Enable AI assistance
    setAiAssistance(prev => ({ ...prev, isEnabled: true }));
  };

  const endCall = () => {
    if (currentCall) {
      // Log the call
      logCallToSystem(currentCall, callDuration, staffNotes);
    }
    
    setCurrentCall(null);
    setCallStatus('idle');
    setCallDuration(0);
    setCustomerMessage('');
    setStaffNotes('');
    setAiAssistance({
      isEnabled: true,
      suggestion: '',
      confidence: 0,
      intent: '',
      extractedData: null
    });
  };

  const processCustomerMessage = async () => {
    if (!customerMessage.trim()) return;

    try {
      const response = await fetch('/api/voice-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerNumber: currentCall?.callerNumber,
          message: customerMessage,
          phoneNumberId: currentCall?.phoneNumberId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setAiAssistance({
          isEnabled: true,
          suggestion: data.response.message,
          confidence: data.response.success ? 90 : 60,
          intent: data.response.intent,
          extractedData: data.response
        });
      }
    } catch (error) {
      console.error('Error processing customer message:', error);
    }
  };

  const logCallToSystem = async (call: IncomingCall, duration: number, notes: string) => {
    try {
      await fetch('/api/phone-system/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumberId: call.phoneNumberId,
          callerNumber: call.callerNumber,
          callType: 'incoming',
          duration,
          handled: true,
          handledBy: 'staff',
          intent: aiAssistance.intent || 'general',
          success: true,
          notes
        })
      });
    } catch (error) {
      console.error('Error logging call:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📞 Call Forwarding Interface</h1>
          <p className="text-gray-600">Handle real phone calls with AI assistance</p>
        </div>
        <Badge 
          variant={callStatus === 'active' ? "default" : callStatus === 'ringing' ? "destructive" : "secondary"}
          className="flex items-center gap-1"
        >
          {callStatus === 'active' && <Phone className="h-3 w-3" />}
          {callStatus === 'ringing' && <PhoneIncoming className="h-3 w-3 animate-pulse" />}
          {callStatus === 'idle' && <PhoneOff className="h-3 w-3" />}
          {callStatus === 'idle' ? 'Ready' : callStatus === 'ringing' ? 'Incoming Call' : 'On Call'}
        </Badge>
      </div>

      {/* Incoming Calls */}
      {incomingCalls.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <PhoneIncoming className="h-5 w-5 animate-pulse" />
              Incoming Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incomingCalls.map((call) => (
                <div key={call.id} className="flex items-center justify-between p-3 bg-white border border-orange-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium">{call.callerName || 'Unknown Caller'}</div>
                      <div className="text-sm text-gray-600">{call.callerNumber}</div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => answerCall(call)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Answer
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setIncomingCalls(prev => prev.filter(c => c.id !== call.id))}
                    >
                      <PhoneOff className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Call Interface */}
      {currentCall && callStatus === 'active' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Call Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-green-600" />
                Active Call
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-lg">{currentCall.callerName || 'Unknown Caller'}</div>
                  <div className="text-gray-600">{currentCall.callerNumber}</div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatDuration(callDuration)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={isMuted ? "destructive" : "outline"}
                  onClick={() => setIsMuted(!isMuted)}
                  className="flex-1"
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentCall(prev => prev ? { ...prev, status: 'on-hold' } : null)}
                  className="flex-1"
                >
                  <Headphones className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={endCall}
                  className="flex-1"
                >
                  <PhoneOff className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Customer Message (What they said)</Label>
                <Textarea
                  placeholder="Type what the customer said..."
                  value={customerMessage}
                  onChange={(e) => setCustomerMessage(e.target.value)}
                  rows={3}
                />
                <Button 
                  onClick={processCustomerMessage}
                  disabled={!customerMessage.trim()}
                  className="w-full"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Get AI Assistance
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Staff Notes</Label>
                <Textarea
                  placeholder="Add your notes about this call..."
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* AI Assistance Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                AI Assistant
                <Badge variant={aiAssistance.confidence > 80 ? "default" : "secondary"}>
                  {aiAssistance.confidence}% confidence
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiAssistance.suggestion ? (
                <>
                  <div className="space-y-2">
                    <Label>Suggested Response</Label>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm">"{aiAssistance.suggestion}"</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-xs text-gray-500">Intent</div>
                      <div className="font-medium capitalize">{aiAssistance.intent}</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-xs text-gray-500">Action</div>
                      <div className="font-medium">{aiAssistance.extractedData?.action || 'Continue'}</div>
                    </div>
                  </div>

                  {aiAssistance.extractedData?.shouldTransfer && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                          AI suggests transferring this call to a specialist
                        </span>
                      </div>
                    </div>
                  )}

                  {(aiAssistance.intent === 'reservation' || aiAssistance.intent === 'order') && (
                    <div className="space-y-2">
                      <Label>Quick Actions</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant="outline">
                          {aiAssistance.intent === 'reservation' ? 'Create Reservation' : 'Create Order'}
                        </Button>
                        <Button size="sm" variant="outline">
                          Check Availability
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Type what the customer said and click "Get AI Assistance" to receive intelligent suggestions.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Setup Instructions */}
      {callStatus === 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle>📞 Call Forwarding Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">1</span>
                  </div>
                  <h3 className="font-medium">Configure Call Forwarding</h3>
                  <p className="text-sm text-gray-600">
                    Set up your restaurant phone to forward to your staff's phone or computer
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold">2</span>
                  </div>
                  <h3 className="font-medium">Answer Forwarded Calls</h3>
                  <p className="text-sm text-gray-600">
                    Use this interface when a call comes in to get AI assistance
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold">3</span>
                  </div>
                  <h3 className="font-medium">AI-Powered Service</h3>
                  <p className="text-sm text-gray-600">
                    Get intelligent suggestions and automatic reservation/order creation
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">How to Set Up Call Forwarding:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li><strong>Landline:</strong> Dial *72 + your forwarding number</li>
                  <li><strong>Cell Phone:</strong> Go to Settings → Phone → Call Forwarding</li>
                  <li><strong>VoIP System:</strong> Configure forwarding in your provider's portal</li>
                  <li><strong>Business Phone:</strong> Contact your provider for setup assistance</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-800">Benefits of This System:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                  <li>No monthly fees or per-minute charges</li>
                  <li>AI assistance for every call</li>
                  <li>Automatic reservation and order creation</li>
                  <li>Real-time call analytics and logging</li>
                  <li>Works with your existing phone system</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demo Notice */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">Demo Mode Active</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            This interface simulates incoming calls. In production, real forwarded calls will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
