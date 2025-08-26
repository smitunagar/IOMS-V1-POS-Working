'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, CreditCard, Package, BarChart3, Users, LogIn, UserPlus, Eye, EyeOff, Home, ShoppingCart, Upload, Settings, Calendar, Plus, X, Edit3, GripVertical } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { 
  getUserQuickActions, 
  saveUserQuickActions, 
  getAvailableActionsForAdding, 
  removeQuickAction, 
  updateQuickActionOrder,
  type QuickAction 
} from '@/lib/quickActionsRegistry'

export default function IOMSApp() {
  const { currentUser, login, signup, isLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    businessName: ''
  })
  const [error, setError] = useState('')
  
  // Quick Actions state
  const [quickActions, setQuickActions] = useState<QuickAction[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [draggedAction, setDraggedAction] = useState<string | null>(null)

  // Simple check: if user is already authenticated, show IOMS dashboard
  useEffect(() => {
    if (currentUser && !isLoading) {
      setActiveTab('dashboard')
    }
  }, [currentUser, isLoading])

  // Load quick actions when dashboard tab is active
  useEffect(() => {
    if (activeTab === 'dashboard') {
      setQuickActions(getUserQuickActions())
    }
  }, [activeTab])

  // Quick Actions functions
  const handleAddQuickAction = (action: QuickAction) => {
    const updatedActions = [...quickActions, { ...action, isEnabled: true }]
    setQuickActions(updatedActions)
    saveUserQuickActions(updatedActions)
    setShowAddModal(false)
  }

  const handleRemoveQuickAction = (actionId: string) => {
    const updatedActions = quickActions.filter(action => action.id !== actionId)
    setQuickActions(updatedActions)
    saveUserQuickActions(updatedActions)
  }

  const handleDragStart = (actionId: string) => {
    setDraggedAction(actionId)
  }

  const handleDragOver = (e: React.DragEvent, actionId: string) => {
    e.preventDefault()
    if (draggedAction && draggedAction !== actionId) {
      const draggedIndex = quickActions.findIndex(action => action.id === draggedAction)
      const targetIndex = quickActions.findIndex(action => action.id === actionId)
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newActions = [...quickActions]
        const [draggedItem] = newActions.splice(draggedIndex, 1)
        newActions.splice(targetIndex, 0, draggedItem)
        
        // Update order numbers
        newActions.forEach((action, index) => {
          action.order = index + 1
        })
        
        setQuickActions(newActions)
        saveUserQuickActions(newActions)
        setDraggedAction(actionId)
      }
    }
  }

  const handleDragEnd = () => {
    setDraggedAction(null)
  }

  // Function to get proper icons for actions
  const getActionIcon = (iconName: string) => {
    const iconMap: { [key: string]: string } = {
      'CreditCard': '💳',
      'Upload': '📤',
      'BarChart3': '📊',
      'MapPin': '📍',
      'ChefHat': '👨‍🍳',
      'Package': '📦',
      'Users': '👥',
      'FileText': '📄',
      'Settings': '⚙️',
      'Scan': '📱',
      'Home': '🏠',
      'ShoppingCart': '🛒',
      'Calendar': '📅',
      'Table': '🪑',
      'UtensilsCrossed': '🍴',
      'History': '⏰',
      'Barcode': '📊',
      'MessageSquareQuote': '💬',
      'User': '👤',
      'Leaf': '🍃'
    }
    return iconMap[iconName] || '🔧'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    
    try {
      if (isLogin) {
        // Handle login
        const success = await login(formData.email, formData.password)
        if (success) {
          setActiveTab('dashboard')
        } else {
          setError('Invalid email or password')
        }
      } else {
        // Handle signup
        const success = await signup(formData.email, formData.password, formData.businessName)
        if (success) {
          setError('Account created successfully! Please login.')
          setIsLogin(true)
          setFormData({ email: '', password: '', name: '', businessName: '' })
        } else {
          setError('Email already exists or signup failed')
        }
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // If not authenticated, show login/signup
  if (!currentUser || isLoading) {
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
                    <span className="text-white font-bold text-sm">🏢</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">IOMS</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Integrated Operations Management System</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            {/* Table Management Link */}
            <div className="mb-6">
              <Link href="/table-management" className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors">
                Go to Table Management
              </Link>
            </div>
            
            {/* Auth Card */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">🏢</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to IOMS</h1>
                <p className="text-gray-600">Access your business operations</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Auth Tabs */}
              <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                    isLogin 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span className="font-medium">Login</span>
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                    !isLogin 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="font-medium">Sign Up</span>
                </button>
              </div>

              {/* Auth Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Name
                      </label>
                      <input
                        type="text"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your business name"
                        required
                      />
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-md hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      <span>{isLogin ? 'Login' : 'Sign Up'}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick Demo Access */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Try Demo (No Login Required)
                </button>
              </div>
            </div>

            {/* Features Preview */}
            <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What you'll get access to:</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-700">POS Terminal</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-700">Menu Upload</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-700">Analytics</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-yellow-600" />
                  </div>
                  <span className="text-sm text-gray-700">Orders</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If authenticated, show IOMS dashboard with tabs
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
                  <span className="text-white font-bold text-sm">🏢</span>
                </div>
                <span className="text-xl font-bold text-gray-900">IOMS Dashboard</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome, {currentUser.email}</span>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Full Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Home className="w-4 h-4 inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'menu'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Menu Upload
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ShoppingCart className="w-4 h-4 inline mr-2" />
              Orders
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'inventory'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('inventory-import')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'inventory-import'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Inventory Import
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
              <div className="flex space-x-2">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 text-white px-2 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Customize</span>
                  </button>
                )}
                {isEditing && (
                  <>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Action</span>
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-600 text-white px-2 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
                    >
                      Done
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {quickActions.map((action) => (
                <div
                  key={action.id}
                  draggable={isEditing}
                  onDragStart={() => handleDragStart(action.id)}
                  onDragOver={(e) => handleDragOver(e, action.id)}
                  onDragEnd={handleDragEnd}
                  className={`relative bg-${action.color}-600 text-white p-3 rounded-lg hover:bg-${action.color}-700 transition-colors text-center cursor-pointer ${
                    isEditing ? 'cursor-move' : ''
                  }`}
                >
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveQuickAction(action.id)}
                      className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  
                  {isEditing && (
                    <div className="absolute top-1 right-1 text-white/70">
                      <GripVertical className="w-3 h-3" />
                    </div>
                  )}
                  
                  <Link href={action.href} className="block">
                    <div className="text-xl mb-1">{getActionIcon(action.icon)}</div>
                    <div className="font-semibold text-sm">{action.title}</div>
                    <div className="text-xs opacity-90">{action.description}</div>
                  </Link>
                </div>
              ))}
            </div>
            
            {quickActions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No quick actions configured. Click "Customize" to add some!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu Upload</h2>
            <div className="text-center py-12">
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Your Menu</h3>
              <p className="text-gray-600 mb-6">Upload PDF or CSV files to automatically extract menu items</p>
              <div className="flex justify-center space-x-4">
                <Link 
                  href="/menu-upload"
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Upload Menu
                </Link>
                <button className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200 transition-colors">
                  View Current Menu
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Orders Management</h2>
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Process Orders</h3>
              <p className="text-gray-600 mb-6">Manage orders, process payments, and track order history</p>
              <div className="flex justify-center space-x-4">
                <Link 
                  href="/order-entry"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Start POS
                </Link>
                <Link 
                  href="/order-history"
                  className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200 transition-colors"
                >
                  View Orders
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory Management</h2>
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Manage Inventory</h3>
              <p className="text-gray-600 mb-6">Track stock levels, manage ingredients, and monitor usage</p>
              <div className="flex justify-center space-x-4">
                <Link 
                  href="/inventory"
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  View Inventory
                </Link>
                <Link 
                  href="/inventory-analytics"
                  className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Analytics
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics & Reports</h2>
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Business Insights</h3>
              <p className="text-gray-600 mb-6">View sales reports, inventory analytics, and business performance</p>
              <div className="flex justify-center space-x-4">
                <Link 
                  href="/order-analytics"
                  className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 transition-colors"
                >
                  Order Analytics
                </Link>
                <Link 
                  href="/inventory-analytics"
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Inventory Analytics
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory-import' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory Import</h2>
            <div className="text-center py-12">
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Import Inventory from CSV</h3>
              <p className="text-gray-600 mb-6">Upload a CSV file to update your inventory directly.</p>
              <div className="flex justify-center space-x-4">
                <Link 
                  href="/inventory-import"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Upload CSV
                </Link>
                <Link 
                  href="/inventory"
                  className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200 transition-colors"
                >
                  View Current Inventory
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Add Action Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Quick Action</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {getAvailableActionsForAdding().map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleAddQuickAction(action)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 bg-${action.color}-100 rounded-lg flex items-center justify-center`}>
                      <span className="text-lg">{getActionIcon(action.icon)}</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{action.title}</div>
                      <div className="text-sm text-gray-600">{action.description}</div>
                    </div>
                  </div>
                  <Plus className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </div>
            
            {getAvailableActionsForAdding().length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No more actions available to add.</p>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 