"use client";

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
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
  Legend 
} from 'recharts';

export default function WasteWatchDogPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'scanning'>('connected');
  
  // Mock data for waste categories
  const wasteData = [
    { name: 'Food Waste', value: 65, color: '#FF6B6B' },
    { name: 'Packaging', value: 20, color: '#4ECDC4' },
    { name: 'Other', value: 15, color: '#45B7D1' }
  ];

  const monthlyWasteData = [
    { month: 'Jan', food: 85, packaging: 22, other: 8 },
    { month: 'Feb', food: 78, packaging: 19, other: 7 },
    { month: 'Mar', food: 72, packaging: 18, other: 6 },
    { month: 'Apr', food: 68, packaging: 16, other: 5 },
    { month: 'May', food: 65, packaging: 15, other: 4 }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleManualScan = () => {
    setIsScanning(true);
    setConnectionStatus('scanning');
    
    setTimeout(() => {
      setIsScanning(false);
      setConnectionStatus('connected');
      toast({
        title: "Scan Complete",
        description: "Waste data has been updated successfully.",
      });
    }, 3000);
  };

  if (loading) {
    return (
      <AppLayout pageTitle="WasteWatchDog">
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading WasteWatchDog data...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="WasteWatchDog">
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
              className="bg-green-600 hover:bg-green-700"
            >
              {isScanning ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Scan className="w-4 h-4 mr-2" />
                  Manual Scan
                </>
              )}
            </Button>
            <div className="flex items-center gap-2">
              {connectionStatus === 'connected' ? (
                <Wifi className="w-5 h-5 text-green-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
              <span className="text-sm text-gray-600 capitalize">{connectionStatus}</span>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Waste Today</p>
                  <p className="text-2xl font-bold text-gray-900">23.4 kg</p>
                </div>
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cost Savings</p>
                  <p className="text-2xl font-bold text-green-600">$147</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Efficiency Score</p>
                  <p className="text-2xl font-bold text-blue-600">87%</p>
                </div>
                <Target className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">CO₂ Reduced</p>
                  <p className="text-2xl font-bold text-emerald-600">45.2 kg</p>
                </div>
                <Leaf className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Waste Composition Chart */}
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Waste Composition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <pie
                        data={wasteData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {wasteData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Monthly Trends */}
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Monthly Waste Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyWasteData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="food" stackId="a" fill="#FF6B6B" name="Food Waste" />
                      <Bar dataKey="packaging" stackId="a" fill="#4ECDC4" name="Packaging" />
                      <Bar dataKey="other" stackId="a" fill="#45B7D1" name="Other" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { time: '2 minutes ago', action: 'Waste scan completed', status: 'success' },
                    { time: '15 minutes ago', action: 'Food waste threshold exceeded', status: 'warning' },
                    { time: '1 hour ago', action: 'Weekly report generated', status: 'info' },
                    { time: '3 hours ago', action: 'System maintenance completed', status: 'success' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {item.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {item.status === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-500" />}
                        {item.status === 'info' && <Clock className="w-5 h-5 text-blue-500" />}
                        <span className="text-sm">{item.action}</span>
                      </div>
                      <span className="text-xs text-gray-500">{item.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Advanced Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Advanced Analytics</h3>
                  <p className="text-gray-500">Detailed analytics and insights coming soon.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Waste History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Historical Data</h3>
                  <p className="text-gray-500">Historical waste tracking data will appear here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Waste Threshold (kg)
                    </label>
                    <Input type="number" defaultValue="25" className="max-w-xs" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scan Frequency (minutes)
                    </label>
                    <Input type="number" defaultValue="30" className="max-w-xs" />
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
