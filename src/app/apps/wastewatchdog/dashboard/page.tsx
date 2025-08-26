"use client";

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Leaf,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Target,
  Clock,
  Camera,
  Brain,
  Zap,
  Shield,
  Globe,
  Users,
  Award,
  FileText,
  Download,
  Eye,
  Calendar,
  Filter
} from 'lucide-react';

export default function WasteWatchDogDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');

  const kpiData = [
    {
      title: "Total Waste Today",
      value: "32.4kg",
      change: "-15.2%",
      trend: "down",
      icon: BarChart3,
      color: "bg-green-500"
    },
    {
      title: "Waste Reduction",
      value: "28.7%",
      change: "+5.2%",
      trend: "up",
      icon: TrendingDown,
      color: "bg-blue-500"
    },
    {
      title: "Carbon Saved",
      value: "45.8kg CO₂",
      change: "+12.1%",
      trend: "up",
      icon: Leaf,
      color: "bg-emerald-500"
    },
    {
      title: "Cost Savings",
      value: "€156.30",
      change: "+8.4%",
      trend: "up",
      icon: DollarSign,
      color: "bg-yellow-500"
    }
  ];

  const complianceStandards = [
    {
      id: "un-sdg",
      name: "UN Sustainable Development Goals",
      description: "SDG 12: Responsible Consumption and Production",
      compliance: 94,
      status: "compliant",
      details: "12.3 - Food waste reduction target met",
      lastAudit: "2025-08-20"
    },
    {
      id: "krwg",
      name: "Kitchen & Restaurant Waste Guidelines",
      description: "Industry best practices for waste management",
      compliance: 92,
      status: "compliant",
      details: "Meets KRWG standards for tracking and reporting",
      lastAudit: "2025-08-22"
    },
    {
      id: "gdpr",
      name: "GDPR Data Protection",
      description: "General Data Protection Regulation compliance",
      compliance: 87,
      status: "review",
      details: "Data anonymization protocols under review",
      lastAudit: "2025-08-15"
    },
    {
      id: "iso-14001",
      name: "ISO 14001 Environmental Management",
      description: "Environmental management system standard",
      compliance: 96,
      status: "compliant",
      details: "Exceeds requirements for environmental impact tracking",
      lastAudit: "2025-08-24"
    },
    {
      id: "fda-fsma",
      name: "FDA Food Safety Modernization Act",
      description: "Food safety and waste handling protocols",
      compliance: 89,
      status: "compliant",
      details: "Compliant with preventive controls for food waste",
      lastAudit: "2025-08-18"
    }
  ];

  const documentLibrary = [
    {
      title: "Waste Management Policy",
      type: "Policy Document",
      version: "v2.1",
      lastUpdated: "2025-08-20",
      size: "2.3 MB"
    },
    {
      title: "GDPR Compliance Report",
      type: "Compliance Report",
      version: "v1.5",
      lastUpdated: "2025-08-15",
      size: "1.8 MB"
    },
    {
      title: "UN SDG Implementation Guide",
      type: "Implementation Guide",
      version: "v3.0",
      lastUpdated: "2025-08-22",
      size: "4.1 MB"
    },
    {
      title: "ISO 14001 Certification",
      type: "Certificate",
      version: "v1.0",
      lastUpdated: "2025-08-24",
      size: "856 KB"
    },
    {
      title: "Monthly Audit Report",
      type: "Audit Report",
      version: "v1.2",
      lastUpdated: "2025-08-25",
      size: "3.2 MB"
    }
  ];

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header with Controls */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">WasteWatchDog Analytics</h1>
                <p className="text-gray-600">Real-time waste monitoring and compliance tracking</p>
                <p className="text-sm text-gray-500 mt-1">by IOMS team</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.map((kpi, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <div className={`w-10 h-10 rounded-lg ${kpi.color} flex items-center justify-center`}>
                  <kpi.icon className="w-5 h-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="flex items-center text-xs">
                  {kpi.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-green-500 mr-1" />
                  )}
                  <span className="text-green-600">{kpi.change}</span>
                  <span className="text-muted-foreground ml-1">vs yesterday</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="compliance">Compliance Hub</TabsTrigger>
            <TabsTrigger value="documents">Standards Library</TabsTrigger>
            <TabsTrigger value="realtime">Real-time Monitoring</TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>Comprehensive waste analytics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Waste Trends</h3>
                    <p className="text-gray-600">Daily waste reduction tracking with AI insights</p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Carbon Impact</h3>
                    <p className="text-gray-600">Environmental footprint analysis and reduction</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Hub Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-blue-500" />
                    Compliance Overview
                  </CardTitle>
                  <CardDescription>Current compliance status across all standards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {complianceStandards.map((standard) => (
                      <div key={standard.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold">{standard.name}</h3>
                            <Badge 
                              variant={standard.status === 'compliant' ? 'default' : 'destructive'}
                              className={
                                standard.status === 'compliant' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {standard.status === 'compliant' ? 'Compliant' : 'Review Required'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{standard.description}</p>
                          <p className="text-xs text-gray-500 mt-2">{standard.details}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">{standard.compliance}%</div>
                          <div className="text-xs text-gray-500">Last audit: {standard.lastAudit}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Standards Library Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-purple-500" />
                  Standards & Documentation Library
                </CardTitle>
                <CardDescription>Access compliance documents, policies, and standards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documentLibrary.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{doc.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{doc.type}</span>
                            <span>•</span>
                            <span>{doc.version}</span>
                            <span>•</span>
                            <span>{doc.size}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Updated {doc.lastUpdated}</span>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Real-time Monitoring Tab */}
          <TabsContent value="realtime" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Camera className="w-5 h-5 mr-2 text-green-500" />
                    Live Camera Feed
                  </CardTitle>
                  <CardDescription>AI-powered waste detection in real-time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">Camera feed placeholder</p>
                      <p className="text-sm text-gray-500">3 cameras active</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Live Detection Active</span>
                    </div>
                    <div className="text-sm text-gray-500">Accuracy: 94.2%</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                    Recent Alerts
                  </CardTitle>
                  <CardDescription>Live notifications and alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { time: '2 min ago', alert: 'High waste detected in prep area', severity: 'high' },
                      { time: '15 min ago', alert: 'Daily threshold reached', severity: 'medium' },
                      { time: '1 hour ago', alert: 'Camera 2 offline briefly', severity: 'low' },
                      { time: '2 hours ago', alert: 'Compliance report generated', severity: 'info' }
                    ].map((alert, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border-l-4 border-orange-500 bg-orange-50 rounded">
                        <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{alert.alert}</p>
                          <p className="text-xs text-gray-500">{alert.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
