"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import POSWasteIntegrationService from '@/lib/posWasteIntegration';
import { 
  Camera, 
  Upload, 
  Scan, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Eye,
  Scale,
  Trash2,
  Activity,
  Clock,
  User,
  MapPin
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ScanResult {
  items: Array<{
    name: string;
    category: string;
    weight: number;
    confidence: number;
  }>;
  totalWeightKg: number;
  co2Kg: number;
  costEUR: number;
  confidence: number;
}

interface WasteEventData {
  amountKg: number;
  type: 'food' | 'oil' | 'packaging' | 'organic';
  station: 'kitchen' | 'bar' | 'dining';
  staffId?: number;
  photoUrl?: string;
  confidence?: number;
  notes?: string;
}

export default function HardwareCapturePage() {
  const [activeTab, setActiveTab] = useState('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [lastThrottle, setLastThrottle] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordingToPOS, setRecordingToPOS] = useState(false);
  
  // Form data for manual confirmation
  const [wasteType, setWasteType] = useState<'food' | 'oil' | 'packaging' | 'organic'>('food');
  const [station, setStation] = useState<'kitchen' | 'bar' | 'dining'>('kitchen');
  const [notes, setNotes] = useState('');

  const { currentUser } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Record waste event to POS system
  const recordWasteEventToPOS = async (wasteData: any) => {
    if (!currentUser) return;
    
    try {
      setRecordingToPOS(true);
      const integrationService = POSWasteIntegrationService.getInstance();
      
      await integrationService.recordWasteEvent(currentUser.id, {
        type: 'food_waste',
        itemName: wasteData.name || 'Unknown waste',
        quantity: wasteData.weight || 0,
        unit: 'kg',
        cost: wasteData.costEUR || 0,
        reason: 'captured_via_scanner',
        category: wasteData.category || wasteType
      });
      
      toast({
        title: "✅ Recorded to POS",
        description: "Waste event synced with point of sale system"
      });
    } catch (error) {
      console.error('Failed to record to POS:', error);
      toast({
        title: "Warning",
        description: "Waste recorded locally, POS sync failed",
        variant: "destructive"
      });
    } finally {
      setRecordingToPOS(false);
    }
  };

  // Throttling mechanism (5 seconds)
  const checkThrottle = useCallback(() => {
    const now = Date.now();
    if (now - lastThrottle < 5000) {
      toast({
        title: "Please wait",
        description: `Wait ${Math.ceil((5000 - (now - lastThrottle)) / 1000)} seconds before next scan`,
        variant: "destructive"
      });
      return false;
    }
    setLastThrottle(now);
    return true;
  }, [lastThrottle]);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Use back camera on mobile
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Capture photo from camera
  const capturePhoto = async () => {
    if (!checkThrottle()) return;
    
    if (!videoRef.current || !canvasRef.current) return;

    setIsScanning(true);
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (blob) {
          await processImage(blob);
        }
      }, 'image/jpeg', 0.8);
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Process uploaded file
  const processUploadedFile = async () => {
    if (!selectedFile || !checkThrottle()) return;
    
    setIsScanning(true);
    await processImage(selectedFile);
  };

  // Process image (mock AI scanning)
  const processImage = async (imageBlob: Blob) => {
    try {
      // Mock API call to AI scanning service
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
      
      // Mock scan results
      const mockResult: ScanResult = {
        items: [
          {
            name: "Mixed vegetables",
            category: "food",
            weight: 2.3,
            confidence: 0.89
          },
          {
            name: "Bread waste",
            category: "food", 
            weight: 0.8,
            confidence: 0.76
          }
        ],
        totalWeightKg: 3.1,
        co2Kg: 7.75,
        costEUR: 38.75,
        confidence: 0.83
      };
      
      setScanResult(mockResult);
      
      toast({
        title: "Scan Complete",
        description: `Detected ${mockResult.items.length} items with ${(mockResult.confidence * 100).toFixed(0)}% confidence`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: "Scan Failed",
        description: "Unable to process image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Confirm and log the waste event
  const confirmAndLog = async () => {
    if (!scanResult) return;
    
    const eventData: WasteEventData = {
      amountKg: scanResult.totalWeightKg,
      type: wasteType,
      station: station,
      confidence: scanResult.confidence,
      notes: notes || 'Auto-logged via AI scanner'
    };
    
    try {
      // Record to waste tracking API
      const response = await fetch('/api/waste/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });
      
      // Record to POS integration system
      await recordWasteEventToPOS({
        name: scanResult.items[0]?.name || 'Mixed waste',
        weight: scanResult.totalWeightKg,
        costEUR: scanResult.totalCostEUR,
        category: wasteType
      });
      
      if (response.ok) {
        toast({
          title: "Waste Event Logged",
          description: `Successfully logged ${scanResult.totalWeightKg.toFixed(1)}kg of ${wasteType} waste • Synced with POS`,
          variant: "default"
        });
        
        // Reset form
        setScanResult(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        setNotes('');
        
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error('Failed to log event');
      }
    } catch (error) {
      console.error('Error logging event:', error);
      toast({
        title: "Logging Failed",
        description: "Unable to log waste event. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Hardware Capture</h1>
          <p className="text-slate-600 mt-1">Scan and log waste items using camera or file upload</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>AI Scanner Online</span>
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-full">
          <TabsTrigger value="camera" className="flex items-center space-x-2">
            <Camera className="w-4 h-4" />
            <span>Camera</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center space-x-2">
            <Scale className="w-4 h-4" />
            <span>Manual Entry</span>
          </TabsTrigger>
        </TabsList>

        {/* Camera Tab */}
        <TabsContent value="camera" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Camera Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="w-5 h-5" />
                  <span>Live Camera</span>
                </CardTitle>
                <CardDescription>Point camera at waste items to scan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative bg-slate-100 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        videoRef.current.play();
                      }
                    }}
                  />
                  {isScanning && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center text-white">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                        <p>Scanning...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="flex space-x-3">
                  <Button 
                    onClick={startCamera} 
                    variant="outline" 
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                  <Button 
                    onClick={capturePhoto}
                    disabled={isScanning}
                    className="flex-1"
                  >
                    <Scan className="w-4 h-4 mr-2" />
                    {isScanning ? 'Scanning...' : 'Capture & Scan'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Scan Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Scale className="w-5 h-5" />
                  <span>Scan Results</span>
                </CardTitle>
                <CardDescription>AI-detected waste items</CardDescription>
              </CardHeader>
              <CardContent>
                {scanResult ? (
                  <div className="space-y-4">
                    {/* Confidence Warning */}
                    {scanResult.confidence < 0.7 && (
                      <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800">
                          Low confidence detection. Please verify results.
                        </span>
                      </div>
                    )}

                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{scanResult.totalWeightKg.toFixed(1)}</p>
                        <p className="text-sm text-slate-600">kg Total</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">€{scanResult.costEUR.toFixed(2)}</p>
                        <p className="text-sm text-slate-600">Cost</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{scanResult.co2Kg.toFixed(1)}</p>
                        <p className="text-sm text-slate-600">kg CO₂</p>
                      </div>
                    </div>

                    {/* Detected Items */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Detected Items:</h4>
                      {scanResult.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-slate-600">{item.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{item.weight.toFixed(1)} kg</p>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <p className="text-sm text-slate-600">{(item.confidence * 100).toFixed(0)}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Overall Confidence */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Detection Confidence</span>
                        <span className="font-medium">{(scanResult.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={scanResult.confidence * 100} className="w-full" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Scan className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No scan results yet</p>
                    <p className="text-sm text-slate-500">Use camera to scan waste items</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Upload Image</span>
                </CardTitle>
                <CardDescription>Upload a photo of waste items to scan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Select Image</Label>
                  <Input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                </div>

                {previewUrl && (
                  <div className="space-y-3">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button 
                      onClick={processUploadedFile}
                      disabled={isScanning}
                      className="w-full"
                    >
                      <Scan className="w-4 h-4 mr-2" />
                      {isScanning ? 'Processing...' : 'Process Image'}
                    </Button>
                  </div>
                )}

                {!selectedFile && (
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center">
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">Choose an image file to upload</p>
                    <p className="text-sm text-slate-500">Supports JPG, PNG, HEIC</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Same Results Card as Camera Tab */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Scale className="w-5 h-5" />
                  <span>Scan Results</span>
                </CardTitle>
                <CardDescription>AI-detected waste items</CardDescription>
              </CardHeader>
              <CardContent>
                {scanResult ? (
                  <div className="space-y-4">
                    {/* Same content as camera tab */}
                    {scanResult.confidence < 0.7 && (
                      <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800">
                          Low confidence detection. Please verify results.
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{scanResult.totalWeightKg.toFixed(1)}</p>
                        <p className="text-sm text-slate-600">kg Total</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">€{scanResult.costEUR.toFixed(2)}</p>
                        <p className="text-sm text-slate-600">Cost</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{scanResult.co2Kg.toFixed(1)}</p>
                        <p className="text-sm text-slate-600">kg CO₂</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Detected Items:</h4>
                      {scanResult.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-slate-600">{item.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{item.weight.toFixed(1)} kg</p>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <p className="text-sm text-slate-600">{(item.confidence * 100).toFixed(0)}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Detection Confidence</span>
                        <span className="font-medium">{(scanResult.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={scanResult.confidence * 100} className="w-full" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No scan results yet</p>
                    <p className="text-sm text-slate-500">Upload an image to scan</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Manual Entry Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Scale className="w-5 h-5" />
                  <span>Manual Entry</span>
                </CardTitle>
                <CardDescription>Manually log waste items without scanning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manual-weight">Weight (kg)</Label>
                    <Input
                      id="manual-weight"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0.0"
                      className="text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manual-items">Number of Items</Label>
                    <Input
                      id="manual-items"
                      type="number"
                      min="1"
                      placeholder="1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-category">Waste Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">Food Waste</SelectItem>
                      <SelectItem value="oil">Oil Waste</SelectItem>
                      <SelectItem value="packaging">Packaging</SelectItem>
                      <SelectItem value="organic">Organic Waste</SelectItem>
                      <SelectItem value="mixed">Mixed Waste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-station">Station</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select station" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kitchen">Kitchen</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                      <SelectItem value="dining">Dining Area</SelectItem>
                      <SelectItem value="storage">Storage</SelectItem>
                      <SelectItem value="prep">Prep Area</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-staff">Staff Member</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Chef John</SelectItem>
                      <SelectItem value="2">Server Maria</SelectItem>
                      <SelectItem value="3">Manager Alex</SelectItem>
                      <SelectItem value="4">Bartender Sam</SelectItem>
                      <SelectItem value="5">Prep Cook Lisa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-reason">Waste Reason (Optional)</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overproduction">Overproduction</SelectItem>
                      <SelectItem value="spoilage">Spoilage</SelectItem>
                      <SelectItem value="customer-leftover">Customer Leftover</SelectItem>
                      <SelectItem value="prep-waste">Prep Waste</SelectItem>
                      <SelectItem value="expired">Expired Items</SelectItem>
                      <SelectItem value="accident">Accident/Spill</SelectItem>
                      <SelectItem value="portion-error">Portion Error</SelectItem>
                      <SelectItem value="quality-issue">Quality Issue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-notes">Additional Notes</Label>
                  <Input
                    id="manual-notes"
                    placeholder="Optional details about the waste..."
                  />
                </div>

                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-blue-800">
                    Manual entries are marked for verification by management
                  </span>
                </div>

                <Button className="w-full" size="lg">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Log Waste Entry
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions & Stats */}
            <div className="space-y-6">
              {/* Today's Manual Entries */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Today's Entries</span>
                  </CardTitle>
                  <CardDescription>Manual waste logs for today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">Food waste - Kitchen</p>
                          <p className="text-sm text-gray-600">2.3 kg • Chef John • 14:30</p>
                        </div>
                      </div>
                      <Badge variant="outline">Manual</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">Packaging - Bar</p>
                          <p className="text-sm text-gray-600">0.8 kg • Server Maria • 13:15</p>
                        </div>
                      </div>
                      <Badge variant="outline">Manual</Badge>
                    </div>

                    <div className="text-center pt-3">
                      <p className="text-sm text-gray-600">5 manual entries today</p>
                      <p className="text-xs text-gray-500">€12.45 estimated cost</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Entry Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">87%</p>
                      <p className="text-sm text-green-800">AI Scanned</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">13%</p>
                      <p className="text-sm text-blue-800">Manual Entry</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 border rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span>This Week</span>
                      <span className="font-medium">23 entries</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span>Average per day</span>
                      <span className="font-medium">3.3 entries</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Eye className="w-4 h-4 mr-2" />
                    View All Manual Entries
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <User className="w-4 h-4 mr-2" />
                    Staff Entry History
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MapPin className="w-4 h-4 mr-2" />
                    Station Breakdown
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirmation Section */}
      {scanResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Confirm & Log</span>
            </CardTitle>
            <CardDescription>Verify details and log the waste event</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="waste-type">Waste Type</Label>
                <Select value={wasteType} onValueChange={(value) => setWasteType(value as typeof wasteType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Food Waste</SelectItem>
                    <SelectItem value="oil">Oil Waste</SelectItem>
                    <SelectItem value="packaging">Packaging</SelectItem>
                    <SelectItem value="organic">Organic Waste</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="station">Station</Label>
                <Select value={station} onValueChange={(value) => setStation(value as typeof station)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kitchen">Kitchen</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="dining">Dining Area</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="Additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <Button 
                onClick={confirmAndLog}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm & Log Event
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setScanResult(null);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
