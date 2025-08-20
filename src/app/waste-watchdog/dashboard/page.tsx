"use client";

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingDown, Leaf, DollarSign, Calendar, AlertTriangle } from 'lucide-react';

export default function WasteWatchDashboardPage() {
  // Sample data - in real app this would come from the database
  const wasteStats = {
    totalWaste: 45.2, // kg
    wasteReduction: 23.5, // percentage
    carbonFootprint: 67.8, // kg CO2
    costSavings: 234.50, // euros
    weeklyTrend: -12.3, // percentage change
    alerts: 3
  };

  const recentWasteItems = [
    { name: 'Chicken Curry', waste: 2.3, carbon: 3.4, date: '2024-01-15' },
    { name: 'Rice', waste: 1.8, carbon: 2.1, date: '2024-01-14' },
    { name: 'Vegetable Soup', waste: 1.2, carbon: 1.8, date: '2024-01-13' },
    { name: 'Bread', waste: 0.9, carbon: 1.2, date: '2024-01-12' }
  ];

  const wasteByCategory = [
    { category: 'Main Courses', waste: 18.5, percentage: 41 },
    { category: 'Side Dishes', waste: 12.3, percentage: 27 },
    { category: 'Beverages', waste: 8.7, percentage: 19 },
    { category: 'Desserts', waste: 5.7, percentage: 13 }
  ];

  return (
    <AppLayout pageTitle="WasteWatch Dashboard">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">WasteWatch Dashboard</h1>
          <p className="text-gray-600">Monitor and analyze your food waste to improve sustainability and reduce costs</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Waste</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{wasteStats.totalWaste} kg</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">↓ {wasteStats.wasteReduction}%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Carbon Footprint</CardTitle>
              <Leaf className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{wasteStats.carbonFootprint} kg CO₂</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">↓ {wasteStats.weeklyTrend}%</span> this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{wasteStats.costSavings}</div>
              <p className="text-xs text-muted-foreground">
                Saved through waste reduction
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{wasteStats.alerts}</div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Waste Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Waste Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentWasteItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{item.waste} kg</p>
                      <p className="text-sm text-gray-500">{item.carbon} kg CO₂</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Waste by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Waste by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {wasteByCategory.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{category.category}</span>
                      <span className="text-gray-500">{category.waste} kg ({category.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sustainability Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-green-500" />
              Sustainability Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {wasteStats.wasteReduction}%
                </div>
                <p className="text-sm text-green-700">Waste Reduction</p>
                <p className="text-xs text-green-600 mt-1">Compared to last month</p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {wasteStats.costSavings.toFixed(0)}€
                </div>
                <p className="text-sm text-blue-700">Cost Savings</p>
                <p className="text-xs text-blue-600 mt-1">This month</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {wasteStats.carbonFootprint.toFixed(0)} kg
                </div>
                <p className="text-sm text-purple-700">CO₂ Saved</p>
                <p className="text-xs text-purple-600 mt-1">Environmental impact</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
