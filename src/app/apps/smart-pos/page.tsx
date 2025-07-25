'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function SmartPOSApp() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading the Smart POS app
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">🛒</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Smart POS</h2>
          <p className="text-gray-600">Preparing your point of sale system...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Marketplace</span>
              </Link>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🛒</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Smart POS</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Powered by IOMS</span>
              <a
                href="/apps/ioms"
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <span className="text-sm">Open Full App</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* App Overview */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-start space-x-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-3xl">
                🛒
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart POS</h1>
                <p className="text-lg text-gray-600 mb-4">
                  Advanced Point of Sale system with AI-powered inventory management, 
                  real-time analytics, and seamless payment processing.
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>⭐ 4.8 Rating</span>
                  <span>📥 15,420 Downloads</span>
                  <span>🔄 Version 2.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Inventory Management</h3>
              <p className="text-gray-600">
                Intelligent stock tracking with predictive analytics and automated reordering.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Analytics</h3>
              <p className="text-gray-600">
                Live dashboards and reports to track sales, inventory, and business performance.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💳</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Processing</h3>
              <p className="text-gray-600">
                Secure payment handling with support for multiple payment methods.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Barcode Scanning</h3>
              <p className="text-gray-600">
                Fast product lookup and inventory management with barcode technology.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/ioms-dashboard"
                className="flex items-center justify-center p-6 bg-blue-50 rounded-lg border-2 border-blue-200 hover:border-blue-300 transition-colors group"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Dashboard</h3>
                  <p className="text-sm text-gray-600">View analytics & reports</p>
                </div>
              </a>

              <a
                href="/inventory"
                className="flex items-center justify-center p-6 bg-green-50 rounded-lg border-2 border-green-200 hover:border-green-300 transition-colors group"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition-colors">
                    <span className="text-2xl">📦</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Inventory</h3>
                  <p className="text-sm text-gray-600">Manage stock & products</p>
                </div>
              </a>

              <a
                href="/payment"
                className="flex items-center justify-center p-6 bg-purple-50 rounded-lg border-2 border-purple-200 hover:border-purple-300 transition-colors group"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
                    <span className="text-2xl">💳</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">POS Terminal</h3>
                  <p className="text-sm text-gray-600">Process transactions</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 