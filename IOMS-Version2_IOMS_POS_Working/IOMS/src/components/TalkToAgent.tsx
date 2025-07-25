/**
 * 🤖 Talk to Agent - Direct AI interaction for orders and reservations
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  User, 
  Send, 
  MessageSquare, 
  ShoppingCart, 
  Calendar,
  Clock,
  CheckCircle,
  Loader2
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  intent?: 'order' | 'reservation' | 'inquiry';
  actionRequired?: boolean;
  actionType?: 'create_order' | 'create_reservation';
  orderData?: any;
  reservationData?: any;
}

interface ChatSession {
  id: string;
  messages: ChatMessage[];
  status: 'active' | 'completed';
  customerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  createdAt: Date;
}

export function TalkToAgent() {
  const { toast } = useToast();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  const startSession = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start-session',
          customerInfo: {
            name: 'Web Customer',
            timestamp: new Date().toISOString()
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        setSession(data.session);
        toast({
          title: "Chat Started",
          description: "Connected to AI agent successfully!",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to start chat session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !session || isTyping) return;

    const userMessage = message.trim();
    setMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai-agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-message',
          sessionId: session.id,
          message: userMessage
        })
      });

      const data = await response.json();
      if (data.success) {
        setSession(data.session);
        
        // If an order or reservation was created, show success toast
        if (data.aiResponse.actionRequired) {
          if (data.aiResponse.actionType === 'create_order') {
            toast({
              title: "Order Created! 🍽️",
              description: `Total: $${data.aiResponse.orderData.total.toFixed(2)}`,
            });
            
            // Here you would typically send the order to your order management system
            console.log('Order created:', data.aiResponse.orderData);
            
          } else if (data.aiResponse.actionType === 'create_reservation') {
            toast({
              title: "Reservation Confirmed! 📅",
              description: `${data.aiResponse.reservationData.partySize} guests on ${data.aiResponse.reservationData.date}`,
            });
            
            // Here you would typically send the reservation to your reservation system
            console.log('Reservation created:', data.aiResponse.reservationData);
          }
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Message Failed",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const endSession = async () => {
    if (!session) return;

    try {
      await fetch('/api/ai-agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end-session',
          sessionId: session.id
        })
      });

      setSession(null);
      toast({
        title: "Chat Ended",
        description: "Thank you for using our service!",
      });
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getIntentIcon = (intent?: string) => {
    switch (intent) {
      case 'order': return <ShoppingCart className="h-4 w-4" />;
      case 'reservation': return <Calendar className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getIntentColor = (intent?: string) => {
    switch (intent) {
      case 'order': return 'bg-green-100 text-green-800';
      case 'reservation': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!session) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Bot className="h-6 w-6 text-blue-600" />
            Talk to Our AI Agent
          </CardTitle>
          <p className="text-gray-600">
            Get instant help with orders, reservations, and restaurant information
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <ShoppingCart className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold">Place Orders</h3>
              <p className="text-sm text-gray-600">Order food for delivery, pickup, or dine-in</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold">Make Reservations</h3>
              <p className="text-sm text-gray-600">Book a table for your party</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <MessageSquare className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold">Get Information</h3>
              <p className="text-sm text-gray-600">Ask about menu, hours, or location</p>
            </div>
          </div>
          
          <Button 
            onClick={startSession} 
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Bot className="h-4 w-4 mr-2" />
                Start Chat with AI Agent
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            AI Agent Chat
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Active
            </Badge>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={endSession}>
            End Chat
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {session.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                )}
                
                <div className={`max-w-[70%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                  <div
                    className={`rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    
                    {/* Show intent and action badges for AI messages */}
                    {msg.role === 'assistant' && (msg.intent || msg.actionRequired) && (
                      <div className="flex gap-2 mt-2">
                        {msg.intent && (
                          <Badge variant="secondary" className={`text-xs ${getIntentColor(msg.intent)}`}>
                            {getIntentIcon(msg.intent)}
                            <span className="ml-1 capitalize">{msg.intent}</span>
                          </Badge>
                        )}
                        {msg.actionRequired && (
                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Action Taken
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className={`text-xs text-gray-500 mt-1 ${
                    msg.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {formatTimestamp(msg.timestamp)}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (e.g., 'I want to order 2 pizzas' or 'Book a table for 4 people tonight')"
              disabled={isTyping}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!message.trim() || isTyping}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Try: "Order a pizza", "Book a table for 4 tonight", "What are your hours?"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
