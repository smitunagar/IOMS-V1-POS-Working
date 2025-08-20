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
    id: 'smart-chef-bot',
    name: 'SmartChefBot',
    description: 'AI-powered culinary assistant that suggests recipes, manages ingredients, and optimizes kitchen operations',
    icon: '👨‍🍳',
    category: 'productivity',
    status: 'active',
    version: '1.5.0',
    author: 'Culinary AI Labs',
    features: ['Recipe Generation', 'Ingredient Substitution', 'Nutritional Analysis', 'Meal Planning', 'Kitchen Inventory Sync', 'Dietary Preferences'],
    pricing: 'freemium',
    route: '/apps/smart-chef-bot',
    requiresAuth: true,
    permissions: ['ai:read', 'inventory:read', 'menu:write']
  },

  {
    id: 'waste-watchdog',
    name: 'WasteWatchDog',
    description: 'AI-powered waste tracking system that scans waste via camera to identify food waste, calculate ingredient waste, and measure carbon footprint impact',
    icon: '♻️',
    category: 'analytics',
    status: 'beta',
    version: '2.0.0',
    author: 'GreenTech Solutions',
    features: ['Camera Waste Scanning', 'AI Waste Recognition', 'Ingredient Waste Analysis', 'Carbon Footprint Calculation', 'Waste Dashboard', 'Sustainability Reporting', 'Predictive Analytics', 'Cost Analysis', 'Automated Alerts', 'Compliance Monitoring'],
    pricing: 'freemium',
    route: '/apps/waste-watchdog',
    requiresAuth: true,
    permissions: ['analytics:read', 'inventory:read', 'camera:access', 'reports:write']
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