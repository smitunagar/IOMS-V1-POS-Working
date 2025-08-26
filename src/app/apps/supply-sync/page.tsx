"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Truck,
  Package,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Users,
  Calendar,
  RefreshCw,
  Download,
  Plus,
  Search,
  Filter,
  Activity,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import Link from 'next/link';

export default function SupplySyncPage() {
  const [loading, setLoading] = useState(true);
  const [supplyData, setSupplyData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadSupplyData();
  }, []);

  const loadSupplyData = async () => {
    setLoading(true);
    try {
      // Mock supply chain data
      const mockData = {
        totalSuppliers: 24,
        activeOrders: 12,
        pendingDeliveries: 8,
        onTimeDeliveryRate: 94.2,
        costSavings: 1250.80,
        inventoryTurnover: 8.5,
        suppliers: [
          { 
            id: 1, 
            name: 'Fresh Produce Berlin GmbH', 
            category: 'Vegetables & Fruits',
            status: 'active',
            rating: 4.8,
            nextDelivery: '2025-08-22',
            contact: '+49 30 123456',
            email: 'orders@freshproduce-berlin.de'
          },
          { 
            id: 2, 
            name: 'Meat Masters München', 
            category: 'Meat & Poultry',
            status: 'active',
            rating: 4.6,
            nextDelivery: '2025-08-23',
            contact: '+49 89 987654',
            email: 'supply@meatmasters.de'
          },
          { 
            id: 3, 
            name: 'Dairy Excellence Hamburg', 
            category: 'Dairy Products',
            status: 'pending',
            rating: 4.9,
            nextDelivery: '2025-08-24',
            contact: '+49 40 555123',
            email: 'orders@dairy-excellence.de'
          }
        ],
        recentOrders: [
          { 
            id: 'ORD-2025-001', 
            supplier: 'Fresh Produce Berlin GmbH', 
            items: 'Tomatoes, Lettuce, Onions',
            amount: 450.20,
            status: 'delivered',
            orderDate: '2025-08-20',
            deliveryDate: '2025-08-21'
          },
          { 
            id: 'ORD-2025-002', 
            supplier: 'Meat Masters München', 
            items: 'Chicken Breast, Beef Steaks',
            amount: 890.50,
            status: 'in-transit',
            orderDate: '2025-08-19',
            deliveryDate: '2025-08-22'
          },
          { 
            id: 'ORD-2025-003', 
            supplier: 'Dairy Excellence Hamburg', 
            items: 'Milk, Cheese, Yogurt',
            amount: 320.75,
            status: 'pending',
            orderDate: '2025-08-21',
            deliveryDate: '2025-08-24'
          }
        ],
        analytics: {
          weeklyOrders: [
            { week: 'Week 1', orders: 28, cost: 4200 },
            { week: 'Week 2', orders: 32, cost: 4800 },
            { week: 'Week 3', orders: 29, cost: 4350 },
            { week: 'Current', orders: 24, cost: 3600 }
          ],
          topCategories: [
            { category: 'Vegetables & Fruits', percentage: 35, cost: 1500 },
            { category: 'Meat & Poultry', percentage: 30, cost: 1200 },
            { category: 'Dairy Products', percentage: 20, cost: 800 },
            { category: 'Beverages', percentage: 15, cost: 600 }
          ]
        }
      };
      
      setSupplyData(mockData);
    } catch (error) {
      console.error('Failed to load supply data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Supply Sync...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/ioms-dashboard" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to IOMS
                </Link>
              </Button>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                  <Truck className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Supply Sync</h1>
                  <p className="text-gray-600">Smart Supply Chain Management</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="default" className="bg-green-100 text-green-800">
                <Activity className="h-3 w-3 mr-1" />
                Synchronized
              </Badge>
              <Button variant="outline" size="sm" onClick={loadSupplyData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* KPI Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{supplyData?.totalSuppliers}</div>
              <p className="text-xs text-blue-600 mt-1">Active partnerships</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <Package className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">{supplyData?.activeOrders}</div>
              <p className="text-xs text-orange-600 mt-1">In progress</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{supplyData?.onTimeDeliveryRate}%</div>
              <p className="text-xs text-green-600 mt-1">Performance rate</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">€{supplyData?.costSavings}</div>
              <p className="text-xs text-purple-600 mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Recent Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {supplyData?.recentOrders?.slice(0, 3).map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{order.id}</div>
                          <div className="text-sm text-gray-600">{order.supplier}</div>
                          <div className="text-xs text-gray-500">{order.items}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">€{order.amount}</div>
                          <Badge variant={
                            order.status === 'delivered' ? 'default' : 
                            order.status === 'in-transit' ? 'secondary' : 
                            'outline'
                          }>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pending Deliveries */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Upcoming Deliveries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {supplyData?.suppliers?.filter((s: any) => s.nextDelivery).slice(0, 3).map((supplier: any) => (
                      <div key={supplier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{supplier.name}</div>
                          <div className="text-sm text-gray-600">{supplier.category}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{supplier.nextDelivery}</div>
                          <div className="flex items-center gap-1 text-xs text-yellow-600">
                            <Clock className="h-3 w-3" />
                            Scheduled
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Supplier Directory</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {supplyData?.suppliers?.map((supplier: any) => (
                <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{supplier.name}</CardTitle>
                      <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                        {supplier.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{supplier.category}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Rating</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">{supplier.rating}</span>
                          <span className="text-yellow-500">★</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Next: {supplier.nextDelivery}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{supplier.contact}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{supplier.email}</span>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" className="flex-1">
                          Contact
                        </Button>
                        <Button size="sm" className="flex-1">
                          Order
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Order Management</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Order
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Supplier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Delivery Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {supplyData?.recentOrders?.map((order: any) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {order.supplier}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {order.items}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            €{order.amount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={
                              order.status === 'delivered' ? 'default' : 
                              order.status === 'in-transit' ? 'secondary' : 
                              'outline'
                            }>
                              {order.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {order.deliveryDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Weekly Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {supplyData?.analytics?.weeklyOrders?.map((week: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{week.week}</div>
                          <div className="text-sm text-gray-600">{week.orders} orders</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">€{week.cost}</div>
                          <div className="text-sm text-gray-600">Total cost</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Category Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {supplyData?.analytics?.topCategories?.map((category: any, index: number) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">{category.category}</span>
                          <span className="text-sm text-gray-600">{category.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${category.percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500">€{category.cost} total</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Export Options */}
            <Card>
              <CardHeader>
                <CardTitle>Export Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-auto p-4">
                    <div className="text-center">
                      <Download className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-medium">Supplier Report</div>
                      <div className="text-sm text-gray-600">PDF format</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4">
                    <div className="text-center">
                      <Download className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-medium">Order History</div>
                      <div className="text-sm text-gray-600">Excel format</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4">
                    <div className="text-center">
                      <Download className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-medium">Cost Analysis</div>
                      <div className="text-sm text-gray-600">CSV format</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
