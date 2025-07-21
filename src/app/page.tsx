"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { APP_REGISTRY, AppMetadata } from '@/lib/appRegistry';
import { Search, Filter, Star, Users, ShoppingCart, TrendingUp } from 'lucide-react';

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPricing, setSelectedPricing] = useState<string>('all');

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🛒</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Business Apps Marketplace</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
                Login
              </Link>
              <Link href="/signup" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-md hover:from-blue-700 hover:to-purple-700 transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Transform Your Business with
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Smart Solutions</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover powerful applications designed to streamline your operations, boost productivity, and drive growth for your business.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">2,847</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">15,392</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">+23%</div>
              <div className="text-sm text-gray-600">Revenue Growth</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">4.9/5</div>
              <div className="text-sm text-gray-600">Customer Rating</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
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
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
                
                {/* Pricing Filter */}
                <select
                  value={selectedPricing}
                  onChange={(e) => setSelectedPricing(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {pricingOptions.map(pricing => (
                    <option key={pricing} value={pricing}>
                      {pricing === 'all' ? 'All Pricing' : pricing.charAt(0).toUpperCase() + pricing.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredApps.map((app) => (
            <div key={app.id} className="bg-white rounded-xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">{app.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{app.name}</h3>
                    <p className="text-gray-600">{app.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  {getStatusBadge(app.status)}
                  {getPricingBadge(app.pricing)}
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Key Features:</h4>
                <div className="grid grid-cols-1 gap-2">
                  {app.features.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                  {app.features.length > 4 && (
                    <div className="text-sm text-gray-500 mt-2">
                      +{app.features.length - 4} more features
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-500">
                  v{app.version} • by {app.author}
                </div>
              </div>
              
              <Link
                href={app.route}
                className={`inline-flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors w-full justify-center ${
                  app.status === 'coming-soon' || app.status === 'deprecated'
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                }`}
              >
                <span>
                  {app.status === 'coming-soon' ? 'Coming Soon' : 
                   app.status === 'deprecated' ? 'Deprecated' : 'Launch App'}
                </span>
                {app.status === 'active' || app.status === 'beta' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                ) : null}
              </Link>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredApps.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No apps found</h3>
            <p className="text-gray-600">Try adjusting your search terms or filters</p>
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of businesses already using our smart solutions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Start Free Trial
              </Link>
              <Link
                href="/apps/ioms"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-colors"
              >
                Explore IOMS
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}