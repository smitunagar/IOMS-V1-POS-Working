"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function AuthDebugPage() {
  const { currentUser, isLoading, logout } = useAuth();
  const router = useRouter();

  const clearAllAuth = () => {
    localStorage.removeItem('gastronomeCurrentUser');
    localStorage.removeItem('gastronomeUsersList');
    window.location.reload();
  };

  const checkLocalStorage = () => {
    const currentUser = localStorage.getItem('gastronomeCurrentUser');
    const usersList = localStorage.getItem('gastronomeUsersList');
    console.log('Current User in localStorage:', currentUser);
    console.log('Users List in localStorage:', usersList);
    alert(`Current User: ${currentUser}\nUsers List: ${usersList}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Authentication Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Auth State:</h3>
            <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
            <p>Current User: {currentUser ? JSON.stringify(currentUser, null, 2) : 'None'}</p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={checkLocalStorage}>Check localStorage</Button>
            <Button onClick={clearAllAuth} variant="destructive">Clear All Auth Data</Button>
            <Button onClick={() => router.push('/login')} variant="outline">Go to Login</Button>
            <Button onClick={() => router.push('/signup')} variant="outline">Go to Signup</Button>
            <Button onClick={() => router.push('/')} variant="outline">Go to Home</Button>
          </div>

          <div>
            <h3 className="font-semibold">Quick Actions:</h3>
            <div className="flex gap-2 mt-2">
              <Button 
                onClick={() => {
                  const testUser = { id: 'test_user', email: 'test@example.com', restaurantName: 'Test Restaurant' };
                  localStorage.setItem('gastronomeCurrentUser', JSON.stringify(testUser));
                  window.location.reload();
                }}
                variant="outline"
                size="sm"
              >
                Set Test User
              </Button>
              <Button 
                onClick={() => {
                  const testUsers = [{ id: 'test_user', email: 'test@example.com', restaurantName: 'Test Restaurant' }];
                  localStorage.setItem('gastronomeUsersList', JSON.stringify(testUsers));
                  alert('Test user added to users list');
                }}
                variant="outline"
                size="sm"
              >
                Add Test User to List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 