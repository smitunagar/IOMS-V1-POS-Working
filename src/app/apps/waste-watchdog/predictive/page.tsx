"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  TrendingDown, 
  Brain,
  Calendar,
  AlertCircle,
  Target,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  Lightbulb,
  TrendingUp,
  Clock,
  DollarSign,
  Leaf,
  Scale
} from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PredictiveAnalyticsPage() {
  const [selectedModel, setSelectedModel] = useState('waste-forecast');
  const [forecastPeriod, setForecastPeriod] = useState('7-days');
  
  // Fetch predictive data
  const { data: predictiveData } = useSWR(
    `/api/waste/predictive?model=${selectedModel}&period=${forecastPeriod}`,
    fetcher,
    { refreshInterval: 300000 } // 5 minutes
  );

  // Mock data for demonstration
  const predictions = [
    {
      type: 'Food Waste',
      current: 12.5,
      predicted: 15.2,
      trend: 'increase',
      confidence: 87,
      timeframe: 'Next 7 days',
      impact: '+21.6% vs current',
      recommendation: 'Review portion sizes and inventory management'
    },
    {
      type: 'Packaging Waste',
      current: 8.3,
      predicted: 7.1,
      trend: 'decrease',
      confidence: 92,
      timeframe: 'Next 7 days',
      impact: '-14.5% vs current',
      recommendation: 'Continue current optimization practices'
    },
    {
      type: 'Oil Waste',
      current: 2.1,
      predicted: 2.8,
      trend: 'increase',
      confidence: 78,
      timeframe: 'Next 7 days',
      impact: '+33.3% vs current',
      recommendation: 'Schedule oil filtration maintenance'
    }
  ];

  const insights = [
    {
      title: 'Peak Waste Times',
      description: 'Highest waste generation predicted for weekends',
      type: 'timing',
      action: 'Increase staff awareness during peak hours',
      priority: 'high'
    },
    {
      title: 'Inventory Optimization',
      description: 'Over-ordering of perishables detected',
      type: 'inventory',
      action: 'Reduce fresh produce orders by 15%',
      priority: 'medium'
    },
    {
      title: 'Seasonal Trends',
      description: 'Summer months show 23% increase in beverage waste',
      type: 'seasonal',
      action: 'Implement portion control for drinks',
      priority: 'medium'
    },
    {
      title: 'Cost Impact',
      description: 'Potential €245 monthly savings identified',
      type: 'financial',
      action: 'Implement suggested optimizations',
      priority: 'high'
    }
  ];

  const modelAccuracy = [
    { model: 'Food Waste Prediction', accuracy: 87, lastUpdated: '2 hours ago' },
    { model: 'Peak Time Forecasting', accuracy: 94, lastUpdated: '1 hour ago' },
    { model: 'Cost Impact Modeling', accuracy: 82, lastUpdated: '3 hours ago' },
    { model: 'Seasonal Trend Analysis', accuracy: 91, lastUpdated: '6 hours ago' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/apps/waste-watchdog"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to WasteWatchDog
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
                Predictive Analytics
              </h1>
              <p className="text-gray-600 mt-1">AI-powered waste forecasting and optimization insights</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <select 
              value={forecastPeriod}
              onChange={(e) => setForecastPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="3-days">3 Days</option>
              <option value="7-days">7 Days</option>
              <option value="14-days">14 Days</option>
              <option value="30-days">30 Days</option>
            </select>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Brain className="w-4 h-4 mr-2" />
              Retrain Models
            </Button>
          </div>
        </div>

        <Tabs defaultValue="forecasts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="forecasts" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Forecasts
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Smart Insights
            </TabsTrigger>
            <TabsTrigger value="models" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Models
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Optimization
            </TabsTrigger>
          </TabsList>

          {/* Forecasts Tab */}
          <TabsContent value="forecasts" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    Total Predicted
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">25.1 kg</div>
                  <p className="text-sm text-gray-600">Next 7 days</p>
                  <div className="flex items-center gap-1 mt-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-red-500" />
                    <span className="text-red-500">+12% vs current</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Cost Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">€52.30</div>
                  <p className="text-sm text-gray-600">Projected cost</p>
                  <div className="flex items-center gap-1 mt-2 text-sm">
                    <TrendingDown className="w-4 h-4 text-green-500" />
                    <span className="text-green-500">€8.20 savings potential</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Leaf className="w-4 h-4" />
                    CO₂ Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">31.2 kg</div>
                  <p className="text-sm text-gray-600">CO₂ equivalent</p>
                  <div className="flex items-center gap-1 mt-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    <span className="text-orange-500">+8% vs baseline</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Confidence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">87%</div>
                  <p className="text-sm text-gray-600">Model accuracy</p>
                  <Progress value={87} className="mt-2 h-2" />
                </CardContent>
              </Card>
            </div>

            {/* Detailed Predictions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Detailed Waste Forecasts</h3>
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                {predictions.map((prediction, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{prediction.type}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={prediction.trend === 'increase' ? 'destructive' : 'default'}
                            className={prediction.trend === 'decrease' ? 'bg-green-500 hover:bg-green-600' : ''}
                          >
                            {prediction.trend === 'increase' ? 'Increasing' : 'Decreasing'}
                          </Badge>
                          <span className="text-sm text-gray-600">{prediction.confidence}% confidence</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Current</p>
                          <p className="text-2xl font-bold">{prediction.current} kg</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Predicted</p>
                          <p className="text-2xl font-bold text-orange-600">{prediction.predicted} kg</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Impact</p>
                          <p className={`text-lg font-semibold ${prediction.trend === 'increase' ? 'text-red-600' : 'text-green-600'}`}>
                            {prediction.impact}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Timeframe</p>
                          <p className="text-lg font-medium">{prediction.timeframe}</p>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4" />
                          Recommendation
                        </p>
                        <p className="text-sm text-blue-700 mt-1">{prediction.recommendation}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Forecast Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Waste Forecast Trends
                </CardTitle>
                <CardDescription>7-day waste generation prediction with historical comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Predictive Forecast Chart</p>
                    <p className="text-sm">Historical vs predicted waste generation</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Smart Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {insights.map((insight, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {insight.type === 'timing' && <Clock className="w-5 h-5" />}
                        {insight.type === 'inventory' && <Scale className="w-5 h-5" />}
                        {insight.type === 'seasonal' && <Calendar className="w-5 h-5" />}
                        {insight.type === 'financial' && <DollarSign className="w-5 h-5" />}
                        {insight.title}
                      </CardTitle>
                      <Badge 
                        variant={insight.priority === 'high' ? 'destructive' : 'secondary'}
                        className={insight.priority === 'medium' ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
                      >
                        {insight.priority} priority
                      </Badge>
                    </div>
                    <CardDescription>{insight.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm font-medium text-orange-800 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Recommended Action
                      </p>
                      <p className="text-sm text-orange-700 mt-1">{insight.action}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* AI Models Tab */}
          <TabsContent value="models" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Model Performance
                  </CardTitle>
                  <CardDescription>Current AI model accuracy and status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {modelAccuracy.map((model, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">{model.model}</p>
                        <p className="text-sm text-gray-600">Last updated: {model.lastUpdated}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{model.accuracy}%</p>
                        <Progress value={model.accuracy} className="w-16 h-2" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Model Training
                  </CardTitle>
                  <CardDescription>Manage and retrain prediction models</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start" variant="outline">
                    <Brain className="w-4 h-4 mr-2" />
                    Retrain All Models
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Update Training Data
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Target className="w-4 h-4 mr-2" />
                    Optimize Parameters
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Activity className="w-4 h-4 mr-2" />
                    View Model Logs
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Model Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Model Architecture
                </CardTitle>
                <CardDescription>Neural network configuration and feature importance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center text-gray-500">
                    <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Model Architecture Visualization</p>
                    <p className="text-sm">Neural network layers and connections</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Optimization Tab */}
          <TabsContent value="optimization" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Cost Savings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">€245</div>
                  <p className="text-sm text-gray-600">Potential monthly savings</p>
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">8 optimizations identified</p>
                    <p className="text-xs text-green-600">Implementation could reduce waste by 23%</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Efficiency Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">7.8/10</div>
                  <p className="text-sm text-gray-600">Current efficiency rating</p>
                  <Progress value={78} className="mt-3 h-2" />
                  <p className="text-xs text-gray-500 mt-1">Based on waste reduction and cost optimization</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Action Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">12</div>
                  <p className="text-sm text-gray-600">Pending optimizations</p>
                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>High Priority</span>
                      <span className="font-medium">3</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medium Priority</span>
                      <span className="font-medium">5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Low Priority</span>
                      <span className="font-medium">4</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Optimization Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Optimization Recommendations
                </CardTitle>
                <CardDescription>AI-generated suggestions for waste reduction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      title: 'Reduce portion sizes during peak waste periods',
                      impact: 'High',
                      savings: '€85/month',
                      effort: 'Low',
                      category: 'Operational'
                    },
                    {
                      title: 'Optimize inventory ordering schedule',
                      impact: 'Medium',
                      savings: '€65/month',
                      effort: 'Medium',
                      category: 'Inventory'
                    },
                    {
                      title: 'Implement dynamic pricing for expiring items',
                      impact: 'High',
                      savings: '€95/month',
                      effort: 'High',
                      category: 'Technology'
                    }
                  ].map((rec, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{rec.title}</h4>
                        <Badge variant="outline">{rec.category}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Impact: </span>
                          <span className={`font-medium ${rec.impact === 'High' ? 'text-green-600' : 'text-orange-600'}`}>
                            {rec.impact}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Savings: </span>
                          <span className="font-medium text-green-600">{rec.savings}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Effort: </span>
                          <span className="font-medium">{rec.effort}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
