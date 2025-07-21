'use client';

import { useState } from 'react';
import { ArrowLeft, CreditCard, ShoppingCart, Plus, Minus, X, DollarSign, Receipt } from 'lucide-react';
import Link from 'next/link';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface CartItem {
  item: MenuItem;
  quantity: number;
}

export default function POSTerminal() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isProcessing, setIsProcessing] = useState(false);

  // Sample menu data - in real app this would come from the uploaded menu
  const menuItems: MenuItem[] = [
    { id: '1', name: 'Chicken Curry', price: 10.00, category: 'Main Courses' },
    { id: '2', name: 'Fish Curry', price: 10.50, category: 'Main Courses' },
    { id: '3', name: 'Lamb Korma', price: 11.00, category: 'Main Courses' },
    { id: '4', name: 'Vegetable Curry', price: 9.00, category: 'Main Courses' },
    { id: '5', name: 'Coca Cola', price: 2.50, category: 'Beverages' },
    { id: '6', name: 'Water', price: 1.50, category: 'Beverages' },
    { id: '7', name: 'Coffee', price: 3.00, category: 'Beverages' },
    { id: '8', name: 'Rice', price: 3.50, category: 'Sides' },
    { id: '9', name: 'Naan Bread', price: 2.00, category: 'Sides' },
  ];

  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))];

  const filteredItems = activeCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  const addToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.item.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.item.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { item, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(cartItem => cartItem.item.id !== itemId));
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(cartItem =>
        cartItem.item.id === itemId
          ? { ...cartItem, quantity: newQuantity }
          : cartItem
      )
    );
  };

  const getTotal = () => {
    return cart.reduce((total, cartItem) => total + (cartItem.item.price * cartItem.quantity), 0);
  };

  const processTransaction = async () => {
    if (cart.length === 0) return;
    
    setIsProcessing(true);
    
    // Simulate transaction processing
    setTimeout(() => {
      alert(`Transaction completed! Total: €${getTotal().toFixed(2)}`);
      setCart([]);
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/ioms-dashboard" 
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </Link>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">POS Terminal</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Ready for transactions</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Menu Items</h2>
              
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      activeCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Menu Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                    onClick={() => addToCart(item)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <span className="text-sm font-medium text-blue-600">€{item.price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{item.category}</span>
                      <button className="p-1 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Current Order</h2>
                <ShoppingCart className="w-5 h-5 text-gray-400" />
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No items in cart</p>
                  <p className="text-sm text-gray-400">Click on menu items to add them</p>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                    {cart.map(cartItem => (
                      <div key={cartItem.item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{cartItem.item.name}</h4>
                          <p className="text-sm text-gray-600">€{cartItem.item.price.toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity - 1)}
                            className="p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-medium">{cartItem.quantity}</span>
                          <button
                            onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity + 1)}
                            className="p-1 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeFromCart(cartItem.item.id)}
                            className="p-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <div className="flex items-center justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span className="text-blue-600">€{getTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={processTransaction}
                      disabled={isProcessing || cart.length === 0}
                      className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          <span>Process Payment</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setCart([])}
                      disabled={cart.length === 0}
                      className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Clear Cart
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 