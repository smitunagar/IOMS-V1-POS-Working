// SupplySync Backend Service - Real-time supply chain intelligence
import { getDishes } from './menuService';

export interface SupplyChainMetrics {
  vendorPerformance: VendorMetrics[];
  inventoryAlerts: InventoryAlert[];
  marketTrends: MarketTrend[];
  geopoliticalFactors: GeopoliticalFactor[];
  procurementForecasts: ProcurementForecast[];
}

export interface VendorMetrics {
  id: string;
  name: string;
  location: string;
  distance: number;
  priceCompetitiveness: number; // 0-100 score
  deliveryReliability: number; // 0-100 score
  qualityRating: number; // 1-5 stars
  paymentTerms: string;
  minimumOrder: number;
  lastOrderDate: string;
  averageDeliveryTime: number; // in hours
  priceHistory: PricePoint[];
  riskFactors: string[];
  certifications: string[];
  preferredItems: string[];
}

export interface InventoryAlert {
  itemId: string;
  itemName: string;
  category: string;
  currentStock: number;
  reorderPoint: number;
  maxCapacity: number;
  dailyUsageRate: number;
  daysUntilStockout: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  suggestedOrderQuantity: number;
  recommendedVendor: string;
  estimatedCost: number;
  seasonalFactor: number;
  lastRestockDate: string;
  stockoutRisk: number; // 0-100 percentage
}

export interface MarketTrend {
  commodity: string;
  priceDirection: 'up' | 'down' | 'stable';
  priceChange: number; // percentage
  timeframe: string;
  confidence: number; // 0-100
  factors: string[];
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface GeopoliticalFactor {
  region: string;
  event: string;
  impact: 'supply_disruption' | 'price_increase' | 'trade_restriction' | 'currency_fluctuation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedCommodities: string[];
  timeline: string;
  mitigation: string[];
  alternativeSuppliers: string[];
}

export interface ProcurementForecast {
  itemName: string;
  predictedDemand: number;
  confidence: number;
  timeframe: string;
  seasonalAdjustment: number;
  trendFactor: number;
  specialEventImpact: number;
  recommendedPurchaseDate: string;
  estimatedCost: number;
  riskFactors: string[];
}

interface PricePoint {
  date: string;
  price: number;
  currency: string;
}

class SupplySyncService {
  private static instance: SupplySyncService;
  private vendors: VendorMetrics[] = [];
  private inventoryThresholds: Map<string, number> = new Map();
  private marketData: Map<string, MarketTrend> = new Map();

  public static getInstance(): SupplySyncService {
    if (!SupplySyncService.instance) {
      SupplySyncService.instance = new SupplySyncService();
    }
    return SupplySyncService.instance;
  }

  constructor() {
    this.initializeVendors();
    this.setupMarketMonitoring();
  }

