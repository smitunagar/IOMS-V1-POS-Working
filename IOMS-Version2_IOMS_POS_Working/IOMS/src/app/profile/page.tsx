"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";

// Mock user data (replace with real user context or API)
const mockUser = {
  id: "cust001",
  email: "john.doe@example.com",
  restaurantName: "John's Diner",
  password: "********", // Not editable
};

export default function ProfilePage() {
  const [email, setEmail] = useState(mockUser.email);
  const [restaurantName, setRestaurantName] = useState(mockUser.restaurantName);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Save logic here (API call or localStorage)
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const qrUrl = typeof window !== 'undefined' ? `${window.location.origin}/scan/${mockUser.id}` : `/scan/${mockUser.id}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>Manage your account information and access your unique QR code for inventory management.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <Input value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Restaurant Name</label>
            <Input value={restaurantName} onChange={e => setRestaurantName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <Input value={mockUser.password} disabled type="password" />
          </div>
          <Button onClick={handleSave}>Save Changes</Button>
          {saved && <div className="text-green-600 text-sm">Profile updated!</div>}
          <div className="mt-8 flex flex-col items-center">
            <div className="font-semibold mb-2">Your Inventory QR Code</div>
            <QRCodeSVG value={qrUrl} size={180} />
            <div className="mt-2 text-xs text-gray-600 text-center max-w-xs">
              Scan this QR code with your mobile device to access the inventory barcode scanner. This allows you or your staff to quickly add products to your inventory by scanning product barcodes, streamlining your stock management process.
            </div>
            <Button className="mt-2" onClick={() => navigator.clipboard.writeText(qrUrl)}>Copy QR Link</Button>
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-gray-400">Powered by IOMS</div>
        </CardFooter>
      </Card>
    </div>
  );
} 