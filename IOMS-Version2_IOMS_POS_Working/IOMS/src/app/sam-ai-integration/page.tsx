/**
 * 🤖 SAM AI Integration Dashboard
 * Monitor and manage Retell AI integration with IOMS
 * View call logs, orders, and reservations from SAM AI
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Phone, 
  Calendar, 
  ShoppingCart, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  Bot,
  Webhook,
  Activity,
  TrendingUp
} from 'lucide-react';
import { getReservations, getUpcomingReservations, type TableReservation } from '@/lib/retellAiIntegration';
import { getOrders, type Order } from '@/lib/orderService';
import { useAuth } from '@/contexts/AuthContext';

interface WebhookLog {
  type: string;
  call_id: string;
  result: any;
  timestamp: string;
}

export default function SamAiIntegration() {
  const { currentUser } = useAuth();
  const [reservations, setReservations] = useState<TableReservation[]>([]);
  const [upcomingReservations, setUpcomingReservations] = useState<TableReservation[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [stats, setStats] = useState({
    totalCalls: 0,
    successfulOrders: 0,
    successfulReservations: 0,
    avgConfidenceScore: 0
  });

  useEffect(() => {
    if (!currentUser?.id) return;

    loadData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const loadData = async () => {
    if (!currentUser?.id) return;

    try {
      // First, sync with server-side data
      await syncServerData();
      
      // Then load from localStorage (which now includes server data)
      const allReservations = getReservations(currentUser.id);
      const upcoming = getUpcomingReservations(currentUser.id);
      setReservations(allReservations);
      setUpcomingReservations(upcoming);

      // Load recent orders (from SAM AI)
      const allOrders = getOrders(currentUser.id);
      const samAiOrders = allOrders.filter(order => 
        order.tableId?.includes('retell') || 
        order.table?.includes('Retell') ||
        order.table?.includes('SAM')
      ).slice(0, 10);
      setRecentOrders(samAiOrders);

      // Load webhook logs
      const logs = JSON.parse(localStorage.getItem(`webhook_logs_${currentUser.id}`) || '[]');
      setWebhookLogs(logs.slice(-20)); // Last 20 logs

      // Calculate stats
      const retellReservations = allReservations.filter(r => r.created_by === 'retell-ai');
      const successfulCalls = logs.filter((log: WebhookLog) => log.type === 'retell_webhook_success');
      
      const avgConfidence = logs.length > 0 
        ? logs.reduce((sum: number, log: WebhookLog) => sum + (log.result?.confidence_score || 0), 0) / logs.length
        : 0;

      setStats({
        totalCalls: logs.length,
        successfulOrders: samAiOrders.length,
        successfulReservations: retellReservations.length,
        avgConfidenceScore: avgConfidence
      });

    } catch (error) {
      console.error('Error loading SAM AI data:', error);
    }
  };

  const syncServerData = async () => {
    if (!currentUser?.id) return;
    
    try {
      console.log('🔄 Syncing with server data...');
      
      // Fetch server-side reservations
      const response = await fetch(`/api/sam-ai/sync?userId=${currentUser.id}&type=samAiReservations`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.length > 0) {
          console.log('📥 Found server reservations:', result.data.length);
          
          // Get current client data
          const currentClientData = JSON.parse(localStorage.getItem(`samAiReservations_${currentUser.id}`) || '[]');
          
          // Merge with server data
          const merged = [...currentClientData];
          let addedCount = 0;
          
          for (const serverItem of result.data) {
            if (!merged.find(item => item.id === serverItem.id)) {
              merged.push(serverItem);
              addedCount++;
            }
          }
          
          if (addedCount > 0) {
            localStorage.setItem(`samAiReservations_${currentUser.id}`, JSON.stringify(merged));
            console.log(`✅ Synced ${addedCount} new reservations from server`);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing server data:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'confirmed': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'completed': { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      'cancelled': { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const testWebhook = async () => {
    try {
      const testPayload = {
        event_type: 'call_ended',
        timestamp: new Date().toISOString(),
        call: {
          call_id: `test_${Date.now()}`,
          agent_id: 'default',
          call_type: 'inbound',
          call_status: 'ended',
          from_number: '+1234567890',
          duration: 120,
          transcript: {
            text: 'Hi, I\'d like to make a reservation for 2 people tomorrow at 7 PM. My name is John Doe and my phone number is 555-1234.',
            confidence: 0.95
          },
          analysis: {
            customer_intent: 'reservation',
            customer_info: {
              name: 'John Doe',
              phone: '555-1234'
            },
            reservation_info: {
              date_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              party_size: 2,
              special_requests: 'Window table if possible'
            },
            confidence_score: 0.95,
            requires_followup: false
          }
        }
      };

      const response = await fetch('/api/retell-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RETELL_WEBHOOK_SECRET || 'default-secret-dev'}`
        },
        body: JSON.stringify(testPayload)
      });

      const result = await response.json();
      
      if (result.success) {
        alert('✅ Test webhook successful! Check the Recent Activity tab.');
        loadData(); // Refresh data
      } else {
        alert(`❌ Test webhook failed: ${result.message}`);
      }
    } catch (error) {
      alert(`❌ Test webhook error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const assignTableToReservation = async (reservationId: string, partySize: number) => {
    if (!currentUser?.id) return;
    
    const { autoAssignTable } = await import('@/lib/retellAiIntegration');
    const result = autoAssignTable(currentUser.id, reservationId, partySize);
    
    if (result.success) {
      alert(`✅ ${result.message}`);
      loadData(); // Refresh data
    } else {
      alert(`❌ Table assignment failed: ${result.message}`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="text-blue-600" />
            SAM AI Integration
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage Retell AI integration with IOMS
          </p>
        </div>
        <Button onClick={testWebhook} variant="outline">
          <Webhook className="w-4 h-4 mr-2" />
          Test Webhook
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold">{stats.totalCalls}</p>
              </div>
              <Phone className="text-blue-500 w-8 h-8" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">AI Orders</p>
                <p className="text-2xl font-bold">{stats.successfulOrders}</p>
              </div>
              <ShoppingCart className="text-green-500 w-8 h-8" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">AI Reservations</p>
                <p className="text-2xl font-bold">{stats.successfulReservations}</p>
              </div>
              <Calendar className="text-purple-500 w-8 h-8" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Confidence</p>
                <p className="text-2xl font-bold">{(stats.avgConfidenceScore * 100).toFixed(1)}%</p>
              </div>
              <TrendingUp className="text-orange-500 w-8 h-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Reservations</TabsTrigger>
          <TabsTrigger value="reservations">All Reservations</TabsTrigger>
          <TabsTrigger value="orders">Recent Orders</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        {/* Upcoming Reservations */}
        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Reservations (Next 24 Hours)
              </CardTitle>
              <CardDescription>
                Reservations made through SAM AI calling agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingReservations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming reservations</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingReservations.map((reservation) => (
                    <div key={reservation.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-semibold">{reservation.customer_name}</h3>
                            <p className="text-sm text-gray-600">{reservation.customer_phone}</p>
                          </div>
                        </div>
                        {getStatusBadge(reservation.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Date & Time:</span>
                          <p>{new Date(reservation.reservation_datetime).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Party Size:</span>
                          <p>{reservation.party_size} guests</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Table:</span>
                          <div className="flex items-center gap-2">
                            <p>{reservation.table_name || 'Not assigned'}</p>
                            {!reservation.table_name && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => assignTableToReservation(reservation.id, reservation.party_size)}
                                className="text-xs"
                              >
                                Assign Table
                              </Button>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Source:</span>
                          <p className="flex items-center gap-1">
                            <Bot className="w-3 h-3" />
                            SAM AI
                          </p>
                        </div>
                      </div>
                      
                      {reservation.special_requests && (
                        <div className="text-sm">
                          <span className="text-gray-500">Special Requests:</span>
                          <p className="mt-1 p-2 bg-gray-50 rounded">{reservation.special_requests}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Reservations */}
        <TabsContent value="reservations">
          <Card>
            <CardHeader>
              <CardTitle>All SAM AI Reservations</CardTitle>
              <CardDescription>
                Complete history of reservations made through the calling agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reservations.filter(r => r.created_by === 'retell-ai').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No SAM AI reservations yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reservations
                    .filter(r => r.created_by === 'retell-ai')
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((reservation) => (
                    <div key={reservation.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{reservation.customer_name}</h3>
                          <p className="text-sm text-gray-600">{reservation.customer_phone}</p>
                        </div>
                        {getStatusBadge(reservation.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>📅 {new Date(reservation.reservation_datetime).toLocaleDateString()}</div>
                        <div>⏰ {new Date(reservation.reservation_datetime).toLocaleTimeString()}</div>
                        <div>👥 {reservation.party_size} guests</div>
                      </div>
                      
                      {reservation.confidence_score && (
                        <div className="mt-2 text-xs text-gray-500">
                          AI Confidence: {(reservation.confidence_score * 100).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Orders */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Recent SAM AI Orders</CardTitle>
              <CardDescription>
                Orders created automatically from phone calls
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No SAM AI orders yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">Order #{order.id.substring(0, 8)}</h3>
                          <p className="text-sm text-gray-600">{order.customerName} • {order.customerPhone}</p>
                        </div>
                        <Badge className={order.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {order.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Items:</span>
                          <span>{order.items.length} items</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total:</span>
                          <span className="font-semibold">${order.totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Created:</span>
                          <span>{new Date(order.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t">
                        <details className="text-sm">
                          <summary className="cursor-pointer text-blue-600">View Items</summary>
                          <div className="mt-2 space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>{item.quantity}x {item.name}</span>
                                <span>${item.totalPrice.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Activity */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Webhook Activity
              </CardTitle>
              <CardDescription>
                Real-time logs from Retell AI webhook calls
              </CardDescription>
            </CardHeader>
            <CardContent>
              {webhookLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No webhook activity yet</p>
                  <Button onClick={testWebhook} className="mt-4" variant="outline">
                    Test Webhook Integration
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {webhookLogs
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((log, idx) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {log.type === 'retell_webhook_success' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="font-medium">
                            {log.type === 'retell_webhook_success' ? 'Successful Processing' : 'Processing Error'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <div><strong>Call ID:</strong> {log.call_id}</div>
                        <div><strong>Message:</strong> {log.result.message}</div>
                        {log.result.order_id && (
                          <div><strong>Order:</strong> #{log.result.order_id.substring(0, 8)}</div>
                        )}
                        {log.result.reservation_id && (
                          <div><strong>Reservation:</strong> #{log.result.reservation_id.substring(0, 8)}</div>
                        )}
                        {log.result.confidence_score && (
                          <div><strong>AI Confidence:</strong> {(log.result.confidence_score * 100).toFixed(1)}%</div>
                        )}
                      </div>
                      
                      {log.result.warnings && log.result.warnings.length > 0 && (
                        <Alert className="mt-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Warnings:</strong> {log.result.warnings.join(', ')}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
