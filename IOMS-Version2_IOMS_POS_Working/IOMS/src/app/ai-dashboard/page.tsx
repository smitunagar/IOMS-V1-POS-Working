/**
 * 📊 Real-time Dashboard for AI Agent Activities
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  ShoppingCart, 
  Calendar, 
  Clock, 
  DollarSign,
  Users,
  Phone,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  items: Array<{name: string, quantity: number, price: number}>;
  total: number;
  orderType: string;
  status: string;
  source: string;
  createdAt: Date;
  estimatedTime?: number;
}

interface Reservation {
  id: string;
  reservationNumber: string;
  partySize: number;
  date: string;
  time: string;
  status: string;
  source: string;
  customerInfo: any;
  createdAt: Date;
  tableNumber?: string;
}

interface DashboardStats {
  orders: {
    total: number;
    confirmed: number;
    preparing: number;
    ready: number;
    todayTotal: number;
  };
  reservations: {
    total: number;
    today: number;
    confirmed: number;
    seated: number;
  };
}

export default function AIAgentDashboard() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchData = async () => {
    try {
      const [ordersResponse, reservationsResponse] = await Promise.all([
        fetch('/api/orders?limit=20'),
        fetch('/api/reservations?limit=20')
      ]);

      const ordersData = await ordersResponse.json();
      const reservationsData = await reservationsResponse.json();

      if (ordersData.success) {
        setOrders(ordersData.orders || []);
      }

      if (reservationsData.success) {
        setReservations(reservationsData.reservations || []);
      }

      // Calculate combined stats
      const combinedStats = {
        orders: ordersData.stats || { total: 0, confirmed: 0, preparing: 0, ready: 0, todayTotal: 0 },
        reservations: reservationsData.stats || { total: 0, today: 0, confirmed: 0, seated: 0 }
      };

      setStats(combinedStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Update Failed",
        description: "Failed to refresh dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-status',
          orderId,
          status: newStatus
        })
      });

      const data = await response.json();
      if (data.success) {
        fetchData(); // Refresh data
        toast({
          title: "Status Updated",
          description: `Order status changed to ${newStatus}`,
        });
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const updateReservationStatus = async (reservationId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-status',
          reservationId,
          status: newStatus
        })
      });

      const data = await response.json();
      if (data.success) {
        fetchData(); // Refresh data
        toast({
          title: "Status Updated",
          description: `Reservation status changed to ${newStatus}`,
        });
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update reservation status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string, type: 'order' | 'reservation') => {
    const statusColors = {
      order: {
        pending: 'bg-yellow-100 text-yellow-800',
        confirmed: 'bg-blue-100 text-blue-800',
        preparing: 'bg-orange-100 text-orange-800',
        ready: 'bg-green-100 text-green-800',
        completed: 'bg-gray-100 text-gray-800',
        cancelled: 'bg-red-100 text-red-800'
      },
      reservation: {
        pending: 'bg-yellow-100 text-yellow-800',
        confirmed: 'bg-blue-100 text-blue-800',
        seated: 'bg-green-100 text-green-800',
        completed: 'bg-gray-100 text-gray-800',
        cancelled: 'bg-red-100 text-red-800',
        'no-show': 'bg-red-100 text-red-800'
      }
    };

    return statusColors[type][status as keyof typeof statusColors[typeof type]] || 'bg-gray-100 text-gray-800';
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'ai-agent': return <Bot className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'web': return <MessageSquare className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Agent Dashboard</h1>
            <p className="text-gray-600">Real-time monitoring of orders and reservations from AI interactions</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Now
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.orders.total}</div>
                <p className="text-xs text-muted-foreground">
                  ${stats.orders.todayTotal.toFixed(2)} revenue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.orders.confirmed + stats.orders.preparing}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.orders.ready} ready for pickup
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Reservations</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.reservations.today}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.reservations.confirmed} confirmed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Agent Activity</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orders.filter(o => o.source === 'ai-agent').length + 
                   reservations.filter(r => r.source === 'ai-agent').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  AI-generated today
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{order.orderNumber}</span>
                          <Badge variant="secondary" className={getStatusColor(order.status, 'order')}>
                            {order.status}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getSourceIcon(order.source)}
                            {order.source}
                          </Badge>
                        </div>
                        <span className="font-semibold">${order.total.toFixed(2)}</span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{new Date(order.createdAt).toLocaleString()}</span>
                        {order.estimatedTime && (
                          <span>{order.estimatedTime} min</span>
                        )}
                      </div>

                      {order.status === 'confirmed' && (
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" onClick={() => updateOrderStatus(order.id, 'preparing')}>
                            Start Preparing
                          </Button>
                        </div>
                      )}

                      {order.status === 'preparing' && (
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" onClick={() => updateOrderStatus(order.id, 'ready')}>
                            Mark Ready
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recent Reservations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Reservations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {reservations.map((reservation) => (
                    <div key={reservation.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{reservation.reservationNumber}</span>
                          <Badge variant="secondary" className={getStatusColor(reservation.status, 'reservation')}>
                            {reservation.status}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getSourceIcon(reservation.source)}
                            {reservation.source}
                          </Badge>
                        </div>
                        <span className="text-sm">{reservation.partySize} guests</span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        {reservation.date} at {reservation.time}
                        {reservation.tableNumber && ` - Table ${reservation.tableNumber}`}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{new Date(reservation.createdAt).toLocaleString()}</span>
                        {reservation.customerInfo?.name && (
                          <span>{reservation.customerInfo.name}</span>
                        )}
                      </div>

                      {reservation.status === 'confirmed' && (
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" onClick={() => updateReservationStatus(reservation.id, 'seated')}>
                            Seat Party
                          </Button>
                        </div>
                      )}

                      {reservation.status === 'seated' && (
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" onClick={() => updateReservationStatus(reservation.id, 'completed')}>
                            Complete
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
