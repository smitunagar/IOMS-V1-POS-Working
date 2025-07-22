'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  User, 
  Phone, 
  MapPin,
  Search,
  Filter,
  Receipt
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  price: string;
  category: string;
  image?: string;
  aiHint?: string;
  ingredients?: string[];
}

interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

interface CustomerInfo {
  name: string;
  phone: string;
  tableNumber: string;
  email?: string;
}

export default function OrderEntryPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    tableNumber: '',
    email: ''
  });
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  // Add order type state
  const [orderType, setOrderType] = useState<'dine-in' | 'take-away' | 'home-delivery'>('dine-in');
  const [driver, setDriver] = useState('');
  const drivers = ['John Doe', 'Jane Smith', 'Alex Rider', 'Priya Patel']; // Example drivers
  const [availableTables, setAvailableTables] = useState<any[]>([]); // Changed to any[] to store all tables

  // Load menu data on component mount
  useEffect(() => {
    loadMenuData();
  }, []);

  // Filter items when search term or category changes
  useEffect(() => {
    let filtered = menuItems;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredItems(filtered);
  }, [menuItems, selectedCategory, searchTerm]);

  // Fetch all tables on mount
  useEffect(() => {
    async function fetchTables() {
      try {
        const res = await fetch('/api/tables');
        const data = await res.json();
        setAvailableTables(data.tables); // Now stores all tables, not just available ones
      } catch (error) {
        setAvailableTables([]);
      }
    }
    fetchTables();
  }, []);

  const loadMenuData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/menuCsv');
      const data = await response.json();
      
      if (data.menu && Array.isArray(data.menu)) {
        setMenuItems(data.menu);
        const uniqueCategories = [...new Set(data.menu.map((item: MenuItem) => item.category))] as string[];
        setCategories(uniqueCategories);
      } else {
        setMenuItems([]);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading menu data:', error);
      setMenuItems([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const addToOrder = (menuItem: MenuItem) => {
    setOrderItems(prev => {
      const existingItem = prev.find(item => item.menuItem.id === menuItem.id);
      
      if (existingItem) {
        return prev.map(item => 
          item.menuItem.id === menuItem.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { menuItem, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromOrder(itemId);
      return;
    }
    
    setOrderItems(prev => 
      prev.map(item => 
        item.menuItem.id === itemId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromOrder = (itemId: string) => {
    setOrderItems(prev => prev.filter(item => item.menuItem.id !== itemId));
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      const price = parseFloat(item.menuItem.price.replace(/[^\d.,]/g, '').replace(',', '.'));
      return total + (price * item.quantity);
    }, 0);
  };

  const handlePlaceOrder = async () => {
    if (orderItems.length === 0) {
      alert('Please add items to your order');
      return;
    }
    if (orderType === 'dine-in') {
      if (!customerInfo.tableNumber) {
        alert('Please enter table number');
        return;
      }
      // Mark table as occupied
      await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'occupy', tableId: customerInfo.tableNumber })
      });
    } else if (orderType === 'take-away') {
      if (!customerInfo.name || !customerInfo.phone) {
        alert('Please enter customer name and phone');
        return;
      }
    } else if (orderType === 'home-delivery') {
      if (!customerInfo.name || !customerInfo.phone || !customerInfo.email || !driver) {
        alert('Please enter all delivery details and assign a driver');
        return;
      }
    }
    const orderData = {
      id: `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderType,
      driver: orderType === 'home-delivery' ? driver : undefined,
      customerInfo,
      items: orderItems.map(item => ({
        name: item.menuItem.name,
        quantity: item.quantity,
        unitPrice: parseFloat(item.menuItem.price.replace(/[^\d.,]/g, '').replace(',', '.')),
        notes: item.notes
      })),
      totalAmount: calculateTotal(),
      createdAt: new Date().toISOString(),
      status: 'Pending'
    };
    try {
      // Add order to active orders
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      alert('Order placed successfully!');
      setOrderItems([]);
      setCustomerInfo({ name: '', phone: '', tableNumber: '', email: '' });
      setDriver('');
      setOrderType('dine-in');
      // Refresh available tables
      const res = await fetch('/api/tables');
      const data = await res.json();
      setAvailableTables(data.tables.filter((t: any) => t.status === 'Available').map((t: any) => t.id));
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order. Please try again.');
    }
  };

  const formatPrice = (price: string) => {
    return price.replace(/[^\d.,]/g, '').replace(',', '.');
  };

  if (loading) {
    return (
      <AppLayout pageTitle="Order Entry">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading menu...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Order Entry">
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Menu Items
                </CardTitle>
                <CardDescription>
                  Select items to add to your order
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
                <div className="mb-6 space-y-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search menu items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Category Filter */}
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={selectedCategory === 'all' ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => setSelectedCategory('all')}
                    >
                      All Categories
                    </Badge>
                    {categories.map(category => (
                      <Badge
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Menu Items Grid */}
                {filteredItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {menuItems.length === 0 
                        ? 'No menu items available. Please upload a menu first.'
                        : 'No items match your search criteria.'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredItems.map((item) => (
                      <Card key={item.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm">{item.name}</h3>
                              <p className="text-xs text-muted-foreground">{item.category}</p>
                            </div>
                            <Badge variant="outline" className="ml-2">
                              €{formatPrice(item.price)}
                            </Badge>
                          </div>
                          {item.ingredients && item.ingredients.length > 0 && (
                            <p className="text-xs text-muted-foreground mb-3">
                              {item.ingredients.slice(0, 3).join(', ')}
                              {item.ingredients.length > 3 && '...'}
                            </p>
                          )}
                          <Button
                            size="sm"
                            onClick={() => addToOrder(item)}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add to Order
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Section */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Current Order
                </CardTitle>
                <CardDescription>
                  {orderItems.length} item{orderItems.length !== 1 ? 's' : ''} in order
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Type */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Order Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input type="radio" name="orderType" value="dine-in" checked={orderType === 'dine-in'} onChange={() => setOrderType('dine-in')} />
                        Dine In
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" name="orderType" value="take-away" checked={orderType === 'take-away'} onChange={() => setOrderType('take-away')} />
                        Take Away
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" name="orderType" value="home-delivery" checked={orderType === 'home-delivery'} onChange={() => setOrderType('home-delivery')} />
                        Home Delivery
                      </label>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Information */}
                {(orderType === 'take-away' || orderType === 'home-delivery') && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <Label htmlFor="customerName">Customer Name *</Label>
                        <Input
                          id="customerName"
                          value={customerInfo.name}
                          onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                          required={true}
                        />
                      </div>
                      <div className="mb-4">
                        <Label htmlFor="customerPhone">Phone Number *</Label>
                        <Input
                          id="customerPhone"
                          value={customerInfo.phone}
                          onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                          required={true}
                        />
                      </div>
                      {orderType === 'home-delivery' && (
                        <>
                          <div className="mb-4">
                            <Label htmlFor="customerAddress">Address *</Label>
                            <Input
                              id="customerAddress"
                              value={customerInfo.email || ''}
                              onChange={e => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                              required={true}
                            />
                          </div>
                          <div className="mb-4">
                            <Label htmlFor="driver">Assign Driver *</Label>
                            <select id="driver" className="w-full border rounded px-2 py-2" value={driver} onChange={e => setDriver(e.target.value)} required>
                              <option value="">Select driver</option>
                              {drivers.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Table selection for Dine In */}
                {orderType === 'dine-in' && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Table Selection</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <Label htmlFor="tableNumber">Table Number *</Label>
                        <select
                          id="tableNumber"
                          className="w-full border rounded px-2 py-2"
                          value={customerInfo.tableNumber}
                          onChange={e => setCustomerInfo({ ...customerInfo, tableNumber: e.target.value })}
                          required
                        >
                          <option value="">Select table</option>
                          {availableTables.map((table: any) => (
                            <option key={table.id} value={table.id}>
                              Table {table.number} ({table.status.charAt(0).toUpperCase() + table.status.slice(1)})
                            </option>
                          ))}
                        </select>
                        {availableTables.length === 0 && (
                          <p className="text-sm text-red-500 mt-1">No tables found</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Separator />

                {/* Order Items */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Order Items</h4>
                  {orderItems.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No items in order</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {orderItems.map((item) => (
                        <div key={item.menuItem.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.menuItem.name}</p>
                            <p className="text-xs text-muted-foreground">
                              €{formatPrice(item.menuItem.price)} × {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFromOrder(item.menuItem.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Order Total */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-lg">€{calculateTotal().toFixed(2)}</span>
                  </div>
                  
                  <Button 
                    onClick={handlePlaceOrder}
                    disabled={orderItems.length === 0}
                    className="w-full"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Place Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 