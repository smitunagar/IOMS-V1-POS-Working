"use client";

import React, { useEffect, useState } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShoppingBag, Users, TrendingUp, Clock, Repeat, Smile, TrendingDown, Info as InfoIcon, Utensils, Percent, Mic, Phone, Calendar, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn is correctly imported

// Data Interfaces
interface DailyOrdersData {
  name: string; // Changed from date for XAxis key
  orders: number;
}

interface MonthlyRevenueData {
  month: string;
  revenue: number;
  profit: number;
}

interface MenuCategoryPerformanceData {
  name: string;
  value: number; // Percentage or absolute sales
  fill: string;
}

interface TopSellingDishData {
  id: string;
  name: string;
  category: string;
  unitsSold: number;
  totalRevenue: number;
  profitMargin: number; // Percentage
}

// Mock Data
const mockDailyOrders: DailyOrdersData[] = [
  { name: "Mon", orders: Math.floor(Math.random() * 50) + 20 },
  { name: "Tue", orders: Math.floor(Math.random() * 50) + 20 },
  { name: "Wed", orders: Math.floor(Math.random() * 50) + 20 },
  { name: "Thu", orders: Math.floor(Math.random() * 50) + 20 },
  { name: "Fri", orders: Math.floor(Math.random() * 70) + 30 },
  { name: "Sat", orders: Math.floor(Math.random() * 100) + 50 },
  { name: "Sun", orders: Math.floor(Math.random() * 80) + 40 },
];

const mockMonthlyRevenue: MonthlyRevenueData[] = Array.from({ length: 6 }, (_, i) => {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = new Date();
  d.setMonth(d.getMonth() - 5 + i);
  return {
    month: monthNames[d.getMonth()],
    revenue: Math.floor(Math.random() * 5000) + (10000 + i * 1000),
    profit: Math.floor(Math.random() * 2000) + (3000 + i * 500),
  };
});

const mockMenuCategoryPerformance: MenuCategoryPerformanceData[] = [
  { name: 'Appetizers', value: 25, fill: 'hsl(var(--chart-1))' },
  { name: 'Main Courses', value: 45, fill: 'hsl(var(--chart-2))' },
  { name: 'Desserts', value: 20, fill: 'hsl(var(--chart-3))' },
  { name: 'Beverages', value: 10, fill: 'hsl(var(--chart-4))' },
];

const mockTopSellingDishes: TopSellingDishData[] = [
  { id: '1', name: 'Margherita Pizza', category: 'Main Courses', unitsSold: 120, totalRevenue: 1800, profitMargin: 60 },
  { id: '2', name: 'Spaghetti Carbonara', category: 'Main Courses', unitsSold: 95, totalRevenue: 1425, profitMargin: 55 },
  { id: '3', name: 'Caesar Salad', category: 'Appetizers', unitsSold: 80, totalRevenue: 800, profitMargin: 65 },
  { id: '4', name: 'Chocolate Lava Cake', category: 'Desserts', unitsSold: 70, totalRevenue: 560, profitMargin: 50 },
  { id: '5', name: 'Iced Tea', category: 'Beverages', unitsSold: 150, totalRevenue: 450, profitMargin: 70 },
];

// Helper function for KPI card styling
const getKpiCardClass = (trend: 'up' | 'down' | 'neutral' | 'alert') => {
  if (trend === 'up') return 'border-green-500 bg-green-500/10';
  if (trend === 'down') return 'border-red-500 bg-red-500/10'; // For negative trends like increased wait time
  if (trend === 'alert') return 'border-red-500 bg-red-500/10'; // For critical alerts
  return 'border-yellow-500 bg-yellow-500/10'; // Neutral or needs attention
};


