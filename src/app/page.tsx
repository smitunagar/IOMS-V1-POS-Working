"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { APP_REGISTRY, AppMetadata } from '@/lib/appRegistry';
import { Search, Filter, Star, Users, ShoppingCart, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPricing, setSelectedPricing] = useState<string>('all');
  const { currentUser } = useAuth();

  const categories = ['all', 'business', 'productivity', 'analytics', 'communication', 'finance'];
  const pricingOptions = ['all', 'free', 'freemium', 'paid', 'enterprise'];

  const filteredApps = useMemo(() => {
    return APP_REGISTRY.filter(app => {
      const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.features.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
      const matchesPricing = selectedPricing === 'all' || app.pricing === selectedPricing;
      
      return matchesSearch && matchesCategory && matchesPricing;
    });
  }, [searchTerm, selectedCategory, selectedPricing]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'active': { color: 'text-green-600', bg: 'bg-green-100', text: 'Active' },
      'beta': { color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Beta' },
      'coming-soon': { color: 'text-blue-600', bg: 'bg-blue-100', text: 'Coming Soon' },
      'deprecated': { color: 'text-red-600', bg: 'bg-red-100', text: 'Deprecated' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getPricingBadge = (pricing: string) => {
    const pricingConfig = {
      'free': { color: 'text-green-600', bg: 'bg-green-100', text: 'Free' },
      'freemium': { color: 'text-blue-600', bg: 'bg-blue-100', text: 'Freemium' },
      'paid': { color: 'text-purple-600', bg: 'bg-purple-100', text: 'Paid' },
      'enterprise': { color: 'text-orange-600', bg: 'bg-orange-100', text: 'Enterprise' }
    };
    
    const config = pricingConfig[pricing as keyof typeof pricingConfig];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🛒</span>
                </div>
                <span className="text-xl font-bold text-gray-900">IOMS Marketplace</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome back!</span>
              {currentUser && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                  <span className="text-sm font-medium">{currentUser.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
        {/* Hero Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">🛒</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Business Apps Marketplace</h1>
              <p className="text-gray-600">Discover and integrate powerful business applications</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">2,847</div>
            <div className="text-sm text-gray-600">Active Users</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-center mb-2">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">15,392</div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">98.5%</div>
            <div className="text-sm text-gray-600">Uptime</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-center mb-2">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">4.9</div>
            <div className="text-sm text-gray-600">Avg Rating</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search apps by name, description, or features..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Pricing Filter */}
            <div>
              <select
                value={selectedPricing}
                onChange={(e) => setSelectedPricing(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {pricingOptions.map(pricing => (
                  <option key={pricing} value={pricing}>
                    {pricing.charAt(0).toUpperCase() + pricing.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map((app: AppMetadata) => (
            <div key={app.id} className="bg-white rounded-xl shadow-sm border p-6 transition-all duration-300 hover:shadow-lg hover:scale-105">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{app.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{app.name}</h3>
                    <p className="text-sm text-gray-600">{app.category}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {getStatusBadge(app.status)}
                  {getPricingBadge(app.pricing)}
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{app.description}</p>
              
              <div className="space-y-2 mb-4">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Key Features</h4>
                <div className="flex flex-wrap gap-1">
                  {app.features.slice(0, 3).map((feature: string, index: number) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                      {feature}
                    </span>
                  ))}
                  {app.features.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                      +{app.features.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium text-gray-700">v{app.version}</span>
                  <span className="text-sm text-gray-500">by {app.author}</span>
                </div>
                {app.route ? (
                  <Link
                    href={app.route}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                  >
                    View App
                  </Link>
                ) : (
                  <button
                    disabled
                    className="bg-gray-300 text-gray-500 px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredApps.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No apps found</div>
            <div className="text-gray-600">Try adjusting your search or filters</div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}