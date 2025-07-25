'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  DollarSign,
  Package,
  RefreshCw,
  Bell,
  BarChart3,
  Truck,
  Users,
  Calendar,
  Target,
  Mail,
  CheckCircle,
  XCircle,
  FileText,
  Settings,
  Send,
  Eye,
  ExternalLink,
  PlusCircle,
  Edit2,
  Trash2,
  Phone,
  Star,
  Filter,
  Search,
  Download,
  Upload
} from 'lucide-react';
import { 
  QuotationRequest, 
  QuotationResponse, 
  OwnerApproval, 
  PurchaseOrder,
  TrackingInfo,
  PurchaseOrderItem
} from '@/lib/procurementWorkflowService';

interface Vendor {
  id: string;
  name: string;
  location: string;
  distance: number;
  rating: number;
  deliveryTime: string;
  reliability: number;
  priceIndex: number; // 1.0 = baseline, <1.0 = cheaper, >1.0 = more expensive
  specialties: string[];
  lastOrderDate: string;
  paymentTerms: string;
  minimumOrder: number;
  currency: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  reorderPoint: number;
  maxStock: number;
  unit: string;
  averageUsage: number; // per day
  lastRestocked: string;
  preferredVendor: string;
  unitCost: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface RestockAlert {
  id: string;
  itemId: string;
  itemName: string;
  currentStock: number;
  reorderPoint: number;
  suggestedQuantity: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  estimatedDaysLeft: number;
  recommendedVendor: string;
  cost: number;
  createdAt: string;
}

interface ProcurementForecast {
  itemName: string;
  predictedNeed: number;
  confidence: number;
  timeframe: string;
  seasonalFactor: number;
  trendDirection: 'up' | 'down' | 'stable';
}

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

interface VendorManagementVendor {
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

export default function SupplySync() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [restockAlerts, setRestockAlerts] = useState<RestockAlert[]>([]);
  const [forecasts, setForeasts] = useState<ProcurementForecast[]>([]);
  const [quotationRequests, setQuotationRequests] = useState<QuotationRequest[]>([]);
  const [ownerApprovals, setOwnerApprovals] = useState<OwnerApproval[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [activeTab, setActiveTab] = useState('alerts');
  const [activeComponent, setActiveComponent] = useState<'supply-sync' | 'vendor-management'>('supply-sync');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Vendor Management State
  const [managementVendors, setManagementVendors] = useState<VendorManagementVendor[]>([]);
  const [vendorSearchTerm, setVendorSearchTerm] = useState('');
  const [vendorFilterCategory, setVendorFilterCategory] = useState('all');
  const [isAddingVendor, setIsAddingVendor] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorManagementVendor | null>(null);
  const [newVendor, setNewVendor] = useState<Partial<VendorManagementVendor>>({
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
  
  const [workflowSettings, setWorkflowSettings] = useState({
    baseThresholdDays: 15,
    ownerEmail: 'owner@museum-restaurant-hechingen.com',
    autoApprovalLimit: 200
  });

  useEffect(() => {
    // Initialize demo data
    initializeDemoData();
    // Set up real-time monitoring
    const interval = setInterval(analyzeSupplyChain, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const initializeDemoData = () => {
    const demoVendors: Vendor[] = [
      {
        id: 'v1',
        name: 'Fresh Valley Farms',
        location: 'Stuttgart, Germany',
        distance: 35,
        rating: 4.8,
        deliveryTime: '1-2 days',
        reliability: 95,
        priceIndex: 0.85,
        specialties: ['Vegetables', 'Herbs', 'Dairy'],
        lastOrderDate: '2025-07-20',
        paymentTerms: 'Net 30',
        minimumOrder: 50,
        currency: 'EUR'
      },
      {
        id: 'v2',
        name: 'Hechingen Local Market',
        location: 'Hechingen, Germany',
        distance: 2,
        rating: 4.5,
        deliveryTime: 'Same day',
        reliability: 88,
        priceIndex: 1.15,
        specialties: ['Meat', 'Spices', 'Grains'],
        lastOrderDate: '2025-07-22',
        paymentTerms: 'COD',
        minimumOrder: 25,
        currency: 'EUR'
      },
      {
        id: 'v3',
        name: 'Bavaria Premium Foods',
        location: 'Munich, Germany',
        distance: 85,
        rating: 4.9,
        deliveryTime: '2-3 days',
        reliability: 98,
        priceIndex: 1.25,
        specialties: ['Premium Ingredients', 'Organic', 'Specialty Items'],
        lastOrderDate: '2025-07-18',
        paymentTerms: 'Net 15',
        minimumOrder: 100,
        currency: 'EUR'
      },
      {
        id: 'v4',
        name: 'Global Spice Trading',
        location: 'Frankfurt, Germany',
        distance: 120,
        rating: 4.3,
        deliveryTime: '3-5 days',
        reliability: 85,
        priceIndex: 0.75,
        specialties: ['Spices', 'International Ingredients', 'Bulk Items'],
        lastOrderDate: '2025-07-15',
        paymentTerms: 'Net 45',
        minimumOrder: 200,
        currency: 'EUR'
      }
    ];

    const demoInventory: InventoryItem[] = [
      {
        id: 'i1',
        name: 'Chicken Breast',
        category: 'Meat',
        currentStock: 8,
        reorderPoint: 15,
        maxStock: 50,
        unit: 'kg',
        averageUsage: 12,
        lastRestocked: '2025-07-20',
        preferredVendor: 'v2',
        unitCost: 8.50,
        urgencyLevel: 'critical'
      },
      {
        id: 'i2',
        name: 'Basmati Rice',
        category: 'Grains',
        currentStock: 25,
        reorderPoint: 20,
        maxStock: 100,
        unit: 'kg',
        averageUsage: 8,
        lastRestocked: '2025-07-22',
        preferredVendor: 'v4',
        unitCost: 3.20,
        urgencyLevel: 'medium'
      },
      {
        id: 'i3',
        name: 'Fresh Tomatoes',
        category: 'Vegetables',
        currentStock: 5,
        reorderPoint: 10,
        maxStock: 30,
        unit: 'kg',
        averageUsage: 6,
        lastRestocked: '2025-07-21',
        preferredVendor: 'v1',
        unitCost: 2.80,
        urgencyLevel: 'high'
      },
      {
        id: 'i4',
        name: 'Olive Oil',
        category: 'Oils',
        currentStock: 12,
        reorderPoint: 8,
        maxStock: 24,
        unit: 'L',
        averageUsage: 2,
        lastRestocked: '2025-07-19',
        preferredVendor: 'v3',
        unitCost: 15.00,
        urgencyLevel: 'low'
      },
      {
        id: 'i5',
        name: 'Garam Masala',
        category: 'Spices',
        currentStock: 2,
        reorderPoint: 3,
        maxStock: 10,
        unit: 'kg',
        averageUsage: 0.5,
        lastRestocked: '2025-07-10',
        preferredVendor: 'v4',
        unitCost: 25.00,
        urgencyLevel: 'high'
      }
    ];

    const demoAlerts: RestockAlert[] = [
      {
        id: 'a1',
        itemId: 'i1',
        itemName: 'Chicken Breast',
        currentStock: 8,
        reorderPoint: 15,
        suggestedQuantity: 42,
        urgency: 'critical',
        estimatedDaysLeft: 0.7,
        recommendedVendor: 'v2',
        cost: 357.00,
        createdAt: '2025-07-24T09:15:00Z'
      },
      {
        id: 'a2',
        itemId: 'i3',
        itemName: 'Fresh Tomatoes',
        currentStock: 5,
        reorderPoint: 10,
        suggestedQuantity: 25,
        urgency: 'high',
        estimatedDaysLeft: 0.8,
        recommendedVendor: 'v1',
        cost: 70.00,
        createdAt: '2025-07-24T08:30:00Z'
      },
      {
        id: 'a3',
        itemId: 'i5',
        itemName: 'Garam Masala',
        currentStock: 2,
        reorderPoint: 3,
        suggestedQuantity: 8,
        urgency: 'high',
        estimatedDaysLeft: 4,
        recommendedVendor: 'v4',
        cost: 200.00,
        createdAt: '2025-07-24T07:45:00Z'
      }
    ];

    const demoForecasts: ProcurementForecast[] = [
      {
        itemName: 'Chicken Breast',
        predictedNeed: 84,
        confidence: 92,
        timeframe: 'Next 7 days',
        seasonalFactor: 1.1,
        trendDirection: 'up'
      },
      {
        itemName: 'Basmati Rice',
        predictedNeed: 56,
        confidence: 88,
        timeframe: 'Next 7 days',
        seasonalFactor: 1.0,
        trendDirection: 'stable'
      },
      {
        itemName: 'Fresh Tomatoes',
        predictedNeed: 42,
        confidence: 85,
        timeframe: 'Next 7 days',
        seasonalFactor: 1.15,
        trendDirection: 'up'
      }
    ];

    // Demo data for quotation requests with simpler structure
    const demoQuotationRequests: QuotationRequest[] = [
      {
        id: 'q1',
        itemId: 'chicken-1',
        itemName: 'Fresh Chicken',
        quantity: 50,
        unit: 'kg',
        urgencyLevel: 'high',
        requestedVendors: ['v1', 'v2'],
        requestDate: '2025-01-21T08:00:00Z',
        requiredDeliveryDate: '2025-01-24T12:00:00Z',
        specifications: 'Grade A, free-range preferred',
        estimatedBudget: 500,
        status: 'responded',
        responses: [
          {
            id: 'r1',
            quotationRequestId: 'q1',
            vendorId: 'v1',
            vendorName: 'Stuttgart Organic Farm',
            unitPrice: 8.50,
            totalPrice: 425,
            deliveryTime: '2 days',
            validUntil: '2025-01-25',
            paymentTerms: 'Net 30',
            notes: 'Grade A free-range chicken',
            receivedDate: '2025-01-21',
            status: 'pending',
            attachments: []
          }
        ],
        createdBy: 'system',
        daysUntilStockout: 12,
        autoGenerated: true
      }
    ];

    // Demo data for owner approvals
    const demoOwnerApprovals: OwnerApproval[] = [
      {
        id: 'a1',
        quotationRequestId: 'q1',
        selectedQuotationId: 'r1',
        requestedBy: 'procurement_bot',
        requestDate: '2025-01-21T10:00:00Z',
        status: 'pending',
        urgencyLevel: 'medium',
        totalAmount: 425,
        vendor: 'Stuttgart Organic Farm',
        item: 'Fresh Chicken',
        quantity: 50,
        budgetImpact: 'within_budget',
        autoApprovalEligible: false
      }
    ];

    // Demo data for purchase orders
    const demoPurchaseOrders: PurchaseOrder[] = [
      {
        id: 'po1',
        orderNumber: 'PO-2025-001',
        quotationRequestId: 'q1',
        quotationResponseId: 'r1',
        ownerApprovalId: 'a1',
        vendorId: 'v1',
        vendorName: 'Stuttgart Organic Farm',
        vendorContact: {
          name: 'Hans Mueller',
          email: 'hans@organicfarm.de',
          phone: '+49-711-123456',
          address: 'Organic Farm Str. 15, Stuttgart',
          contactPerson: 'Hans Mueller'
        },
        orderDate: '2025-01-21T12:00:00Z',
        requiredDeliveryDate: '2025-01-24T12:00:00Z',
        estimatedDeliveryDate: '2025-01-24T12:00:00Z',
        items: [
          {
            itemId: 'chicken-1',
            itemName: 'Fresh Chicken',
            description: 'Grade A free-range chicken',
            quantity: 50,
            unit: 'kg',
            unitPrice: 8.50,
            totalPrice: 425,
            specifications: 'Grade A, free-range'
          }
        ],
        subtotal: 425,
        taxAmount: 80.75,
        totalAmount: 505.75,
        paymentTerms: 'Net 30',
        deliveryAddress: 'Restaurant Kitchen, Hechingen',
        specialInstructions: 'Deliver to rear entrance',
        status: 'sent',
        createdBy: 'system',
        approvedBy: 'owner'
      }
    ];

    setVendors(demoVendors);
    setInventory(demoInventory);
    setRestockAlerts(demoAlerts);
    setForeasts(demoForecasts);
    setQuotationRequests(demoQuotationRequests);
    setOwnerApprovals(demoOwnerApprovals);
    setPurchaseOrders(demoPurchaseOrders);
    
    // Initialize vendor management data
    initializeVendorManagementData();
  };

  const initializeVendorManagementData = () => {
    const managementVendorsData: VendorManagementVendor[] = [
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
    
    setManagementVendors(managementVendorsData);
  };

  const analyzeSupplyChain = () => {
    setIsAnalyzing(true);
    
    // Simulate real-time analysis
    setTimeout(() => {
      // Update stock levels and alerts
      setInventory(prev => prev.map(item => ({
        ...item,
        currentStock: Math.max(0, item.currentStock - (Math.random() * 0.5))
      })));
      
      setIsAnalyzing(false);
    }, 2000);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default: return <BarChart3 className="h-4 w-4 text-blue-500" />;
    }
  };

  const generatePurchaseOrder = async (alertId: string) => {
    const alert = restockAlerts.find(a => a.id === alertId);
    if (!alert) return;

    try {
      setIsAnalyzing(true);
      
      // Call the procurement workflow API to generate PO
      const response = await fetch('/api/supply-sync/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: alert.itemId,
          itemName: alert.itemName,
          quantity: alert.suggestedQuantity,
          vendorId: alert.recommendedVendor,
          urgencyLevel: alert.urgency,
          estimatedCost: alert.cost,
          reason: `Auto-generated from restock alert - ${alert.estimatedDaysLeft} days left`
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update purchase orders list
        setPurchaseOrders(prev => [...prev, result.data]);
        
        // Remove the alert since PO is generated
        setRestockAlerts(prev => prev.filter(a => a.id !== alertId));
        
        // Show success notification
        window.alert(`✅ Purchase Order ${result.data.orderNumber} generated successfully!`);
        
        // Switch to orders tab to show the new PO
        setActiveTab('orders');
      } else {
        throw new Error('Failed to generate purchase order');
      }
    } catch (error) {
      console.error('Error generating PO:', error);
      window.alert('❌ Failed to generate purchase order. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleVendorComparison = async (itemName: string) => {
    try {
      setIsAnalyzing(true);
      
      // Call vendor comparison API
      const response = await fetch(`/api/supply-sync/vendor-comparison?item=${encodeURIComponent(itemName)}`, {
        method: 'GET',
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update vendor data with comparison results
        setVendors(prev => prev.map(vendor => {
          const comparison = result.data.vendors.find((v: any) => v.id === vendor.id);
          return comparison ? { ...vendor, ...comparison } : vendor;
        }));
        
        // Switch to vendors tab to show comparison
        setActiveTab('vendors');
        
        alert(`✅ Vendor comparison updated for ${itemName}`);
      } else {
        throw new Error('Failed to fetch vendor comparison');
      }
    } catch (error) {
      console.error('Error in vendor comparison:', error);
      alert('❌ Failed to load vendor comparison. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const scheduleOrder = async (forecast: ProcurementForecast) => {
    try {
      setIsAnalyzing(true);
      
      // Calculate optimal order timing based on forecast
      const response = await fetch('/api/supply-sync/schedule-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemName: forecast.itemName,
          predictedNeed: forecast.predictedNeed,
          confidence: forecast.confidence,
          timeframe: forecast.timeframe,
          seasonalFactor: forecast.seasonalFactor,
          trendDirection: forecast.trendDirection
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Create a quotation request for the scheduled order
        const quotationRequest = {
          id: `qr_${Date.now()}`,
          itemId: result.data.itemId,
          itemName: forecast.itemName,
          quantity: result.data.recommendedQuantity,
          unit: result.data.unit,
          urgencyLevel: result.data.urgencyLevel,
          requestedVendors: result.data.recommendedVendors,
          requestDate: new Date().toISOString(),
          requiredDeliveryDate: result.data.requiredDeliveryDate,
          specifications: result.data.specifications,
          estimatedBudget: result.data.estimatedBudget,
          status: 'draft',
          responses: [],
          createdBy: 'forecast_system',
          daysUntilStockout: result.data.daysUntilStockout,
          autoGenerated: true
        };
        
        // Add to quotation requests
        setQuotationRequests(prev => [...prev, quotationRequest as QuotationRequest]);
        
        // Switch to quotations tab
        setActiveTab('quotations');
        
        alert(`✅ Order scheduled for ${forecast.itemName}. Quotation request created.`);
      } else {
        throw new Error('Failed to schedule order');
      }
    } catch (error) {
      console.error('Error scheduling order:', error);
      alert('❌ Failed to schedule order. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const requestQuotations = async () => {
    try {
      setIsAnalyzing(true);
      
      // Get items that need restocking
      const itemsNeedingRestock = restockAlerts.map(alert => ({
        itemId: alert.itemId,
        itemName: alert.itemName,
        quantity: alert.suggestedQuantity,
        urgencyLevel: alert.urgency
      }));

      if (itemsNeedingRestock.length === 0) {
        alert('ℹ️ No items currently need restocking.');
        return;
      }

      // Call quotation request API
      const response = await fetch('/api/supply-sync/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: itemsNeedingRestock,
          urgencyLevel: 'high',
          specifications: 'Standard quality requirements'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add new quotation requests
        setQuotationRequests(prev => [...prev, ...result.data]);
        
        // Switch to quotations tab
        setActiveTab('quotations');
        
        alert(`✅ Quotation requests sent for ${itemsNeedingRestock.length} items`);
      } else {
        throw new Error('Failed to request quotations');
      }
    } catch (error) {
      console.error('Error requesting quotations:', error);
      alert('❌ Failed to request quotations. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateForecastPO = async (forecast: ProcurementForecast) => {
    try {
      setIsAnalyzing(true);
      
      // Find the best vendor for this item
      const item = inventory.find(i => i.name === forecast.itemName);
      const preferredVendor = vendors.find(v => v.id === item?.preferredVendor) || vendors[0];
      
      // Generate PO directly from forecast
      const response = await fetch('/api/supply-sync/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemName: forecast.itemName,
          quantity: forecast.predictedNeed,
          vendorId: preferredVendor.id,
          urgencyLevel: forecast.confidence > 90 ? 'high' : 'medium',
          reason: `Generated from AI forecast - ${forecast.confidence}% confidence`,
          scheduledDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add to purchase orders
        setPurchaseOrders(prev => [...prev, result.data]);
        
        // Switch to orders tab
        setActiveTab('orders');
        
        alert(`✅ Purchase Order generated from forecast for ${forecast.itemName}`);
      } else {
        throw new Error('Failed to generate PO from forecast');
      }
    } catch (error) {
      console.error('Error generating forecast PO:', error);
      alert('❌ Failed to generate purchase order from forecast. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      {/* Header with Component Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SupplySync Agent</h1>
            <p className="text-gray-600">Smart Vendor & Resupply Engine</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Component Switcher */}
          <div className="flex bg-white rounded-lg p-1 border">
            <Button
              variant={activeComponent === 'supply-sync' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveComponent('supply-sync')}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              SupplySync Agent
            </Button>
            <Button
              variant={activeComponent === 'vendor-management' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveComponent('vendor-management')}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Vendor Management
            </Button>
          </div>
          
          {activeComponent === 'supply-sync' && (
            <Button 
              onClick={analyzeSupplyChain}
              disabled={isAnalyzing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
              {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
            </Button>
          )}
        </div>
      </div>

      {/* Conditional Component Rendering */}
      {activeComponent === 'supply-sync' ? renderSupplySyncComponent() : renderVendorManagementComponent()}
    </div>
  );

  function renderSupplySyncComponent() {
    return (
      <>
        {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Critical Alerts</p>
                <p className="text-2xl font-bold text-red-600">
                  {restockAlerts.filter(a => a.urgency === 'critical').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Active Vendors</p>
                <p className="text-2xl font-bold text-blue-600">{vendors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Stock Coverage</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round((inventory.filter(i => i.currentStock > i.reorderPoint).length / inventory.length) * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-orange-600">
                  €{restockAlerts.reduce((sum, alert) => sum + alert.cost, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="alerts" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Restock Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Vendor Comparison</span>
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Procurement Forecast</span>
          </TabsTrigger>
          <TabsTrigger value="quotations" className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>Quotations</span>
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Approvals</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center space-x-2">
            <ShoppingCart className="h-4 w-4" />
            <span>Purchase Orders</span>
          </TabsTrigger>
        </TabsList>

        {/* Restock Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span>Critical Restock Alerts</span>
                <Badge variant="destructive">{restockAlerts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {restockAlerts.map(alert => (
                  <Alert key={alert.id} className="border-l-4 border-red-500">
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge className={getUrgencyColor(alert.urgency)}>
                              {alert.urgency.toUpperCase()}
                            </Badge>
                            <span className="font-semibold">{alert.itemName}</span>
                            <span className="text-sm text-gray-600">
                              ({alert.currentStock} / {alert.reorderPoint} units)
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            <p>⏰ Estimated {alert.estimatedDaysLeft} days left</p>
                            <p>📦 Suggested order: {alert.suggestedQuantity} units</p>
                            <p>🏪 Recommended vendor: {vendors.find(v => v.id === alert.recommendedVendor)?.name}</p>
                            <p>💰 Estimated cost: €{alert.cost.toFixed(2)}</p>
                          </div>
                          
                          <Progress 
                            value={(alert.currentStock / alert.reorderPoint) * 100} 
                            className="w-48 h-2"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Button 
                            onClick={() => generatePurchaseOrder(alert.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Generate PO
                          </Button>
                          <Button variant="outline" size="sm">
                            <Clock className="h-4 w-4 mr-2" />
                            Delay 24h
                          </Button>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendor Comparison Tab */}
        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span>Smart Vendor Comparison</span>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => handleVendorComparison('All Items')}
                    disabled={isAnalyzing}
                    variant="outline"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    Refresh Comparison
                  </Button>
                  <Button 
                    onClick={requestQuotations}
                    disabled={isAnalyzing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Request Quotes
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-3">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Best Price</p>
                    <p className="text-lg font-bold text-green-600">
                      {vendors.find(v => v.priceIndex === Math.min(...vendors.map(vendor => vendor.priceIndex)))?.name}
                    </p>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Fastest Delivery</p>
                    <p className="text-lg font-bold text-blue-600">
                      {vendors.find(v => v.deliveryTime === 'Same day')?.name || 'Hechingen Local Market'}
                    </p>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Highest Rating</p>
                    <p className="text-lg font-bold text-purple-600">
                      {vendors.find(v => v.rating === Math.max(...vendors.map(vendor => vendor.rating)))?.name}
                    </p>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Most Reliable</p>
                    <p className="text-lg font-bold text-orange-600">
                      {vendors.find(v => v.reliability === Math.max(...vendors.map(vendor => vendor.reliability)))?.name}
                    </p>
                  </div>
                </Card>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Vendor</th>
                      <th className="text-left p-3">Location</th>
                      <th className="text-left p-3">Price Index</th>
                      <th className="text-left p-3">Delivery</th>
                      <th className="text-left p-3">Reliability</th>
                      <th className="text-left p-3">Rating</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map(vendor => (
                      <tr key={vendor.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <p className="font-semibold">{vendor.name}</p>
                            <p className="text-sm text-gray-600">{vendor.specialties.join(', ')}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                Min: €{vendor.minimumOrder}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {vendor.paymentTerms}
                              </Badge>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{vendor.location}</span>
                            <span className="text-xs text-gray-500">({vendor.distance}km)</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge 
                            className={vendor.priceIndex < 1 ? 'bg-green-500' : vendor.priceIndex > 1.1 ? 'bg-red-500' : 'bg-yellow-500'}
                          >
                            {vendor.priceIndex < 1 ? '💰 Cheaper' : vendor.priceIndex > 1.1 ? '💸 Premium' : '📊 Standard'}
                          </Badge>
                          <p className="text-xs text-gray-600 mt-1">×{vendor.priceIndex}</p>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-1">
                            <Truck className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{vendor.deliveryTime}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <Progress value={vendor.reliability} className="w-16 h-2" />
                            <span className="text-sm">{vendor.reliability}%</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-1">
                            <span className="text-yellow-500">⭐</span>
                            <span className="text-sm">{vendor.rating}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col space-y-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                alert(`Contacting ${vendor.name}...`);
                              }}
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              Contact
                            </Button>
                            <Button 
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => {
                                setSelectedVendor(vendor.id);
                                setActiveTab('quotations');
                              }}
                            >
                              <ShoppingCart className="h-3 w-3 mr-1" />
                              Order
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Vendor Performance Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-blue-700 font-medium">Average Price Index:</p>
                    <p className="text-xl font-bold text-blue-800">
                      ×{(vendors.reduce((sum, v) => sum + v.priceIndex, 0) / vendors.length).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-700 font-medium">Average Reliability:</p>
                    <p className="text-xl font-bold text-blue-800">
                      {Math.round(vendors.reduce((sum, v) => sum + v.reliability, 0) / vendors.length)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-700 font-medium">Average Rating:</p>
                    <p className="text-xl font-bold text-blue-800">
                      {(vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length).toFixed(1)} ⭐
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Procurement Forecast Tab */}
        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-green-500" />
                  <span>AI-Powered Procurement Forecast</span>
                </div>
                <Button onClick={requestQuotations} className="bg-blue-600 hover:bg-blue-700">
                  <Mail className="h-4 w-4 mr-2" />
                  Request All Quotations
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {forecasts.map((forecast, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-lg">{forecast.itemName}</h3>
                          {getTrendIcon(forecast.trendDirection)}
                          <Badge variant="outline">{forecast.timeframe}</Badge>
                          <Badge 
                            className={forecast.confidence > 90 ? 'bg-green-100 text-green-800' : 
                                     forecast.confidence > 75 ? 'bg-yellow-100 text-yellow-800' : 
                                     'bg-red-100 text-red-800'}
                          >
                            {forecast.confidence}% confidence
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <p><span className="font-medium">📊 Predicted need:</span></p>
                            <p className="text-lg font-bold text-blue-600">{forecast.predictedNeed} units</p>
                          </div>
                          <div>
                            <p><span className="font-medium">🌡️ Seasonal impact:</span></p>
                            <p className="text-lg font-bold text-orange-600">×{forecast.seasonalFactor}</p>
                          </div>
                          <div>
                            <p><span className="font-medium">📈 Trend:</span></p>
                            <p className="text-lg font-bold text-purple-600 capitalize">{forecast.trendDirection}</p>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Forecast Confidence</span>
                            <span>{forecast.confidence}%</span>
                          </div>
                          <Progress value={forecast.confidence} className="w-full h-2" />
                        </div>
                      </div>
                      
                      <div className="ml-6 space-y-2">
                        <div className="flex flex-col space-y-2">
                          <Button 
                            onClick={() => scheduleOrder(forecast)}
                            disabled={isAnalyzing}
                            className="bg-green-600 hover:bg-green-700 min-w-[140px]"
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule Order
                          </Button>
                          
                          <Button 
                            onClick={() => handleVendorComparison(forecast.itemName)}
                            disabled={isAnalyzing}
                            variant="outline"
                            className="min-w-[140px]"
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Compare Vendors
                          </Button>
                          
                          <Button 
                            onClick={() => generateForecastPO(forecast)}
                            disabled={isAnalyzing}
                            className="bg-purple-600 hover:bg-purple-700 min-w-[140px]"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Generate PO
                          </Button>
                        </div>
                        
                        {forecast.confidence > 90 && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                            <span className="text-green-700 font-medium">🎯 High Confidence</span>
                            <p className="text-green-600">Recommended for auto-ordering</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-800">Forecast Summary</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-blue-700 font-medium">Total Predicted Value:</p>
                    <p className="text-xl font-bold text-blue-800">
                      €{forecasts.reduce((sum, f) => {
                        const item = inventory.find(i => i.name === f.itemName);
                        return sum + (f.predictedNeed * (item?.unitCost || 0));
                      }, 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-700 font-medium">High Confidence Items:</p>
                    <p className="text-xl font-bold text-blue-800">
                      {forecasts.filter(f => f.confidence > 90).length}/{forecasts.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-700 font-medium">Avg. Confidence:</p>
                    <p className="text-xl font-bold text-blue-800">
                      {Math.round(forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length)}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quotations Tab */}
        <TabsContent value="quotations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Quotation Management</h3>
            <Button onClick={() => {
              // Generate new quotation requests
              console.log('Generating new quotation requests...');
            }}>
              <Send className="w-4 h-4 mr-2" />
              Request New Quotes
            </Button>
          </div>

          <div className="grid gap-6">
            {quotationRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm">{request.itemName}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {request.quantity} {request.unit} • Status: {request.status}
                      </p>
                    </div>
                    <Badge variant={request.status === 'sent' ? 'secondary' : 'default'}>
                      {request.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-3">
                      {request.responses.map((response, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{response.vendorName}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">${response.unitPrice.toFixed(2)}</span>
                              <Badge variant="outline">{response.deliveryTime}</Badge>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>Total: ${response.totalPrice.toFixed(2)}</p>
                            <p>Status: {response.status}</p>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              Details
                            </Button>
                            <Button size="sm">
                              Select Vendor
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Owner Approvals</h3>
            <Badge variant="secondary">
              {ownerApprovals.filter(a => a.status === 'pending').length} Pending
            </Badge>
          </div>

          <div className="grid gap-4">
            {ownerApprovals.map((approval) => (
              <Card key={approval.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm">{approval.item}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {approval.vendor} • ${approval.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    <Badge variant={
                      approval.status === 'pending' ? 'secondary' :
                      approval.status === 'approved' ? 'default' : 'destructive'
                    }>
                      {approval.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Quantity:</span>
                        <p>{approval.quantity}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Request Date:</span>
                        <p>{new Date(approval.requestDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm text-muted-foreground">Auto Approval Eligible:</span>
                      <p className="text-sm mt-1">{approval.autoApprovalEligible ? 'Yes' : 'No'}</p>
                    </div>

                    {approval.status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive">
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}

                    <div>
                      <span className="text-sm text-muted-foreground">Budget Impact:</span>
                      <p className="text-sm mt-1">{approval.budgetImpact}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Purchase Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Purchase Orders</h3>
            <div className="flex gap-2">
              <Badge variant="secondary">
                {purchaseOrders.filter(po => po.status === 'sent').length} Pending
              </Badge>
              <Button>
                <FileText className="w-4 h-4 mr-2" />
                Generate PO
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {purchaseOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm">PO #{order.orderNumber}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {order.vendorName} • {order.items[0]?.itemName || 'Multiple Items'}
                      </p>
                    </div>
                    <Badge variant={
                      order.status === 'sent' ? 'secondary' :
                      order.status === 'acknowledged' ? 'default' : 'destructive'
                    }>
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Quantity:</span>
                        <p>{order.items[0]?.quantity || 0} {order.items[0]?.unit || ''}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total:</span>
                        <p className="font-medium">${order.totalAmount.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expected:</span>
                        <p>{new Date(order.estimatedDeliveryDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        View PO
                      </Button>
                      <Button size="sm" variant="outline">
                        <Mail className="w-4 h-4 mr-1" />
                        Send Email
                      </Button>
                      {order.status === 'sent' && (
                        <Button size="sm">
                          <Send className="w-4 h-4 mr-1" />
                          Send to Vendor
                        </Button>
                      )}
                    </div>

                    <div className="border-t pt-2">
                      <span className="text-sm text-muted-foreground">Order Date:</span>
                      <p className="text-sm mt-1">{new Date(order.orderDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      </>
    );
  }

  function renderVendorManagementComponent() {
    const categories = ['Fresh Produce', 'Local Suppliers', 'Premium Ingredients', 'Spices & Seasonings', 'Dairy Products', 'Meat & Poultry', 'Beverages'];

    const handleAddVendor = () => {
      if (!newVendor.name || !newVendor.category) {
        alert('Please fill in required fields (Name and Category)');
        return;
      }

      const vendor: VendorManagementVendor = {
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

      setManagementVendors(prev => [...prev, vendor]);
      setIsAddingVendor(false);
      resetNewVendorForm();
    };

    const handleEditVendor = (vendor: VendorManagementVendor) => {
      setEditingVendor(vendor);
      setNewVendor(vendor);
      setIsAddingVendor(true);
    };

    const handleUpdateVendor = () => {
      if (!editingVendor) return;

      setManagementVendors(prev => prev.map(v => 
        v.id === editingVendor.id ? { ...editingVendor, ...newVendor } : v
      ));
      setEditingVendor(null);
      resetNewVendorForm();
      setIsAddingVendor(false);
    };

    const handleDeleteVendor = (vendorId: string) => {
      if (confirm('Are you sure you want to delete this vendor?')) {
        setManagementVendors(prev => prev.filter(v => v.id !== vendorId));
      }
    };

    const resetNewVendorForm = () => {
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

    const filteredVendors = managementVendors.filter(vendor => {
      const matchesSearch = vendor.name.toLowerCase().includes(vendorSearchTerm.toLowerCase()) ||
                           vendor.category.toLowerCase().includes(vendorSearchTerm.toLowerCase()) ||
                           vendor.products.some(p => p.toLowerCase().includes(vendorSearchTerm.toLowerCase()));
      const matchesCategory = vendorFilterCategory === 'all' || vendor.category === vendorFilterCategory;
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
      <div className="space-y-6">
        {/* Vendor Management Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Vendor Management</h2>
            <p className="text-gray-600">Manage your suppliers and vendor relationships</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsAddingVendor(true)}
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Add Vendor
            </Button>
          </div>
        </div>

        {/* Add/Edit Vendor Form */}
        {isAddingVendor && (
          <Card>
            <CardHeader>
              <CardTitle>{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div>
                <Label>Products/Services</Label>
                <div className="flex gap-2 mt-1">
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
                <div className="flex flex-wrap gap-2 mt-2">
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

              <div className="flex gap-4">
                <Button
                  onClick={editingVendor ? handleUpdateVendor : handleAddVendor}
                >
                  {editingVendor ? 'Update Vendor' : 'Add Vendor'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingVendor(false);
                    setEditingVendor(null);
                    resetNewVendorForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter */}
        <div className="flex gap-4 items-center bg-white p-4 rounded-lg border">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search vendors, categories, or products..."
              value={vendorSearchTerm}
              onChange={(e) => setVendorSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={vendorFilterCategory}
              onChange={(e) => setVendorFilterCategory(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Vendor Grid */}
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
              {vendorSearchTerm || vendorFilterCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Get started by adding your first vendor.'}
            </p>
            <Button onClick={() => setIsAddingVendor(true)} className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Vendor
            </Button>
          </div>
        )}
      </div>
    );
  }
}
