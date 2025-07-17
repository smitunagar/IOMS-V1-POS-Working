# IOMS (Inventory Order Management System) - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Module Documentation](#module-documentation)
5. [Core Features](#core-features)
6. [API Reference](#api-reference)
7. [Database Design](#database-design)
8. [Frontend Components](#frontend-components)
9. [AI Integration](#ai-integration)
10. [Security Implementation](#security-implementation)
11. [Performance Optimization](#performance-optimization)
12. [Deployment Guide](#deployment-guide)
13. [Development Workflow](#development-workflow)
14. [Testing Strategy](#testing-strategy)
15. [Troubleshooting](#troubleshooting)

---

## Project Overview

### What is IOMS?
IOMS (Inventory Order Management System) is a comprehensive Point-of-Sale (POS) solution designed specifically for restaurants and food service establishments. The system integrates advanced inventory management with intelligent order processing, featuring AI-powered ingredient analysis and real-time serving availability monitoring.

### Key Objectives
- **Streamlined Operations**: Centralize order management, inventory tracking, and payment processing
- **Intelligent Automation**: AI-driven ingredient suggestions and order processing
- **Real-time Analytics**: Comprehensive dashboard with revenue, inventory, and operational insights
- **Scalability**: Built to handle growing restaurant operations with minimal overhead
- **User Experience**: Intuitive interface designed for busy restaurant environments

### Business Value
- **Cost Reduction**: Automated inventory tracking reduces waste and overordering
- **Revenue Optimization**: Real-time availability prevents lost sales due to stockouts
- **Operational Efficiency**: Streamlined workflows reduce staff training time
- **Data-Driven Decisions**: Comprehensive analytics for informed business decisions

---

## Technology Stack

### Frontend Technologies

#### **Next.js 15.3.3**
- **Purpose**: Full-stack React framework providing both frontend and backend capabilities
- **Why Chosen**: 
  - Server-side rendering for improved performance
  - Built-in API routes eliminate need for separate backend
  - Excellent TypeScript support
  - Automatic code splitting and optimization

#### **React 18.3.1**
- **Purpose**: Frontend UI library for building interactive user interfaces
- **Why Chosen**:
  - Component-based architecture for reusability
  - Virtual DOM for optimal performance
  - Large ecosystem and community support
  - Excellent state management capabilities

#### **TypeScript 5.x**
- **Purpose**: Strongly-typed superset of JavaScript
- **Why Chosen**:
  - Compile-time error detection
  - Enhanced developer experience with intellisense
  - Better code maintainability and refactoring
  - Improved team collaboration through type contracts

#### **Tailwind CSS 3.4.1**
- **Purpose**: Utility-first CSS framework
- **Why Chosen**:
  - Rapid UI development with utility classes
  - Consistent design system
  - Highly customizable and extensible
  - Smaller bundle sizes compared to traditional CSS frameworks

#### **Shadcn/ui**
- **Purpose**: Modern React component library
- **Why Chosen**:
  - High-quality, accessible components
  - Seamless Tailwind CSS integration
  - Customizable and themeable
  - TypeScript-first approach

### Backend Technologies

#### **Next.js API Routes**
- **Purpose**: Server-side API endpoints within the Next.js framework
- **Why Chosen**:
  - Unified codebase for frontend and backend
  - Automatic API optimization and caching
  - Built-in middleware support
  - Easy deployment and scaling

#### **Node.js Runtime**
- **Purpose**: JavaScript runtime for server-side execution
- **Why Chosen**:
  - Consistent language across full stack
  - Excellent performance for I/O operations
  - Large package ecosystem (npm)
  - Strong community support

### AI & Machine Learning

#### **Google Gemini API (Genkit 1.14.0)**
- **Purpose**: AI-powered natural language processing and content generation
- **Why Chosen**:
  - Advanced language understanding capabilities
  - Restaurant-specific context awareness
  - Cost-effective API pricing
  - Reliable performance and uptime

#### **Firebase GenKit**
- **Purpose**: AI application development framework
- **Why Chosen**:
  - Streamlined AI workflow development
  - Built-in monitoring and observability
  - Easy integration with Google AI services
  - Developer-friendly tooling

### Data Storage

#### **LocalStorage (Browser-based)**
- **Purpose**: Client-side data persistence for demonstration
- **Why Chosen**:
  - Zero infrastructure costs for demo
  - Instant setup and deployment
  - No server dependencies
  - Easy data inspection for development

#### **Future Database Considerations**
- **PostgreSQL**: For production deployments requiring ACID compliance
- **MongoDB**: For flexible schema requirements
- **Redis**: For caching and session management

### UI & Design Libraries

#### **Lucide React 0.475.0**
- **Purpose**: Modern icon library
- **Why Chosen**:
  - Consistent design language
  - Lightweight and tree-shakeable
  - Extensive icon collection
  - Excellent React integration

#### **Recharts 2.15.1**
- **Purpose**: Data visualization and charting
- **Why Chosen**:
  - React-native integration
  - Responsive chart designs
  - Customizable and extensible
  - Good performance with large datasets

#### **Radix UI Primitives**
- **Purpose**: Low-level UI component primitives
- **Why Chosen**:
  - Accessibility-first approach
  - Unstyled components for maximum customization
  - Comprehensive keyboard navigation
  - Screen reader compatibility

### Additional Tools & Utilities

#### **Class Variance Authority (CVA)**
- **Purpose**: Variant-based component styling
- **Implementation**: Type-safe component variants with conditional styling

#### **CLSX & Tailwind Merge**
- **Purpose**: Utility for merging CSS classes
- **Implementation**: Intelligent class name merging to prevent conflicts

#### **Date-fns**
- **Purpose**: Modern JavaScript date utility library
- **Implementation**: Date formatting and manipulation throughout the application

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    IOMS Architecture                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Frontend      │  │      AI         │  │   Backend   │ │
│  │   (Next.js)     │  │   Services      │  │   (API)     │ │
│  │                 │  │                 │  │             │ │
│  │ • React Pages   │  │ • Gemini API    │  │ • API Routes│ │
│  │ • Components    │  │ • GenKit Flows  │  │ • Services  │ │
│  │ • Contexts      │  │ • NLP Processing│  │ • Utils     │ │
│  │ • Hooks         │  │ • Content Gen   │  │ • Validation│ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│           │                    │                    │       │
│           └────────────────────┼────────────────────┘       │
│                               │                            │
│  ┌─────────────────────────────┼─────────────────────────── │
│  │            Data Layer       │                           │ │
│  │                            │                           │ │
│  │ • LocalStorage (Demo)      │                           │ │
│  │ • File System (CSV)       │                           │ │
│  │ • Session Management      │                           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Service Layer Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   POS Service   │────│ Integration     │────│ Inventory       │
│                 │    │ Layer           │    │ Service         │
│ • Order Entry   │    │                 │    │                 │
│ • Menu Display  │    │ • Stock Check   │    │ • Stock Mgmt    │
│ • Payment       │    │ • Usage Track   │    │ • Alerts        │
└─────────────────┘    │ • Cost Calc     │    │ • Reporting     │
                       └─────────────────┘    └─────────────────┘
                               │
                       ┌─────────────────┐
                       │ Analytics       │
                       │ Service         │
                       │                 │
                       │ • Forecasting   │
                       │ • Cost Analysis │
                       │ • Reporting     │
                       └─────────────────┘
```

### Data Flow Architecture

```
User Input → Authentication → Route Handler → Service Layer → Data Layer
    ↓              ↓              ↓             ↓            ↓
UI Event → Auth Context → API Route → Business Logic → LocalStorage
    ↓              ↓              ↓             ↓            ↓
State Update ← Auth State ← Response ← Processed Data ← Persisted Data
```

---

## Module Documentation

### 1. Authentication Module

**Location**: `src/contexts/AuthContext.tsx`

#### Purpose
Handles user authentication, session management, and user state across the application.

#### Key Components
- **AuthProvider**: React context provider for authentication state
- **useAuth Hook**: Custom hook for accessing authentication functionality
- **User Interface**: TypeScript interface defining user structure

#### Core Functions
```typescript
interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, restaurantName?: string) => Promise<boolean>;
  logout: () => void;
}
```

#### Implementation Details
- **Storage**: LocalStorage for session persistence
- **Security**: Basic email/password validation
- **State Management**: React Context API for global state
- **Navigation**: Automatic route protection and redirection

### 2. Inventory Management Module

**Location**: `src/lib/inventoryService.ts`

#### Purpose
Core inventory operations including stock management, low stock alerts, and ingredient tracking.

#### Key Features
- **CRUD Operations**: Complete inventory item management
- **Stock Tracking**: Real-time quantity monitoring
- **Usage Recording**: Automatic ingredient consumption tracking
- **Expiry Management**: Date-based inventory rotation
- **Category Management**: Organized inventory categorization

#### Core Functions
```typescript
// Inventory CRUD Operations
addInventoryItem(userId: string, item: InventoryItem): Promise<void>
updateInventoryItem(userId: string, itemId: string, updates: Partial<InventoryItem>): Promise<void>
deleteInventoryItem(userId: string, itemId: string): Promise<void>
getInventory(userId: string): InventoryItem[]

// Stock Management
checkLowStock(userId: string): InventoryItem[]
recordIngredientUsage(userId: string, ingredientName: string, quantity: number): void
validateStockAvailability(userId: string, ingredients: Ingredient[]): boolean
```

### 3. Order Management Module

**Location**: `src/lib/orderService.ts`

#### Purpose
Handles complete order lifecycle from creation to completion, including table management and payment processing.

#### Key Features
- **Order Creation**: Multi-item order composition
- **Table Management**: Table assignment and status tracking
- **Payment Integration**: Multiple payment method support
- **Order History**: Complete transaction logging
- **Status Tracking**: Real-time order status updates

#### Core Functions
```typescript
// Order Lifecycle
createOrder(userId: string, order: Omit<Order, 'id' | 'timestamp'>): string
updateOrderStatus(userId: string, orderId: string, status: OrderStatus): void
getPendingOrders(userId: string): Order[]
getCompletedOrders(userId: string): Order[]

// Table Management
assignTable(userId: string, orderId: string, tableNumber: number): void
clearOccupiedTable(userId: string, tableNumber: number): void
getOccupiedTables(userId: string): number[]
```

### 4. Menu Management Module

**Location**: `src/lib/menuService.ts`

#### Purpose
Menu item management with AI-powered ingredient analysis and availability tracking.

#### Key Features
- **Menu CRUD**: Complete menu item management
- **Ingredient Analysis**: AI-powered ingredient extraction
- **Availability Checking**: Real-time serving capacity calculation
- **CSV Import/Export**: Bulk menu management capabilities
- **Category Management**: Organized menu categorization

#### Core Functions
```typescript
// Menu Management
addDish(userId: string, dish: Omit<Dish, 'id'>): string
updateDish(userId: string, dishId: string, updates: Partial<Dish>): void
deleteDish(userId: string, dishId: string): void
getDishes(userId: string): Dish[]

// Availability & Analysis
getDishesWithAvailability(userId: string): Dish[]
debugDishInventoryAlignment(userId: string): DebugInfo
calculateMaxServings(userId: string, dish: Dish): number
```

### 5. POS Integration Module

**Location**: `src/lib/posInventoryIntegration.ts`

#### Purpose
Advanced integration between Point-of-Sale operations and inventory management for real-time stock tracking.

#### Key Features
- **Real-time Validation**: Pre-order inventory checking
- **Automatic Deduction**: Ingredient consumption on order completion
- **Availability Analysis**: Menu item availability calculation
- **Cost Tracking**: Ingredient cost analysis for orders
- **Alert System**: Low stock and unavailability notifications

#### Core Functions
```typescript
// Advanced Integration
validateDishAvailability(userId: string, dish: Dish, quantity: number): ValidationResult
recordIngredientUsageWithValidation(userId: string, dish: Dish, quantity: number): UsageResult
getMenuAvailability(userId: string, dishes: Dish[]): AvailabilityReport
calculateOrderCost(userId: string, orderItems: OrderItem[]): CostAnalysis
```

### 6. Serving Availability Module

**Location**: `src/lib/servingAvailabilityService.ts`

#### Purpose
Intelligent serving capacity calculation and availability monitoring with unit conversion support.

#### Key Features
- **Serving Calculations**: Maximum serving capacity per dish
- **Ingredient Limiting**: Identification of constraining ingredients
- **Unit Conversion**: Automatic liter/milliliter conversions
- **Batch Processing**: Multi-dish availability checking
- **Usage Tracking**: Cumulative ingredient consumption monitoring

#### Core Functions
```typescript
// Serving Analysis
checkDishServingAvailability(userId: string, dish: Dish, requestedQuantity: number): DishAvailabilityResult
getMenuServingCapacity(userId: string): MenuCapacityReport[]
processOrderWithAvailabilityCheck(userId: string, orderItems: OrderItem[]): OrderProcessResult
resetIngredientUsage(userId: string): void
```

### 7. AI Integration Module

**Location**: `src/ai/` directory

#### Purpose
AI-powered features for ingredient analysis, order processing, and menu optimization.

#### Key Components

**Ingredient Generation** (`flows/generate-ingredients-list.ts`)
- Automatic ingredient list generation from dish names
- Context-aware ingredient suggestions
- Quantity and unit recommendations

**Order Extraction** (`flows/extract-order-from-text.ts`)
- Natural language order processing
- Menu item matching and validation
- Quantity extraction and normalization

**Menu Optimization** (`flows/suggest-discounted-dishes.ts`)
- Inventory-based discount suggestions
- Revenue optimization recommendations
- Demand pattern analysis

#### Core AI Functions
```typescript
// AI Flows
generateIngredientsList(input: DishInput): Promise<Ingredient[]>
extractOrderFromText(input: OrderTextInput): Promise<ExtractedOrder>
suggestDiscountedDishes(input: InventoryInput): Promise<DiscountSuggestion[]>
```

### 8. Smart CSV Module

**Location**: `src/lib/smartCSVConverter.ts`

#### Purpose
Intelligent CSV import/export with automatic data mapping, validation, and enhancement.

#### Key Features
- **Auto-Detection**: Automatic field mapping and data type detection
- **Data Enhancement**: Intelligent category assignment and unit standardization
- **Validation**: Comprehensive data validation and error reporting
- **Translation Support**: Multi-language ingredient name mapping
- **Format Optimization**: Data optimization for better readability

#### Core Functions
```typescript
// Smart CSV Processing
analyzeCSV(csvContent: string, templateType: 'inventory' | 'menu'): CSVAnalysis
convertCSV(csvContent: string, mappings: FieldMappings, templateType: string): ConversionResult
generateTemplateCSV(templateType: string): string
```

---

## Core Features

### 1. Order Management System

#### Order Entry
- **Multi-item Selection**: Add multiple dishes with quantities
- **Real-time Validation**: Instant availability checking
- **Customer Information**: Table assignment and customer details
- **Order Modification**: Edit orders before confirmation

#### Table Management
- **Visual Table View**: Graphical representation of restaurant layout
- **Status Tracking**: Occupied, available, and reserved tables
- **Order Assignment**: Link orders to specific tables
- **Table History**: Track table turnover and usage patterns

#### Payment Processing
- **Multiple Payment Methods**: Cash, card, and digital payments
- **Receipt Generation**: Detailed receipt with itemization
- **Payment Validation**: Amount verification and change calculation
- **Transaction Logging**: Complete payment audit trail

### 2. Inventory Management

#### Stock Tracking
- **Real-time Updates**: Instant inventory level adjustments
- **Low Stock Alerts**: Configurable threshold-based notifications
- **Expiry Management**: Date-based inventory rotation alerts
- **Category Organization**: Systematic ingredient categorization

#### Usage Monitoring
- **Automatic Deduction**: Ingredient consumption on order completion
- **Usage History**: Detailed consumption tracking and reporting
- **Cost Analysis**: Ingredient cost tracking and optimization
- **Waste Tracking**: Monitor and reduce inventory waste

#### Smart Replenishment
- **Predictive Analytics**: AI-driven reorder point calculations
- **Vendor Integration**: Automated purchase order generation
- **Seasonal Adjustments**: Demand-based inventory planning
- **Cost Optimization**: Bulk purchase recommendations

### 3. Menu Management

#### Dynamic Menu Creation
- **AI-Powered Setup**: Automatic ingredient list generation
- **CSV Import/Export**: Bulk menu management capabilities
- **Category Management**: Organized menu structure
- **Pricing Optimization**: Cost-based pricing recommendations

#### Batch Ingredient Processing
- **Bulk Processing**: Generate ingredients for multiple dishes simultaneously
- **Configurable Batches**: Process 1-50 dishes per batch for optimal performance
- **Progress Monitoring**: Real-time progress tracking with visual indicators
- **Pause/Resume**: Full control over processing with ability to pause and resume
- **Error Management**: Detailed error reporting and retry mechanisms
- **Smart Queuing**: Automatic identification of dishes without ingredients

**Enhanced Menu Upload Batch Processing:**
- **Intelligent Processing**: Sequential processing with rate limiting (1-second delays)
- **Batch Grouping**: Automatic 2-second pauses every 10 dishes
- **Real-time Feedback**: Live progress bar and status updates
- **Error Resilience**: Continue processing even if some dishes fail
- **Visual Dashboard**: Comprehensive progress tracking with success/failure counts

**How to Use Menu Upload Batch Processing:**
1. **Upload Menu** via PDF or CSV to the Menu Upload page
2. **Review** the parsed menu items in the table
3. **Click** "Generate Ingredients for All" button
4. **Monitor** real-time progress with visual indicators
5. **Pause/Resume** processing as needed using control buttons
6. **Review** detailed success/failure reports
7. **Reset** and retry if needed

**Batch Processing Features:**
```typescript
interface BatchProgress {
  isProcessing: boolean;
  isPaused: boolean;
  currentIndex: number;
  totalDishes: number;
  progress: number;           // 0-100 percentage
  processedDishes: string[];  // Successfully processed dish names
  failedDishes: Array<{       // Failed dishes with error details
    name: string;
    error: string;
  }>;
  batchSize: number;          // Default: 10 dishes per batch
}
```

**Benefits of Enhanced Batch Processing:**
- **Performance**: Rate-limited requests prevent AI service overload
- **Reliability**: Robust error handling keeps processing going
- **User Experience**: Visual feedback and control over the process
- **Efficiency**: Automatic batching optimizes API usage
- **Recovery**: Failed dishes can be retried individually

**Batch Size Examples:**
- **Small Menu (20 dishes)**: 2 batches of 10 dishes each
- **Medium Menu (60 dishes)**: 6 batches of 10 dishes each
- **Large Menu (100 dishes)**: 10 batches of 10 dishes each

#### Availability Tracking
- **Real-time Status**: Live menu item availability
- **Ingredient Dependencies**: Automatic availability calculation
- **Alternative Suggestions**: Substitute dish recommendations
- **Capacity Planning**: Maximum serving calculations

### 4. Analytics Dashboard

#### Revenue Analytics
- **Daily/Monthly Reports**: Comprehensive revenue tracking
- **Trend Analysis**: Historical performance insights
- **Peak Hour Identification**: Optimal staffing recommendations
- **Profit Margin Analysis**: Item-level profitability tracking

#### Inventory Analytics
- **Stock Turn Rates**: Inventory efficiency metrics
- **Waste Analysis**: Identify and reduce waste patterns
- **Cost Tracking**: Detailed ingredient cost analysis
- **Supplier Performance**: Vendor comparison and optimization

#### Operational Insights
- **Order Patterns**: Customer behavior analysis
- **Staff Productivity**: Service efficiency metrics
- **Customer Satisfaction**: Feedback and rating tracking
- **Seasonal Trends**: Year-over-year performance comparison

### 5. AI-Powered Features

#### Natural Language Processing
- **Voice Orders**: Speech-to-text order entry
- **Text Processing**: Natural language order interpretation
- **Menu Matching**: Intelligent dish name recognition
- **Context Awareness**: Restaurant-specific understanding

#### Intelligent Automation
- **Inventory Predictions**: AI-driven stock forecasting
- **Menu Optimization**: Data-driven menu recommendations
- **Cost Analysis**: Automated profitability insights
- **Customer Insights**: Behavior pattern recognition

---

## API Reference

### Authentication Endpoints

#### POST /api/auth/login
Authenticate user credentials and establish session.

**Request Body:**
```json
{
  "email": "user@restaurant.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@restaurant.com",
    "restaurantName": "My Restaurant"
  }
}
```

#### POST /api/auth/signup
Create new user account with restaurant information.

**Request Body:**
```json
{
  "email": "user@restaurant.com",
  "password": "secure_password",
  "restaurantName": "My Restaurant"
}
```

### Menu Management Endpoints

#### GET /api/menuCsv
Retrieve complete menu in CSV format with ingredient preservation.

**Response:**
```json
{
  "menu": [
    {
      "id": "dish_1",
      "name": "Chicken Biryani",
      "price": 12.90,
      "category": "Main Dishes",
      "ingredients": [
        {
          "inventoryItemName": "Chicken",
          "quantityPerDish": 200,
          "unit": "g"
        }
      ]
    }
  ]
}
```

#### POST /api/menuCsv
Save menu data to CSV format with proper ingredient serialization.

**Request Body:**
```json
{
  "menu": [
    {
      "id": "dish_1",
      "name": "Chicken Biryani",
      "price": 12.90,
      "category": "Main Dishes",
      "ingredients": [
        {
          "inventoryItemName": "Chicken",
          "quantityPerDish": 200,
          "unit": "g"
        }
      ]
    }
  ]
}
```

#### POST /api/uploadMenu
Process PDF menu upload with AI extraction.

**Request Body:**
```json
{
  "file": "base64_encoded_pdf_data",
  "userId": "user_id"
}
```

**Response:**
```json
{
  "success": true,
  "count": 25,
  "menu": [...],
  "partialOrRepaired": false
}
```

### AI Processing Endpoints

#### POST /api/ai-ingredient
Generate ingredient list for dish using AI.

**Request Body:**
```json
{
  "dishName": "Chicken Biryani",
  "aiHint": "Traditional Indian rice dish"
}
```

**Response:**
```json
{
  "ingredients": [
    {
      "name": "Chicken",
      "quantity": 200,
      "unit": "g"
    },
    {
      "name": "Basmati Rice",
      "quantity": 150,
      "unit": "g"
    }
  ]
}
```

---

## Database Design

### LocalStorage Schema

#### User Data Structure
```typescript
interface User {
  id: string;                    // Unique user identifier
  email: string;                 // User email address
  restaurantName?: string;       // Optional restaurant name
}

// Storage Key: 'gastronomeCurrentUser'
// Storage Key: 'gastronomeUsersList'
```

#### Inventory Data Structure
```typescript
interface InventoryItem {
  id: string;                    // Unique item identifier
  name: string;                  // Item name
  quantity: number;              // Current stock quantity
  unit: string;                  // Measurement unit (g, kg, l, ml, pcs)
  category: string;              // Item category
  expiryDate: string;           // Expiry date (YYYY-MM-DD)
  lowStockThreshold: number;    // Minimum stock alert level
  imageUrl?: string;            // Optional item image
  supplier?: string;            // Supplier information
  costPerUnit?: number;         // Unit cost for analysis
  lastUpdated: string;          // Last modification timestamp
}

// Storage Key: 'inventory_${userId}'
```

#### Menu Data Structure
```typescript
interface Dish {
  id: string;                    // Unique dish identifier
  name: string;                  // Dish name
  price: number;                 // Dish price
  category: string;              // Menu category
  image?: string;                // Optional dish image
  aiHint?: string;              // AI processing hint
  ingredients: IngredientQuantity[]; // Required ingredients
  isAvailable?: boolean;         // Real-time availability
  maxServings?: number;          // Maximum possible servings
}

interface IngredientQuantity {
  inventoryItemName: string;     // Reference to inventory item
  quantityPerDish: number;       // Required quantity per serving
  unit: string;                  // Measurement unit
}

// Storage Key: 'restaurantMenu_${userId}'
```

#### Order Data Structure
```typescript
interface Order {
  id: string;                    // Unique order identifier
  userId: string;                // User who created the order
  items: OrderItem[];            // Ordered items
  total: number;                 // Total order amount
  customerName?: string;         // Optional customer name
  tableNumber?: number;          // Table assignment
  orderType: 'dine-in' | 'takeout' | 'delivery';
  status: 'pending' | 'completed' | 'cancelled';
  timestamp: string;             // Order creation time
  paymentMethod?: string;        // Payment method used
  completedAt?: string;          // Order completion time
}

interface OrderItem {
  dishId: string;                // Reference to menu dish
  dishName: string;              // Dish name for display
  quantity: number;              // Ordered quantity
  price: number;                 // Unit price at time of order
  total: number;                 // Line item total
}

// Storage Key: 'orders_${userId}'
```

### Data Relationships

```
Users (1) -----> (∞) Inventory Items
Users (1) -----> (∞) Menu Dishes
Users (1) -----> (∞) Orders
Menu Dishes (∞) -----> (∞) Inventory Items (through ingredients)
Orders (∞) -----> (∞) Menu Dishes (through order items)
```

### Data Migration Strategy

For production deployment, the system supports seamless migration to:
- **PostgreSQL**: For ACID compliance and complex queries
- **MongoDB**: For flexible schema and document storage
- **Firebase Firestore**: For real-time updates and scalability

---

## Frontend Components

### UI Component Architecture

#### Atomic Design Structure
```
atoms/           # Basic UI elements
├── Button
├── Input
├── Label
├── Badge
└── ...

molecules/       # Component combinations
├── SearchBox
├── MenuCard
├── OrderItem
└── ...

organisms/       # Complex components
├── OrderForm
├── InventoryTable
├── AnalyticsChart
└── ...

templates/       # Page layouts
├── AppLayout
├── AuthLayout
└── ...

pages/           # Complete pages
├── Dashboard
├── Inventory
├── MenuUpload
└── ...
```

### Core Component Libraries

#### Shadcn/ui Components
- **Purpose**: Modern, accessible React components
- **Implementation**: Radix UI primitives with Tailwind CSS styling
- **Customization**: Fully customizable through CSS variables and class overrides

#### Custom Components

**AppLayout Component**
```typescript
interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

// Features:
// - Responsive sidebar navigation
// - User authentication state
// - Dynamic page titles
// - Mobile-optimized layout
```

**OrderEntry Component**
```typescript
interface OrderEntryProps {
  onOrderComplete: (order: Order) => void;
  availableDishes: Dish[];
}

// Features:
// - Real-time dish availability
// - Quantity validation
// - Order total calculation
// - Table assignment
```

**InventoryManager Component**
```typescript
interface InventoryManagerProps {
  userId: string;
  onInventoryUpdate: () => void;
}

// Features:
// - CRUD operations
// - Low stock alerts
// - Batch operations
// - Export capabilities
```

### State Management

#### React Context Usage
- **AuthContext**: Global authentication state
- **ThemeContext**: UI theme and preferences
- **NotificationContext**: Toast and alert management

#### Local State Management
- **useState**: Component-level state for forms and UI
- **useReducer**: Complex state management for forms
- **useEffect**: Side effects and data fetching

### Responsive Design

#### Breakpoint Strategy
```css
/* Mobile First Approach */
sm: 640px    /* Small tablets */
md: 768px    /* Large tablets */
lg: 1024px   /* Small laptops */
xl: 1280px   /* Large laptops */
2xl: 1536px  /* Desktop monitors */
```

#### Component Adaptivity
- **Mobile**: Simplified navigation, touch-optimized controls
- **Tablet**: Adaptive layouts, contextual menus
- **Desktop**: Full feature access, multi-panel layouts

---

## AI Integration

### Google Gemini Integration

#### Setup and Configuration
```typescript
// AI Configuration
const genkit = new Genkit({
  model: 'gemini-1.5-pro',
  apiKey: process.env.GOOGLE_AI_API_KEY,
  systemInstructions: [
    'You are a restaurant management AI assistant.',
    'Focus on accuracy and practical recommendations.',
    'Consider food safety and cost optimization.'
  ]
});
```

#### Natural Language Processing Flows

**Ingredient Extraction Flow**
```typescript
export const generateIngredientsList = defineFlow(
  {
    name: 'generateIngredientsList',
    inputSchema: z.object({
      dishName: z.string(),
      aiHint: z.string().optional(),
      cuisine: z.string().optional()
    }),
    outputSchema: z.object({
      ingredients: z.array(z.object({
        name: z.string(),
        quantity: z.number(),
        unit: z.string(),
        category: z.string()
      }))
    })
  },
  async (input) => {
    // AI processing logic for ingredient extraction
    const prompt = `Analyze the dish "${input.dishName}" and provide a detailed ingredient list...`;
    
    const response = await generate({
      model: gemini15Pro,
      prompt: prompt,
      config: { temperature: 0.3 }
    });
    
    return parseIngredientResponse(response.text());
  }
);
```

**Order Processing Flow**
```typescript
export const extractOrderFromText = defineFlow(
  {
    name: 'extractOrderFromText',
    inputSchema: z.object({
      orderText: z.string(),
      menuItems: z.array(z.string())
    }),
    outputSchema: z.object({
      extractedItems: z.array(z.object({
        dishName: z.string(),
        quantity: z.number(),
        confidence: z.number()
      })),
      totalConfidence: z.number()
    })
  },
  async (input) => {
    // Natural language order processing
    const prompt = `Parse this customer order: "${input.orderText}"...`;
    
    const response = await generate({
      model: gemini15Pro,
      prompt: prompt,
      config: { temperature: 0.1 }
    });
    
    return parseOrderResponse(response.text(), input.menuItems);
  }
);
```

### AI-Powered Features

#### Smart Menu Analysis
- **Ingredient Prediction**: Automatic ingredient list generation
- **Nutritional Analysis**: Calorie and macro estimation
- **Allergen Detection**: Automatic allergen identification
- **Cost Optimization**: Price point recommendations

#### Batch Ingredient Processing
- **Intelligent Batching**: Process dishes in configurable batches (1-50 dishes per batch)
- **Progress Monitoring**: Real-time progress tracking with pause/resume functionality
- **Error Handling**: Robust error handling with detailed failure reporting
- **Performance Optimization**: Automatic delays between AI requests to prevent rate limiting
- **Smart Resume**: Resume from last processed dish after interruption

**Batch Processing Features:**
```typescript
interface BatchProcessingState {
  isProcessing: boolean;
  isPaused: boolean;
  currentBatch: number;
  totalBatches: number;
  currentDishIndex: number;
  totalDishes: number;
  processedDishes: string[];
  failedDishes: { name: string; error: string }[];
  batchSize: number;
  progress: number;
}

// Example: Processing 60 dishes in 6 batches of 10
const batches = [
  { dishes: [1-10], batchNumber: 1 },
  { dishes: [11-20], batchNumber: 2 },
  { dishes: [21-30], batchNumber: 3 },
  { dishes: [31-40], batchNumber: 4 },
  { dishes: [41-50], batchNumber: 5 },
  { dishes: [51-60], batchNumber: 6 }
];
```

**Benefits of Batch Processing:**
- **Efficiency**: Process large menus (60+ dishes) systematically
- **Reliability**: Built-in error recovery and progress persistence
- **Performance**: Configurable batch sizes prevent AI service overload
- **User Control**: Pause, resume, and monitor processing in real-time
- **Cost Management**: Controlled API usage with rate limiting

#### Intelligent Order Processing
- **Voice Recognition**: Speech-to-text order entry
- **Context Understanding**: Ambiguous order clarification
- **Menu Matching**: Fuzzy matching for dish names
- **Quantity Extraction**: Natural language quantity parsing

#### Predictive Analytics
- **Demand Forecasting**: AI-driven demand predictions
- **Inventory Optimization**: Automated reorder point calculations
- **Price Optimization**: Dynamic pricing recommendations
- **Waste Reduction**: Predictive waste prevention

### Error Handling and Fallbacks

#### AI Service Reliability
```typescript
async function aiWithFallback<T>(
  aiFunction: () => Promise<T>,
  fallbackFunction: () => T,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await aiFunction();
    } catch (error) {
      if (attempt === maxRetries) {
        console.warn('AI service failed, using fallback:', error);
        return fallbackFunction();
      }
      await delay(1000 * attempt); // Exponential backoff
    }
  }
}
```

---

## Security Implementation

### Authentication Security

#### Local Storage Security
```typescript
// Secure token handling
const encryptData = (data: any): string => {
  // Simple encryption for demo purposes
  return btoa(JSON.stringify(data));
};

const decryptData = (encryptedData: string): any => {
  try {
    return JSON.parse(atob(encryptedData));
  } catch {
    return null;
  }
};
```

#### Session Management
- **Auto-logout**: Configurable session timeout
- **Route Protection**: Authenticated route access control
- **Credential Validation**: Input sanitization and validation

### Data Protection

#### Input Validation
```typescript
// Comprehensive input validation
const validateInventoryItem = (item: any): ValidationResult => {
  const errors: string[] = [];
  
  if (!item.name || typeof item.name !== 'string') {
    errors.push('Item name is required');
  }
  
  if (!item.quantity || item.quantity < 0) {
    errors.push('Valid quantity is required');
  }
  
  if (!item.unit || !VALID_UNITS.includes(item.unit)) {
    errors.push('Valid unit is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

#### XSS Prevention
- **Content Sanitization**: HTML content sanitization
- **Input Escaping**: Automatic input escaping
- **CSP Headers**: Content Security Policy implementation

### API Security

#### Request Validation
```typescript
// API request validation middleware
export async function validateRequest(
  req: NextRequest,
  schema: ZodSchema
): Promise<ValidationResult> {
  try {
    const body = await req.json();
    const validated = schema.parse(body);
    return { isValid: true, data: validated };
  } catch (error) {
    return { 
      isValid: false, 
      errors: error.errors?.map(e => e.message) || ['Invalid request'] 
    };
  }
}
```

#### Rate Limiting
```typescript
// Simple rate limiting implementation
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(clientId: string, maxRequests: number = 100): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  const current = rateLimiter.get(clientId);
  
  if (!current || now > current.resetTime) {
    rateLimiter.set(clientId, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
}
```

---

## Performance Optimization

### Frontend Optimization

#### Code Splitting
```typescript
// Lazy loading for optimal bundle size
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inventory = lazy(() => import('./pages/Inventory'));
const MenuUpload = lazy(() => import('./pages/MenuUpload'));

// Route-based code splitting
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/inventory" element={<Inventory />} />
    <Route path="/menu-upload" element={<MenuUpload />} />
  </Routes>
</Suspense>
```

#### Memoization Strategy
```typescript
// Expensive computation memoization
const memoizedCalculateServings = useMemo(() => {
  return dishes.map(dish => ({
    ...dish,
    maxServings: calculateMaxServings(inventory, dish.ingredients)
  }));
}, [dishes, inventory]);

// Callback memoization
const memoizedHandleOrder = useCallback((order: Order) => {
  processOrder(order);
  updateInventory(order.items);
}, [processOrder, updateInventory]);
```

#### Virtual Scrolling
```typescript
// Large list optimization
const VirtualizedTable = ({ items }: { items: any[] }) => {
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(50);
  
  const visibleItems = items.slice(startIndex, endIndex);
  
  return (
    <div className="virtual-container">
      {visibleItems.map(item => (
        <TableRow key={item.id} {...item} />
      ))}
    </div>
  );
};
```

### Backend Optimization

#### Caching Strategy
```typescript
// In-memory caching for frequent queries
const cache = new Map<string, { data: any; timestamp: number }>();

export function getCachedData<T>(
  key: string, 
  fetchFunction: () => T,
  ttlMs: number = 300000 // 5 minutes
): T {
  const cached = cache.get(key);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < ttlMs) {
    return cached.data;
  }
  
  const data = fetchFunction();
  cache.set(key, { data, timestamp: now });
  return data;
}
```

#### Data Compression
```typescript
// Response compression for large datasets
export function compressResponse(data: any): string {
  return JSON.stringify(data, (key, value) => {
    // Remove null/undefined values
    if (value === null || value === undefined) {
      return undefined;
    }
    return value;
  });
}
```

### Database Optimization

#### Query Optimization
```typescript
// Efficient data retrieval patterns
export function getInventoryWithAvailability(userId: string): InventoryItem[] {
  const inventory = getInventory(userId);
  const orders = getPendingOrders(userId);
  
  // Calculate reserved quantities
  const reservedQuantities = calculateReservedQuantities(orders);
  
  return inventory.map(item => ({
    ...item,
    availableQuantity: item.quantity - (reservedQuantities[item.id] || 0),
    isLowStock: item.quantity <= item.lowStockThreshold
  }));
}
```

#### Data Indexing Strategy
```typescript
// Efficient data access patterns
const indexedData = {
  byId: new Map<string, InventoryItem>(),
  byCategory: new Map<string, InventoryItem[]>(),
  lowStock: new Set<string>()
};

export function buildInventoryIndex(items: InventoryItem[]): void {
  indexedData.byId.clear();
  indexedData.byCategory.clear();
  indexedData.lowStock.clear();
  
  items.forEach(item => {
    indexedData.byId.set(item.id, item);
    
    if (!indexedData.byCategory.has(item.category)) {
      indexedData.byCategory.set(item.category, []);
    }
    indexedData.byCategory.get(item.category)!.push(item);
    
    if (item.quantity <= item.lowStockThreshold) {
      indexedData.lowStock.add(item.id);
    }
  });
}
```

---

## Deployment Guide

### Development Setup

#### Prerequisites
```bash
# Required software versions
Node.js >= 18.0.0
npm >= 8.0.0
Git >= 2.30.0
```

#### Environment Setup
```bash
# Clone repository
git clone https://github.com/your-repo/ioms-pos-system.git
cd ioms-pos-system

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

#### Environment Variables
```env
# AI Integration
GOOGLE_AI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_AI_ENABLED=true

# Application Configuration
NEXT_PUBLIC_APP_NAME=IOMS
NEXT_PUBLIC_APP_VERSION=2.0.0
NODE_ENV=development

# Security
JWT_SECRET=your_jwt_secret
SESSION_TIMEOUT=3600000
```

### Production Deployment

#### Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel --prod

# Configure environment variables
vercel env add GOOGLE_AI_API_KEY
vercel env add JWT_SECRET
```

#### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

#### AWS Deployment
```yaml
# docker-compose.yml for AWS ECS
version: '3.8'
services:
  ioms-app:
    image: your-repo/ioms:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - GOOGLE_AI_API_KEY=${GOOGLE_AI_API_KEY}
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
```

### Database Migration

#### Production Database Setup
```typescript
// Database migration script
export async function migrateToProduction() {
  // Extract LocalStorage data
  const userData = extractLocalStorageData();
  
  // Transform to production schema
  const transformedData = transformDataSchema(userData);
  
  // Insert into production database
  await insertIntoDatabase(transformedData);
  
  // Verify data integrity
  await verifyMigration();
}
```

### Monitoring and Logging

#### Production Monitoring
```typescript
// Error tracking and logging
export function setupProductionLogging() {
  // Error boundary logging
  window.addEventListener('error', (event) => {
    logError({
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });
  });
  
  // Performance monitoring
  if ('performance' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 1000) { // Log slow operations
          logPerformance({
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime
          });
        }
      }
    });
    
    observer.observe({ entryTypes: ['measure', 'navigation'] });
  }
}
```

---

## Development Workflow

### Git Workflow

#### Branch Strategy
```
main                 # Production-ready code
├── develop         # Integration branch
├── feature/*       # Feature development
├── bugfix/*        # Bug fixes
└── release/*       # Release preparation
```

#### Commit Convention
```
feat: add new inventory management feature
fix: resolve calculation error in serving availability
docs: update API documentation
style: improve mobile responsive design
refactor: optimize database query performance
test: add unit tests for order processing
chore: update dependencies
```

### Code Quality

#### ESLint Configuration
```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "prefer-const": "error",
    "no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

#### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

#### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ]
  }
}
```

### Testing Strategy

#### Unit Testing
```typescript
// Example unit test
import { calculateMaxServings } from '../lib/servingAvailabilityService';

describe('Serving Availability Service', () => {
  test('should calculate correct max servings', () => {
    const inventory = [
      { name: 'Chicken', quantity: 1000, unit: 'g' },
      { name: 'Rice', quantity: 500, unit: 'g' }
    ];
    
    const dish = {
      name: 'Chicken Rice',
      ingredients: [
        { inventoryItemName: 'Chicken', quantityPerDish: 200, unit: 'g' },
        { inventoryItemName: 'Rice', quantityPerDish: 150, unit: 'g' }
      ]
    };
    
    const result = calculateMaxServings(inventory, dish);
    expect(result).toBe(3); // Limited by Rice: 500/150 = 3.33, floored to 3
  });
});
```

#### Integration Testing
```typescript
// API integration test
import { NextRequest } from 'next/server';
import { POST } from '../app/api/menuCsv/route';

describe('Menu CSV API', () => {
  test('should save menu data correctly', async () => {
    const mockRequest = new NextRequest('http://localhost/api/menuCsv', {
      method: 'POST',
      body: JSON.stringify({
        menu: [
          {
            id: 'test_1',
            name: 'Test Dish',
            price: 10.99,
            ingredients: [
              { inventoryItemName: 'Test Ingredient', quantityPerDish: 100, unit: 'g' }
            ]
          }
        ]
      })
    });
    
    const response = await POST(mockRequest);
    const result = await response.json();
    
    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
  });
});
```

#### End-to-End Testing
```typescript
// E2E test with Playwright
import { test, expect } from '@playwright/test';

test('complete order flow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[data-testid=email]', 'test@restaurant.com');
  await page.fill('[data-testid=password]', 'password');
  await page.click('[data-testid=login-button]');
  
  // Navigate to order entry
  await page.goto('/');
  
  // Add item to order
  await page.click('[data-testid=dish-card]:first-child');
  await page.fill('[data-testid=quantity-input]', '2');
  await page.click('[data-testid=add-to-order]');
  
  // Complete order
  await page.click('[data-testid=complete-order]');
  await page.click('[data-testid=confirm-payment]');
  
  // Verify success
  await expect(page.locator('[data-testid=order-success]')).toBeVisible();
});
```

---

## Troubleshooting

### Common Issues

#### Performance Issues

**Problem**: Slow application loading
```typescript
// Solution: Implement code splitting and lazy loading
const LazyComponent = lazy(() => import('./components/ExpensiveComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

**Problem**: Large bundle size
```bash
# Analyze bundle size
npm run build
npm install -g @next/bundle-analyzer
ANALYZE=true npm run build
```

#### Data Synchronization Issues

**Problem**: Data inconsistency between components
```typescript
// Solution: Centralized state management
const useInventorySync = () => {
  const [inventory, setInventory] = useState([]);
  
  useEffect(() => {
    const handleStorageChange = () => {
      const updated = getInventory(userId);
      setInventory(updated);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('inventory-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('inventory-updated', handleStorageChange);
    };
  }, [userId]);
  
  return inventory;
};
```

#### Memory Leaks

**Problem**: Increasing memory usage over time
```typescript
// Solution: Proper cleanup in useEffect
useEffect(() => {
  const interval = setInterval(() => {
    // Periodic task
  }, 5000);
  
  const eventListener = (event) => {
    // Handle event
  };
  
  window.addEventListener('resize', eventListener);
  
  return () => {
    clearInterval(interval);
    window.removeEventListener('resize', eventListener);
  };
}, []);
```

### Debug Tools

#### Development Debugging
```typescript
// Enhanced logging for development
export const logger = {
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🐛 [DEBUG] ${message}`, data);
    }
  },
  
  info: (message: string, data?: any) => {
    console.info(`ℹ️ [INFO] ${message}`, data);
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`⚠️ [WARN] ${message}`, data);
  },
  
  error: (message: string, error?: any) => {
    console.error(`❌ [ERROR] ${message}`, error);
    
    // Send to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      sendToErrorService({ message, error, timestamp: new Date().toISOString() });
    }
  }
};
```

#### Production Monitoring
```typescript
// Production error monitoring
export function setupErrorMonitoring() {
  // Global error handler
  window.addEventListener('error', (event) => {
    logger.error('Global error caught', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  });
  
  // Promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', {
      reason: event.reason,
      url: window.location.href
    });
  });
}
```

### Support Resources

#### Documentation Links
- **Next.js Documentation**: https://nextjs.org/docs
- **React Documentation**: https://react.dev/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Shadcn/ui Components**: https://ui.shadcn.com/

#### Community Support
- **GitHub Issues**: Project-specific issue tracking
- **Stack Overflow**: Technical Q&A community
- **Discord/Slack**: Real-time development support
- **Documentation Wiki**: Comprehensive guides and tutorials

---

## Conclusion

This IOMS (Inventory Order Management System) represents a comprehensive solution for modern restaurant management, combining traditional POS functionality with advanced AI capabilities and intelligent inventory management. The system's modular architecture, robust feature set, and scalable design make it suitable for restaurants of all sizes, from small cafes to large restaurant chains.

The technology choices reflect modern best practices in web development, prioritizing performance, maintainability, and user experience. The integration of AI services provides intelligent automation that can significantly improve operational efficiency and reduce manual workload.

For production deployment, the system can be easily scaled and adapted to specific business requirements, with clear migration paths for database backends and infrastructure scaling.

This documentation serves as a complete reference for developers, system administrators, and business stakeholders working with the IOMS system.

---

*Last Updated: January 2025*
*Version: 2.0.0*
*Documentation Version: 1.0*