  private initializeVendors() {
    this.vendors = [
      {
        id: 'vendor_001',
        name: 'Fresh Valley Farms',
        location: 'Stuttgart, Germany',
        distance: 35.2,
        priceCompetitiveness: 85,
        deliveryReliability: 94,
        qualityRating: 4.7,
        paymentTerms: 'Net 30',
        minimumOrder: 50,
        lastOrderDate: '2025-07-20',
        averageDeliveryTime: 18,
        priceHistory: [
          { date: '2025-07-01', price: 2.80, currency: 'EUR' },
          { date: '2025-07-15', price: 2.75, currency: 'EUR' },
          { date: '2025-07-23', price: 2.85, currency: 'EUR' }
        ],
        riskFactors: ['seasonal_variation', 'weather_dependent'],
        certifications: ['Organic', 'Regional'],
        preferredItems: ['vegetables', 'herbs', 'dairy']
      },
      {
        id: 'vendor_002',
        name: 'Hechingen Local Market',
        location: 'Hechingen, Germany',
        distance: 1.8,
        priceCompetitiveness: 72,
        deliveryReliability: 88,
        qualityRating: 4.3,
        paymentTerms: 'COD',
        minimumOrder: 25,
        lastOrderDate: '2025-07-22',
        averageDeliveryTime: 2,
        priceHistory: [
          { date: '2025-07-01', price: 8.50, currency: 'EUR' },
          { date: '2025-07-15', price: 8.75, currency: 'EUR' },
          { date: '2025-07-23', price: 8.60, currency: 'EUR' }
        ],
        riskFactors: ['limited_capacity'],
        certifications: ['Local', 'Fresh'],
        preferredItems: ['meat', 'spices', 'local_produce']
      },
      {
        id: 'vendor_003',
        name: 'Bavaria Premium Foods',
        location: 'Munich, Germany',
        distance: 85.4,
        priceCompetitiveness: 65,
        deliveryReliability: 97,
        qualityRating: 4.9,
        paymentTerms: 'Net 15',
        minimumOrder: 100,
        lastOrderDate: '2025-07-18',
        averageDeliveryTime: 36,
        priceHistory: [
          { date: '2025-07-01', price: 15.20, currency: 'EUR' },
          { date: '2025-07-15', price: 15.50, currency: 'EUR' },
          { date: '2025-07-23', price: 15.30, currency: 'EUR' }
        ],
        riskFactors: ['premium_pricing', 'high_minimum'],
        certifications: ['Premium', 'Organic', 'Sustainable'],
        preferredItems: ['premium_ingredients', 'specialty_oils', 'gourmet_spices']
      },
      {
        id: 'vendor_004',
        name: 'Global Spice Trading Co.',
        location: 'Frankfurt, Germany',
        distance: 120.5,
        priceCompetitiveness: 92,
        deliveryReliability: 85,
        qualityRating: 4.1,
        paymentTerms: 'Net 45',
        minimumOrder: 200,
        lastOrderDate: '2025-07-15',
        averageDeliveryTime: 72,
        priceHistory: [
          { date: '2025-07-01', price: 25.00, currency: 'EUR' },
          { date: '2025-07-15', price: 26.50, currency: 'EUR' },
          { date: '2025-07-23', price: 24.80, currency: 'EUR' }
        ],
        riskFactors: ['currency_fluctuation', 'long_lead_time', 'geopolitical'],
        certifications: ['International', 'Bulk'],
        preferredItems: ['spices', 'international_ingredients', 'bulk_items']
      }
    ];
  }

  private setupMarketMonitoring() {
    // Simulate real-time market data
    this.marketData.set('vegetables', {
      commodity: 'Fresh Vegetables',
      priceDirection: 'up',
      priceChange: 12.5,
      timeframe: 'Last 30 days',
      confidence: 87,
      factors: ['Summer heat wave', 'Increased demand', 'Transport costs'],
      impact: 'medium',
      recommendation: 'Consider bulk purchases before further price increases'
    });

    this.marketData.set('meat', {
      commodity: 'Poultry & Meat',
      priceDirection: 'stable',
      priceChange: 2.1,
      timeframe: 'Last 30 days',
      confidence: 92,
      factors: ['Stable supply chain', 'Normal demand'],
      impact: 'low',
      recommendation: 'Maintain current ordering schedule'
    });

    this.marketData.set('spices', {
      commodity: 'International Spices',
      priceDirection: 'down',
      priceChange: -8.3,
      timeframe: 'Last 30 days',
      confidence: 78,
      factors: ['New harvest season', 'Improved shipping routes'],
      impact: 'medium',
      recommendation: 'Good time to stock up on spices with longer shelf life'
    });
  }

  // Analyze current supply chain status
  public async analyzeSupplyChain(): Promise<SupplyChainMetrics> {
    try {
      const [alerts, forecasts, trends, geopolitical] = await Promise.all([
        this.generateInventoryAlerts(),
        this.generateProcurementForecasts(),
        this.getMarketTrends(),
        this.getGeopoliticalFactors()
      ]);

      return {
        vendorPerformance: this.vendors,
        inventoryAlerts: alerts,
        marketTrends: trends,
        geopoliticalFactors: geopolitical,
        procurementForecasts: forecasts
      };
    } catch (error) {
      console.error('[SupplySync] Analysis failed:', error);
      throw new Error('Supply chain analysis failed');
    }
  }

