"use client";

import React, { useState, useRef, useCallback } from 'react';
import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';
import {
  Camera,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Scale,
  Scan,
  Wifi,
  WifiOff,
  Battery,
  Settings,
  Download,
  Plus,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function WasteWatchHardware() {
  const { toast } = useToast();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [wasteResults, setWasteResults] = useState<any>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState('camera-1');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Hardware devices status
  const hardwareDevices = [
    {
      id: 'camera-1',
      name: 'Kitchen Camera 1',
      type: 'camera',
      status: 'online',
      battery: 85,
      location: 'Main Kitchen',
      lastSync: '2 min ago'
    },
    {
      id: 'scale-1',
      name: 'Smart Scale 1',
      type: 'scale',
      status: 'online',
      battery: 92,
      location: 'Prep Station',
      lastSync: '5 min ago'
    },
    {
      id: 'scanner-1',
      name: 'Barcode Scanner',
      type: 'scanner',
      status: 'offline',
      battery: 23,
      location: 'Storage Room',
      lastSync: '2 hours ago'
    },
    {
      id: 'camera-2',
      name: 'Waste Bin Camera',
      type: 'camera',
      status: 'maintenance',
      battery: 67,
      location: 'Disposal Area',
      lastSync: '30 min ago'
    }
  ];

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
      setCameraError('Unable to access camera. Please check permissions.');
      toast({
        title: 'Camera Access Error',
        description: 'Unable to access camera. Please check permissions.',
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

  // Mock AI waste analysis
  const analyzeWaste = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const mockResults = {
      totalWeight: '2.3kg',
      items: [
        { name: 'Rice', weight: '800g', carbonFootprint: '1.2kg CO₂', cost: '€3.20' },
        { name: 'Vegetables', weight: '600g', carbonFootprint: '0.8kg CO₂', cost: '€2.40' },
        { name: 'Chicken', weight: '500g', carbonFootprint: '2.1kg CO₂', cost: '€4.50' },
        { name: 'Bread', weight: '400g', carbonFootprint: '0.6kg CO₂', cost: '€1.80' }
      ],
      totalCarbonFootprint: '4.7kg CO₂',
      totalCost: '€11.90',
      recommendations: [
        'Consider smaller portion sizes for rice dishes',
        'Use vegetable scraps for composting',
        'Monitor chicken preparation to reduce waste'
      ]
    };
    
    setWasteResults(mockResults);
    setIsAnalyzing(false);
    
    toast({
      title: 'Analysis Complete',
      description: `Detected ${mockResults.items.length} food items totaling ${mockResults.totalWeight}`,
    });
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'camera': return Camera;
      case 'scale': return Scale;
      case 'scanner': return Scan;
      default: return Settings;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'offline': return 'text-red-600 bg-red-100';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <EnterpriseLayout pageTitle="WasteWatch Hardware">
      <TooltipProvider>
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hardware Components</h1>
                <p className="text-gray-600 mt-1">Manage devices and log waste data with AI analysis</p>
              </div>
              <div className="flex items-center space-x-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2">
                      <Plus className="w-4 h-4" />
                      <span>Add Device</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Connect new hardware devices to the WasteWatch system</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Device Management */}
            <div className="lg:col-span-1 space-y-6">
              {/* Connected Devices */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-900">Connected Devices</h3>
                </div>
                <div className="p-4 space-y-3">
                  {hardwareDevices.map((device) => {
                    const DeviceIcon = getDeviceIcon(device.type);
                    return (
                      <Tooltip key={device.id}>
                        <TooltipTrigger asChild>
                          <div 
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                              selectedDevice === device.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                            }`}
                            onClick={() => setSelectedDevice(device.id)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <DeviceIcon className="w-4 h-4 text-gray-600" />
                                <span className="font-medium text-sm">{device.name}</span>
                              </div>
                              {device.status === 'online' ? (
                                <Wifi className="w-4 h-4 text-green-600" />
                              ) : (
                                <WifiOff className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{device.location}</span>
                              <div className="flex items-center space-x-1">
                                <Battery className="w-3 h-3" />
                                <span>{device.battery}%</span>
                              </div>
                            </div>
                            <div className="mt-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(device.status)}`}>
                                {device.status}
                              </span>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {device.name} - {device.status} <br />
                            Location: {device.location} <br />
                            Last sync: {device.lastSync}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>

              {/* Device Actions */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-900">Device Actions</h3>
                </div>
                <div className="p-4 space-y-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="w-full flex items-center space-x-2 p-2 text-left hover:bg-gray-50 rounded-md transition-colors">
                        <Settings className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">Configure Device</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Adjust settings for the selected device</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="w-full flex items-center space-x-2 p-2 text-left hover:bg-gray-50 rounded-md transition-colors">
                        <Download className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Sync Data</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Manually sync data from the selected device</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="w-full flex items-center space-x-2 p-2 text-left hover:bg-gray-50 rounded-md transition-colors">
                        <Trash2 className="w-4 h-4 text-red-600" />
                        <span className="text-sm">Remove Device</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Remove the selected device from the system</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Waste Logging Interface */}
            <div className="lg:col-span-2 space-y-6">
              {/* Camera Interface */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-900">Waste Logging Interface</h3>
                  <p className="text-sm text-gray-600">Capture or upload images for AI waste analysis</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Camera Feed */}
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
                      
                      <div className="grid grid-cols-3 gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={startCamera}
                              className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm"
                            >
                              <Camera className="w-4 h-4" />
                              <span>Start</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Start live camera feed for waste capture</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={captureImage}
                              disabled={!videoRef.current?.srcObject}
                              className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Capture</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Capture current frame for analysis</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={stopCamera}
                              className="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2 text-sm"
                            >
                              <AlertCircle className="w-4 h-4" />
                              <span>Stop</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Stop camera and release resources</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      <div className="border-t pt-4">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <label className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2 cursor-pointer">
                              <Upload className="w-4 h-4" />
                              <span>Upload Image</span>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (e) => {
                                      setCapturedImage(e.target?.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Upload an existing image for waste analysis</p>
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
                              alt="Captured waste" 
                              className="w-full rounded-lg border"
                              style={{ aspectRatio: '16/9', objectFit: 'cover' }}
                            />
                          </div>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={analyzeWaste}
                                disabled={isAnalyzing}
                                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
                              <p>Use AI to identify food items and calculate waste metrics</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}

                      {wasteResults && (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-gray-900">Analysis Complete</span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-white rounded p-2">
                              <p className="text-xs text-gray-600">Total Weight</p>
                              <p className="font-bold text-orange-600">{wasteResults.totalWeight}</p>
                            </div>
                            <div className="bg-white rounded p-2">
                              <p className="text-xs text-gray-600">Carbon Impact</p>
                              <p className="font-bold text-red-600">{wasteResults.totalCarbonFootprint}</p>
                            </div>
                            <div className="bg-white rounded p-2">
                              <p className="text-xs text-gray-600">Cost Impact</p>
                              <p className="font-bold text-green-600">{wasteResults.totalCost}</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-900 mb-2">Detected Items:</p>
                            <div className="space-y-1">
                              {wasteResults.items.map((item: any, index: number) => (
                                <div key={index} className="flex justify-between text-xs bg-white rounded p-2">
                                  <span>{item.name}</span>
                                  <span className="text-gray-600">{item.weight}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-900 mb-2">Recommendations:</p>
                            <ul className="space-y-1">
                              {wasteResults.recommendations.map((rec: string, index: number) => (
                                <li key={index} className="text-xs text-gray-700 flex items-start space-x-2">
                                  <span className="text-green-600">•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </EnterpriseLayout>
  );
}
