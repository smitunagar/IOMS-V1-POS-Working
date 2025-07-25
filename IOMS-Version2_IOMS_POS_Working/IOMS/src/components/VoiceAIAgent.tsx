/**
 * 🎤 Voice AI Agent - Speech-to-Speech interface for orders and reservations
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Bot, 
  ShoppingCart, 
  Calendar,
  Play,
  Pause,
  RotateCcw,
  Settings,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface VoiceMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  intent?: string;
  action?: {
    type: 'order' | 'reservation';
    data: any;
    success: boolean;
  };
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onstart: () => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function VoiceAIAgent() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [sessionId] = useState(() => `voice-session-${Date.now()}`);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        let finalTranscript = '';

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = '';
          finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          // Update current transcript for display
          setCurrentTranscript(finalTranscript + interimTranscript);
          
          // If we have a final result, process it immediately
          if (finalTranscript.trim()) {
            console.log('Final transcript:', finalTranscript);
            handleVoiceInput(finalTranscript.trim());
            setCurrentTranscript('');
            setIsListening(false);
          }
        };

        recognitionRef.current.onstart = () => {
          console.log('Speech recognition started');
          setIsListening(true);
          setCurrentTranscript('');
          finalTranscript = '';
        };

        recognitionRef.current.onend = () => {
          console.log('Speech recognition ended');
          setIsListening(false);
          setCurrentTranscript('');
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          setCurrentTranscript('');
          
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            toast({
              title: "Speech Recognition Error",
              description: `Failed to recognize speech: ${event.error}`,
              variant: "destructive",
            });
          }
        };
      } else {
        toast({
          title: "Speech Recognition Not Available",
          description: "Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari.",
          variant: "destructive",
        });
      }

      synthRef.current = window.speechSynthesis;
      
      // Load voices immediately for Sam
      const loadVoices = () => {
        const voices = synthRef.current?.getVoices() || [];
        console.log('🎤 Voices loaded for Sam:', voices.length);
        console.log('🎤 Available voices:', voices.map(v => v.name));
      };
      
      // Load voices now and when they change
      loadVoices();
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
      
      // Also try loading voices after a short delay
      setTimeout(loadVoices, 100);
    }

    // Welcome message from Sam
    addMessage({
      type: 'assistant',
      content: 'Hello! I\'m Sam, your AI assistant for Museum Restaurant Hechingen. Press the microphone button and tell me what you\'d like to order or if you need to make a reservation.',
    });

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = useCallback((message: Omit<VoiceMessage, 'id' | 'timestamp'>) => {
    const newMessage: VoiceMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Please try Chrome, Edge, or Safari.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      console.log('Already listening, stopping first');
      stopListening();
      return;
    }

    try {
      console.log('Starting speech recognition...');
      setCurrentTranscript('');
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
      toast({
        title: "Microphone Error",
        description: "Failed to access microphone. Please check permissions and try again.",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      console.log('Stopping speech recognition...');
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setCurrentTranscript('');
  };

  const speak = (text: string) => {
    if (!audioEnabled || !synthRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1; // Higher pitch for female voice
    utterance.volume = 0.8;
    utterance.lang = 'en-US';

    // Enhanced female voice selection for Sam
    const voices = synthRef.current.getVoices();
    console.log('🎤 Sam looking for voice. Available:', voices.length);
    
    let selectedVoice = null;
    
    // Try to find specific female voices for Sam
    const preferredVoices = [
      'Microsoft Zira Desktop - English (United States)',
      'Microsoft Zira - English (United States)', 
      'Google US English Female',
      'Microsoft Eva - English (United States)',
      'Microsoft Aria - English (United States)',
      'Samantha',
      'Victoria',
      'Karen',
      'Moira'
    ];
    
    // Search for preferred female voices
    for (const voiceName of preferredVoices) {
      selectedVoice = voices.find(voice => 
        voice.name.includes(voiceName) || 
        voice.name.toLowerCase().includes(voiceName.toLowerCase())
      );
      if (selectedVoice) {
        console.log('🎤 Sam found preferred voice:', selectedVoice.name);
        break;
      }
    }
    
    // Fallback: find any female voice by keywords
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => {
        const name = voice.name.toLowerCase();
        return name.includes('female') ||
               name.includes('woman') ||
               name.includes('zira') ||
               name.includes('eva') ||
               name.includes('aria') ||
               name.includes('samantha') ||
               name.includes('karen') ||
               name.includes('moira') ||
               name.includes('victoria');
      });
      if (selectedVoice) {
        console.log('🎤 Sam found female voice by keyword:', selectedVoice.name);
      }
    }
    
    // Final fallback: use first available voice
    if (!selectedVoice && voices.length > 0) {
      selectedVoice = voices[0];
      console.log('🎤 Sam using fallback voice:', selectedVoice.name);
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('🎤 Sam speaking with voice:', selectedVoice.name, 'Lang:', selectedVoice.lang);
    } else {
      console.log('🎤 Sam using default system voice');
    }

    utterance.onstart = () => {
      console.log('🤖 Sam started speaking:', text);
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      console.log('🤖 Sam finished speaking');
      setIsSpeaking(false);
    };
    utterance.onerror = (event) => {
      console.error('🤖 Sam speech error:', event);
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handleVoiceInput = async (transcript: string) => {
    if (!transcript.trim()) {
      console.log('Empty transcript, ignoring');
      return;
    }

    console.log('Processing voice input:', transcript);

    // Add user message
    addMessage({
      type: 'user',
      content: transcript,
    });

    setIsProcessing(true);

    try {
      console.log('Sending to voice-agent API...');
      
      // Send to AI for processing
      const response = await fetch('/api/voice-agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: transcript,
          sessionId,
          isVoice: true,
          userId: currentUser?.id || 'demo-user' // Pass current user ID
        }),
      });

      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response data:', data);

      if (data.success) {
        const assistantMessage = addMessage({
          type: 'assistant',
          content: data.response,
          intent: data.intent,
          action: data.action
        });

        // Speak the response
        if (data.response) {
          speak(data.response);
        }

        if (data.action && data.action.success) {
          toast({
            title: data.action.type === 'order' ? "Order Created" : "Reservation Made",
            description: data.action.type === 'order' 
              ? `Order #${data.action.data.orderNumber} created successfully`
              : `Reservation #${data.action.data.reservationNumber} confirmed`,
          });
        }
      } else {
        console.error('API returned error:', data.error);
        const errorMessage = "I'm sorry, I couldn't process that request. Could you please try again?";
        addMessage({
          type: 'assistant',
          content: errorMessage,
        });
        speak(errorMessage);
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
      const errorMessage = "I'm experiencing some technical difficulties. Please try again in a moment.";
      addMessage({
        type: 'assistant',
        content: errorMessage,
      });
      speak(errorMessage);
      
      toast({
        title: "Processing Error",
        description: "Failed to process your voice input. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    addMessage({
      type: 'assistant',
      content: 'Conversation cleared. How can I help you today?',
    });
  };

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'order': return <ShoppingCart className="h-4 w-4" />;
      case 'reservation': return <Calendar className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'order': return 'bg-green-100 text-green-800';
      case 'reservation': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-6 w-6" />
            Voice AI Assistant
            {isListening && (
              <Badge variant="secondary" className="bg-red-100 text-red-800 animate-pulse">
                Listening...
              </Badge>
            )}
            {isSpeaking && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Speaking...
              </Badge>
            )}
            {isProcessing && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Processing...
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Click the microphone and speak naturally to place orders or make reservations
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAudioEnabled(!audioEnabled)}
                title={audioEnabled ? "Disable voice responses" : "Enable voice responses"}
              >
                {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearConversation}
                title="Clear conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              variant={isListening ? "destructive" : "default"}
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing || isSpeaking}
              className="h-16 w-16 rounded-full"
            >
              {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </Button>
            
            {/* Test Sam's Voice Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => speak("Hello! This is Sam testing my voice. I'm your AI assistant for Museum Restaurant Hechingen.")}
              disabled={isProcessing || isSpeaking}
              className="px-3 py-2"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Test Sam's Voice
            </Button>
            
            {isSpeaking && (
              <Button
                size="lg"
                variant="outline"
                onClick={stopSpeaking}
                className="h-16 w-16 rounded-full"
              >
                <Pause className="h-8 w-8" />
              </Button>
            )}
          </div>
          
          {currentTranscript && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center border-2 border-blue-200">
              <span className="text-sm text-blue-600 font-medium">You're saying: </span>
              <span className="font-medium text-blue-800">{currentTranscript}</span>
              <div className="flex items-center justify-center mt-2">
                <div className="animate-pulse bg-blue-500 rounded-full h-2 w-2 mr-1"></div>
                <div className="animate-pulse bg-blue-400 rounded-full h-2 w-2 mr-1" style={{animationDelay: '0.1s'}}></div>
                <div className="animate-pulse bg-blue-300 rounded-full h-2 w-2" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          )}
          
          {isProcessing && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-center border-2 border-yellow-200">
              <span className="text-sm text-yellow-600 font-medium">Processing your request...</span>
              <div className="flex items-center justify-center mt-2">
                <div className="animate-spin border-2 border-yellow-500 border-t-transparent rounded-full h-4 w-4"></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation */}
      <Card>
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.type === 'assistant' && (
                        <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm">{message.content}</p>
                        
                        {message.intent && (
                          <div className="mt-2 flex items-center gap-2">
                            <Badge className={`text-xs ${getIntentColor(message.intent)}`}>
                              {getIntentIcon(message.intent)}
                              <span className="ml-1 capitalize">{message.intent}</span>
                            </Badge>
                          </div>
                        )}
                        
                        {message.action && (
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant="secondary" className={
                              message.action.success 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }>
                              {message.action.success ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <AlertCircle className="h-3 w-3 mr-1" />
                              )}
                              {message.action.success ? 'Completed' : 'Failed'}
                            </Badge>
                          </div>
                        )}
                        
                        <div className="mt-1 text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Commands</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Order Examples:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• "I'd like to order a large pizza with pepperoni"</li>
                <li>• "Can I get two burgers and fries?"</li>
                <li>• "I want to place an order for pickup"</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Reservation Examples:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• "I need a table for 4 people tonight at 7 PM"</li>
                <li>• "Can I book a reservation for tomorrow?"</li>
                <li>• "I'd like to reserve a table for 6"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