  // Generate smart inventory alerts based on usage patterns
  private async generateInventoryAlerts(): Promise<InventoryAlert[]> {
    const alerts: InventoryAlert[] = [];
    
    // Simulate current inventory status
    const inventoryItems = [
      {
        itemId: 'chicken_breast',
        itemName: 'Chicken Breast',
        category: 'Meat',
        currentStock: 8.5,
        reorderPoint: 15,
        maxCapacity: 50,
        dailyUsageRate: 12.3,
        lastRestockDate: '2025-07-20'
      },
      {
        itemId: 'basmati_rice',
        itemName: 'Basmati Rice',
        category: 'Grains',
        currentStock: 23.8,
        reorderPoint: 20,
        maxCapacity: 100,
        dailyUsageRate: 8.1,
        lastRestockDate: '2025-07-22'
      },
      {
        itemId: 'fresh_tomatoes',
        itemName: 'Fresh Tomatoes',
        category: 'Vegetables',
        currentStock: 4.2,
        reorderPoint: 10,
        maxCapacity: 30,
        dailyUsageRate: 6.5,
        lastRestockDate: '2025-07-21'
      },
      {
        itemId: 'garam_masala',
        itemName: 'Garam Masala',
        category: 'Spices',
        currentStock: 1.8,
        reorderPoint: 3,
        maxCapacity: 10,
        dailyUsageRate: 0.4,
        lastRestockDate: '2025-07-10'
      }
    ];

    for (const item of inventoryItems) {
      const daysUntilStockout = item.currentStock / item.dailyUsageRate;
      const seasonalFactor = this.getSeasonalFactor(item.category);
      const adjustedUsage = item.dailyUsageRate * seasonalFactor;
      
      let urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
      if (daysUntilStockout < 1) urgencyLevel = 'critical';
      else if (daysUntilStockout < 3) urgencyLevel = 'high';
      else if (item.currentStock <= item.reorderPoint) urgencyLevel = 'medium';
      else urgencyLevel = 'low';

      if (item.currentStock <= item.reorderPoint || daysUntilStockout < 5) {
        const suggestedQuantity = Math.ceil((item.maxCapacity - item.currentStock) * 1.1);
        const recommendedVendor = this.selectOptimalVendor(item.category, suggestedQuantity);
        
        alerts.push({
          itemId: item.itemId,
          itemName: item.itemName,
          category: item.category,
          currentStock: item.currentStock,
          reorderPoint: item.reorderPoint,
          maxCapacity: item.maxCapacity,
          dailyUsageRate: adjustedUsage,
          daysUntilStockout: Math.round(daysUntilStockout * 10) / 10,
          urgencyLevel,
          suggestedOrderQuantity: suggestedQuantity,
          recommendedVendor: recommendedVendor.id,
          estimatedCost: this.calculateCost(item.itemName, suggestedQuantity, recommendedVendor.id),
          seasonalFactor,
          lastRestockDate: item.lastRestockDate,
          stockoutRisk: Math.min(100, Math.max(0, (item.reorderPoint - item.currentStock) / item.reorderPoint * 100))
        });
      }
    }

    return alerts.sort((a, b) => {
      const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return urgencyOrder[b.urgencyLevel] - urgencyOrder[a.urgencyLevel];
    });
  }

