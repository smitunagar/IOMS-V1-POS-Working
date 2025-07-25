'use client';

/**
 * 🤖 Voice AI Agent Page
 * Custom voice calling agent for restaurant orders and reservations
 */

import React from 'react';
import VoiceAIInterface from '@/components/voice/VoiceAIInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  Phone, 
  Calendar, 
  ShoppingCart, 
  Users, 
  Clock,
  CheckCircle,
  Zap,
  Shield,
  Heart
} from 'lucide-react';

export default function VoiceAIAgentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Mic className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Voice AI Restaurant Agent
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Custom-built voice calling agent that automatically handles restaurant orders and table reservations. 
            Say goodbye to third-party integrations and hello to complete control!
          </p>
          <div className="flex items-center justify-center gap-3">
            <Badge variant="secondary" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Custom Built
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Real-time Processing
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              100% Reliable
            </Badge>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
                Table Reservations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Automatic party size detection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Date and time extraction
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Customer name capture
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Special requests handling
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                Food Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Menu item recognition
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Quantity and modifications
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Dine-in, takeout, delivery
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Automatic pricing
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="h-5 w-5 text-red-600" />
                Smart Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Natural conversation flow
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Confirmation before processing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Human handoff when needed
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Real-time dashboard updates
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Main Voice Interface */}
        <VoiceAIInterface />

        {/* Quick Start Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Quick Start Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">1</span>
                </div>
                <h3 className="font-medium">Start Call</h3>
                <p className="text-sm text-gray-600">
                  Click the "Start Call" button to begin a voice conversation.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">2</span>
                </div>
                <h3 className="font-medium">Allow Microphone</h3>
                <p className="text-sm text-gray-600">
                  Grant microphone permissions when prompted by your browser.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-semibold">3</span>
                </div>
                <h3 className="font-medium">Speak Naturally</h3>
                <p className="text-sm text-gray-600">
                  Say what you want - "I need a reservation" or "I want to order food".
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">4</span>
                </div>
                <h3 className="font-medium">Confirm & Done</h3>
                <p className="text-sm text-gray-600">
                  Review the details and confirm. Your order/reservation is created automatically!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sample Conversations */}
        <Card>
          <CardHeader>
            <CardTitle>Sample Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Reservation Example
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div><strong>🤖 Agent:</strong> "Hello! Welcome to our restaurant. How can I help you today?"</div>
                  <div><strong>👤 Customer:</strong> "Hi, I'd like to make a reservation for tonight"</div>
                  <div><strong>🤖 Agent:</strong> "I'd be happy to help you with a reservation! How many people will be dining?"</div>
                  <div><strong>👤 Customer:</strong> "Table for 4 at 7pm, name is John Smith"</div>
                  <div><strong>🤖 Agent:</strong> "Perfect! I have a reservation for 4 people under John Smith for tonight at 7pm. Is this correct?"</div>
                  <div><strong>👤 Customer:</strong> "Yes, that's right"</div>
                  <div><strong>🤖 Agent:</strong> "Great! Your reservation has been confirmed. Your reservation number is VOICE-123456789. We look forward to seeing you!"</div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-green-600" />
                  Order Example
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div><strong>🤖 Agent:</strong> "Hello! Welcome to our restaurant. How can I help you today?"</div>
                  <div><strong>👤 Customer:</strong> "I want to place an order for delivery"</div>
                  <div><strong>🤖 Agent:</strong> "Great! I can help you place an order. What would you like to order today?"</div>
                  <div><strong>👤 Customer:</strong> "I'll have 2 pizzas and a salad"</div>
                  <div><strong>🤖 Agent:</strong> "Got it! 2 pizzas and 1 salad. Anything else you'd like to add to your order?"</div>
                  <div><strong>👤 Customer:</strong> "That's all, name is Sarah"</div>
                  <div><strong>🤖 Agent:</strong> "Perfect! Your order has been placed. Your order number is VOICE-ORDER-987654321. We'll have it ready for delivery soon!"</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
