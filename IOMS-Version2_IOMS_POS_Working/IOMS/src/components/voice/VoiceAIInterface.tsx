'use client';

/**
 * 🎤 Voice AI Agent Interface
 * Interactive voice calling agent for restaurant orders and reservations
 */

import React, { useState, useEffect, useRef } from 'react';
import { VoiceAIAgent, ConversationState } from '@/lib/voiceAIAgent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  User, 
  Calendar, 
  Clock, 
  Users, 
  ShoppingCart,
  Volume2,
  VolumeX,
  Settings,
  MessageCircle,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function VoiceAIInterface() {
  const [agent, setAgent] = useState<VoiceAIAgent | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for speech recognition support
    const hasSupport = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setIsSupported(hasSupport);

    if (hasSupport) {
      // Initialize the voice agent
      const voiceAgent = new VoiceAIAgent({
        language: 'en-US',
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0
      });

      voiceAgent.setStateChangeCallback((state) => {
        setConversationState(state);
        
        // Auto-scroll to bottom when new messages arrive
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });

      setAgent(voiceAgent);
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, []);

  const startCall = () => {
    if (!agent || !isSupported) return;

    try {
      agent.startConversation();
      setIsActive(true);
      setIsListening(true);
      setCallDuration(0);

      // Start call timer
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to start voice call:', error);
      alert('Failed to start voice call. Please check your microphone permissions.');
    }
  };

  const endCall = () => {
    if (!agent) return;

    agent.stopConversation();
    setIsActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    setConversationState(null);

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  const toggleMute = () => {
    // Toggle microphone (implement mute functionality)
    setIsListening(!isListening);
  };

  const toggleSpeaker = () => {
    // Toggle speaker (implement speaker mute)
    setIsSpeaking(!isSpeaking);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseColor = (phase: string): string => {
    switch (phase) {
      case 'greeting': return 'bg-blue-500';
      case 'listening': return 'bg-green-500';
      case 'confirming': return 'bg-yellow-500';
      case 'processing': return 'bg-purple-500';
      case 'completed': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'reservation': return <Calendar className="h-4 w-4" />;
      case 'order': return <ShoppingCart className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  if (!isSupported) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Voice AI Not Supported
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Your browser doesn't support voice recognition. Please use a modern browser like Chrome, Safari, or Edge.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Call Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Voice AI Restaurant Agent
            </div>
            {isActive && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Live Call - {formatTime(callDuration)}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-4">
            {!isActive ? (
              <Button
                onClick={startCall}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg"
                size="lg"
              >
                <Phone className="h-6 w-6 mr-2" />
                Start Call
              </Button>
            ) : (
              <div className="flex items-center gap-4">
                <Button
                  onClick={toggleMute}
                  variant={isListening ? "default" : "destructive"}
                  size="lg"
                >
                  {isListening ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>
                
                <Button
                  onClick={toggleSpeaker}
                  variant={isSpeaking ? "default" : "secondary"}
                  size="lg"
                >
                  {isSpeaking ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </Button>
                
                <Button
                  onClick={endCall}
                  variant="destructive"
                  size="lg"
                  className="px-8"
                >
                  <PhoneOff className="h-6 w-6 mr-2" />
                  End Call
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conversation State */}
      {conversationState && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Conversation Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Phase</label>
                <Badge className={`${getPhaseColor(conversationState.phase)} text-white`}>
                  {conversationState.phase}
                </Badge>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Intent</label>
                <div className="flex items-center gap-2">
                  {getIntentIcon(conversationState.intent)}
                  <span className="capitalize">{conversationState.intent}</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Confidence</label>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${conversationState.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {Math.round(conversationState.confidence * 100)}%
                </span>
              </div>

              {conversationState.needsHumanAssistance && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Human Assistance Needed</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {conversationState.customerData.name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{conversationState.customerData.name}</span>
                </div>
              )}
              
              {conversationState.customerData.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{conversationState.customerData.phone}</span>
                </div>
              )}
              
              {!conversationState.customerData.name && !conversationState.customerData.phone && (
                <p className="text-gray-500 text-sm">No customer data yet</p>
              )}
            </CardContent>
          </Card>

          {/* Intent-Specific Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {conversationState.intent === 'reservation' ? 'Reservation Details' : 
                 conversationState.intent === 'order' ? 'Order Details' : 'Details'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {conversationState.intent === 'reservation' && (
                <>
                  {conversationState.reservationData.partySize && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>{conversationState.reservationData.partySize} people</span>
                    </div>
                  )}
                  
                  {conversationState.reservationData.date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{conversationState.reservationData.date}</span>
                    </div>
                  )}
                  
                  {conversationState.reservationData.time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{conversationState.reservationData.time}</span>
                    </div>
                  )}
                </>
              )}
              
              {conversationState.intent === 'order' && (
                <>
                  {conversationState.orderData.items.length > 0 && (
                    <div>
                      <label className="text-sm text-gray-600">Items</label>
                      <div className="space-y-1">
                        {conversationState.orderData.items.map((item, index) => (
                          <div key={index} className="text-sm">
                            {item.quantity}x {item.name}
                            {item.specialInstructions && (
                              <span className="text-gray-500"> ({item.specialInstructions})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-gray-500" />
                    <span className="capitalize">{conversationState.orderData.orderType}</span>
                  </div>
                </>
              )}
              
              {conversationState.intent === 'unknown' && (
                <p className="text-gray-500 text-sm">Determining customer intent...</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conversation Transcript */}
      {conversationState && conversationState.transcript.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Conversation Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 w-full" ref={scrollRef}>
              <div className="space-y-2">
                {conversationState.transcript.map((message, index) => {
                  const isAgent = message.startsWith('Agent:');
                  return (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg ${
                        isAgent 
                          ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                          : 'bg-gray-50 border-l-4 border-l-gray-500'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {isAgent ? (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <MessageCircle className="h-3 w-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 mb-1">
                            {isAgent ? 'AI Agent' : 'Customer'}
                          </div>
                          <div className="text-sm">
                            {message.replace(/^(Agent|Customer):\s*/, '')}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Testing Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Testing Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              onClick={() => agent?.simulateCustomerInput("Hi, I'd like to make a reservation")}
              variant="outline"
              size="sm"
              disabled={!isActive}
            >
              Test Reservation
            </Button>
            
            <Button
              onClick={() => agent?.simulateCustomerInput("I want to order food for delivery")}
              variant="outline"
              size="sm"
              disabled={!isActive}
            >
              Test Order
            </Button>
            
            <Button
              onClick={() => agent?.simulateCustomerInput("Table for 4 people at 7pm tonight")}
              variant="outline"
              size="sm"
              disabled={!isActive}
            >
              Test Details
            </Button>
            
            <Button
              onClick={() => agent?.simulateCustomerInput("Yes, that's correct")}
              variant="outline"
              size="sm"
              disabled={!isActive}
            >
              Test Confirm
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