  // Generate AI-powered procurement forecasts
  private async generateProcurementForecasts(): Promise<ProcurementForecast[]> {
    const forecasts: ProcurementForecast[] = [];
    
    const items = [
      { name: 'Chicken Breast', baseUsage: 84, seasonality: 1.1, trend: 1.05 },
      { name: 'Basmati Rice', baseUsage: 56, seasonality: 1.0, trend: 1.0 },
      { name: 'Fresh Tomatoes', baseUsage: 45, seasonality: 1.15, trend: 1.08 },
      { name: 'Olive Oil', baseUsage: 14, seasonality: 0.95, trend: 1.02 },
      { name: 'Garam Masala', baseUsage: 3, seasonality: 1.05, trend: 1.0 }
    ];

    for (const item of items) {
      const specialEventImpact = this.calculateSpecialEventImpact(item.name);
      const predictedDemand = Math.round(item.baseUsage * item.seasonality * item.trend * specialEventImpact);
      
      forecasts.push({
        itemName: item.name,
        predictedDemand,
        confidence: Math.floor(85 + Math.random() * 10),
        timeframe: 'Next 7 days',
        seasonalAdjustment: item.seasonality,
        trendFactor: item.trend,
        specialEventImpact,
        recommendedPurchaseDate: this.calculateOptimalPurchaseDate(item.name),
        estimatedCost: this.estimateFutureCost(item.name, predictedDemand),
        riskFactors: this.identifyRiskFactors(item.name)
      });
    }

    return forecasts;
  }

  // Get market trends affecting procurement
  private getMarketTrends(): MarketTrend[] {
    return Array.from(this.marketData.values());
  }

  // Monitor geopolitical factors affecting supply chain
  private getGeopoliticalFactors(): GeopoliticalFactor[] {
    return [
      {
        region: 'India',
        event: 'Monsoon season affecting spice production',
        impact: 'price_increase',
        severity: 'medium',
        affectedCommodities: ['turmeric', 'cardamom', 'black_pepper'],
        timeline: 'Next 3 months',
        mitigation: ['Diversify suppliers', 'Increase safety stock'],
        alternativeSuppliers: ['vendor_004', 'vendor_003']
      },
      {
        region: 'Europe',
        event: 'Energy cost increases affecting transportation',
        impact: 'supply_disruption',
        severity: 'low',
        affectedCommodities: ['all_categories'],
        timeline: 'Ongoing',
        mitigation: ['Local sourcing preference', 'Bulk ordering'],
        alternativeSuppliers: ['vendor_002', 'vendor_001']
      }
    ];
  }

  // Helper methods
  private getSeasonalFactor(category: string): number {
    const seasonalFactors: { [key: string]: number } = {
      'vegetables': 1.15, // Summer increased demand
      'meat': 1.05,
      'spices': 1.0,
      'grains': 0.95
    };
    return seasonalFactors[category.toLowerCase()] || 1.0;
  }

  private selectOptimalVendor(category: string, quantity: number): VendorMetrics {
    const suitableVendors = this.vendors.filter(vendor => 
      vendor.preferredItems.some(item => 
        category.toLowerCase().includes(item) || item.includes(category.toLowerCase())
      ) && vendor.minimumOrder <= quantity
    );

    if (suitableVendors.length === 0) {
      return this.vendors[0]; // Fallback to first vendor
    }

    // Score vendors based on multiple factors
    const scoredVendors = suitableVendors.map(vendor => ({
      vendor,
      score: this.calculateVendorScore(vendor, quantity)
    }));

    return scoredVendors.sort((a, b) => b.score - a.score)[0].vendor;
  }

  private calculateVendorScore(vendor: VendorMetrics, quantity: number): number {
    const priceWeight = 0.4;
    const reliabilityWeight = 0.3;
    const proximityWeight = 0.2;
    const qualityWeight = 0.1;

    const priceScore = vendor.priceCompetitiveness;
    const reliabilityScore = vendor.deliveryReliability;
    const proximityScore = Math.max(0, 100 - vendor.distance);
    const qualityScore = (vendor.qualityRating / 5) * 100;

    return (
      priceScore * priceWeight +
      reliabilityScore * reliabilityWeight +
      proximityScore * proximityWeight +
      qualityScore * qualityWeight
    );
  }

  private calculateCost(itemName: string, quantity: number, vendorId: string): number {
    const basePrices: { [key: string]: number } = {
      'Chicken Breast': 8.50,
      'Basmati Rice': 3.20,
      'Fresh Tomatoes': 2.80,
      'Olive Oil': 15.00,
      'Garam Masala': 25.00
    };

    const basePrice = basePrices[itemName] || 5.00;
    const vendor = this.vendors.find(v => v.id === vendorId);
    const vendorMultiplier = vendor ? (vendor.priceCompetitiveness / 100) : 1.0;
    
    return Math.round(basePrice * quantity * vendorMultiplier * 100) / 100;
  }

