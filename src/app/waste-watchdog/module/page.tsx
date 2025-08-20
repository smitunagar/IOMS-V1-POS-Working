"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Image, Loader2, CheckCircle, AlertCircle, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';

interface DishIdentification {
  dishName: string;
  confidence: number;
  ingredients: string[];
  estimatedWaste: string;
  carbonFootprint: string;
  recommendations: string[];
}

export default function WasteWatchModulePage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [dishIdentification, setDishIdentification] = useState<DishIdentification | null>(null);
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

  // Get time until next analysis is allowed
  const getTimeUntilNextAnalysis = () => {
    if (!lastAnalysisTime) return 0;
    const timeSinceLastAnalysis = Date.now() - lastAnalysisTime;
    return Math.max(0, 5000 - timeSinceLastAnalysis);
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

  // File upload functionality
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedImage(e.target?.result as string);
          setCapturedImage(null);
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please select an image file (JPEG, PNG, etc.)',
          variant: 'destructive',
        });
      }
    }
  };

  // Analyze image with Gemini
  const analyzeImage = async () => {
    const imageToAnalyze = capturedImage || uploadedImage;
    if (!imageToAnalyze) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/waste-watchdog/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageToAnalyze }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 429) {
          // Rate limit error
          toast({
            title: 'Rate Limit Exceeded',
            description: errorData.details || 'Please wait a moment before trying again.',
            variant: 'destructive',
          });
          
          // Show retry suggestion
          setTimeout(() => {
            toast({
              title: 'Ready to Retry',
              description: 'You can now try analyzing the image again.',
              variant: 'default',
            });
          }, 30000); // 30 seconds
          
          return;
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setDishIdentification(result);
      setLastAnalysisTime(Date.now()); // Update last analysis time
      
      toast({
        title: 'Analysis Complete',
        description: `Identified: ${result.dishName}`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      
      let errorMessage = 'Failed to analyze image. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Analysis Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset functionality
  const resetModule = () => {
    setCapturedImage(null);
    setUploadedImage(null);
    setDishIdentification(null);
    setCameraError(null);
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <AppLayout pageTitle="WasteWatch Module">
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-3xl">🍽️</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">WasteWatch Module</h1>
                <p className="text-xl text-gray-600">AI-powered waste tracking and dish identification</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Image Capture/Upload */}
            <div className="space-y-6">
              {/* Camera Section */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Camera className="w-6 h-6 text-blue-600" />
                  Camera Capture
                </h2>
                
                {!capturedImage && !uploadedImage && (
                  <div className="space-y-4">
                    {!streamRef.current ? (
                      <button
                        onClick={startCamera}
                        className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Camera className="w-5 h-5" />
                        Start Camera
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full rounded-lg border-2 border-gray-200"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={captureImage}
                            className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <Image className="w-5 h-5" />
                            Capture Image
                          </button>
                          <button
                            onClick={stopCamera}
                            className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                          >
                            Stop Camera
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {cameraError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-sm">{cameraError}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Image Upload Alternative */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-green-600" />
                    Or Upload Image
                  </h3>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>

              {/* Analysis Controls */}
              {(capturedImage || uploadedImage) && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Analysis Controls</h2>
                  
                  {/* Rate Limit Warning */}
                  {!canAnalyze() && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">Rate Limited</span>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">
                        Please wait {Math.ceil(getTimeUntilNextAnalysis() / 1000)} seconds before next analysis
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <button
                      onClick={analyzeImage}
                      disabled={isAnalyzing || !canAnalyze()}
                      className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Analyzing...
                        </>
                      ) : !canAnalyze() ? (
                        <>
                          <AlertTriangle className="w-4 h-4" />
                          Wait {Math.ceil(getTimeUntilNextAnalysis() / 1000)}s
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Analyze Image
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={resetModule}
                      className="w-full py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Reset Module
                    </button>
                  </div>
                  
                  {/* Rate Limiting Info */}
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">Rate Limiting</span>
                    </div>
                    <p className="text-xs text-blue-700">
                      To avoid API rate limits, please wait at least 5 seconds between analyses. 
                      This helps ensure reliable service for all users.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Results & Display */}
            <div className="space-y-6">
              {/* Captured/Uploaded Image Display */}
              {(capturedImage || uploadedImage) && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Image Preview</h2>
                  <div className="relative">
                    <img
                      src={capturedImage || uploadedImage || ''}
                      alt="Captured/Uploaded"
                      className="w-full rounded-lg border-2 border-gray-200"
                    />
                    <button
                      onClick={() => {
                        setCapturedImage(null);
                        setUploadedImage(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Analysis Results */}
              {dishIdentification && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Analysis Results
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h3 className="font-semibold text-green-800 mb-2">Identified Dish</h3>
                      <p className="text-2xl font-bold text-green-900">{dishIdentification.dishName}</p>
                      <p className="text-sm text-green-700">Confidence: {(dishIdentification.confidence * 100).toFixed(1)}%</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-1">Estimated Waste</h4>
                        <p className="text-lg font-bold text-blue-900">{dishIdentification.estimatedWaste}</p>
                      </div>
                      
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <h4 className="font-semibold text-orange-800 mb-1">Carbon Footprint</h4>
                        <p className="text-lg font-bold text-orange-900">{dishIdentification.carbonFootprint}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-2">Ingredients</h4>
                      <div className="flex flex-wrap gap-2">
                        {dishIdentification.ingredients.map((ingredient, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                          >
                            {ingredient}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 mb-2">Recommendations</h4>
                      <ul className="space-y-1">
                        {dishIdentification.recommendations.map((recommendation, index) => (
                          <li key={index} className="text-sm text-yellow-700 flex items-start gap-2">
                            <span className="text-yellow-600 mt-1">•</span>
                            {recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Instructions */}
              {!capturedImage && !uploadedImage && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">How to Use</h2>
                    <div className="space-y-3 text-gray-600">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                          1
                        </div>
                        <p>Use the camera to capture an image of food waste or upload an existing image</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                          2
                        </div>
                        <p>Click "Analyze Image" to process the image with AI</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                          3
                        </div>
                        <p>Review the analysis results including waste estimation and recommendations</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Configuration Check */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Configuration Check</h2>
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">WasteWatchDog Module</span>
                        </div>
                        <p className="text-xs text-green-700 mt-1">Module is properly configured and ready to use</p>
                      </div>
                      
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-800">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">Rate Limiting</span>
                        </div>
                        <p className="text-xs text-blue-700 mt-1">
                          To ensure reliable service, please wait 5 seconds between analyses. 
                          This helps avoid API rate limits and ensures consistent results.
                        </p>
                      </div>
                      
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">API Configuration</span>
                        </div>
                        <p className="text-xs text-yellow-700 mt-1">
                          Make sure you have a valid Gemini API key configured in your environment. 
                          Contact your administrator if you encounter configuration errors.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
