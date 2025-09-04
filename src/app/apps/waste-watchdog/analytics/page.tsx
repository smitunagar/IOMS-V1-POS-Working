"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingDown, 
  TrendingUp, 
  Calendar as CalendarIcon,
  Download,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Leaf,
  DollarSign,
  Zap,
  Activity,
  Target,
  TreePine,
  Utensils,
  Scale,
  BarChart3,
  FileText,
  RefreshCw
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: number;
  prefix?: string;
  suffix?: string;
  icon: React.ReactNode;
  color?: string;
}

function KPICard({ title, value, trend, prefix = '', suffix = '', icon, color = 'blue' }: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200'
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-xl border-2 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
            {icon}
          </div>
          {trend !== undefined && (
            <div className={`flex items-center space-x-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="text-sm font-medium">{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-medium text-slate-600">{title}</h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function WasteAnalyticsPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  
  const [dateRange, setDateRange] = useState('7d');
  const [metric, setMetric] = useState('weight');
  const [selectedTab, setSelectedTab] = useState('analytics');
  
  // Reset tab state on page load and handle URL parameters
  useEffect(() => {
    if (tabParam && ['analytics', 'compliance', 'realtime', 'export'].includes(tabParam)) {
      setSelectedTab(tabParam);
    } else {
      // Always start with analytics tab when no specific tab is requested
      setSelectedTab('analytics');
    }
  }, [tabParam]);
  
  // Export-related state
  const [isExporting, setIsExporting] = useState(false);
  const [reportType, setReportType] = useState('summary');
  
  // Advanced filtering state
  const [selectedStation, setSelectedStation] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const [exportHistory] = useState([
    {
      name: 'Waste Analytics Report - Week 34',
      date: 'Aug 26, 2025',
      size: '1.2 MB',
      type: 'pdf'
    },
    {
      name: 'Waste Events Export - Aug 2025',
      date: 'Aug 25, 2025', 
      size: '345 KB',
      type: 'csv'
    },
    {
      name: 'Compliance Report - Q3 2025',
      date: 'Aug 20, 2025',
      size: '890 KB', 
      type: 'pdf'
    }
  ]);

  // Export function
  const handleExport = async (type: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        range: dateRange,
        format: type,
        ...(type === 'pdf' && { reportType })
      });
      
      const response = await fetch(`/api/waste/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `waste-${type === 'csv' ? 'data' : 'report'}-${dateRange}-${new Date().toISOString().split('T')[0]}.${type}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Export error:', error);
      // Could add toast notification here
    } finally {
      setIsExporting(false);
    }
  };

  // Fetch data with SWR
  const { data: kpisData, error: kpisError } = useSWR(
    `/api/waste/kpis?window=week`,
    fetcher,
    { refreshInterval: 30000 } // Refresh every 30 seconds
  );

  const { data: analyticsData, error: analyticsError } = useSWR(
    `/api/waste/analytics?range=${dateRange}&metric=${metric}`,
    fetcher,
    { refreshInterval: 60000 } // Refresh every minute
  );

  const { data: complianceData, error: complianceError } = useSWR(
    `/api/waste/compliance?range=30d`,
    fetcher,
    { refreshInterval: 300000 } // Refresh every 5 minutes
  );

  // Loading states - more specific handling
  const isLoading = !kpisData && !kpisError && !analyticsData && !analyticsError && !complianceData && !complianceError;
  const hasErrors = kpisError || analyticsError || complianceError;

  // Mock colors for charts
  const categoryColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  const stationColors = ['#8b5cf6', '#06b6d4', '#84cc16'];

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg font-medium text-slate-600">Loading analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (hasErrors) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Error Loading Data</h3>
            <p className="text-slate-600">Unable to load analytics data. Please refresh the page.</p>
            <Button 
              className="mt-4" 
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const kpis = kpisData?.data || {};
  const analytics = analyticsData?.data || {};
  const compliance = complianceData?.data || {};

  return (
    <AppLayout pageTitle="WasteWatch Analytics">
      <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">WasteWatch Analytics</h1>
          <p className="text-slate-600 mt-1">Comprehensive waste management and compliance monitoring</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Waste"
          value={kpis?.totalWasteKg?.toFixed(1) || '0'}
          suffix=" kg"
          trend={kpis?.trends?.waste}
          icon={<Scale className="w-6 h-6" />}
          color="blue"
        />
        <KPICard
          title="Cost Savings"
          value={kpis?.costSavingsEUR?.toFixed(0) || '0'}
          prefix="€"
          trend={kpis?.trends?.cost}
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
        />
        <KPICard
          title="CO₂ Reduced"
          value={kpis?.co2SavedKg?.toFixed(1) || '0'}
          suffix=" kg"
          trend={kpis?.trends?.co2}
          icon={<Leaf className="w-6 h-6" />}
          color="green"
        />
        <KPICard
          title="Waste Reduction"
          value={kpis?.wasteReductionPercent?.toFixed(1) || '0'}
          suffix="%"
          icon={<TrendingDown className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-full">
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Compliance</span>
          </TabsTrigger>
          <TabsTrigger value="realtime" className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Real-time</span>
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Analytics Controls</CardTitle>
                  <CardDescription>Customize your data view and apply filters</CardDescription>
                </div>
                <div className="flex items-center space-x-3">
                  <Select value={metric} onValueChange={setMetric}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight">Weight (kg)</SelectItem>
                      <SelectItem value="cost">Cost (€)</SelectItem>
                      <SelectItem value="co2">CO₂ Impact</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                    Filters
                  </Button>
                </div>
              </div>
            </CardHeader>
            {showAdvancedFilters && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Station Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Station</label>
                    <Select value={selectedStation} onValueChange={setSelectedStation}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stations</SelectItem>
                        <SelectItem value="kitchen">Kitchen</SelectItem>
                        <SelectItem value="bar">Bar</SelectItem>
                        <SelectItem value="dining">Dining Area</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="food">Food Waste</SelectItem>
                        <SelectItem value="oil">Oil Waste</SelectItem>
                        <SelectItem value="packaging">Packaging</SelectItem>
                        <SelectItem value="organic">Organic Waste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Staff Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Staff Member</label>
                    <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Staff</SelectItem>
                        <SelectItem value="1">Chef John</SelectItem>
                        <SelectItem value="2">Server Maria</SelectItem>
                        <SelectItem value="3">Manager Alex</SelectItem>
                        <SelectItem value="4">Bartender Sam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reset Filters */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-transparent">Reset</label>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedStation('all');
                        setSelectedCategory('all');
                        setSelectedStaff('all');
                      }}
                      className="w-full"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </div>

                {/* Active Filters Display */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedStation !== 'all' && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Station: {selectedStation}
                      <button 
                        onClick={() => setSelectedStation('all')}
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {selectedCategory !== 'all' && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Category: {selectedCategory}
                      <button 
                        onClick={() => setSelectedCategory('all')}
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {selectedStaff !== 'all' && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Staff: {selectedStaff === '1' ? 'Chef John' : selectedStaff === '2' ? 'Server Maria' : selectedStaff === '3' ? 'Manager Alex' : 'Bartender Sam'}
                      <button 
                        onClick={() => setSelectedStaff('all')}
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Trends</CardTitle>
                <CardDescription>Waste generation over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics?.dailyTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey={metric} 
                      stroke="#3b82f6" 
                      fill="#3b82f620" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Waste by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Waste by Category</CardTitle>
                <CardDescription>Distribution by waste type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics?.byCategory || []}
                      dataKey="weight"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ type, percentage }) => `${type}: ${percentage.toFixed(1)}%`}
                    >
                      {(analytics?.byCategory || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Waste by Station */}
            <Card>
              <CardHeader>
                <CardTitle>Waste by Station</CardTitle>
                <CardDescription>Source analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.byStation || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="station" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="weight" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Wasted Dishes */}
            <Card>
              <CardHeader>
                <CardTitle>Top Wasted Dishes</CardTitle>
                <CardDescription>Items with highest waste frequency</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dish</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Total Waste</TableHead>
                      <TableHead>Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(analytics?.topWastedDishes || []).slice(0, 5).map((dish: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{dish.dish}</TableCell>
                        <TableCell>{dish.frequency}</TableCell>
                        <TableCell>{dish.totalWaste.toFixed(1)} kg</TableCell>
                        <TableCell>€{dish.estimatedCost.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Impact & Ratios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TreePine className="w-5 h-5 text-green-600" />
                  <span>Environmental Impact</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600">CO₂ Equivalent</p>
                  <p className="text-xl font-bold">{analytics?.impact?.co2Equivalent}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Trees Equivalent</p>
                  <p className="text-xl font-bold">{analytics?.impact?.treesEquivalent} trees</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Meals Lost</p>
                  <p className="text-xl font-bold">{analytics?.impact?.mealsLost} meals</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Utensils className="w-5 h-5 text-blue-600" />
                  <span>Waste per Cover</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {analytics?.ratios?.wastePerCover?.toFixed(2)} kg
                  </p>
                  <p className="text-sm text-slate-600 mt-2">Average waste per customer</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <span>Waste-to-Sales Ratio</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">
                    {analytics?.ratios?.wasteToSales?.toFixed(1)}%
                  </p>
                  <p className="text-sm text-slate-600 mt-2">Of total sales value</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Compliance Score */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Score</CardTitle>
                <CardDescription>Overall compliance rating</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-5xl font-bold text-green-600">
                    {compliance?.score || 0}
                  </div>
                  <Progress value={compliance?.score || 0} className="w-full" />
                  <p className="text-sm text-slate-600">Excellent performance</p>
                </div>
              </CardContent>
            </Card>

            {/* Open Violations */}
            <Card>
              <CardHeader>
                <CardTitle>Open Violations</CardTitle>
                <CardDescription>Issues requiring attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm">Critical</span>
                  </div>
                  <Badge variant="destructive">{compliance?.openViolations?.critical || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm">Major</span>
                  </div>
                  <Badge variant="secondary">{compliance?.openViolations?.major || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm">Minor</span>
                  </div>
                  <Badge variant="outline">{compliance?.openViolations?.minor || 0}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* SDG Progress */}
            <Card>
              <CardHeader>
                <CardTitle>SDG 12.3 Progress</CardTitle>
                <CardDescription>UN Sustainable Development Goal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Progress value={compliance?.sdg12_3Progress || 0} className="w-full" />
                  <div className="text-center">
                    <p className="text-2xl font-bold">{compliance?.sdg12_3Progress || 0}%</p>
                    <p className="text-sm text-slate-600">Towards 50% reduction by 2030</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Corrective Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Corrective Actions</CardTitle>
              <CardDescription>Active compliance issues and remediation</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Issue</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(compliance?.actions || []).map((action: any) => (
                    <TableRow key={action.id}>
                      <TableCell className="font-medium">{action.title}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            action.severity === 'critical' ? 'destructive' : 
                            action.severity === 'major' ? 'secondary' : 'outline'
                          }
                        >
                          {action.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            action.status === 'closed' ? 'secondary' : 
                            action.overdue ? 'destructive' : 'outline'
                          }
                        >
                          {action.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{action.assignee || 'Unassigned'}</TableCell>
                      <TableCell className={action.overdue ? 'text-red-600' : ''}>
                        {action.dueDate}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">Update</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Log Completeness */}
          <Card>
            <CardHeader>
              <CardTitle>Log Completeness</CardTitle>
              <CardDescription>Data logging quality assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={compliance?.logCompleteness || 0} className="w-full" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Logging Completeness</span>
                  <span className="font-medium">{compliance?.logCompleteness || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Real-time Tab */}
        <TabsContent value="realtime" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Feed */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Live Waste Events</span>
                    <Badge variant="outline" className="ml-auto">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      Live
                    </Badge>
                  </CardTitle>
                  <CardDescription>Real-time waste tracking events as they happen</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {[
                      {
                        id: 1,
                        time: '15:42',
                        type: 'AI Scan',
                        category: 'Food',
                        weight: 2.3,
                        station: 'Kitchen',
                        staff: 'Chef John',
                        confidence: 92,
                        status: 'confirmed'
                      },
                      {
                        id: 2,
                        time: '15:38',
                        type: 'Manual Entry',
                        category: 'Packaging',
                        weight: 0.8,
                        station: 'Bar',
                        staff: 'Server Maria',
                        confidence: null,
                        status: 'pending'
                      },
                      {
                        id: 3,
                        time: '15:35',
                        type: 'AI Scan',
                        category: 'Oil',
                        weight: 1.5,
                        station: 'Kitchen',
                        staff: 'Prep Cook Lisa',
                        confidence: 87,
                        status: 'confirmed'
                      },
                      {
                        id: 4,
                        time: '15:31',
                        type: 'Upload Scan',
                        category: 'Food',
                        weight: 3.2,
                        station: 'Dining',
                        staff: 'Manager Alex',
                        confidence: 76,
                        status: 'review'
                      }
                    ].map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${
                              event.category === 'Food' ? 'bg-orange-500' :
                              event.category === 'Oil' ? 'bg-yellow-500' :
                              event.category === 'Packaging' ? 'bg-blue-500' : 'bg-green-500'
                            }`} />
                            <span className="text-sm font-medium">{event.time}</span>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{event.weight} kg {event.category}</span>
                              <Badge variant="outline" className="text-xs">
                                {event.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{event.station} • {event.staff}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {event.confidence && (
                            <span className="text-sm text-gray-600">{event.confidence}%</span>
                          )}
                          <Badge variant={
                            event.status === 'confirmed' ? 'default' :
                            event.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {event.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium">Live updates every 10 seconds</p>
                    <p className="text-xs text-blue-600">Last update: {new Date().toLocaleTimeString()}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Live Charts */}
              <Card>
                <CardHeader>
                  <CardTitle>Real-time Metrics</CardTitle>
                  <CardDescription>Live waste generation throughout the day</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center text-gray-500">
                      <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Live Chart Visualization</p>
                      <p className="text-sm">Real-time waste generation graph</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Real-time Stats Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span>Live Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                      <p className="text-3xl font-bold text-blue-600">6.8 kg</p>
                      <p className="text-sm text-blue-800">Today's Total</p>
                      <p className="text-xs text-blue-600">+0.8 kg last hour</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Kitchen</span>
                        <span className="text-sm font-medium">4.2 kg</span>
                      </div>
                      <Progress value={62} className="h-2" />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Bar</span>
                        <span className="text-sm font-medium">1.8 kg</span>
                      </div>
                      <Progress value={26} className="h-2" />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Dining</span>
                        <span className="text-sm font-medium">0.8 kg</span>
                      </div>
                      <Progress value={12} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Peak Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium">Lunch Rush</p>
                        <p className="text-sm text-gray-600">12:00 - 14:00</p>
                      </div>
                      <p className="text-sm font-bold text-red-600">3.2 kg</p>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div>
                        <p className="font-medium">Dinner Service</p>
                        <p className="text-sm text-gray-600">18:00 - 21:00</p>
                      </div>
                      <p className="text-sm font-bold text-orange-600">2.8 kg</p>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium">Prep Time</p>
                        <p className="text-sm text-gray-600">09:00 - 11:00</p>
                      </div>
                      <p className="text-sm font-bold text-blue-600">0.8 kg</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alerts & Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">High waste alert</p>
                        <p className="text-xs text-yellow-600">Kitchen exceeding daily target</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Pattern detected</p>
                        <p className="text-xs text-blue-600">Peak waste time approaching</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Goal achieved</p>
                        <p className="text-xs text-green-600">20% reduction this week</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>Export Data</span>
              </CardTitle>
              <CardDescription>Download waste analytics data in various formats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CSV Export */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">CSV Export</CardTitle>
                    <CardDescription>Export detailed waste event data for spreadsheet analysis</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date Range</label>
                      <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7d">Last 7 days</SelectItem>
                          <SelectItem value="30d">Last 30 days</SelectItem>
                          <SelectItem value="90d">Last 90 days</SelectItem>
                          <SelectItem value="custom">Custom range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={() => handleExport('csv')}
                      className="w-full"
                      disabled={isExporting}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isExporting ? 'Exporting...' : 'Download CSV'}
                    </Button>
                  </CardContent>
                </Card>

                {/* PDF Report */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">PDF Report</CardTitle>
                    <CardDescription>Generate comprehensive waste analytics report</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Report Type</label>
                      <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="summary">Executive Summary</SelectItem>
                          <SelectItem value="detailed">Detailed Analytics</SelectItem>
                          <SelectItem value="compliance">Compliance Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={() => handleExport('pdf')}
                      className="w-full"
                      disabled={isExporting}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {isExporting ? 'Generating...' : 'Generate PDF'}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Export History */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Exports</CardTitle>
                  <CardDescription>Download previous export files</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {exportHistory.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            item.type === 'csv' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {item.type === 'csv' ? 
                              <Scale className="w-4 h-4 text-green-600" /> : 
                              <FileText className="w-4 h-4 text-red-600" />
                            }
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">{item.date} • {item.size}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
