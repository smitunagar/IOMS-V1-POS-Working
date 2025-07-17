
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

type SignupStep = 'account' | 'complete';

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState<SignupStep>('account');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [error, setError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  
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
      setCurrentStep('complete');
      toast({ title: "Account Created", description: "Account created successfully!" });
    } else {
      setError('Failed to create account. Email might already be in use.');
    }
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
        <div className={`flex items-center space-x-2 ${currentStep === 'account' ? 'text-primary' : currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'account' ? 'bg-primary text-white' : currentStep === 'complete' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            {currentStep === 'complete' ? <CheckCircle className="w-5 h-5" /> : '1'}
          </div>
          <span className="font-medium">Account</span>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400" />
        <div className={`flex items-center space-x-2 ${currentStep === 'complete' ? 'text-primary' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'complete' ? 'bg-primary text-white' : 'bg-gray-200'}`}>2</div>
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
          {currentStep === 'complete' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Welcome to Webmeister360AI!</h3>
                <p className="text-muted-foreground">
                  Your account has been created successfully.
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
