/**
 * 📞 Ultimate Phone System - Complete All-in-One Interface
 * Clean, simple, and powerful phone system management
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  PhoneOutgoing,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  Users,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  PlayCircle,
  PauseCircle,
  Square,
  RotateCcw,
  Zap,
  Shield,
  MessageSquare,
  Star,
  Timer,
  Activity,
  Bell,
  AlertCircle,
  Headphones,
  Radio,
  Smartphone
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Types
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

export default function UltimatePhoneSystem() {
  // Main state
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [callHistory, setCallHistory] = useState<Call[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [customerMessage, setCustomerMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalCalls: 127,
    activeCall: false,
    callsToday: 15,
    avgDuration: 185,
    successRate: 94,
    systemHealth: 'excellent'
  });

  // AI and Voice state
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('+1 (555) 123-4567');
  const [staffName, setStaffName] = useState('Restaurant Staff');

  // UI state
  const [activeSection, setActiveSection] = useState<'call' | 'setup' | 'analytics'>('call');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Refs
  const callTimerRef = useRef<NodeJS.Timeout>();

  // Sample call history
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/phone-agent');
      const data = await response.json();
      
      if (data.success) {
        if (data.stats) {
          setSystemStats(data.stats);
        }
        if (data.callHistory) {
          setCallHistory(data.callHistory);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to sample data
      setCallHistory([
        {
          id: '1',
          number: '+1 (555) 987-6543',
          name: 'John Smith',
          type: 'incoming',
          status: 'ended',
          startTime: new Date(Date.now() - 300000),
          duration: 180,
          intent: 'reservation',
          notes: 'Table for 4, tonight 7pm'
        },
        {
          id: '2',
          number: '+1 (555) 555-0123',
          name: 'Sarah Johnson',
          type: 'incoming',
          status: 'ended',
          startTime: new Date(Date.now() - 600000),
          duration: 95,
          intent: 'order',
          notes: '2 pizzas, 1 salad - delivery'
        },
        {
          id: '3',
          number: '+1 (555) 444-7890',
          name: 'Mike Wilson',
          type: 'incoming',
          status: 'ended',
          startTime: new Date(Date.now() - 900000),
          duration: 60,
          intent: 'inquiry',
          notes: 'Asked about hours and menu'
        }
      ]);
    }
  };

  // Call timer
  useEffect(() => {
    if (currentCall && currentCall.status === 'active') {
      callTimerRef.current = setInterval(() => {
        setCurrentCall(prev => prev ? { ...prev, duration: prev.duration + 1 } : null);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [currentCall?.status]);

  // Simulate incoming call
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

  // Answer call
  const answerCall = () => {
    if (currentCall) {
      setCurrentCall({ ...currentCall, status: 'active' });
      if (voiceEnabled) {
        speak("Hello! Thank you for calling. How can I help you today?");
      }
    }
  };

  // End call
  const endCall = async () => {
    if (currentCall) {
      const endedCall = { ...currentCall, status: 'ended' as const };
      
      // Log the call to API
      try {
        await fetch('/api/phone-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'log-call',
            data: {
              number: endedCall.number,
              name: endedCall.name,
              type: endedCall.type,
              duration: endedCall.duration,
              intent: customerMessage ? 'processed' : 'brief',
              notes: customerMessage || 'No specific request'
            }
          })
        });
      } catch (error) {
        console.error('Error logging call:', error);
      }
      
      setCallHistory(prev => [endedCall, ...prev.slice(0, 9)]);
      setCurrentCall(null);
      setCustomerMessage('');
      setAiResponse('');
      setSystemStats(prev => ({ 
        ...prev, 
        activeCall: false, 
        totalCalls: prev.totalCalls + 1,
        callsToday: prev.callsToday + 1
      }));
    }
  };

  // Hold call
  const holdCall = () => {
    if (currentCall) {
      setCurrentCall({ 
        ...currentCall, 
        status: currentCall.status === 'hold' ? 'active' : 'hold' 
      });
    }
  };

  // AI Processing
  const processWithAI = async () => {
    if (!customerMessage.trim()) return;

    try {
      setAiResponse('Processing...');
      
      const response = await fetch('/api/phone-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process-message',
          data: { message: customerMessage }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setAiResponse(data.response);
        
        if (voiceEnabled && isSpeaking) {
          speak(data.response);
        }
      } else {
        setAiResponse('Sorry, I had trouble processing that. Could you please repeat your request?');
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setAiResponse('Sorry, I had trouble processing that. Could you please repeat your request?');
    }
  };

  // Text-to-speech
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      speechSynthesis.speak(utterance);
    }
  };

  // Voice recognition
  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCustomerMessage(transcript);
      };
      
      recognition.start();
    } else {
      alert('Speech recognition not supported in this browser');
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status color
  const getStatusColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-blue-600 rounded-full">
              <Phone className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Ultimate Phone System
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Complete AI-powered phone management in one beautiful interface</p>
        </div>

        {/* Quick Stats Bar */}
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

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Active Call */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Current Call */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {currentCall ? (
                      currentCall.status === 'ringing' ? (
                        <PhoneIncoming className="h-6 w-6 text-green-600 animate-pulse" />
                      ) : currentCall.status === 'active' ? (
                        <Phone className="h-6 w-6 text-blue-600" />
                      ) : (
                        <Timer className="h-6 w-6 text-yellow-600" />
                      )
                    ) : (
                      <Phone className="h-6 w-6 text-gray-400" />
                    )}
                    {currentCall ? (
                      currentCall.status === 'ringing' ? 'Incoming Call' :
                      currentCall.status === 'active' ? 'Active Call' :
                      'Call on Hold'
                    ) : 'Ready for Calls'}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsConfigOpen(!isConfigOpen)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    {!currentCall && (
                      <Button onClick={simulateCall} variant="outline" size="sm">
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Demo Call
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {currentCall ? (
                  <>
                    {/* Call Info */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">{currentCall.name}</h3>
                          <p className="text-gray-600">{currentCall.number}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatDuration(currentCall.duration)}
                          </div>
                          <Badge variant={
                            currentCall.status === 'ringing' ? 'secondary' :
                            currentCall.status === 'active' ? 'default' : 'outline'
                          }>
                            {currentCall.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Call Controls */}
                      <div className="flex justify-center gap-3">
                        {currentCall.status === 'ringing' ? (
                          <>
                            <Button onClick={answerCall} size="lg" className="bg-green-600 hover:bg-green-700">
                              <Phone className="h-5 w-5 mr-2" />
                              Answer
                            </Button>
                            <Button onClick={endCall} variant="destructive" size="lg">
                              <XCircle className="h-5 w-5 mr-2" />
                              Decline
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button onClick={holdCall} variant="outline" size="lg">
                              {currentCall.status === 'hold' ? (
                                <PlayCircle className="h-5 w-5 mr-2" />
                              ) : (
                                <PauseCircle className="h-5 w-5 mr-2" />
                              )}
                              {currentCall.status === 'hold' ? 'Resume' : 'Hold'}
                            </Button>
                            <Button onClick={endCall} variant="destructive" size="lg">
                              <Phone className="h-5 w-5 mr-2" />
                              End Call
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* AI Assistant - Only show when call is active */}
                    {currentCall.status === 'active' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-semibold flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-purple-600" />
                            AI Assistant
                          </h4>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setVoiceEnabled(!voiceEnabled)}
                            >
                              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsSpeaking(!isSpeaking)}
                            >
                              {isSpeaking ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        {/* Customer Message Input */}
                        <div className="space-y-3">
                          <Label>What is the customer saying?</Label>
                          <div className="flex gap-2">
                            <Textarea
                              value={customerMessage}
                              onChange={(e) => setCustomerMessage(e.target.value)}
                              placeholder="Type or speak the customer's message..."
                              className="flex-1"
                              rows={2}
                            />
                            <Button 
                              onClick={startListening} 
                              variant="outline"
                              disabled={isListening}
                              className="px-3"
                            >
                              {isListening ? (
                                <Radio className="h-4 w-4 text-red-500 animate-pulse" />
                              ) : (
                                <Mic className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <Button 
                            onClick={processWithAI} 
                            disabled={!customerMessage.trim()}
                            className="w-full bg-purple-600 hover:bg-purple-700"
                          >
                            <Zap className="h-4 w-4 mr-2" />
                            Get AI Assistance
                          </Button>
                        </div>

                        {/* AI Response */}
                        {aiResponse && (
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-l-4 border-purple-500">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-purple-100 rounded-full">
                                <MessageSquare className="h-4 w-4 text-purple-600" />
                              </div>
                              <div className="flex-1">
                                <h5 className="font-medium text-purple-800 mb-2">AI Suggestion</h5>
                                <p className="text-purple-700">{aiResponse}</p>
                                {voiceEnabled && (
                                  <Button 
                                    onClick={() => speak(aiResponse)} 
                                    variant="outline" 
                                    size="sm" 
                                    className="mt-2"
                                  >
                                    <Volume2 className="h-3 w-3 mr-1" />
                                    Speak
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Phone className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Ready for Calls</h3>
                    <p className="text-gray-600 mb-6">Your AI-powered phone system is ready to handle incoming calls</p>
                    <div className="flex justify-center gap-3">
                      <Button onClick={simulateCall} variant="outline">
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Test with Demo Call
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Setup Panel */}
            {isConfigOpen && (
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Quick Setup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Restaurant Phone</Label>
                      <Input
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Staff Name</Label>
                      <Input
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Voice AI Assistant</h4>
                      <p className="text-sm text-gray-600">Enable AI voice responses</p>
                    </div>
                    <Button
                      variant={voiceEnabled ? "default" : "outline"}
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                    >
                      {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Auto Mode</h4>
                      <p className="text-sm text-gray-600">Automatically process customer requests</p>
                    </div>
                    <Button
                      variant={autoMode ? "default" : "outline"}
                      onClick={() => setAutoMode(!autoMode)}
                    >
                      {autoMode ? <Zap className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Call History & Analytics */}
          <div className="space-y-6">
            
            {/* Recent Calls */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Calls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {callHistory.map((call) => (
                    <div key={call.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          call.type === 'incoming' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {call.type === 'incoming' ? (
                            <PhoneIncoming className="h-4 w-4" />
                          ) : (
                            <PhoneOutgoing className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{call.name}</div>
                          <div className="text-xs text-gray-600">{call.number}</div>
                          {call.intent && (
                            <Badge variant="outline" className="text-xs">
                              {call.intent}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-600">
                          {formatDuration(call.duration)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {call.startTime.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={simulateCall} className="w-full" variant="outline">
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Simulate Call
                </Button>
                <Button 
                  onClick={() => speak("Phone system test successful. All systems operational.")} 
                  className="w-full" 
                  variant="outline"
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  Test Voice
                </Button>
                <Button 
                  onClick={() => setIsConfigOpen(!isConfigOpen)} 
                  className="w-full" 
                  variant="outline"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Phone System</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Voice AI</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">Ready</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Call Forwarding</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">Active</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">Connected</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
