
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2, Upload, CheckCircle, ArrowRight, ArrowLeft, FileText, Utensils } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';

type SignupStep = 'account' | 'menu' | 'complete';

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState<SignupStep>('account');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [error, setError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [menuUploaded, setMenuUploaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const { signup, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setError('');
    setIsSigningUp(true);
    
    const success = await signup(email, password, restaurantName);
    setIsSigningUp(false);
    
    if (success) {
      // Get the user ID from the auth context or localStorage
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      setUserId(currentUser.id);
      setCurrentStep('menu');
      toast({ title: "Account Created", description: "Account created successfully! Now let's set up your menu." });
    } else {
      setError('Failed to create account. Email might already be in use.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleMenuUpload = async () => {
    if (!selectedFile || !userId) return;
    
    setIsUploading(true);
    setUploadProgress('Processing your menu...');
    
    try {
      const fileData = await selectedFile.arrayBuffer();
      const base64File = Buffer.from(fileData).toString('base64');
      
      setUploadProgress('Analyzing menu structure...');
      
      const response = await fetch('/api/uploadMenu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: base64File, userId: userId }),
      });
      
      if (!response.ok) {
        let errorMsg = 'Upload failed';
        try {
          const err = await response.json();
          if (err && err.error && err.error.includes('overloaded')) {
            errorMsg = 'AI service is overloaded. Please try again in a few minutes.';
          } else if (err && err.error) {
            errorMsg = err.error;
          }
        } catch {}
        throw new Error(errorMsg);
      }
      
      setUploadProgress('Saving menu to your account...');
      
      const data = await response.json();
      
      if (Array.isArray(data.menu) || Array.isArray(data.items)) {
        const menuItems = Array.isArray(data.menu) ? data.menu : data.items;
        
        // Save menu to CSV
        const res = await fetch('/api/menuCsv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ menu: menuItems, userId: userId })
        });
        
        if (!res.ok) throw new Error('Failed to save menu');
        
        setMenuUploaded(true);
        setUploadProgress('Menu uploaded successfully!');
        
        toast({ 
          title: 'Menu Uploaded', 
          description: `Successfully processed ${menuItems.length} menu items.` 
        });
        
        setTimeout(() => {
          setCurrentStep('complete');
        }, 2000);
        
      } else {
        throw new Error('No menu items found in the uploaded file.');
      }
    } catch (error: any) {
      let errorMsg = error?.message || 'Failed to upload menu.';
      if (errorMsg.includes('overloaded')) {
        errorMsg = 'AI service is overloaded. Please try again in a few minutes.';
      }
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
      setUploadProgress('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkipMenu = () => {
    setCurrentStep('complete');
    toast({ title: 'Menu Setup Skipped', description: 'You can upload your menu later from the Menu Upload section.' });
  };

  const handleComplete = () => {
    router.push('/login');
  };
  
  if (authIsLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Loading...</p>
      </div>
    );
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        <div className={`flex items-center space-x-2 ${currentStep === 'account' ? 'text-primary' : currentStep === 'menu' || currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'account' ? 'bg-primary text-white' : currentStep === 'menu' || currentStep === 'complete' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            {currentStep === 'menu' || currentStep === 'complete' ? <CheckCircle className="w-5 h-5" /> : '1'}
          </div>
          <span className="font-medium">Account</span>
        </div>
        
        <ArrowRight className="w-5 h-5 text-gray-400" />
        
        <div className={`flex items-center space-x-2 ${currentStep === 'menu' ? 'text-primary' : currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'menu' ? 'bg-primary text-white' : currentStep === 'complete' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            {currentStep === 'complete' ? <CheckCircle className="w-5 h-5" /> : '2'}
          </div>
          <span className="font-medium">Menu</span>
        </div>
        
        <ArrowRight className="w-5 h-5 text-gray-400" />
        
        <div className={`flex items-center space-x-2 ${currentStep === 'complete' ? 'text-primary' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'complete' ? 'bg-primary text-white' : 'bg-gray-200'}`}>
            3
          </div>
          <span className="font-medium">Complete</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Create Account</CardTitle>
          <CardDescription>Join Webmeister360AI to manage your restaurant.</CardDescription>
        </CardHeader>
        
        {renderStepIndicator()}
        
        <CardContent>
          {currentStep === 'account' && (
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="restaurantName">Restaurant Name (Optional)</Label>
                <Input
                  id="restaurantName"
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="My Awesome Restaurant"
                  className="text-base"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="text-base"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="text-base"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="text-base"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full text-lg py-3" disabled={isSigningUp || authIsLoading}>
                {isSigningUp ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Create Account
              </Button>
            </form>
          )}

          {currentStep === 'menu' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <Utensils className="w-12 h-12 mx-auto text-primary" />
                <h3 className="text-xl font-semibold">Upload Your Menu</h3>
                <p className="text-muted-foreground">
                  Upload your restaurant menu PDF and we'll automatically parse it for you.
                  Your menu will be available in the Order Entry section.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="hidden"
                    id="menu-file"
                  />
                  <label htmlFor="menu-file" className="cursor-pointer">
                    <div className="text-sm text-gray-600">
                      {selectedFile ? (
                        <div className="flex items-center justify-center space-x-2">
                          <FileText className="w-4 h-4" />
                          <span>{selectedFile.name}</span>
                        </div>
                      ) : (
                        <span>Click to select a PDF file or drag and drop</span>
                      )}
                    </div>
                  </label>
                </div>
                
                {uploadProgress && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <LoadingSpinner 
                      message={uploadProgress} 
                      size="sm" 
                      className="text-blue-800"
                    />
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <Button 
                    onClick={handleMenuUpload} 
                    disabled={!selectedFile || isUploading}
                    className="flex-1"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload & Parse Menu
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleSkipMenu}
                    disabled={isUploading}
                  >
                    Skip for Now
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Welcome to Webmeister360AI!</h3>
                <p className="text-muted-foreground">
                  Your account has been created successfully.
                  {menuUploaded && " Your menu has been uploaded and is ready to use in the Order Entry section."}
                </p>
              </div>
              <Button onClick={handleComplete} className="w-full">
                Continue to Login
              </Button>
            </div>
          )}
        </CardContent>
        
        {currentStep === 'account' && (
          <CardFooter className="flex flex-col items-center text-sm">
            <p>
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
