'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as inventoryService from '@/lib/inventoryService'; // Assuming an inventory service exists
import { AppLayout } from '../../components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';      

const BarcodeScannerPage: React.FC = () => {
  // References for video element and ZXing code reader
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<any | null>(null);
  const { user } = useAuth(); // ✅ move inside component

  const [userId, setUserId] = useState<string | null>(null);
  // State variables for scanner functionality
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isZxingLoaded, setIsZxingLoaded] = useState<boolean>(false);

  // States for product details and inventory actions
  const { toast } = useToast(); // Hook for displaying toast notifications
  const [productDetails, setProductDetails] = useState<any | null>(null);
  const [productLoading, setProductLoading] = useState<boolean>(false);
  const [productError, setProductError] = useState<string | null>(null);

  // State for manual barcode input
  const [manualBarcodeInput, setManualBarcodeInput] = useState<string>('');

  // State for quantity input
  const [quantity, setQuantity] = useState<number>(1);

  // Effect hook to load the ZXing library dynamically
  useEffect(() => {
    const zxingScript = document.createElement('script');
    zxingScript.src = "https://unpkg.com/@zxing/library@latest/umd/index.min.js";
    zxingScript.async = true;

    zxingScript.onload = () => {
      // Check if ZXing is available on the window object
      if (typeof window !== 'undefined' && (window as any).ZXing) {
        if ((window as any).ZXing.BrowserCodeReader) {
          // Configure ZXing to locate its worker file if necessary (for development setup)
          (window as any).ZXing.BrowserCodeReader.setLocateFile = (path: string, prefix: string) => {
            if (path.endsWith('zxing.min.js')) {
              return `/zxing.min.js`; // Adjust path if worker is served differently
            }
            return prefix + path;
          };
        } else {
          console.warn("window.ZXing.BrowserCodeReader not found, worker location might not be configurable.");
        }
        
        // Initialize the ZXing BrowserMultiFormatReader
        codeReader.current = new (window as any).ZXing.BrowserMultiFormatReader();
        setIsZxingLoaded(true);
        setErrorMessage(null); // Clear any previous loading errors
      } else {
        setErrorMessage("ZXing library failed to load or is not available on window.ZXing.");
        console.error("ZXing library (window.ZXing) not found after script load.");
      }
    };

    zxingScript.onerror = () => {
      setErrorMessage("Failed to load ZXing library script. Please check your network connection.");
      console.error("ZXing script loading failed.");
      setIsZxingLoaded(false);
    };

    // Append the ZXing script to the document body
    document.body.appendChild(zxingScript);

    // Cleanup function: reset scanner and remove script on component unmount
    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
      }
      if (document.body.contains(zxingScript)) {
        document.body.removeChild(zxingScript);
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Function to simulate fetching product details from a database
  const fetchProductDetails = async (barcode: string) => {
  setProductLoading(true);
  setProductDetails(null);
  setProductError(null);
  setScannedResult(null);

  try {
    const res = await fetch(`/api/products?barcode=${encodeURIComponent(barcode)}`);
    if (!res.ok) {
      throw new Error('Product not found');
    }

    const product = await res.json();

    return {
      name: product.name,
      description: product.brand || product.category || "No description available",
      price: product.price,
      expiryDate: null,
      manufacturingDate: null,
      batchNumber: null,
    };
  } catch (err) {
    console.error('Fetch failed:', err);
    return null;
  } finally {
    setProductLoading(false);
  }
};


  // Handler for manual barcode lookup
  async function handleManualBarcodeLookup() {
  const barcode = manualBarcodeInput.trim();

  if (!barcode) {
    setProductError("Please enter a barcode number.");
    return;
  }

  setErrorMessage(null);           // Clear any camera errors
  setProductError(null);           // Clear previous product errors
  setProductDetails(null);         // Clear previous product info
  setProductLoading(true);         // Start loading state
  setScannedResult(null);          // Reset scanned result for clarity

  try {
    const details = await fetchProductDetails(barcode); // 🔍 Call CSV-based lookup

    if (details) {
      setProductDetails(details);
      setManualBarcodeInput('');  // Clear input field
    } else {
      setProductError(`No product found for barcode: ${barcode}`);
    }
  } catch (error) {
    console.error("Error during barcode lookup:", error);
    setProductError("An error occurred while fetching product details.");
  } finally {
    setProductLoading(false);      // Ensure loading ends
  }
}


  const handleAddToInventory = async () => {
  if (!productDetails) {
    toast({ title: "Error", description: "No product details available.", variant: "destructive" });
    return;
  }

  // 1️⃣ Get userId (from localStorage or auth context)
  const userId = localStorage.getItem('userId'); // ✅ Update this line as per your system
  if (!userId) {
    toast({ title: "Error", description: "No user session found. Please log in.", variant: "destructive" });
    return;
  }

  const barcodeToAdd = manualBarcodeInput.trim() || scannedResult;
  if (!barcodeToAdd) {
    toast({ title: "Error", description: "No barcode available to add to inventory.", variant: "destructive" });
    return;
  }

  // 2️⃣ Build correct ingredient object
  const ingredient = {
    name: productDetails.name,                                // ✅ REQUIRED
    quantity: quantity,                                       // ✅ REQUIRED
    unit: 'pcs',                                              // ✅ REQUIRED, fallback
    category: productDetails.category || 'Pantry',            // optional, fallback
    price: productDetails.price || null,                     // optional
    barcode: barcodeToAdd,                                    // optional
    expiryDate: productDetails.expiryDate || null,            // optional
    manufacturingDate: productDetails.manufacturingDate || null, // optional
    batchNumber: productDetails.batchNumber || null,          // optional
    image: productDetails.imageUrl || "https://placehold.co/60x60.png", // fallback image
  };

  try {
    const addedItem = inventoryService.addIngredientToInventoryIfNotExists(userId, ingredient);

    if (addedItem) {
      toast({ title: "Success", description: `${addedItem.name} added to inventory.` });
    } else {
      toast({ title: "Info", description: `${ingredient.name} already exists in inventory.` });
    }

    setManualBarcodeInput('');
    setProductDetails(null);
    setQuantity(1);
    setScannedResult(null);
  } catch (error) {
    console.error('Error adding to inventory:', error);
    toast({ title: "Error", description: "Failed to add item to inventory.", variant: "destructive" });
  }
};


  // Function to start the camera scanning process
  const startScanning = async () => {
    if (!isZxingLoaded) {
      setErrorMessage("Scanner library is still loading. Please wait a moment.");
      return;
    }
    if (!videoRef.current || !codeReader.current) {
      setErrorMessage("Video element or scanner not initialized.");
      return;
    }

    // Reset relevant states before starting a new scan
    setIsScanning(true);
    setScannedResult(null);
    setErrorMessage(null);
    setProductDetails(null);
    setProductError(null);
    setProductLoading(false);
    setManualBarcodeInput(''); // Clear manual input when starting scan

    try {
      // Get available video input devices (cameras)
      const videoInputDevices = await codeReader.current.getVideoInputDevices();

      if (videoInputDevices.length === 0) {
        setErrorMessage("No video input devices found. Please ensure a camera is connected and allowed.");
        setIsScanning(false);
        return;
      }

      // Use the first available camera device
      const selectedDeviceId = videoInputDevices[0].deviceId;

      // Start decoding from the video stream
      codeReader.current.decodeFromVideoDevice(selectedDeviceId, videoRef.current, async (result: any, err: any) => {
        if (result) {
          // If a barcode is successfully scanned
          const barcodeData = result.getText();
          setScannedResult(barcodeData);
          setErrorMessage(null);
          setIsScanning(false);
          codeReader.current?.reset(); // Stop the scanner after a successful scan
          setManualBarcodeInput(barcodeData); // Populate manual input with scanned result
          console.log(`Scanned barcode: ${barcodeData}. Fetching product details...`);
          
          // Fetch product details for the scanned barcode
          const details = await fetchProductDetails(barcodeData);
          if (details) {
            setProductDetails(details);
          } else {
            setProductError(`No product found for barcode: ${barcodeData}`);
          }
          setProductLoading(false); // End loading state
        }
        if (err && !(err instanceof (window as any).ZXing.NotFoundException)) {
          // Handle other scanning errors, but ignore NotFoundException (no barcode found yet)
          console.error('Error scanning barcode:', err);
          setErrorMessage(`Error scanning: ${err.message}`);
          setIsScanning(false);
          codeReader.current?.reset(); // Reset scanner on error
          setProductLoading(false);
        }
      });
    } catch (error: any) {
      // Catch errors related to camera access or initialization
      console.error('Error starting camera or decoding:', error);
      setErrorMessage(`Error accessing camera: ${error.message || 'Unknown error'}. Please grant camera permission.`);
      setIsScanning(false);
      setProductLoading(false);
    }
  };

  // Function to stop the camera scanning process
  const stopScanning = () => {
    if (codeReader.current) {
      codeReader.current.reset(); // Reset the scanner to stop the camera feed
    }
    // Reset relevant states when stopping scan
    setIsScanning(false);
    setScannedResult(null);
    setErrorMessage(null);
    setProductDetails(null);
    setProductError(null);
    setProductLoading(false);
    // Manual input is kept as is, allowing the user to continue with it
  };

  return (
    // AppLayout provides a consistent layout for the page
    <AppLayout>
      <div className="flex flex-col items-center p-5 bg-gray-100 min-h-screen font-inter">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 rounded-md p-2">Barcode Scanner</h1>

        {/* Video Scanner Section */}
        <div className="w-full max-w-lg mb-6 bg-white shadow-lg rounded-lg overflow-hidden border border-gray-300">
          <video
            ref={videoRef}
            className="w-full h-auto block rounded-t-lg"
            style={{ transform: 'scaleX(-1)' }} // Mirror the video feed for natural user experience
            playsInline // Important for mobile devices to allow inline playback
            autoPlay // Automatically start video playback
          />
          <div className="p-4 bg-gray-50 text-center text-sm text-gray-600 rounded-b-lg">
            {isScanning ? "Scanning for barcodes..." : (isZxingLoaded ? "Press 'Start Scanning' to begin." : "Loading scanner components...")}
          </div>
        </div>

        {/* Action Buttons: Start/Stop Scanning */}
        <div className="mt-6 mb-6 space-x-4">
          {!isScanning ? (
            <button
              onClick={startScanning}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-all duration-200"
              disabled={!isZxingLoaded} // Disable button if ZXing library is not yet loaded
            >
              {isZxingLoaded ? 'Start Camera Scan' : 'Loading Scanner...'}
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 transition-all duration-200"
            >
              Stop Camera Scan
            </button>
          )}
        </div>

        {/* Manual Barcode Input Section */}
        <div className="w-full max-w-lg p-5 bg-white shadow-lg rounded-lg border border-gray-300 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Manual Barcode Input</h2>
          <input // Barcode input field
            type="text"
            value={manualBarcodeInput}
            onChange={(e) => setManualBarcodeInput(e.target.value)}
            placeholder="Enter barcode number"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-center text-lg"
            disabled={!isZxingLoaded} // Disable input until ZXing is loaded
          />
           <input // Quantity input field
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} // Ensure quantity is at least 1
            placeholder="Quantity"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-center text-lg"
            min="1" // HTML5 min attribute for numeric input
            disabled={!isZxingLoaded || !manualBarcodeInput.trim()} // Disable if ZXing not loaded or no barcode entered
          />
          <div className="flex space-x-4">
            <button
              onClick={handleManualBarcodeLookup}
            
              className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isZxingLoaded || !manualBarcodeInput.trim()} // Disable if not loaded or input is empty
            >
              Lookup Barcode
            </button>
             <button
              onClick={handleAddToInventory}
              className="flex-1 px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-75 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              // Disable if ZXing not loaded, no barcode (manual or scanned), no product details, or quantity is zero/negative
              disabled={!isZxingLoaded || !productDetails || quantity <= 0} 
            >
              Add to Inventory
            </button>
          </div>
        </div>

        {/* Results and Error Messages Display Area */}
        {scannedResult && !productDetails && !productLoading && !productError && ( // Show only if scanned and no product details found yet
          <div className="mt-4 p-4 bg-green-100 text-green-800 font-semibold text-lg rounded-lg shadow-md break-words">
            Scanned Result: <span className="font-mono break-all">{scannedResult}</span>
          </div>
        )}

        {productLoading && (
          <div className="mt-4 p-4 bg-blue-100 text-blue-800 font-medium text-center rounded-lg shadow-md">
            Fetching product details...
          </div>
        )}

        {productDetails && (
          <div className="mt-4 p-4 bg-purple-100 text-purple-800 font-semibold text-lg rounded-lg shadow-md w-full max-w-lg">
            <h2 className="text-xl font-bold mb-2">Product Details</h2>
            <p><strong>Name:</strong> {productDetails.name}</p>
            <p><strong>Description:</strong> {productDetails.description}</p>
            <p><strong>Price:</strong> {productDetails.price}</p>
            {productDetails.expiryDate && (
              <p><strong>Expiry Date:</strong> {productDetails.expiryDate}</p>
            )}
            {productDetails.batchNumber && (
              <p><strong>Batch Number:</strong> {productDetails.batchNumber}</p>
            )}
            {productDetails.manufacturingDate && (
              <p><strong>Mfg. Date:</strong> {productDetails.manufacturingDate}</p>
            )}
          </div>
        )}

        {productError && (
          <div className="mt-4 p-4 bg-orange-100 text-orange-800 font-medium text-center rounded-lg shadow-md">
            {productError}
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-4 bg-red-100 text-red-800 font-medium text-center rounded-lg shadow-md">
            Error: {errorMessage}
          </div>
        )}

        {/* Tailwind CSS CDN - for rapid prototyping. For production, integrate via build process. */}
        <script src="https://cdn.tailwindcss.com"></script>
      </div>
    </AppLayout>
  );
};

export default BarcodeScannerPage;
