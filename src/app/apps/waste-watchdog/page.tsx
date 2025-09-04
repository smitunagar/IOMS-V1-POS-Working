"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BarChart3, Camera, FileText, TrendingDown, AlertTriangle, Leaf, DollarSign, Scale, Clock, Target, ArrowRight, ShoppingCart, Package, Activity, CheckCircle } from 'lucide-react';
import { useWasteWatchDog } from '@/contexts/WasteWatchDogContext';
import { useAuth } from '@/contexts/AuthContext';
import POSWasteIntegrationService, { POSWasteMetrics } from '@/lib/posWasteIntegration';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function WasteWatchDogPage() {
  const { isActive, toggleWasteWatchDog } = useWasteWatchDog();
  const { currentUser } = useAuth();
  const [posMetrics, setPosMetrics] = useState<POSWasteMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Load POS integration data
  useEffect(() => {
    if (isActive && currentUser) {
      const loadPOSData = async () => {
        try {
          setLoading(true);
          const integrationService = POSWasteIntegrationService.getInstance();
          const metrics = await integrationService.getWasteMetrics(currentUser.id);
          setPosMetrics(metrics);
        } catch (error) {
          console.error('Failed to load POS metrics:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadPOSData();
      
      // Refresh every 30 seconds
      const interval = setInterval(loadPOSData, 30000);
      return () => clearInterval(interval);
    }
  }, [isActive, currentUser]);
  
  // Fetch dashboard KPIs when active
  const { data: kpiData } = useSWR(
    isActive ? '/api/waste/kpis?window=today' : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  // Fetch recent events
  const { data: recentEvents } = useSWR(
    isActive ? '/api/waste/recent?limit=5' : null,
    fetcher,
    { refreshInterval: 10000 }
  );

  const quickActions = [
    {
      title: "Analytics Dashboard",
      description: "Comprehensive waste analytics & insights",
      icon: BarChart3,
      href: "/apps/waste-watchdog/analytics",
      color: "from-blue-500 to-blue-600",
      stats: kpiData?.data ? `${kpiData.data.totalWasteKg.toFixed(1)} kg today` : null
    },
    {
      title: "Hardware Capture",
      description: "Scan waste with camera or upload images",
      icon: Camera,
      href: "/apps/waste-watchdog/hardware",
      color: "from-green-500 to-green-600",
      stats: "AI Scanner Ready"
    },
    {
      title: "Compliance Center",
      description: "SDG tracking & regulatory compliance",
      icon: FileText,
      href: "/apps/waste-watchdog/compliance",
      color: "from-purple-500 to-purple-600",
      stats: "SDG 12.3 Monitoring"
    },
    {
      title: "Predictive Analytics",
      description: "AI-powered waste forecasting",
      icon: TrendingDown,
      href: "/apps/waste-watchdog/predictive",
      color: "from-orange-500 to-orange-600",
      stats: "Smart Insights"
    }
  ];

  return (
    <AppLayout pageTitle="WasteWatchDog">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-3xl">♻️</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">WasteWatchDog</h1>
                <p className="text-xl text-gray-600">AI-Powered Waste Tracking & Sustainability Dashboard</p>
              </div>
            </div>
            
            {/* Status & Toggle */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">System Status</p>
                <Badge variant={isActive ? "default" : "secondary"} className="text-sm">
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <button
                onClick={toggleWasteWatchDog}
                className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  isActive ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-12' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {isActive ? (
          <>
            {/* POS Integration Status */}
            {posMetrics && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-green-600" />
                    POS Integration Active
                  </h2>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Live Data
                  </Badge>
                </div>
                <p className="text-gray-600">
                  Connected to Point of Sale system • {posMetrics.recentOrders.length} recent orders • {posMetrics.inventoryStatus.lowStock.length} inventory alerts
                </p>
              </div>
            )}

            {/* Real-time KPI Cards from POS */}
            {posMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Waste</CardTitle>
                    <Scale className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{posMetrics.todayWaste.toFixed(1)} kg</div>
                    <p className="text-xs text-muted-foreground">
                      +{Math.abs(posMetrics.reductionPercentage - 100).toFixed(1)}% from yesterday
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cost Impact</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">€{posMetrics.costImpact.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      €{(posMetrics.costImpact * 30).toFixed(2)} saved this period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">CO₂ Impact</CardTitle>
                    <Leaf className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{posMetrics.co2Impact.toFixed(1)} kg</div>
                    <p className="text-xs text-muted-foreground">
                      {(posMetrics.co2Impact * 0.4).toFixed(1)} kg CO₂ saved
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reduction</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{posMetrics.reductionPercentage.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">vs previous period</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Loading state for POS data */}
            {loading && !posMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-4 w-4 bg-gray-200 rounded"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Fallback to API KPI Cards if POS data not available */}
            {!loading && !posMetrics && kpiData?.data && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Waste</CardTitle>
                    <Scale className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpiData.data.totalWasteKg.toFixed(1)} kg</div>
                    <p className="text-xs text-muted-foreground">
                      {kpiData.data.trends.waste >= 0 ? '+' : ''}{kpiData.data.trends.waste.toFixed(1)}% from yesterday
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cost Impact</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">€{kpiData.data.totalCostEUR.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      €{kpiData.data.costSavingsEUR.toFixed(2)} saved this period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">CO₂ Impact</CardTitle>
                    <Leaf className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpiData.data.totalCO2Kg.toFixed(1)} kg</div>
                    <p className="text-xs text-muted-foreground">
                      {kpiData.data.co2SavedKg.toFixed(1)} kg CO₂ saved
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reduction</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpiData.data.wasteReductionPercent.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                      vs previous period
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* POS Inventory Alerts */}
            {posMetrics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Recent Orders from POS */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-blue-600" />
                      Recent POS Orders
                    </CardTitle>
                    <CardDescription>Live data from point of sale system</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {posMetrics.recentOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div>
                          <p className="font-medium">Order #{order.id.slice(-8)}</p>
                          <p className="text-sm text-gray-600">{order.items?.length || 0} items • {order.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${order.totalAmount.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {posMetrics.recentOrders.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No recent orders</p>
                    )}
                  </CardContent>
                </Card>

                {/* Inventory Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-orange-600" />
                      Inventory Alerts
                    </CardTitle>
                    <CardDescription>Real-time inventory status from POS</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {posMetrics.inventoryStatus.expiring.length > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-800">
                            {posMetrics.inventoryStatus.expiring.length} items expiring soon
                          </span>
                        </div>
                      )}
                      {posMetrics.inventoryStatus.lowStock.length > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm text-yellow-800">
                            {posMetrics.inventoryStatus.lowStock.length} items low in stock
                          </span>
                        </div>
                      )}
                      {posMetrics.inventoryStatus.overstock.length > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-800">
                            {posMetrics.inventoryStatus.overstock.length} items overstocked
                          </span>
                        </div>
                      )}
                      {posMetrics.inventoryStatus.expiring.length === 0 && 
                       posMetrics.inventoryStatus.lowStock.length === 0 && 
                       posMetrics.inventoryStatus.overstock.length === 0 && (
                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-800">All inventory levels optimal</span>
                        </div>
                      )}
                    </div>

                    {/* Waste by Category */}
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-2">Waste by Category (Today)</h4>
                      {Object.entries(posMetrics.wasteByCategory).slice(0, 3).map(([category, amount]) => (
                        <div key={category} className="flex justify-between items-center py-1">
                          <span className="text-sm text-gray-600 capitalize">{category}</span>
                          <span className="text-sm font-medium">{amount.toFixed(1)} kg</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
              {quickActions.slice(0, 2).map((action) => (
                <Link key={action.title} href={action.href}>
                  <Card className="hover:shadow-lg transition-all duration-200 transform hover:scale-105 cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                        <action.icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                      <CardDescription className="text-sm">{action.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{action.stats}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Secondary Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {quickActions.slice(2).map((action) => (
                <Link key={action.title} href={action.href}>
                  <Card className="hover:shadow-lg transition-all duration-200 transform hover:scale-105 cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                        <action.icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                      <CardDescription className="text-sm">{action.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{action.stats}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Recent Activity */}
            {recentEvents?.data && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Waste Events
                  </CardTitle>
                  <CardDescription>Latest waste tracking activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentEvents.data.map((event: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            event.type === 'food' ? 'bg-orange-500' :
                            event.type === 'oil' ? 'bg-yellow-500' :
                            event.type === 'packaging' ? 'bg-blue-500' : 'bg-green-500'
                          }`} />
                          <div>
                            <p className="font-medium">{event.type} waste</p>
                            <p className="text-sm text-gray-600">{event.station} station</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{event.amountKg} kg</p>
                          <p className="text-sm text-gray-600">€{event.costEUR}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <Link href="/apps/waste-watchdog/analytics">
                      <Button variant="outline" className="w-full">
                        View All Events
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          /* Inactive State */
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">WasteWatchDog is Inactive</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Activate WasteWatchDog to start tracking waste, monitoring environmental impact, and accessing comprehensive analytics.
              </p>
              <Button onClick={toggleWasteWatchDog} size="lg" className="bg-green-600 hover:bg-green-700">
                Activate WasteWatchDog
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
