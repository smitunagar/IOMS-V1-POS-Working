"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Placeholder for barcode scanning logic (reuse from barcode-scanner/page.tsx)
// You may want to extract the scanner logic into a shared component for DRY code

export default function ScanCustomerPage() {
  const params = useParams();
  const customerId = params?.customerId as string;
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [added, setAdded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Request camera permission on mount
    async function requestCamera() {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: "camera" as PermissionName });
          if (result.state === "granted") {
            setCameraPermission("granted");
          } else if (result.state === "prompt") {
            // Try to get user media
            try {
              await navigator.mediaDevices.getUserMedia({ video: true });
              setCameraPermission("granted");
            } catch {
              setCameraPermission("denied");
            }
          } else {
            setCameraPermission("denied");
          }
        } catch {
          // Fallback: try to get user media
          try {
            await navigator.mediaDevices.getUserMedia({ video: true });
            setCameraPermission("granted");
          } catch {
            setCameraPermission("denied");
          }
        }
      } else {
        // Fallback: try to get user media
        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
          setCameraPermission("granted");
        } catch {
          setCameraPermission("denied");
        }
      }
    }
    requestCamera();
  }, []);

  // Placeholder: Simulate barcode scanning (replace with real scanner logic)
  const handleSimulateScan = () => {
    // Simulate a scanned barcode
    const fakeBarcode = "4012625530530";
    setScannedBarcode(fakeBarcode);
    // Simulate product lookup
    setProduct({
      name: "Ceylen Tea (earl grey)",
      brand: "Marmara",
      barcode: fakeBarcode,
      weight: "500g",
      category: "Tea",
      price: "4.49"
    });
  };

  const handleAddToInventory = () => {
    // Simulate adding to inventory (could POST to API with customerId, product, etc.)
    setAdded(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Customer Scan Portal</CardTitle>
          <div className="text-sm text-gray-500">Customer ID: {customerId}</div>
        </CardHeader>
        <CardContent>
          {cameraPermission === 'pending' && <div>Requesting camera permission...</div>}
          {cameraPermission === 'denied' && <div className="text-red-500">Camera access denied. Please enable camera permissions in your browser settings.</div>}
          {cameraPermission === 'granted' && !scannedBarcode && (
            <>
              {/* Replace this with actual barcode scanner UI */}
              <div className="mb-4">Camera is ready. Please scan a product barcode.</div>
              <Button onClick={handleSimulateScan}>Simulate Barcode Scan</Button>
              {/* <video ref={videoRef} autoPlay playsInline className="w-full h-48 bg-black rounded" /> */}
            </>
          )}
          {scannedBarcode && product && (
            <div className="space-y-2">
              <div className="font-semibold">Product Found:</div>
              <div>Name: {product.name}</div>
              <div>Brand: {product.brand}</div>
              <div>Barcode: {product.barcode}</div>
              <div>Weight: {product.weight}</div>
              <div>Category: {product.category}</div>
              <div>Price: €{product.price}</div>
              {!added ? (
                <Button className="mt-4" onClick={handleAddToInventory}>Add to Inventory</Button>
              ) : (
                <div className="text-green-600 mt-4">Product added to inventory!</div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="text-xs text-gray-400">Powered by IOMS</div>
        </CardFooter>
      </Card>
    </div>
  );
} 