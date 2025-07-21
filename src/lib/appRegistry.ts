export interface AppMetadata {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'business' | 'productivity' | 'analytics' | 'communication' | 'finance';
  status: 'active' | 'beta' | 'coming-soon' | 'deprecated';
  version: string;
  author: string;
  features: string[];
  pricing: 'free' | 'freemium' | 'paid' | 'enterprise';
  route: string;
  requiresAuth: boolean;
  dependencies?: string[];
  permissions?: string[];
}

export const APP_REGISTRY: AppMetadata[] = [
  {
    id: 'ioms',
    name: 'IOMS',
    description: 'Integrated Operations Management System',
    icon: '🏢',
    category: 'business',
    status: 'active',
    version: '2.0.0',
    author: 'IOMS Team',
    features: ['Inventory Management', 'Menu Management', 'AI-Powered Analytics', 'Barcode Scanning'],
    pricing: 'freemium',
    route: '/apps/ioms',
    requiresAuth: true,
    permissions: ['inventory:read', 'menu:write', 'analytics:read']
  },
  {
    id: 'smart-pos',
    name: 'Smart POS',
    description: 'Intelligent Point of Sale System',
    icon: '💳',
    category: 'business',
    status: 'coming-soon',
    version: '1.0.0-beta',
    author: 'IOMS Team',
    features: ['Payment Processing', 'Order Management', 'Customer Analytics', 'Multi-location Support'],
    pricing: 'paid',
    route: '/apps/smart-pos',
    requiresAuth: true,
    permissions: ['pos:write', 'orders:read', 'customers:read']
  },
  {
    id: 'inventory-pro',
    name: 'Inventory Pro',
    description: 'Advanced Inventory Management with AI',
    icon: '📦',
    category: 'business',
    status: 'beta',
    version: '1.5.0',
    author: 'IOMS Team',
    features: ['AI Demand Forecasting', 'Automated Reordering', 'Supplier Management', 'Real-time Tracking'],
    pricing: 'paid',
    route: '/apps/inventory-pro',
    requiresAuth: true,
    permissions: ['inventory:write', 'suppliers:read', 'analytics:write']
  },
  {
    id: 'ai-ingredient-generator',
    name: 'IOMS Individual',
    description: 'Personal inventory management with AI-powered recipe suggestions',
    icon: '🏠',
    category: 'productivity',
    status: 'active',
    version: '2.0.0',
    author: 'IOMS Team',
    features: ['Bill Scanning & OCR', 'Smart Inventory Management', 'AI Recipe Suggestions', 'Dietary Restrictions', 'Automatic Inventory Updates'],
    pricing: 'free',
    route: '/apps/ai-ingredient-generator',
    requiresAuth: false,
    permissions: ['ai:read', 'inventory:write']
  },
  {
    id: 'analytics-dashboard',
    name: 'Analytics Dashboard',
    description: 'Comprehensive Business Analytics',
    icon: '📊',
    category: 'analytics',
    status: 'active',
    version: '2.1.0',
    author: 'IOMS Team',
    features: ['Real-time Analytics', 'Custom Reports', 'Data Visualization', 'Export Capabilities'],
    pricing: 'freemium',
    route: '/apps/analytics-dashboard',
    requiresAuth: true,
    permissions: ['analytics:read', 'reports:write']
  },
  {
    id: 'customer-analytics',
    name: 'Customer Analytics',
    description: 'Deep insights into customer behavior, segmentation, and predictive analytics',
    icon: '👥',
    category: 'analytics',
    status: 'active',
    version: '1.0.0',
    author: 'IOMS Team',
    features: ['Customer Segmentation', 'Behavior Tracking', 'ROI Analysis', 'Predictive Analytics'],
    pricing: 'freemium',
    route: '/apps/customer-analytics',
    requiresAuth: true,
    permissions: ['analytics:read', 'customers:read']
  }
];

export function getAppById(id: string): AppMetadata | undefined {
  return APP_REGISTRY.find(app => app.id === id);
}

export function getAppsByCategory(category: string): AppMetadata[] {
  return APP_REGISTRY.filter(app => app.category === category);
}

export function getActiveApps(): AppMetadata[] {
  return APP_REGISTRY.filter(app => app.status === 'active' || app.status === 'beta');
}

export function getAppsByPricing(pricing: string): AppMetadata[] {
  return APP_REGISTRY.filter(app => app.pricing === pricing);
} 