  private calculateSpecialEventImpact(itemName: string): number {
    // Check for upcoming events that might affect demand
    const upcomingEvents = this.getUpcomingEvents();
    let impact = 1.0;

    for (const event of upcomingEvents) {
      if (event.affectedItems.includes(itemName.toLowerCase())) {
        impact *= event.demandMultiplier;
      }
    }

    return impact;
  }

  private getUpcomingEvents() {
    return [
      {
        name: 'Weekend Rush',
        affectedItems: ['chicken breast', 'fresh tomatoes'],
        demandMultiplier: 1.2,
        date: '2025-07-26'
      },
      {
        name: 'Summer Festival',
        affectedItems: ['all'],
        demandMultiplier: 1.15,
        date: '2025-08-01'
      }
    ];
  }

  private calculateOptimalPurchaseDate(itemName: string): string {
    // Calculate optimal purchase timing based on shelf life and usage patterns
    const today = new Date();
    const optimalDays = this.getOptimalLeadTime(itemName);
    const purchaseDate = new Date(today.getTime() + optimalDays * 24 * 60 * 60 * 1000);
    
    return purchaseDate.toISOString().split('T')[0];
  }

  private getOptimalLeadTime(itemName: string): number {
    const leadTimes: { [key: string]: number } = {
      'Chicken Breast': 1, // Fresh meat needs quick delivery
      'Fresh Tomatoes': 1,
      'Basmati Rice': 3, // Longer shelf life allows planning
      'Olive Oil': 5,
      'Garam Masala': 7
    };

    return leadTimes[itemName] || 3;
  }

  private estimateFutureCost(itemName: string, quantity: number): number {
    const currentCost = this.calculateCost(itemName, quantity, this.vendors[0].id);
    const marketTrend = this.marketData.get(this.getCommodityCategory(itemName));
    
    if (marketTrend) {
      const trendMultiplier = marketTrend.priceDirection === 'up' ? 1 + (marketTrend.priceChange / 100) :
                             marketTrend.priceDirection === 'down' ? 1 - (marketTrend.priceChange / 100) : 1;
      return Math.round(currentCost * trendMultiplier * 100) / 100;
    }

    return currentCost;
  }

  private getCommodityCategory(itemName: string): string {
    if (['Chicken Breast'].includes(itemName)) return 'meat';
    if (['Fresh Tomatoes'].includes(itemName)) return 'vegetables';
    if (['Garam Masala'].includes(itemName)) return 'spices';
    return 'general';
  }

  private identifyRiskFactors(itemName: string): string[] {
    const commonRisks = ['price_volatility', 'seasonal_variation'];
    const itemSpecificRisks: { [key: string]: string[] } = {
      'Chicken Breast': ['supply_disruption', 'health_regulations'],
      'Fresh Tomatoes': ['weather_dependency', 'short_shelf_life'],
      'Garam Masala': ['import_dependency', 'currency_fluctuation']
    };

    return [...commonRisks, ...(itemSpecificRisks[itemName] || [])];
  }

  // Public methods for real-time updates
  public updateInventoryLevel(itemId: string, newLevel: number): void {
    console.log(`[SupplySync] Updated ${itemId} stock level to ${newLevel}`);
    // Trigger real-time analysis
    this.analyzeSupplyChain();
  }

  public addVendor(vendor: VendorMetrics): void {
    this.vendors.push(vendor);
    console.log(`[SupplySync] Added new vendor: ${vendor.name}`);
  }

  public updateMarketData(commodity: string, trend: MarketTrend): void {
    this.marketData.set(commodity, trend);
    console.log(`[SupplySync] Updated market data for ${commodity}`);
  }
}

export const supplySyncService = SupplySyncService.getInstance();
