'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function DashboardPage() {
  const { currentUser, isLoading, isInitialized } = useAuth();

  return (
    <AppLayout pageTitle="IOMS Dashboard">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to IOMS Dashboard</h1>
              <p className="text-xl text-gray-600 mb-6">
                Your central hub for managing restaurant operations, inventory, and analytics
              </p>
              
              {/* Marketplace Link */}
              <div className="mb-8">
                <Link 
                  href="/" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
                >
                  <span>🏪</span>
                  Back to Marketplace
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Quick Access</h3>
                  <p className="text-blue-700">Access all IOMS modules from the sidebar</p>
                </div>
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Marketplace</h3>
                  <p className="text-green-700">Discover new apps and features</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">Support</h3>
                  <p className="text-purple-700">Get help and documentation</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link 
                href="/order-entry" 
                className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                <div className="text-2xl mb-2">🛒</div>
                <div className="font-semibold">Start POS</div>
              </Link>
              <Link 
                href="/inventory" 
                className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                <div className="text-2xl mb-2">📦</div>
                <div className="font-semibold">Inventory</div>
              </Link>
              <Link 
                href="/menu-upload" 
                className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors text-center"
              >
                <div className="text-2xl mb-2">📋</div>
                <div className="font-semibold">Menu Upload</div>
              </Link>
              <Link 
                href="/" 
                className="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 transition-colors text-center"
              >
                <div className="text-2xl mb-2">🏪</div>
                <div className="font-semibold">Marketplace</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 