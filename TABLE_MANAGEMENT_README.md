# Table Management System - Production Documentation

## 🎯 Overview

The **Table Management System** is a comprehensive, production-ready solution for restaurant floor planning and table management. Built with **Next.js 15**, **TypeScript**, **Zustand**, and **Tailwind CSS**, it provides real-time table status updates, reservation management, and advanced layout tools.

## ✨ Key Features

### 🎨 **Advanced Layout Editor**
- **Drag & Drop**: Intuitive table positioning with snap-to-grid
- **Multi-Shape Support**: Round, square, and rectangular tables
- **Real-time Validation**: Instant feedback for overlaps and constraints
- **Keyboard Navigation**: Arrow key nudging for precise positioning

### 🔄 **State Management**
- **Undo/Redo**: 20-step history with full state restoration
- **Auto-save**: Automatic draft saving with conflict detection
- **Optimistic Locking**: Prevents data loss from concurrent edits
- **Real-time Sync**: WebSocket-based multi-user synchronization

### 🏷️ **Zone Management**
- **Color-Coded Zones**: Visual organization of dining areas
- **Interactive Legend**: Toggle visibility and view statistics
- **Smart Assignment**: Drag-and-drop zone assignment
- **Filtering**: Show/hide tables by zone

### 🔗 **Table Operations**
- **Merge Tables**: Combine adjacent tables for large parties
- **Split Tables**: Restore merged tables to original components
- **Properties Panel**: Real-time editing of capacity, shape, and zone
- **Unique Validation**: Prevent duplicate table IDs

### 📱 **QR Code Integration**
- **Individual Codes**: Generate QR codes for each table
- **Batch Export**: Download all codes as PNG or PDF
- **Versioned URLs**: Cache-busted links for menu updates
- **Print-Ready**: High-resolution output for physical menus

### 📅 **Reservation System**
- **Time Conflict Detection**: Prevent double-bookings
- **Customer Management**: Track party size and special requests
- **Real-time Updates**: Instant reservation status changes
- **Integration Ready**: API endpoints for external booking systems

## 🏗️ Architecture

### **Frontend Stack**
```
Next.js 15 (App Router)
├── TypeScript (Type Safety)
├── Tailwind CSS (Styling)
├── Zustand (State Management)
├── Radix UI (Components)
├── React DnD (Drag & Drop)
└── Canvas API (Table Rendering)
```

### **Backend Stack**
```
Next.js API Routes
├── SQLite Database
├── Prisma ORM
├── WebSocket Support
├── Multi-tenancy
└── Audit Logging
```

### **Testing Infrastructure**
```
Testing Stack
├── Jest (Unit Tests)
├── Playwright (E2E Tests)
├── Testing Library (Component Tests)
└── MSW (API Mocking)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd table-management-system

# Install dependencies
npm install

# Setup database
npx prisma migrate dev

# Start development server
npm run dev
```

### Environment Setup

Create `.env.local`:
```env
# Database
DATABASE_URL="file:./database/ioms.db"

# WebSocket (for production)
WEBSOCKET_URL="ws://localhost:3001"

# Multi-tenancy
DEFAULT_TENANT_ID="default"
```

## 📖 Usage Guide

### 1. **Creating a Floor Layout**

```typescript
// Navigate to Table Management
/apps/pos/table-management

// Add tables
1. Click "Add Round Table" / "Add Square Table" / "Add Rectangle Table"
2. Drag tables to desired positions
3. Use properties panel to adjust capacity and zones
4. Save as draft when ready
```

### 2. **Managing Zones**

```typescript
// Create zones
1. Click "Add Zone"
2. Set name and color
3. Assign tables by dragging or using properties panel
4. Use zone legend to filter views
```

### 3. **Merge/Split Operations**

```typescript
// Merge adjacent tables
1. Select "Merge Tables" mode
2. Check tables to merge
3. Click "Merge Selected"

// Split merged table
1. Select merged table
2. Click "Split Table"
3. Original tables restored
```

### 4. **QR Code Generation**

```typescript
// Individual table
1. Select table
2. Click "Generate QR Code"
3. Download PNG or PDF

// Batch export
1. Click "Export All QR Codes"
2. Choose format (PNG/PDF)
3. Download zip file
```

### 5. **Reservations**

```typescript
// Create reservation
1. Select table
2. Click "Reservations"
3. Add customer details and time
4. System checks for conflicts
```

## 🧪 Testing

### Unit Tests
```bash
# Run all unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### E2E Tests
```bash
# Install browsers
npm run playwright:install

# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run in headed mode
npm run test:e2e:headed
```

### Test All
```bash
# Run full test suite
npm run test:all
```

## 📊 Acceptance Criteria Coverage

| AC | Feature | Status | Tests |
|----|---------|--------|-------|
| AC-001 | Add tables + default sizes + snap + labels | ✅ | Unit + E2E |
| AC-002 | Drag/Resize + keyboard + snap + bounds | ✅ | Unit + E2E |
| AC-003 | Save/Reload draft (exact restoration) | ✅ | Unit + E2E |
| AC-004 | Properties panel (ID unique, capacity ≥1, shape switch) | ✅ | Unit + E2E |
| AC-005 | FE+BE Duplicate ID guard | ✅ | Unit + E2E |
| AC-006 | No overlap (visual + save blocked) | ✅ | Unit + E2E |
| AC-007 | Zones (create/assign/filter + legend) | ✅ | Unit + E2E |
| AC-008 | Merge/Split with metadata childIds | ✅ | Unit + E2E |
| AC-009 | QR export (PNG/PDF + versioned URLs) | ✅ | Unit + E2E |
| AC-010 | Status change realtime broadcast | ✅ | Unit + E2E |
| AC-011 | Reservations with conflict detection | ✅ | Unit + E2E |
| AC-012 | Versioning with stale version rejection | ✅ | Unit + E2E |

## 🔧 API Reference

### Draft Layout API
```typescript
// Save draft layout
POST /api/pos/floor/layout/draft
{
  "floorId": "main-dining",
  "layoutDraft": {
    "tables": [...],
    "zones": [...]
  }
}

