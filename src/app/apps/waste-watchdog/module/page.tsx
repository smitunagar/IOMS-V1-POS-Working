"use client";

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, Upload, Image, Loader2, CheckCircle, AlertCircle, Trash2, RotateCcw } from 'lucide-react';
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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
        throw new Error('Failed to analyze image');
      }

      const result = await response.json();
      setDishIdentification(result);
      
      toast({
        title: 'Analysis Complete',
        description: `Identified: ${result.dishName}`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Failed to analyze image. Please try again.',
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
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Link 
              href="/apps/waste-watchdog"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to WasteWatchDog
            </Link>
          </div>

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-3xl">🍽️</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">WasteWatchModule</h1>
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
                
                {!capturedImage && !uploadedImage ? (
                  <div className="space-y-4">
                    {cameraError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-sm">{cameraError}</p>
                      </div>
                    )}
                    
                    <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-64 object-cover"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={startCamera}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        Start Camera
                      </button>
                      <button
                        onClick={captureImage}
                        disabled={!streamRef.current}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Image className="w-4 h-4" />
                        Capture
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={capturedImage || uploadedImage || ''}
                        alt="Captured/Uploaded"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <button
                        onClick={resetModule}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <button
                      onClick={analyzeImage}
                      disabled={isAnalyzing}
                      className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                      {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
                    </button>
                  </div>
                )}
              </div>

              {/* File Upload Section */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Upload className="w-6 h-6 text-green-600" />
                  Image Upload
                </h2>
                
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Click to upload an image</p>
                    <p className="text-sm text-gray-500 mt-2">Supports JPEG, PNG, and other image formats</p>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Analysis Results */}
            <div className="space-y-6">
              {/* Analysis Results */}
              {dishIdentification && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    Analysis Results
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-semibold text-green-900 text-lg mb-2">
                        {dishIdentification.dishName}
                      </h3>
                      <p className="text-green-700">
                        Confidence: {(dishIdentification.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Ingredients</h4>
                        <ul className="text-blue-700 text-sm space-y-1">
                          {dishIdentification.ingredients.map((ingredient, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                              {ingredient}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h4 className="font-semibold text-orange-900 mb-2">Waste Analysis</h4>
                        <p className="text-orange-700 text-sm mb-2">
                          <strong>Estimated Waste:</strong> {dishIdentification.estimatedWaste}
                        </p>
                        <p className="text-orange-700 text-sm">
                          <strong>Carbon Footprint:</strong> {dishIdentification.carbonFootprint}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-900 mb-2">Recommendations</h4>
                      <ul className="text-purple-700 text-sm space-y-1">
                        {dishIdentification.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                  How to Use
                </h2>
                
                <div className="space-y-3 text-gray-600">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
                    <p>Use your device camera or upload an image of the food waste</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
                    <p>Our AI will identify the dish and analyze its components</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">3</span>
                    <p>Get detailed insights about waste, ingredients, and carbon footprint</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