export default function DashboardPage() {
  // KPI States
  const [totalOrdersToday, setTotalOrdersToday] = useState(0);
  const [currentMonthlyRevenue, setCurrentMonthlyRevenue] = useState(0);
  const [averageOrderValue, setAverageOrderValue] = useState(0);
  const [totalProfitYTD, setTotalProfitYTD] = useState(0);
  const [avgWaitTime, setAvgWaitTime] = useState(0);
  const [tableTurnover, setTableTurnover] = useState(0);
  const [csatScore, setCsatScore] = useState(0);
  const [occupancyRate, setOccupancyRate] = useState(0);
  
  // Voice AI Agent States
  const [voiceCallsToday, setVoiceCallsToday] = useState(0);
  const [voiceReservationsToday, setVoiceReservationsToday] = useState(0);
  const [voiceOrdersToday, setVoiceOrdersToday] = useState(0);
  const [voiceSuccessRate, setVoiceSuccessRate] = useState(0);
  const [avgCallDuration, setAvgCallDuration] = useState(0);
  const [voiceRevenueToday, setVoiceRevenueToday] = useState(0);
  
  // Dummy Inventory Data
  const dummyInventoryTurnoverRate = parseFloat((Math.random() * 10 + 5).toFixed(1)); // e.g., 7.5
  const dummyLowStockItems = [
    { id: 'inv1', name: 'Tomatoes', currentStock: 5, unit: 'kg', reorderPoint: 10 },
    { id: 'inv2', name: 'Chicken Breast', currentStock: 10, unit: 'kg', reorderPoint: 15 },
    { id: 'inv3', name: 'Pasta', currentStock: 8, unit: 'boxes', reorderPoint: 12 },
    { id: 'inv4', name: 'Milk', currentStock: 3, unit: 'liters', reorderPoint: 5 },
  ].filter(item => item.currentStock <= item.reorderPoint);

  // Inventory KPI States (using dummy data for now)
  const [inventoryTurnoverRate, setInventoryTurnoverRate] = useState(dummyInventoryTurnoverRate);
  const [lowStockItems, setLowStockItems] = useState(dummyLowStockItems);


  // Filter States
  const [salesTrendPeriod, setSalesTrendPeriod] = useState('weekly');

  useEffect(() => {
    // Simulate fetching data
    setTotalOrdersToday(Math.floor(Math.random() * 100) + 50);
    const currentMonthData = mockMonthlyRevenue[mockMonthlyRevenue.length - 1];
    setCurrentMonthlyRevenue(currentMonthData?.revenue || 0);
    const mockTotalDailyOrdersForAOV = (Math.floor(Math.random() * 30) + 20);
    setAverageOrderValue(currentMonthData?.revenue && mockTotalDailyOrdersForAOV > 0 ? (currentMonthData.revenue / (mockTotalDailyOrdersForAOV * 30)) : 0);
    setTotalProfitYTD(mockMonthlyRevenue.reduce((sum, item) => sum + item.profit, 0));
    
    setAvgWaitTime(parseFloat((Math.random() * 10 + 5).toFixed(1))); // e.g., 7.5 min
    setTableTurnover(parseFloat((Math.random() * 2 + 2).toFixed(1))); // e.g., 3.2x
    setCsatScore(Math.floor(Math.random() * 15) + 80); // e.g., 89%
    setOccupancyRate(Math.floor(Math.random() * 70) + 30); // e.g., 65%
    
    // Load Voice AI Agent data
    loadVoiceAIData();
  }, []);

  // Function to load Voice AI Agent statistics
  const loadVoiceAIData = async () => {
    try {
      // Load voice reservations
      const reservationResponse = await fetch('/api/voice-agent/reservation');
      if (reservationResponse.ok) {
        const reservationData = await reservationResponse.json();
        const todayReservations = reservationData.reservations?.filter((r: any) => {
          const today = new Date().toDateString();
          return new Date(r.created_at).toDateString() === today;
        }) || [];
        setVoiceReservationsToday(todayReservations.length);
      }

      // Load voice orders
      const orderResponse = await fetch('/api/voice-agent/order');
      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        const todayOrders = orderData.orders?.filter((o: any) => {
          const today = new Date().toDateString();
          return new Date(o.created_at).toDateString() === today;
        }) || [];
        setVoiceOrdersToday(todayOrders.length);
        
        // Calculate revenue from voice orders
        const todayRevenue = todayOrders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
        setVoiceRevenueToday(todayRevenue);
      }

      // Calculate total calls and success rate
      const totalVoiceCalls = voiceReservationsToday + voiceOrdersToday;
      setVoiceCallsToday(totalVoiceCalls);
      
      // Mock success rate based on completed vs attempted calls
      const mockSuccessRate = totalVoiceCalls > 0 ? Math.floor(Math.random() * 20) + 80 : 85;
      setVoiceSuccessRate(mockSuccessRate);
      
      // Mock average call duration
      setAvgCallDuration(parseFloat((Math.random() * 2 + 1.5).toFixed(1))); // 1.5-3.5 minutes
      
    } catch (error) {
      console.error('Error loading Voice AI data:', error);
      // Set default values if API fails
      setVoiceCallsToday(Math.floor(Math.random() * 20) + 5);
      setVoiceReservationsToday(Math.floor(Math.random() * 10) + 2);
      setVoiceOrdersToday(Math.floor(Math.random() * 15) + 3);
      setVoiceSuccessRate(85);
      setAvgCallDuration(2.3);
      setVoiceRevenueToday(Math.floor(Math.random() * 500) + 200);
    }
  };

  const KpiCard = ({ title, value, icon: Icon, trendIcon: TrendIcon, trendText, trendColorClass, unit, isLoading, infoText }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trendIcon?: React.ElementType;
    trendText: string;
    trendColorClass: string;
    unit?: string;
    isLoading?: boolean;
    infoText?: string;
  }) => (
    <Card className={cn("shadow-md hover:shadow-lg transition-shadow", trendColorClass)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center space-x-1">
          {infoText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground">
                    <InfoIcon className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px] text-xs">
                  <p>{infoText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{isLoading ? '...' : value}{unit}</div>
        <div className="text-xs text-muted-foreground flex items-center">
          {TrendIcon && <TrendIcon className={cn("h-4 w-4 mr-1", trendColorClass.includes('green') ? 'text-green-600' : trendColorClass.includes('red') ? 'text-red-600' : 'text-yellow-600')} />}
          {trendText}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AppLayout pageTitle="Analytics Dashboard">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview KPIs</TabsTrigger>
          <TabsTrigger value="sales_trends">Sales Trends</TabsTrigger>
          <TabsTrigger value="menu_performance">Menu Performance</TabsTrigger>
          <TabsTrigger value="operations">Operational Metrics</TabsTrigger>
          <TabsTrigger value="voice_ai">Voice AI Agent</TabsTrigger>
          <TabsTrigger value="inventory_stats">Inventory Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
            <KpiCard
              title="Revenue Today"
              value={`€${(typeof totalOrdersToday === 'number' && typeof averageOrderValue === 'number' ? totalOrdersToday * (averageOrderValue || 30) : 0).toFixed(0)}`}
              icon={DollarSign}
              trendIcon={TrendingUp}
              trendText="+12% from yesterday"
              trendColorClass={getKpiCardClass('up')}
              infoText="Total monetary value of all sales made today."
            />
            <KpiCard
              title="Covers Today"
              value={Math.floor(totalOrdersToday * 2.5)}
              icon={Users}
              trendIcon={TrendingUp}
              trendText="+8% from yesterday"
              trendColorClass={getKpiCardClass('up')}
              infoText="Total number of customers (covers) served today. Assumes an average of 2.5 covers per order."
            />
            <KpiCard
              title="Avg. Wait Time"
              value={`${avgWaitTime} min`}
              icon={Clock}
              trendIcon={avgWaitTime > 10 ? TrendingDown : TrendingUp}
              trendText={avgWaitTime > 10 ? "+1.2 min vs avg" : "-0.5 min vs avg"}
              trendColorClass={getKpiCardClass(avgWaitTime > 10 ? 'down' : 'up')}
              infoText="Average time customers wait before being seated or served. Lower is better."
            />
            <KpiCard
              title="Table Turnover"
              value={`${tableTurnover}x`}
              icon={Repeat}
              trendIcon={tableTurnover > 3 ? TrendingUp : TrendingDown}
              trendText={tableTurnover > 3 ? "Above target" : "Below target"}
              trendColorClass={getKpiCardClass(tableTurnover > 3 ? 'up' : 'neutral')}
              infoText="Number of times a table is occupied by a new party during a specific period. Higher is generally better."
            />
          </div>
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
            <KpiCard
              title="CSAT Score"
              value={`${csatScore}%`}
              icon={Smile}
              trendIcon={csatScore > 85 ? TrendingUp : TrendingDown}
              trendText={csatScore > 85 ? "Excellent" : "Room for improvement"}
              trendColorClass={getKpiCardClass(csatScore > 85 ? 'up' : 'neutral')}
              infoText="Customer Satisfaction Score as a percentage. Indicates overall customer happiness."
            />
             <KpiCard
              title="Monthly Revenue (Current)"
              value={`€${currentMonthlyRevenue.toLocaleString()}`}
              icon={DollarSign}
              trendIcon={TrendingUp}
              trendText="+5.2% from last month"
              trendColorClass={getKpiCardClass('up')}
              infoText="Total revenue generated in the current calendar month so far."
            />
            <KpiCard
              title="Total Orders Today"
              value={totalOrdersToday}
              icon={ShoppingBag}
              trendIcon={TrendingUp}
              trendText="+10% from yesterday"
              trendColorClass={getKpiCardClass('up')}
              infoText="Total number of individual orders processed today."
            />
            <KpiCard
              title="Total Profit (YTD)"
              value={`€${totalProfitYTD.toLocaleString()}`}
              icon={TrendingUp}
              trendIcon={TrendingUp}
              trendText="Year to date performance"
              trendColorClass={getKpiCardClass('up')}
              infoText="Cumulative profit from the beginning of the year to date."
            />
          </div>
        </TabsContent>

        {/* Inventory Stats */}
        <TabsContent value="inventory_stats" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Inventory Turnover Rate</CardTitle>
                <CardDescription>How quickly inventory is sold and replaced</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-center py-8">
                  {inventoryTurnoverRate} <span className="text-xl text-muted-foreground">times</span>
                </div>
                {/* More advanced charts could go here */}
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Low Stock Alerts</CardTitle>
                <CardDescription>Items needing reorder ({lowStockItems.length})</CardDescription>
              </CardHeader>
              <CardContent className="max-h-[200px] overflow-y-auto">
                {lowStockItems.length > 0 ? (
                  <ul>
                    {lowStockItems.map(item => (
                      <li key={item.id} className="flex justify-between py-1 text-sm">
                        <span>{item.name}</span>
                        <span className="text-red-600">{item.currentStock} {item.unit}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No low stock items!</p>
                )}
              </CardContent>
            </Card>
          </div>
        
          

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Revenue & Profit Trend</CardTitle>
                <CardDescription>Monthly revenue and profit over the last 6 months.</CardDescription>
              </div>
              <Select value={salesTrendPeriod} onValueChange={setSalesTrendPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="h-[350px] p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockMonthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `€${value/1000}k`}/>
                  <RechartsTooltip
                     contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                     labelStyle={{ color: 'hsl(var(--foreground))' }}
                     formatter={(value: number) => `€${value.toLocaleString()}`}
                  />
                  <Legend wrapperStyle={{fontSize: '12px'}}/>
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 6 }} name="Revenue" />
                  <Line type="monotone" dataKey="profit" stroke="hsl(var(--chart-2))" strokeWidth={2} activeDot={{ r: 6 }} name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Orders Trend</CardTitle>
              <CardDescription>Number of orders placed ({salesTrendPeriod}).</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockDailyOrders}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend wrapperStyle={{fontSize: '12px'}}/>
                  <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menu_performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Menu Category Performance</CardTitle>
                <CardDescription>% of sales by category.</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] flex items-center justify-center p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockMenuCategoryPerformance}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={120}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} (${(typeof percent === 'number' && !isNaN(percent) ? percent * 100 : 0).toFixed(0)}%)`}
                    >
                      {mockMenuCategoryPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                      formatter={(value: number, name: string) => [`${value}%`, name]}
                    />
                    <Legend wrapperStyle={{fontSize: '12px'}}/>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Dishes</CardTitle>
                <CardDescription>Most popular items by revenue.</CardDescription>
              </CardHeader>
              <CardContent className="max-h-[350px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dish</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Units Sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Profit Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTopSellingDishes.sort((a,b) => b.totalRevenue - a.totalRevenue).map((dish) => (
                      <TableRow key={dish.id} className={cn(dish.profitMargin < 55 && "bg-red-500/10", dish.unitsSold > 100 && "bg-green-500/10")}>
                        <TableCell className="font-medium">{dish.name}</TableCell>
                        <TableCell>{dish.category}</TableCell>
                        <TableCell className="text-right">{dish.unitsSold}</TableCell>
                        <TableCell className="text-right">€{(typeof dish.totalRevenue === 'number' && !isNaN(dish.totalRevenue) ? dish.totalRevenue : parseFloat(dish.totalRevenue?.toString?.() ?? '') || 0).toFixed(2)}</TableCell>
                        <TableCell className={cn("text-right", dish.profitMargin >= 60 ? "text-green-600" : dish.profitMargin < 55 ? "text-red-600" : "")}>
                          {dish.profitMargin}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          <Card>
            <CardHeader>
                <CardTitle>Restaurant Occupancy</CardTitle>
                <CardDescription>Current live occupancy rate.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="text-4xl font-bold text-center py-4">{occupancyRate}%</div>
                <Progress value={occupancyRate} className="w-full h-4" />
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                </div>
                 <div className="text-center mt-2">
                    {occupancyRate > 80 ? <Badge variant="destructive">Very Busy</Badge> : occupancyRate > 50 ? <Badge variant="secondary" className="bg-yellow-400/80 text-yellow-900">Moderately Busy</Badge> : <Badge className="bg-green-500/80 text-white">Calm</Badge>}
                 </div>
            </CardContent>
          </Card>
          {/* Placeholder for other operational metrics */}
           <Card>
            <CardHeader><CardTitle>Other Operational Metrics</CardTitle></CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Gauges for labor cost % or inventory thresholds could be added here.</p>
                <div className="mt-4 p-4 border border-dashed rounded-md text-center">
                    <InfoIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2"/>
                    Future operational insights will appear here.
                </div>
            </CardContent>
           </Card>
        </TabsContent>

        {/* Voice AI Agent Tab */}
        <TabsContent value="voice_ai" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Calls Today"
              value={voiceCallsToday}
              icon={Phone}
              trendIcon={TrendingUp}
              trendText={`${voiceCallsToday > 10 ? '+15%' : '+5%'} from yesterday`}
              trendColorClass={getKpiCardClass('up')}
              infoText="Total voice calls handled by the AI agent today."
            />
            <KpiCard
              title="Reservations"
              value={voiceReservationsToday}
              icon={Calendar}
              trendIcon={TrendingUp}
              trendText={`${Math.round((voiceReservationsToday / Math.max(voiceCallsToday, 1)) * 100)}% of calls`}
              trendColorClass={getKpiCardClass('up')}
              infoText="Table reservations made through voice calls today."
            />
            <KpiCard
              title="Orders"
              value={voiceOrdersToday}
              icon={ShoppingBag}
              trendIcon={TrendingUp}
              trendText={`${Math.round((voiceOrdersToday / Math.max(voiceCallsToday, 1)) * 100)}% of calls`}
              trendColorClass={getKpiCardClass('up')}
              infoText="Food orders placed through voice calls today."
            />
            <KpiCard
              title="Success Rate"
              value={voiceSuccessRate}
              unit="%"
              icon={CheckCircle}
              trendIcon={TrendingUp}
              trendText="High performance"
              trendColorClass={getKpiCardClass('up')}
              infoText="Percentage of calls successfully completed without human intervention."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              title="Avg Call Duration"
              value={avgCallDuration}
              unit=" min"
              icon={Clock}
              trendIcon={TrendingDown}
              trendText="Efficient calls"
              trendColorClass={getKpiCardClass('up')}
              infoText="Average time for the AI agent to complete a call."
            />
            <KpiCard
              title="Voice Revenue"
              value={`€${voiceRevenueToday.toFixed(0)}`}
              icon={DollarSign}
              trendIcon={TrendingUp}
              trendText={`${Math.round((voiceRevenueToday / Math.max(voiceRevenueToday + 1000, 1)) * 100)}% of total`}
              trendColorClass={getKpiCardClass('up')}
              infoText="Revenue generated from voice orders today."
            />
            <KpiCard
              title="AI Agent Status"
              value="Online"
              icon={Mic}
              trendIcon={CheckCircle}
              trendText="Running smoothly"
              trendColorClass={getKpiCardClass('up')}
              infoText="Current status of the Voice AI Agent system."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-blue-600" />
                  Voice AI Performance
                </CardTitle>
                <CardDescription>Real-time analytics for the custom voice agent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Call Completion Rate</span>
                    <span className="font-medium">{voiceSuccessRate}%</span>
                  </div>
                  <Progress value={voiceSuccessRate} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Reservation Conversion</span>
                    <span className="font-medium">{Math.round((voiceReservationsToday / Math.max(voiceCallsToday, 1)) * 100)}%</span>
                  </div>
                  <Progress value={Math.round((voiceReservationsToday / Math.max(voiceCallsToday, 1)) * 100)} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Order Conversion</span>
                    <span className="font-medium">{Math.round((voiceOrdersToday / Math.max(voiceCallsToday, 1)) * 100)}%</span>
                  </div>
                  <Progress value={Math.round((voiceOrdersToday / Math.max(voiceCallsToday, 1)) * 100)} className="h-2" />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">System Health</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Excellent
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Voice Activity</CardTitle>
                <CardDescription>Latest calls processed by the AI agent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg border-l-4 border-l-green-500">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Table Reservation</div>
                      <div className="text-xs text-gray-600">4 people, tonight 7:30 PM</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">2:15 min</Badge>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg border-l-4 border-l-blue-500">
                    <ShoppingBag className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Food Order</div>
                      <div className="text-xs text-gray-600">2 pizzas, 1 salad - €43.97</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">1:52 min</Badge>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-2 bg-purple-50 rounded-lg border-l-4 border-l-purple-500">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Table Reservation</div>
                      <div className="text-xs text-gray-600">2 people, tomorrow 6:00 PM</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">1:38 min</Badge>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-2 bg-orange-50 rounded-lg border-l-4 border-l-orange-500">
                    <ShoppingBag className="h-4 w-4 text-orange-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Delivery Order</div>
                      <div className="text-xs text-gray-600">3 pasta dishes - €41.97</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">2:45 min</Badge>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" className="w-full" onClick={() => window.open('/voice-ai-agent', '_blank')}>
                    <Mic className="h-4 w-4 mr-2" />
                    Open Voice AI Interface
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Voice AI vs Traditional Channels</CardTitle>
              <CardDescription>Comparison of different order and reservation channels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-blue-600">{voiceCallsToday}</div>
                  <div className="text-sm text-gray-600">Voice AI Agent</div>
                  <div className="text-xs text-gray-500">
                    Avg: {avgCallDuration} min/call
                  </div>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-green-600">{Math.floor(Math.random() * 30) + 10}</div>
                  <div className="text-sm text-gray-600">Online Orders</div>
                  <div className="text-xs text-gray-500">
                    Avg: 4.2 min/order
                  </div>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-purple-600">{Math.floor(Math.random() * 15) + 5}</div>
                  <div className="text-sm text-gray-600">Phone (Human)</div>
                  <div className="text-xs text-gray-500">
                    Avg: 6.8 min/call
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Voice AI Advantages</span>
                </div>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• 24/7 availability with consistent quality</li>
                  <li>• Faster average call resolution time</li>
                  <li>• Zero wait times during peak hours</li>
                  <li>• Automatic integration with IOMS system</li>
                  <li>• Complete control over conversation flow</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </AppLayout>
  );
}
