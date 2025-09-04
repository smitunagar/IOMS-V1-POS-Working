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
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  Download,
  Shield,
  Target,
  Leaf,
  Globe,
  TrendingUp,
  BarChart3,
  Clock,
  Award
} from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ComplianceCenterPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('month');
  
  // Fetch compliance data
  const { data: complianceData } = useSWR(
    `/api/waste/compliance?range=${selectedTimeRange}`,
    fetcher,
    { refreshInterval: 60000 }
  );

  // Fetch sustainability metrics
  const { data: sustainabilityData } = useSWR(
    `/api/waste/sustainability?range=${selectedTimeRange}`,
    fetcher,
    { refreshInterval: 60000 }
  );

  const sdgTargets = [
    {
      id: '12.3',
      title: 'Reduce Food Waste',
      description: 'Halve per capita food waste by 2030',
      progress: 68,
      status: 'on-track',
      impact: '2.3 kg reduction per day'
    },
    {
      id: '12.5',
      title: 'Reduce Waste Generation',
      description: 'Substantially reduce waste through prevention, reduction, recycling',
      progress: 45,
      status: 'behind',
      impact: '15% total waste reduction'
    },
    {
      id: '13.3',
      title: 'Climate Action',
      description: 'Improve education on climate change mitigation',
      progress: 82,
      status: 'ahead',
      impact: '1.2 tons CO₂ saved monthly'
    }
  ];

  const complianceMetrics = [
    {
      title: 'Waste Documentation',
      value: '98%',
      target: '95%',
      status: 'compliant',
      description: 'All waste streams properly documented'
    },
    {
      title: 'Regulatory Reports',
      value: '12/12',
      target: '12/12',
      status: 'compliant',
      description: 'Monthly compliance reports submitted'
    },
    {
      title: 'Audit Readiness',
      value: '94%',
      target: '90%',
      status: 'compliant',
      description: 'Systems ready for external audits'
    },
    {
      title: 'Staff Training',
      value: '87%',
      target: '85%',
      status: 'compliant',
      description: 'Team certified in waste management'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
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
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                Compliance Center
              </h1>
              <p className="text-gray-600 mt-1">SDG tracking & regulatory compliance monitoring</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <select 
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        <Tabs defaultValue="sdg" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sdg" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              SDG Tracking
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Compliance
            </TabsTrigger>
            <TabsTrigger value="sustainability" className="flex items-center gap-2">
              <Leaf className="w-4 h-4" />
              Sustainability
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* SDG Tracking Tab */}
          <TabsContent value="sdg" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {sdgTargets.map((target) => (
                <Card key={target.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        SDG {target.id}
                      </Badge>
                      <Badge 
                        variant={target.status === 'on-track' ? 'default' : target.status === 'ahead' ? 'default' : 'destructive'}
                        className={target.status === 'ahead' ? 'bg-green-500 hover:bg-green-600' : ''}
                      >
                        {target.status === 'on-track' ? 'On Track' : target.status === 'ahead' ? 'Ahead' : 'Behind'}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{target.title}</CardTitle>
                    <CardDescription>{target.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{target.progress}%</span>
                      </div>
                      <Progress value={target.progress} className="h-2" />
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <TrendingUp className="w-4 h-4" />
                        {target.impact}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* SDG Overview Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  SDG Progress Overview
                </CardTitle>
                <CardDescription>Monthly progress tracking for sustainable development goals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>SDG Progress Chart</p>
                    <p className="text-sm">Interactive visualization coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {complianceMetrics.map((metric, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{metric.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                          Compliant
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>{metric.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-green-600">{metric.value}</span>
                        <span className="text-sm text-gray-600">Target: {metric.target}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Compliance Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Compliance Timeline
                </CardTitle>
                <CardDescription>Recent compliance activities and upcoming deadlines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { date: '2025-08-27', event: 'Monthly waste report submitted', status: 'completed' },
                    { date: '2025-08-25', event: 'Staff compliance training completed', status: 'completed' },
                    { date: '2025-08-30', event: 'Quarterly audit preparation due', status: 'upcoming' },
                    { date: '2025-09-01', event: 'SDG 12.3 progress review', status: 'upcoming' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${item.status === 'completed' ? 'bg-green-500' : 'bg-orange-500'}`} />
                      <div className="flex-1">
                        <p className="font-medium">{item.event}</p>
                        <p className="text-sm text-gray-600">{item.date}</p>
                      </div>
                      <Badge variant={item.status === 'completed' ? 'default' : 'secondary'}>
                        {item.status === 'completed' ? 'Completed' : 'Upcoming'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sustainability Tab */}
          <TabsContent value="sustainability" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Carbon Footprint
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">-24%</div>
                  <p className="text-sm text-gray-600">CO₂ reduction this month</p>
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">1.2 tons CO₂ saved</p>
                    <p className="text-xs text-green-600">Equivalent to 2,400 km of driving</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Sustainability Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">8.4/10</div>
                  <p className="text-sm text-gray-600">Overall sustainability rating</p>
                  <Progress value={84} className="mt-3 h-2" />
                  <p className="text-xs text-gray-500 mt-1">Based on waste reduction, energy efficiency, and compliance</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="w-5 h-5" />
                    Waste Diverted
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">89%</div>
                  <p className="text-sm text-gray-600">From landfill this month</p>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Recycled</span>
                      <span>45%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Composted</span>
                      <span>32%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Donated</span>
                      <span>12%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Environmental Impact Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Environmental Impact Trends
                </CardTitle>
                <CardDescription>Monthly tracking of key environmental metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Environmental Impact Chart</p>
                    <p className="text-sm">CO₂, water usage, and energy consumption trends</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Regulatory Reports</CardTitle>
                  <CardDescription>Automated compliance documentation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: 'Monthly Waste Audit Report', date: '2025-08-27', type: 'PDF' },
                    { name: 'SDG Progress Report', date: '2025-08-25', type: 'PDF' },
                    { name: 'Environmental Impact Assessment', date: '2025-08-20', type: 'Excel' },
                    { name: 'Compliance Certificate', date: '2025-08-15', type: 'PDF' }
                  ].map((report, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">{report.name}</p>
                        <p className="text-sm text-gray-600">{report.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{report.type}</Badge>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Custom Reports</CardTitle>
                  <CardDescription>Generate tailored compliance reports</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate SDG Report
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Create Analytics Summary
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Shield className="w-4 h-4 mr-2" />
                    Export Compliance Data
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Automated Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
