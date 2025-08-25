"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useWasteWatchDog } from '@/contexts/WasteWatchDogContext';

export default function WasteWatchDogPage() {
  const { isActive, toggleWasteWatchDog } = useWasteWatchDog();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-3xl">♻️</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">WasteWatchDog</h1>
                <p className="text-xl text-gray-600">AI-Powered Waste Tracking & Sustainability System</p>
              </div>
            </div>
            
            {/* Toggle Button */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">WasteWatchDog Status</p>
                <p className={`text-lg font-semibold ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                  {isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              <button
                onClick={toggleWasteWatchDog}
                className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  isActive ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-12' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About WasteWatchDog</h2>
          <div className="prose prose-lg text-gray-600">
            <p className="mb-4">
              WasteWatchDog is an AI-powered waste tracking system designed to revolutionize how restaurants and food service businesses 
              monitor and reduce food waste. By leveraging advanced computer vision and machine learning, WasteWatchDog automatically 
              identifies waste items through camera scanning and provides comprehensive analytics on waste patterns, ingredient loss, 
              and environmental impact.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Key Features:</h3>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li><strong>Camera Waste Scanning:</strong> Automatically scan waste items using your device's camera</li>
              <li><strong>AI Waste Recognition:</strong> Intelligent identification of food waste types and quantities</li>
              <li><strong>Ingredient Waste Analysis:</strong> Detailed breakdown of which ingredients are being wasted</li>
              <li><strong>Carbon Footprint Calculation:</strong> Real-time environmental impact assessment</li>
              <li><strong>Waste Dashboard:</strong> Comprehensive analytics and reporting interface</li>
              <li><strong>Sustainability Reporting:</strong> Track progress toward waste reduction goals</li>
              <li><strong>Predictive Analytics:</strong> AI-powered insights for waste prevention</li>
              <li><strong>Automated Alerts:</strong> Real-time notifications for waste anomalies</li>
              <li><strong>Compliance Monitoring:</strong> Track regulatory and sustainability requirements</li>
            </ul>
            
            <p className="mb-4">
              The system calculates the carbon footprint based on the type and quantity of waste, helping businesses understand 
              their environmental impact and make data-driven decisions to reduce waste and improve sustainability.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                <strong>Environmental Impact:</strong> Every kilogram of food waste prevented saves approximately 2.5 kg of CO2 emissions. 
                WasteWatchDog helps you track and reduce your carbon footprint while improving operational efficiency.
              </p>
            </div>
            
            {/* Quick Access to Module */}
            <div className="mt-8 text-center">
              <Link 
                href="/apps/waste-watchdog/module"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
              >
                <span className="text-2xl">🍽️</span>
                <span>Start Waste Analysis</span>
                <span className="text-sm opacity-90">→</span>
              </Link>
              <p className="text-gray-600 mt-3">
                Access the AI-powered waste analysis module with camera scanning and dish identification
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
