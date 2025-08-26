"use client";

import React, { useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  BarChart3,
  Camera,
  Leaf,
  Shield,
  FileText,
  TrendingDown,
  Activity,
  Upload,
  Image,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
  RotateCcw,
  AlertTriangle,
  DollarSign,
  Download,
  Lock,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// WasteWatchDog Dashboard Component
function WasteWatchDashboard() {
  const wasteStats = {
    todayWaste: 5.2,
    hardwareStatus: 2,
    costSavings: 284,
    co2Saved: 127,
    wasteReduction: 18,
    costIncrement: 67,
    efficiency: 12,
    co2Reduction: 34
  };

  const chartData = {
    wasteDistribution: [
      { name: 'Food Waste', value: 75, color: '#22c55e' },
      { name: 'Packaging', value: 20, color: '#3b82f6' },
      { name: 'Other', value: 5, color: '#64748b' }
    ],
    weeklyEfficiency: [
      { day: 'Mon', efficiency: 85 },
      { day: 'Tue', efficiency: 88 },
      { day: 'Wed', efficiency: 90 },
      { day: 'Thu', efficiency: 89 },
      { day: 'Fri', efficiency: 92 },
      { day: 'Sat', efficiency: 95 },
      { day: 'Sun', efficiency: 97 }
    ],
    dailyWasteTracking: [
      { day: 'Mon', waste: 6.2 },
      { day: 'Tue', waste: 5.8 },
      { day: 'Wed', waste: 5.1 },
      { day: 'Thu', waste: 4.9 },
      { day: 'Fri', waste: 4.2 },
      { day: 'Sat', waste: 3.8 },
      { day: 'Sun', waste: 3.2 }
    ],
    monthlyWasteByCategory: [
      { month: 'Jan', foodWaste: 120, packaging: 30, other: 15 },
      { month: 'Feb', foodWaste: 115, packaging: 28, other: 12 },
      { month: 'Mar', foodWaste: 108, packaging: 25, other: 10 },
      { month: 'Apr', foodWaste: 95, packaging: 22, other: 8 },
      { month: 'May', foodWaste: 85, packaging: 20, other: 7 }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            WasteWatchDog
          </h1>
          <p className="text-slate-600 font-medium mt-1">Smart waste monitoring and optimization system</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg">
          Manual Scan
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 font-medium text-sm">Today's Waste</span>
            <TrendingDown className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-1">{wasteStats.todayWaste}kg</div>
          <div className="text-xs text-emerald-600 font-medium">-5% from yesterday</div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 font-medium text-sm">Hardware Status</span>
            <Shield className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-1">{wasteStats.hardwareStatus}/3</div>
          <div className="text-xs text-slate-500 font-medium">Devices online</div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 font-medium text-sm">Cost Savings</span>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-1">${wasteStats.costSavings}</div>
          <div className="text-xs text-slate-500 font-medium">This month</div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 font-medium text-sm">CO2 Saved</span>
            <Leaf className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-1">{wasteStats.co2Saved}kg</div>
          <div className="text-xs text-slate-500 font-medium">Carbon footprint reduced</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm">
        <div className="flex items-center border-b border-slate-200/50">
          <Button variant="ghost" className="px-6 py-4 text-slate-800 border-b-2 border-emerald-600 font-medium">
            Overview
          </Button>
          <Button variant="ghost" className="px-6 py-4 text-slate-600 hover:text-slate-800 font-medium">
            Hardware
          </Button>
          <Button variant="ghost" className="px-6 py-4 text-slate-600 hover:text-slate-800 font-medium">
            Analytics
          </Button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waste Distribution Chart */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-5 h-5 text-slate-600 mr-2" />
            <h3 className="text-lg font-semibold text-slate-800">Waste Distribution (Today)</h3>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="w-48 h-48 relative">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="8"
                  strokeDasharray="188 62.8"
                  className="opacity-90"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  strokeDasharray="50.2 200.6"
                  strokeDashoffset="-188"
                  className="opacity-90"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="8"
                  strokeDasharray="12.5 237.5"
                  strokeDashoffset="-238.2"
                  className="opacity-90"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800">100%</div>
                  <div className="text-xs text-slate-600">Total</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
                <span className="text-sm text-slate-600">Food Waste: 75%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-slate-600">Packaging: 20%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-slate-500 rounded-full mr-2"></div>
                <span className="text-sm text-slate-600">Other: 5%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Efficiency Trends */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-5 h-5 text-slate-600 mr-2" />
            <h3 className="text-lg font-semibold text-slate-800">Weekly Efficiency Trends</h3>
          </div>
          <div className="h-64 flex items-end justify-between space-x-2 px-4">
            {chartData.weeklyEfficiency.map((data, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className="bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg w-full transition-all duration-300 hover:from-emerald-600 hover:to-emerald-500"
                  style={{ height: `${(data.efficiency / 100) * 200}px` }}
                ></div>
                <span className="text-xs text-slate-600 mt-2 font-medium">{data.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <span className="text-sm text-emerald-600 font-medium">↗ Efficiency (%)</span>
          </div>
        </div>

        {/* Daily Waste Tracking */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-5 h-5 text-slate-600 mr-2" />
            <h3 className="text-lg font-semibold text-slate-800">Daily Waste Tracking (This Week)</h3>
          </div>
          <div className="h-64 relative">
            <svg className="w-full h-full" viewBox="0 0 300 200">
              <defs>
                <linearGradient id="wasteGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0.1"/>
                </linearGradient>
              </defs>
              <polyline
                fill="url(#wasteGradient)"
                stroke="#22c55e"
                strokeWidth="3"
                points="20,150 60,140 100,125 140,120 180,110 220,100 260,90"
              />
              <polyline
                fill="none"
                stroke="#22c55e"
                strokeWidth="3"
                points="20,150 60,140 100,125 140,120 180,110 220,100 260,90"
              />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 text-xs text-slate-600">
              {chartData.dailyWasteTracking.map((data, index) => (
                <span key={index}>{data.day}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Waste by Category */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-5 h-5 text-slate-600 mr-2" />
            <h3 className="text-lg font-semibold text-slate-800">Monthly Waste by Category</h3>
          </div>
          <div className="h-64 flex items-end justify-between space-x-4 px-4">
            {chartData.monthlyWasteByCategory.map((month, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="flex flex-col items-center w-full space-y-1">
                  <div 
                    className="bg-emerald-500 rounded-t-sm w-full"
                    style={{ height: `${(month.foodWaste / 120) * 150}px` }}
                  ></div>
                  <div 
                    className="bg-blue-500 w-full"
                    style={{ height: `${(month.packaging / 30) * 40}px` }}
                  ></div>
                  <div 
                    className="bg-slate-500 rounded-b-sm w-full"
                    style={{ height: `${(month.other / 15) * 20}px` }}
                  ></div>
                </div>
                <span className="text-xs text-slate-600 mt-2 font-medium">{month.month}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center space-x-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-emerald-500 rounded mr-1"></div>
              <span className="text-slate-600">Food Waste</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
              <span className="text-slate-600">Packaging</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-slate-500 rounded mr-1"></div>
              <span className="text-slate-600">Other</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
        <div className="flex items-center mb-6">
          <Shield className="w-5 h-5 text-slate-600 mr-2" />
          <h3 className="text-lg font-semibold text-slate-800">Performance Summary</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200/50">
            <div className="text-2xl font-bold text-emerald-600 mb-1">-{wasteStats.wasteReduction}%</div>
            <div className="text-sm text-slate-600 font-medium">Waste Reduction</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200/50">
            <div className="text-2xl font-bold text-purple-600 mb-1">+${wasteStats.costIncrement}</div>
            <div className="text-sm text-slate-600 font-medium">Cost Savings</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
            <div className="text-2xl font-bold text-blue-600 mb-1">+{wasteStats.efficiency}%</div>
            <div className="text-sm text-slate-600 font-medium">Efficiency</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border border-teal-200/50">
            <div className="text-2xl font-bold text-teal-600 mb-1">-{wasteStats.co2Reduction}kg</div>
            <div className="text-sm text-slate-600 font-medium">CO2 Reduced</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// WasteWatchDog Hardware Component with Camera Interface
function WasteWatchHardware() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [dishIdentification, setDishIdentification] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<number | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check if enough time has passed since last analysis (rate limiting)
  const canAnalyze = () => {
    if (!lastAnalysisTime) return true;
    const timeSinceLastAnalysis = Date.now() - lastAnalysisTime;
    return timeSinceLastAnalysis >= 5000; // 5 seconds minimum between requests
  };

  // Camera functionality
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraError('Unable to access camera. Please check permissions or try uploading an image instead.');
      toast({
        title: 'Camera Access Error',
        description: 'Unable to access camera. Please check permissions or try uploading an image instead.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  }, [stopCamera]);

  // Mock AI analysis function
  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true);
    setLastAnalysisTime(Date.now());
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock AI response
    const mockResult = {
      dishName: 'Chicken Curry with Rice',
      confidence: 92.5,
      ingredients: ['Chicken', 'Rice', 'Onions', 'Tomatoes', 'Spices'],
      estimatedWaste: '2.3 kg',
      carbonFootprint: '3.4 kg CO₂',
      recommendations: [
        'Consider smaller portion sizes to reduce waste',
        'Use leftover rice for fried rice tomorrow',
        'Compost vegetable scraps to reduce carbon footprint'
      ]
    };
    
    setDishIdentification(mockResult);
    setIsAnalyzing(false);
    
    toast({
      title: 'Analysis Complete',
      description: `Identified: ${mockResult.dishName} (${mockResult.confidence}% confidence)`,
    });
  };

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hardware Management</h1>
          <p className="text-gray-600">Monitor devices and analyze waste with AI-powered camera system</p>
        </div>

        {/* Camera System Status */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Camera System Status</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200 cursor-help hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3">
                      <Camera className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">Kitchen Camera 1</p>
                        <p className="text-sm text-green-600">Active - Recording</p>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Main kitchen camera monitoring cooking area - actively recording waste incidents</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200 cursor-help hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3">
                      <Camera className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">Kitchen Camera 2</p>
                        <p className="text-sm text-green-600">Active - Recording</p>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Secondary kitchen camera for prep area monitoring - capturing food preparation waste</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200 cursor-help hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3">
                      <Camera className="h-8 w-8 text-red-600" />
                      <div>
                        <p className="font-medium text-red-900">Waste Bin Camera</p>
                        <p className="text-sm text-red-600">Offline - Check connection</p>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Camera monitoring waste disposal area - currently offline. Check network connection and power supply.</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* AI Waste Analysis */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">AI Waste Analysis</h3>
            <p className="text-sm text-gray-600">Capture or upload images to analyze food waste</p>
          </div>
          <div className="p-6">
            {/* Camera Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Live Camera Feed</h4>
                <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  {cameraError ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                        <p className="text-red-600 text-sm">{cameraError}</p>
                      </div>
                    </div>
                  ) : (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                
                <div className="flex space-x-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={startCamera}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Start Camera</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Start live camera feed for waste analysis - requires camera permissions</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={captureImage}
                        disabled={!videoRef.current?.srcObject}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Capture</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Capture current frame for AI analysis - camera must be active first</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={stopCamera}
                        className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>Stop</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Stop camera feed and release camera resources</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Analysis Results */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Analysis Results</h4>
                
                {capturedImage && (
                  <div className="space-y-4">
                    <div className="relative">
                      <img 
                        src={capturedImage} 
                        alt="Captured food waste" 
                        className="w-full rounded-lg border"
                        style={{ aspectRatio: '16/9', objectFit: 'cover' }}
                      />
                    </div>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => analyzeImage(capturedImage)}
                          disabled={isAnalyzing || !canAnalyze()}
                          className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <BarChart3 className="w-4 h-4" />
                              <span>Analyze Waste</span>
                            </>
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Use AI to identify food items and calculate waste metrics - 5 second cooldown between analyses</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}

                {dishIdentification && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3 cursor-help hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-gray-900">{dishIdentification.dishName}</span>
                          <span className="text-sm text-gray-600">({dishIdentification.confidence}% confidence)</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Estimated Waste:</span>
                            <p className="font-medium text-orange-600">{dishIdentification.estimatedWaste}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Carbon Footprint:</span>
                            <p className="font-medium text-red-600">{dishIdentification.carbonFootprint}</p>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-gray-600 text-sm">Recommendations:</span>
                          <ul className="mt-1 space-y-1">
                            {dishIdentification.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                                <span className="text-green-600">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>AI analysis results showing dish identification, waste metrics, and sustainability recommendations</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Storage & Processing */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Data Storage & Processing</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="space-y-4 cursor-help">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Storage Used</span>
                      <span className="font-medium">67.3 GB / 100 GB</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '67.3%' }}></div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Local storage usage for camera feeds and analysis data - 32.7 GB remaining</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="space-y-4 cursor-help">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Processing Queue</span>
                      <span className="font-medium">12 images pending</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: '24%' }}></div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>AI analysis queue - 12 images waiting to be processed for waste identification</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default function WasteWatchDogPage() {
  const searchParams = useSearchParams();
  const activeView = searchParams.get('view') || 'dashboard';

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <WasteWatchDashboard />;
      case 'hardware':
        return <WasteWatchHardware />;
      case 'compliance':
        return (
          <TooltipProvider>
            <div className="p-6 space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Compliance Management</h1>
                <p className="text-gray-600">Monitor compliance with SDG, KRWG, and GDPR frameworks</p>
              </div>

              {/* Compliance Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-white rounded-lg border p-6 cursor-help hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Shield className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">UN SDG Compliance</h3>
                          <p className="text-2xl font-bold text-green-600">94%</p>
                          <p className="text-sm text-gray-600">Sustainable Development Goals</p>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Compliance score for UN Sustainable Development Goals 2.4 (Food Security) and 12.3 (Food Waste Reduction)</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-white rounded-lg border p-6 cursor-help hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <AlertTriangle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">KRWG Compliance</h3>
                          <p className="text-2xl font-bold text-green-600">92%</p>
                          <p className="text-sm text-gray-600">Korean Responsible Waste Guidelines</p>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Compliance with Korean Responsible Waste Guidelines including waste separation, tracking, and reduction targets</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-white rounded-lg border p-6 cursor-help hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <Lock className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">GDPR Compliance</h3>
                          <p className="text-2xl font-bold text-yellow-600">87%</p>
                          <p className="text-sm text-gray-600">Data Protection Regulation</p>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>GDPR compliance for customer data protection, consent management, and data processing transparency</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Action Items */}
              <div className="bg-white rounded-lg border">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold">Compliance Action Items</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg cursor-help hover:bg-yellow-100 transition-colors">
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">Update GDPR consent forms</p>
                            <p className="text-sm text-gray-600">Due: December 30, 2024</p>
                          </div>
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Medium Priority</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Customer consent forms need updating to include new data processing activities for AI waste analysis</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg cursor-help hover:bg-green-100 transition-colors">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">SDG 12.3 waste reduction targets met</p>
                            <p className="text-sm text-gray-600">Completed: December 15, 2024</p>
                          </div>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Completed</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Successfully achieved 50% food waste reduction target as per UN SDG 12.3 guidelines</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg cursor-help hover:bg-blue-100 transition-colors">
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">KRWG quarterly reporting</p>
                            <p className="text-sm text-gray-600">Due: January 15, 2025</p>
                          </div>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Upcoming</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Submit quarterly waste management report to Korean authorities including waste volumes and disposal methods</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          </TooltipProvider>
        );
      case 'reports':
        return (
          <TooltipProvider>
            <div className="p-6 space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
                <p className="text-gray-600">Generate comprehensive waste management reports</p>
              </div>

              {/* Report Controls */}
              <div className="bg-white rounded-lg border p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <select className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer">
                          <option value="week">Last Week</option>
                          <option value="month" selected>Last Month</option>
                          <option value="quarter">Last Quarter</option>
                          <option value="year">Last Year</option>
                        </select>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select the time period for report generation - affects all metrics and calculations</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <select className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer">
                          <option value="comprehensive" selected>Comprehensive Report</option>
                          <option value="waste-summary">Waste Summary</option>
                          <option value="compliance">Compliance Report</option>
                          <option value="cost-analysis">Cost Analysis</option>
                        </select>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Choose report type: Comprehensive includes all metrics, others focus on specific areas</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="flex items-end">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                          <Download className="w-4 h-4" />
                          <span>Generate Report</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Generate and download PDF report with selected parameters - includes charts and recommendations</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-white rounded-lg border p-6 cursor-help hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <Trash2 className="h-8 w-8 text-orange-600" />
                        <div>
                          <p className="text-2xl font-bold text-gray-900">234.5kg</p>
                          <p className="text-sm text-gray-600">Total Waste This Month</p>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total food waste generated this month - includes prep waste, spoilage, and customer plate waste</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-white rounded-lg border p-6 cursor-help hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="text-2xl font-bold text-gray-900">$3,240</p>
                          <p className="text-sm text-gray-600">Cost Savings</p>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Monthly cost savings from waste reduction initiatives compared to baseline period</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-white rounded-lg border p-6 cursor-help hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <Leaf className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="text-2xl font-bold text-gray-900">47%</p>
                          <p className="text-sm text-gray-600">Waste Reduction</p>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Percentage reduction in food waste compared to the same period last year</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-white rounded-lg border p-6 cursor-help hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <BarChart3 className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="text-2xl font-bold text-gray-900">94%</p>
                          <p className="text-sm text-gray-600">Compliance Score</p>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Overall compliance score across SDG, KRWG, and GDPR frameworks</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Available Reports */}
              <div className="bg-white rounded-lg border">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold">Available Reports</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {[
                      {
                        title: 'Monthly Waste Analysis Report',
                        description: 'Comprehensive analysis of waste patterns, trends, and recommendations',
                        date: 'December 2024',
                        size: '2.4 MB',
                        type: 'PDF'
                      },
                      {
                        title: 'SDG Compliance Report',
                        description: 'Progress tracking for UN Sustainable Development Goals 2.4 and 12.3',
                        date: 'Q4 2024',
                        size: '1.8 MB',
                        type: 'PDF'
                      },
                      {
                        title: 'Cost-Benefit Analysis',
                        description: 'Financial impact of waste reduction initiatives and ROI calculations',
                        date: 'November 2024',
                        size: '3.1 MB',
                        type: 'PDF'
                      },
                      {
                        title: 'KRWG Regulatory Submission',
                        description: 'Quarterly waste management report for Korean regulatory authorities',
                        date: 'Q4 2024',
                        size: '1.2 MB',
                        type: 'PDF'
                      }
                    ].map((report, index) => (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-help">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <FileText className="h-8 w-8 text-blue-600" />
                                <div>
                                  <h4 className="font-medium text-gray-900">{report.title}</h4>
                                  <p className="text-sm text-gray-600">{report.description}</p>
                                  <div className="flex items-center space-x-4 mt-1">
                                    <span className="text-xs text-gray-500">{report.date}</span>
                                    <span className="text-xs text-gray-500">{report.size}</span>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{report.type}</span>
                                  </div>
                                </div>
                              </div>
                              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2">
                                <Download className="w-4 h-4" />
                                <span>Download</span>
                              </button>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Click download to get {report.type} report - generated {report.date}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TooltipProvider>
        );
      default:
        return <WasteWatchDashboard />;
    }
  };

  return (
    <MainLayout>
      {renderContent()}
    </MainLayout>
  );
}
