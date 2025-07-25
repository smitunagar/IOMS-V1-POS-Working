'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PlusCircle, 
  Edit2, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Star,
  Package,
  TrendingUp,
  Users,
  Search,
  Filter,
  Download,
  Upload
} from 'lucide-react';

interface VendorContact {
  name: string;
  email: string;
  phone: string;
  position: string;
}

interface VendorPerformance {
  reliability: number;
  qualityScore: number;
  deliveryTime: number;
  priceCompetitiveness: number;
  responseTime: number;
}

interface Vendor {
  id: string;
  name: string;
  category: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
    website?: string;
  };
  contacts: VendorContact[];
  products: string[];
  performance: VendorPerformance;
  status: 'active' | 'inactive' | 'pending';
  createdDate: string;
  lastOrderDate?: string;
  totalOrders: number;
  averageOrderValue: number;
  paymentTerms: string;
  deliveryRadius: string;
  minimumOrder: number;
  notes: string;
}

export default function VendorManagement() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [activeTab, setActiveTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isAddingVendor, setIsAddingVendor] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [newVendor, setNewVendor] = useState<Partial<Vendor>>({
    name: '',
    category: '',
    contactInfo: {
      email: '',
      phone: '',
      address: '',
      website: ''
    },
    contacts: [{
      name: '',
      email: '',
      phone: '',
      position: ''
    }],
    products: [],
    status: 'active',
    paymentTerms: 'Net 30',
    deliveryRadius: '50km',
    minimumOrder: 0,
    notes: ''
  });

  // Sample vendor data
  useEffect(() => {
    const sampleVendors: Vendor[] = [
      {
        id: 'v1',
        name: 'Fresh Valley Farms',
        category: 'Fresh Produce',
        contactInfo: {
          email: 'orders@freshvalley.de',
          phone: '+49-711-123456',
          address: 'Farm Road 15, Stuttgart, Germany',
          website: 'www.freshvalley.de'
        },
        contacts: [
          {
            name: 'Maria Schmidt',
            email: 'maria@freshvalley.de',
            phone: '+49-711-123456',
            position: 'Sales Manager'
          }
        ],
        products: ['Fresh Chicken', 'Vegetables', 'Organic Produce'],
        performance: {
          reliability: 95,
          qualityScore: 92,
          deliveryTime: 88,
          priceCompetitiveness: 85,
          responseTime: 90
        },
        status: 'active',
        createdDate: '2024-01-15',
        lastOrderDate: '2025-07-20',
        totalOrders: 156,
        averageOrderValue: 425.50,
        paymentTerms: 'Net 30',
        deliveryRadius: '100km',
        minimumOrder: 200,
        notes: 'Excellent quality fresh produce. Reliable delivery.'
      },
      {
        id: 'v2',
        name: 'Hechingen Local Market',
        category: 'Local Suppliers',
        contactInfo: {
          email: 'info@hechingen-market.de',
          phone: '+49-7471-987654',
          address: 'Market Square 1, Hechingen, Germany'
        },
        contacts: [
          {
            name: 'Klaus Weber',
            email: 'klaus@hechingen-market.de',
            phone: '+49-7471-987654',
            position: 'Owner'
          }
        ],
        products: ['Local Vegetables', 'Dairy Products', 'Bakery Items'],
        performance: {
          reliability: 88,
          qualityScore: 90,
          deliveryTime: 95,
          priceCompetitiveness: 92,
          responseTime: 85
        },
        status: 'active',
        createdDate: '2024-02-10',
        lastOrderDate: '2025-07-22',
        totalOrders: 89,
        averageOrderValue: 245.75,
        paymentTerms: 'Net 15',
        deliveryRadius: '25km',
        minimumOrder: 100,
        notes: 'Local supplier with competitive prices. Quick delivery.'
      },
      {
        id: 'v3',
        name: 'Bavaria Premium Foods',
        category: 'Premium Ingredients',
        contactInfo: {
          email: 'sales@bavaria-premium.de',
          phone: '+49-89-456789',
          address: 'Premium Street 25, Munich, Germany',
          website: 'www.bavaria-premium.de'
        },
        contacts: [
          {
            name: 'Anna Mueller',
            email: 'anna@bavaria-premium.de',
            phone: '+49-89-456789',
            position: 'Account Manager'
          }
        ],
        products: ['Premium Oils', 'Specialty Ingredients', 'Gourmet Items'],
        performance: {
          reliability: 98,
          qualityScore: 96,
          deliveryTime: 85,
          priceCompetitiveness: 78,
          responseTime: 92
        },
        status: 'active',
        createdDate: '2024-03-05',
        lastOrderDate: '2025-07-18',
        totalOrders: 67,
        averageOrderValue: 685.25,
        paymentTerms: 'Net 45',
        deliveryRadius: '200km',
        minimumOrder: 500,
        notes: 'Premium quality products. Higher pricing but excellent quality.'
      },
      {
        id: 'v4',
        name: 'Global Spice Trading',
        category: 'Spices & Seasonings',
        contactInfo: {
          email: 'orders@globalspice.de',
          phone: '+49-69-345678',
          address: 'Trade Center 50, Frankfurt, Germany',
          website: 'www.globalspice.de'
        },
        contacts: [
          {
            name: 'Raj Patel',
            email: 'raj@globalspice.de',
            phone: '+49-69-345678',
            position: 'Sales Director'
          }
        ],
        products: ['Spices', 'Herbs', 'Specialty Seasonings'],
        performance: {
          reliability: 90,
          qualityScore: 94,
          deliveryTime: 82,
          priceCompetitiveness: 88,
          responseTime: 87
        },
        status: 'active',
        createdDate: '2024-04-20',
        lastOrderDate: '2025-07-15',
        totalOrders: 34,
        averageOrderValue: 325.00,
        paymentTerms: 'Net 30',
        deliveryRadius: '150km',
        minimumOrder: 250,
        notes: 'Authentic spices from around the world. Good variety.'
      }
    ];
    setVendors(sampleVendors);
  }, []);

  const categories = ['Fresh Produce', 'Local Suppliers', 'Premium Ingredients', 'Spices & Seasonings', 'Dairy Products', 'Meat & Poultry', 'Beverages'];

  const handleAddVendor = () => {
    if (!newVendor.name || !newVendor.category) {
      alert('Please fill in required fields (Name and Category)');
      return;
    }

    const vendor: Vendor = {
      id: `v${Date.now()}`,
      name: newVendor.name!,
      category: newVendor.category!,
      contactInfo: newVendor.contactInfo!,
      contacts: newVendor.contacts || [],
      products: newVendor.products || [],
      performance: {
        reliability: 0,
        qualityScore: 0,
        deliveryTime: 0,
        priceCompetitiveness: 0,
        responseTime: 0
      },
      status: newVendor.status as 'active' | 'inactive' | 'pending',
      createdDate: new Date().toISOString().split('T')[0],
      totalOrders: 0,
      averageOrderValue: 0,
      paymentTerms: newVendor.paymentTerms || 'Net 30',
      deliveryRadius: newVendor.deliveryRadius || '50km',
      minimumOrder: newVendor.minimumOrder || 0,
      notes: newVendor.notes || ''
    };

    setVendors(prev => [...prev, vendor]);
    setIsAddingVendor(false);
    setNewVendor({
      name: '',
      category: '',
      contactInfo: {
        email: '',
        phone: '',
        address: '',
        website: ''
      },
      contacts: [{
        name: '',
        email: '',
        phone: '',
        position: ''
      }],
      products: [],
      status: 'active',
      paymentTerms: 'Net 30',
      deliveryRadius: '50km',
      minimumOrder: 0,
      notes: ''
    });
    setActiveTab('list');
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setNewVendor(vendor);
    setActiveTab('add');
  };

  const handleUpdateVendor = () => {
    if (!editingVendor) return;

    setVendors(prev => prev.map(v => 
      v.id === editingVendor.id ? { ...editingVendor, ...newVendor } : v
    ));
    setEditingVendor(null);
    setNewVendor({
      name: '',
      category: '',
      contactInfo: {
        email: '',
        phone: '',
        address: '',
        website: ''
      },
      contacts: [{
        name: '',
        email: '',
        phone: '',
        position: ''
      }],
      products: [],
      status: 'active',
      paymentTerms: 'Net 30',
      deliveryRadius: '50km',
      minimumOrder: 0,
      notes: ''
    });
    setActiveTab('list');
  };

  const handleDeleteVendor = (vendorId: string) => {
    if (confirm('Are you sure you want to delete this vendor?')) {
      setVendors(prev => prev.filter(v => v.id !== vendorId));
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.products.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || vendor.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const addProductToVendor = (product: string) => {
    if (product && !newVendor.products?.includes(product)) {
      setNewVendor(prev => ({
        ...prev,
        products: [...(prev.products || []), product]
      }));
    }
  };

  const removeProductFromVendor = (productIndex: number) => {
    setNewVendor(prev => ({
      ...prev,
      products: prev.products?.filter((_, index) => index !== productIndex) || []
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-600 mt-1">Manage your suppliers and vendor relationships</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Vendor List
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            {editingVendor ? 'Edit Vendor' : 'Add Vendor'}
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4 items-center bg-white p-4 rounded-lg border">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search vendors, categories, or products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border rounded-md px-3 py-2"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Vendor Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map(vendor => (
              <Card key={vendor.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{vendor.name}</CardTitle>
                      <p className="text-sm text-gray-600">{vendor.category}</p>
                    </div>
                    <Badge className={getStatusBadge(vendor.status)}>
                      {vendor.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="truncate">{vendor.contactInfo.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{vendor.contactInfo.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="truncate">{vendor.contactInfo.address}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Products:</p>
                    <div className="flex flex-wrap gap-1">
                      {vendor.products.slice(0, 3).map(product => (
                        <Badge key={product} variant="secondary" className="text-xs">
                          {product}
                        </Badge>
                      ))}
                      {vendor.products.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{vendor.products.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Total Orders</p>
                      <p className="text-gray-600">{vendor.totalOrders}</p>
                    </div>
                    <div>
                      <p className="font-medium">Avg Order</p>
                      <p className="text-gray-600">€{vendor.averageOrderValue.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">
                        {((vendor.performance.reliability + vendor.performance.qualityScore + vendor.performance.deliveryTime + vendor.performance.priceCompetitiveness + vendor.performance.responseTime) / 5).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditVendor(vendor)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteVendor(vendor.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredVendors.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterCategory !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Get started by adding your first vendor.'}
              </p>
              <Button onClick={() => setActiveTab('add')} className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Add Vendor
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="add" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Vendor Name *</Label>
                    <Input
                      id="name"
                      value={newVendor.name || ''}
                      onChange={(e) => setNewVendor(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter vendor name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <select
                      id="category"
                      value={newVendor.category || ''}
                      onChange={(e) => setNewVendor(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2"
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newVendor.contactInfo?.email || ''}
                      onChange={(e) => setNewVendor(prev => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo!, email: e.target.value }
                      }))}
                      placeholder="vendor@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newVendor.contactInfo?.phone || ''}
                      onChange={(e) => setNewVendor(prev => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo!, phone: e.target.value }
                      }))}
                      placeholder="+49-xxx-xxxxxx"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={newVendor.contactInfo?.address || ''}
                    onChange={(e) => setNewVendor(prev => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo!, address: e.target.value }
                    }))}
                    placeholder="Enter full address"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website (Optional)</Label>
                  <Input
                    id="website"
                    value={newVendor.contactInfo?.website || ''}
                    onChange={(e) => setNewVendor(prev => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo!, website: e.target.value }
                    }))}
                    placeholder="www.vendor.com"
                  />
                </div>
              </div>

              {/* Business Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Business Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <select
                      id="paymentTerms"
                      value={newVendor.paymentTerms || 'Net 30'}
                      onChange={(e) => setNewVendor(prev => ({ ...prev, paymentTerms: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2"
                    >
                      <option value="Net 15">Net 15</option>
                      <option value="Net 30">Net 30</option>
                      <option value="Net 45">Net 45</option>
                      <option value="Net 60">Net 60</option>
                      <option value="COD">Cash on Delivery</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="deliveryRadius">Delivery Radius</Label>
                    <Input
                      id="deliveryRadius"
                      value={newVendor.deliveryRadius || ''}
                      onChange={(e) => setNewVendor(prev => ({ ...prev, deliveryRadius: e.target.value }))}
                      placeholder="50km"
                    />
                  </div>
                  <div>
                    <Label htmlFor="minimumOrder">Minimum Order (€)</Label>
                    <Input
                      id="minimumOrder"
                      type="number"
                      value={newVendor.minimumOrder || 0}
                      onChange={(e) => setNewVendor(prev => ({ ...prev, minimumOrder: Number(e.target.value) }))}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Products */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Products/Services</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add product/service"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addProductToVendor((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={(e) => {
                      const input = (e.target as HTMLElement).parentElement?.querySelector('input');
                      if (input) {
                        addProductToVendor(input.value);
                        input.value = '';
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newVendor.products?.map((product, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {product}
                      <button
                        onClick={() => removeProductFromVendor(index)}
                        className="ml-1 text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newVendor.notes || ''}
                  onChange={(e) => setNewVendor(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this vendor..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={editingVendor ? handleUpdateVendor : handleAddVendor}
                  className="flex items-center gap-2"
                >
                  {editingVendor ? 'Update Vendor' : 'Add Vendor'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveTab('list');
                    setEditingVendor(null);
                    setNewVendor({
                      name: '',
                      category: '',
                      contactInfo: {
                        email: '',
                        phone: '',
                        address: '',
                        website: ''
                      },
                      contacts: [{
                        name: '',
                        email: '',
                        phone: '',
                        position: ''
                      }],
                      products: [],
                      status: 'active',
                      paymentTerms: 'Net 30',
                      deliveryRadius: '50km',
                      minimumOrder: 0,
                      notes: ''
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {vendors.map(vendor => (
              <Card key={vendor.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {vendor.name}
                    <Badge className={getStatusBadge(vendor.status)}>
                      {vendor.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Reliability</span>
                      <span className={`font-medium ${getPerformanceColor(vendor.performance.reliability)}`}>
                        {vendor.performance.reliability}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Quality Score</span>
                      <span className={`font-medium ${getPerformanceColor(vendor.performance.qualityScore)}`}>
                        {vendor.performance.qualityScore}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Delivery Time</span>
                      <span className={`font-medium ${getPerformanceColor(vendor.performance.deliveryTime)}`}>
                        {vendor.performance.deliveryTime}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Price Competitiveness</span>
                      <span className={`font-medium ${getPerformanceColor(vendor.performance.priceCompetitiveness)}`}>
                        {vendor.performance.priceCompetitiveness}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Response Time</span>
                      <span className={`font-medium ${getPerformanceColor(vendor.performance.responseTime)}`}>
                        {vendor.performance.responseTime}%
                      </span>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Total Orders</p>
                        <p className="text-gray-600">{vendor.totalOrders}</p>
                      </div>
                      <div>
                        <p className="font-medium">Last Order</p>
                        <p className="text-gray-600">{vendor.lastOrderDate || 'Never'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Vendors</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600">{vendors.length}</p>
                <p className="text-sm text-gray-600 mt-1">Active suppliers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  {new Set(vendors.map(v => v.category)).size}
                </p>
                <p className="text-sm text-gray-600 mt-1">Product categories</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Avg Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-600">
                  {vendors.length > 0 ? 
                    (vendors.reduce((acc, v) => 
                      acc + (v.performance.reliability + v.performance.qualityScore + v.performance.deliveryTime + v.performance.priceCompetitiveness + v.performance.responseTime) / 5, 0
                    ) / vendors.length).toFixed(1) : 0}%
                </p>
                <p className="text-sm text-gray-600 mt-1">Overall rating</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Vendor Distribution by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.map(category => {
                  const count = vendors.filter(v => v.category === category).length;
                  const percentage = vendors.length > 0 ? (count / vendors.length) * 100 : 0;
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
