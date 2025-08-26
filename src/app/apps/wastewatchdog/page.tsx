'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Trash2, 
  Scan, 
  Activity, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Wifi, 
  WifiOff,
  BarChart3,
  PieChart,
  Calendar,
  DollarSign,
  Leaf,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  PieChart as RechartsPieChart, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
  Pie
} from 'recharts';

interface WasteEvent {
  id: string;
  timestamp: string;
  wasteType: string;
  quantity: number;
  location: string;
  deviceId: string;
  status: 'processed' | 'pending' | 'error';
}

interface HardwareStatus {
  deviceId: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  lastSeen: string;
  batteryLevel?: number;
}

export default function WasteWatchDogPage() {
  const [wasteEvents, setWasteEvents] = useState<WasteEvent[]>([]);
  const [hardwareStatus, setHardwareStatus] = useState<HardwareStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Mock data for demonstration
        const mockEvents: WasteEvent[] = [
          {
            id: '1',
            timestamp: new Date().toISOString(),
            wasteType: 'Food Waste',
            quantity: 2.5,
            location: 'Kitchen Station A',
            deviceId: 'WWD-001',
            status: 'processed'
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            wasteType: 'Packaging',
            quantity: 1.8,
            location: 'Prep Area B',
            deviceId: 'WWD-002',
            status: 'processed'
          },
          {
            id: '3',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            wasteType: 'Food Waste',
            quantity: 0.9,
            location: 'Service Counter',
            deviceId: 'WWD-003',
            status: 'pending'
          }
        ];

        const mockHardware: HardwareStatus[] = [
          {
            deviceId: 'WWD-001',
            name: 'Kitchen Scanner Alpha',
            location: 'Kitchen Station A',
            status: 'online',
            lastSeen: new Date().toISOString(),
            batteryLevel: 87
          },
          {
            deviceId: 'WWD-002',
            name: 'Prep Area Scanner',
            location: 'Prep Area B',
            status: 'online',
            lastSeen: new Date(Date.now() - 300000).toISOString(),
            batteryLevel: 65
          },
          {
            deviceId: 'WWD-003',
            name: 'Service Counter Scanner',
            location: 'Service Counter',
            status: 'maintenance',
            lastSeen: new Date(Date.now() - 1800000).toISOString(),
            batteryLevel: 23
          }
        ];

        setWasteEvents(mockEvents);
        setHardwareStatus(mockHardware);
      } catch (error) {
        console.error('Failed to load waste watch data:', error);
        toast({
          title: "Error",
          description: "Failed to load waste monitoring data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const handleManualScan = async () => {
    setIsScanning(true);
    try {
      // Simulate scanning process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newEvent: WasteEvent = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        wasteType: 'Food Waste',
        quantity: Math.round((Math.random() * 3 + 0.5) * 100) / 100,
        location: 'Manual Entry',
        deviceId: 'MANUAL',
        status: 'processed'
      };

      setWasteEvents(prev => [newEvent, ...prev]);
      
      toast({
        title: "Scan Complete",
        description: `Recorded ${newEvent.quantity}kg of ${newEvent.wasteType}`,
      });
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: "Unable to complete manual scan",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-red-600';
      case 'maintenance': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Wifi className="w-4 h-4 text-green-600" />;
      case 'offline': return <WifiOff className="w-4 h-4 text-red-600" />;
      case 'maintenance': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  // Calculate KPIs
  const totalWasteToday = wasteEvents
    .filter(event => new Date(event.timestamp).toDateString() === new Date().toDateString())
    .reduce((sum, event) => sum + event.quantity, 0);

  const onlineDevices = hardwareStatus.filter(device => device.status === 'online').length;
  const totalDevices = hardwareStatus.length;

  // Chart data
  const wasteByTypeData = [
    { name: 'Food Waste', value: 75, color: '#16a34a' },
    { name: 'Packaging', value: 20, color: '#2563eb' },
    { name: 'Other', value: 5, color: '#6b7280' }
  ];

  const weeklyTrendData = [
    { day: 'Mon', waste: 4.2, cost: 45, efficiency: 87 },
    { day: 'Tue', waste: 3.8, cost: 42, efficiency: 89 },
    { day: 'Wed', waste: 3.5, cost: 38, efficiency: 91 },
    { day: 'Thu', waste: 3.2, cost: 35, efficiency: 93 },
    { day: 'Fri', waste: 2.9, cost: 32, efficiency: 95 },
    { day: 'Sat', waste: 2.7, cost: 29, efficiency: 96 },
    { day: 'Sun', waste: 2.5, cost: 26, efficiency: 98 }
  ];

  const monthlyWasteData = [
    { month: 'Jan', food: 85, packaging: 22, other: 8 },
    { month: 'Feb', food: 78, packaging: 19, other: 7 },
    { month: 'Mar', food: 72, packaging: 18, other: 6 },
    { month: 'Apr', food: 68, packaging: 16, other: 5 },
    { month: 'May', food: 65, packaging: 15, other: 4 }
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading WasteWatchDog data...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6 bg-gradient-to-br from-green-50 to-emerald-100 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Trash2 className="w-8 h-8 text-green-600" />
              WasteWatchDog
            </h1>
            <p className="text-gray-600 mt-2">Smart waste monitoring and optimization system</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleManualScan}
              disabled={isScanning}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Scan className="w-4 h-4" />
              {isScanning ? 'Scanning...' : 'Manual Scan'}
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Waste</CardTitle>
              <Trash2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {totalWasteToday.toFixed(1)}kg
              </div>
              <p className="text-xs text-muted-foreground">
                -15% from yesterday
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hardware Status</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {onlineDevices}/{totalDevices}
              </div>
              <p className="text-xs text-muted-foreground">
                Devices online
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">$284</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CO2 Saved</CardTitle>
              <Leaf className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">127kg</div>
              <p className="text-xs text-muted-foreground">
                Carbon footprint reduced
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="hardware" className="gap-2">
              <Activity className="w-4 h-4" />
              Hardware
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <PieChart className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Waste Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Waste Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {wasteEvents.slice(0, 6).map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            event.status === 'processed' ? 'bg-green-500' :
                            event.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <div>
                            <p className="text-sm font-medium">{event.wasteType}</p>
                            <p className="text-xs text-gray-600">{event.location}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{event.quantity}kg</p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleManualScan}
                    disabled={isScanning}
                    className="w-full gap-2"
                    variant="outline"
                  >
                    <Scan className="w-4 h-4" />
                    {isScanning ? 'Scanning...' : 'Manual Waste Scan'}
                  </Button>
                  
                  <Button className="w-full gap-2" variant="outline">
                    <BarChart3 className="w-4 h-4" />
                    Generate Report
                  </Button>
                  
                  <Button className="w-full gap-2" variant="outline">
                    <AlertCircle className="w-4 h-4" />
                    Check Device Status
                  </Button>
                  
                  <Button className="w-full gap-2" variant="outline">
                    <Calendar className="w-4 h-4" />
                    Schedule Maintenance
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Hardware Tab */}
          <TabsContent value="hardware" className="space-y-6">
            <div className="grid gap-6">
              {hardwareStatus.map((device) => (
                <Card key={device.deviceId} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(device.status)}
                        <div>
                          <h3 className="font-semibold text-lg">{device.name}</h3>
                          <p className="text-gray-600">{device.location}</p>
                          <p className="text-sm text-gray-500">ID: {device.deviceId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={device.status === 'online' ? 'default' : 
                                     device.status === 'maintenance' ? 'secondary' : 'destructive'}>
                          {device.status.toUpperCase()}
                        </Badge>
                        {device.batteryLevel && (
                          <p className="text-sm text-gray-600 mt-2">
                            Battery: {device.batteryLevel}%
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Last seen: {new Date(device.lastSeen).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Waste by Type Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Waste Distribution (Today)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={wasteByTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {wasteByTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Efficiency Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5" />
                    Weekly Efficiency Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="efficiency" 
                          stroke="#16a34a" 
                          strokeWidth={2}
                          name="Efficiency (%)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Waste Reduction */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Daily Waste Tracking (This Week)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="waste" 
                          stroke="#16a34a" 
                          fill="#16a34a" 
                          fillOpacity={0.3}
                          name="Waste (kg)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Waste Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Monthly Waste by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyWasteData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="food" stackId="a" fill="#16a34a" name="Food Waste" />
                        <Bar dataKey="packaging" stackId="a" fill="#2563eb" name="Packaging" />
                        <Bar dataKey="other" stackId="a" fill="#6b7280" name="Other" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">-18%</div>
                    <div className="text-sm text-gray-600">Waste Reduction</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">+$67</div>
                    <div className="text-sm text-gray-600">Cost Savings</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">+12%</div>
                    <div className="text-sm text-gray-600">Efficiency</div>
                  </div>
                  <div className="text-center p-4 bg-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600">-34kg</div>
                    <div className="text-sm text-gray-600">CO2 Reduced</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