// Get current draft
GET /api/pos/floor/layout/draft?floorId=main-dining
```

### Activation API
```typescript
// Activate layout
PUT /api/pos/floor/layout/activate
{
  "floorId": "main-dining",
  "expectVersion": 1
}
```

### Table Status API
```typescript
// Update table status
PUT /api/pos/tables/status
{
  "tableId": "T1",
  "status": "seated",
  "partySize": 4
}

// Get all statuses
GET /api/pos/tables/status?floorId=main-dining
```

### Reservations API
```typescript
// Create reservation
POST /api/pos/reservations
{
  "tableId": "T1",
  "customerName": "John Doe",
  "partySize": 4,
  "dateTime": "2025-09-05T19:00:00Z",
  "duration": 120
}

// Check conflicts
GET /api/pos/reservations/conflicts?tableId=T1&dateTime=...&duration=120
```

## 🛠️ Development

### Code Structure
```
src/
├── app/                    # Next.js App Router
│   ├── table-management/   # Main table management page
│   └── api/               # API routes
├── components/            # Reusable UI components
│   ├── table-management/  # Table-specific components
│   └── ui/               # Generic UI components
├── contexts/             # Zustand stores
├── lib/                  # Utilities and services
├── types/               # TypeScript definitions
└── hooks/              # Custom React hooks
```

### Key Components

#### **TableCanvas.tsx**
Main drawing surface with drag/drop capabilities
```typescript
// Handles table rendering, interactions, and real-time updates
const TableCanvas = () => {
  // Canvas rendering logic
  // Drag and drop handlers
  // Real-time synchronization
}
```

#### **tableStore.ts**
Zustand store for state management
```typescript
// Complete state management with undo/redo
const useTableStore = create<TableStore>((set, get) => ({
  // Tables and zones state
  // Validation logic
  // API integration
  // History management
}))
```

#### **TableNode.tsx**
Individual table component
```typescript
// Draggable table with resize handles
const TableNode = ({ table, isSelected, onSelect }) => {
  // Rendering based on shape
  // Resize handle logic
  // Status visualization
}
```

### Adding New Features

1. **New Table Shape**
```typescript
// 1. Add to types
type TableShape = 'round' | 'square' | 'rect' | 'hexagon';

// 2. Update rendering
const renderTable = (shape: TableShape) => {
  switch (shape) {
    case 'hexagon':
      return renderHexagon();
    // ...
  }
}

// 3. Add to toolbar
<button onClick={() => addTable({ shape: 'hexagon' })}>
  Add Hexagon
</button>
```

2. **New Validation Rule**
```typescript
// Add to validateLayout function
const validateLayout = (tables: Table[]) => {
  const errors = [];
  
  // New validation
  if (hasCustomRule(tables)) {
    errors.push('CUSTOM_RULE_VIOLATION');
  }
  
  return { isValid: errors.length === 0, errors };
}
```

## 🚢 Deployment

### Production Build
```bash
# Type check
npm run typecheck

# Lint code
npm run lint

# Run tests
npm run test:all

# Build application
npm run build

# Start production server
npm start
```

### Environment Variables
```env
# Production environment
NODE_ENV=production
DATABASE_URL="postgresql://..."
WEBSOCKET_URL="wss://your-domain.com/ws"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📈 Performance

### Optimization Features
- **Virtual Scrolling**: Handles large numbers of tables
- **Debounced Updates**: Prevents excessive API calls
- **Memoized Components**: Reduces unnecessary re-renders
- **Lazy Loading**: Components loaded on demand
- **WebSocket Optimization**: Efficient real-time updates

### Monitoring
```typescript
// Performance tracking
const trackTableOperation = (operation: string, duration: number) => {
  analytics.track('table_operation', {
    operation,
    duration,
    tableCount: tables.length
  });
}
```

## 🔒 Security

### Data Protection
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Sanitized outputs
- **CSRF Protection**: Token-based validation

### Multi-tenancy
```typescript
// Tenant isolation
const getTenantId = (request: Request) => {
  return request.headers.get('x-tenant-id') || 'default';
}

// Database queries with tenant scope
const getTables = (tenantId: string) => {
  return db.table.findMany({
    where: { tenantId }
  });
}
```

## 📞 Support

### Common Issues

**Tables not saving**
- Check network connectivity
- Verify tenant ID in headers
- Check browser console for errors

**Overlap detection not working**
- Ensure tables have valid dimensions
- Check for floating-point precision issues
- Verify collision detection algorithm

**Real-time updates not syncing**
- Check WebSocket connection
- Verify tenant isolation
- Check server-side broadcasting

### Debug Mode
```typescript
// Enable debug logging
localStorage.setItem('debug_table_management', 'true');

// View detailed operation logs
console.log(useTableStore.getState().debugInfo);
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for new functionality
4. Ensure all tests pass (`npm run test:all`)
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎉 Production Ready

This Table Management System is **production-ready** with:
- ✅ All 12 acceptance criteria implemented
- ✅ Comprehensive test coverage (Unit + E2E)
- ✅ Real-time multi-user synchronization
- ✅ Advanced validation and conflict detection
- ✅ Professional UI/UX with accessibility
- ✅ Scalable architecture with multi-tenancy
- ✅ Complete documentation and deployment guides

**Ready for immediate deployment and use in production environments.**
